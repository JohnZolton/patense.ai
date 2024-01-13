import { headers } from 'next/headers'
import { Document } from "langchain/document";
import Stripe from 'stripe'
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import Cors from 'micro-cors';
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import {prisma} from '../../../server/db'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { exit } from 'process';
import OpenAI from 'openai'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    typescript: true,
    apiVersion: "2023-10-16"
  })


const cors = Cors({
  allowMethods: ['POST', 'HEAD'],
});
export const config = {
  api: {
    bodyParser: false,
  },
};

async function webhookHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method==="POST"){
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']!
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_TEST_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`);
      return res.status(400).json({error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}`})
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (!session?.metadata?.userId) {
      return res.status(200).end()
    }

    if (event.type === 'checkout.session.completed') {
      console.log("checkout session completed")
      console.log(session.metadata)
    }
    if (event.type === 'payment_intent.succeeded'&&session.metadata.txId) {
      console.log("intent succeeded")
      console.log("Transaction id: ",session.metadata.txId)
      const job = await prisma.oAReport.update({
        data:{
          paid:true
        },
        where: {
          id: session.metadata.txId
        },
        include:{
          files: true
        }
      })
      console.log("got job: ", job)
      if (!job){
        return null
      }
      const spec = await fetch(
        `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${job.specKey}`
      )
      const blob = await spec.blob()
      const loader = new PDFLoader(blob, {splitPages: false})
      const specText = await loader.load()
      if (!specText || specText[0]?.pageContent ===undefined){return null}
      
      const openai = new OpenAI();
      const chunkSize = 12000
      const totalChunks=Math.ceil(specText.length/chunkSize)
      const chunks = makeChunks(specText[0].pageContent, totalChunks)
      let featureList = ""
      for (let i=0; i<chunks.length;i++){
        console.log("CHUNK: ", chunks[i])
        if (chunks[i]===undefined){break}
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a world-class patent analyst. You are an expert at identifying inventive features in a disclosure." },
            { role: "user", content: "Identify each and every inventive element in the following disclosure, make sure you identify every possible feature but do not repeat yourself." },
            { role: "user", content: `Identified features: ${featureList}` },
            { role: "user", content: `Disclosure: ${chunks[i]!}` }
          ],
          model: "gpt-3.5-turbo",
        });
        const features = completion.choices[0]?.message.content
        //console.log("features: ", features)
        console.log(completion.choices[0])
        if (features !== null && features !==undefined){
          featureList = features
        }
        console.log("all features: \n", featureList)
      }
      
      const featureArray = featureList.split('\n')
      console.log('featureArray: ')
      console.log(featureArray)
      
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPEN_API_KEY
      })
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
      })
      
      const pinecone = new Pinecone({
        environment: "us-east-1-aws",
        apiKey: process.env.PINECONE_API_KEY!,
      })
      const pineconeIndex = pinecone.Index('patense')
      const refDocs: Document[] =[]
      if (job){
        await Promise.all(job.files.map(async (file)=>{
          const newfile = await fetch(`https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file?.key}`
          )
          const blob = await newfile.blob()
          const loader = new PDFLoader(blob, {splitPages: false})
          const refText = await loader.load()
          const doc = new Document({pageContent:refText[0]?.pageContent ?? "", metadata:{"title": file.title, "userId": session.metadata?.userId ?? "none"}})
          console.log("NEW DOCUMENT: ", doc)
          refDocs.push(doc)        
        }))
      }
      const splitDocuments = await textSplitter.splitDocuments(refDocs)
      const vectorStore = await PineconeStore.fromDocuments(
        splitDocuments,
        embeddings,
        {
          pineconeIndex,
          namespace: session.metadata.userId,
          textKey: session.metadata.userId
        }
      )
        // retrieval QA over inventive elements    
        const model = new ChatOpenAI({modelName:"gpt-3.5-turbo"})
        const template = ``
        const chain = RetrievalQAChain.fromLLM(
          model, 
          vectorStore.asRetriever(),
          { returnSourceDocuments: true, }
        )
      interface FeatureItem {
        feature: string;
        analysis: string;
        source: string;
      }
      const analysisArray: FeatureItem[]=[]
      interface vectorDocument {
        pageContent: string;
        metadata: {
          title: string;
          userId: string;
          loc: {
            // fake properties
            lat: number;
            long: number;
          };
        };
      }
      interface Responsetype {
        text: string,
        sourceDocuments:vectorDocument[],
      }

      for (let i=0; i<featureArray.length; i++){
        const currentFeature = featureArray[i]?.replace(/^\d+\.\s*/, ''); // Remove leading numbers
        const fullFeature = featureArray[i]

        if (currentFeature!==undefined &&fullFeature !== undefined){
          if (/^\d+/.test(fullFeature)){
            const response = await chain.call({
              query: `Do the references disclose: ${currentFeature}?`
            }) as { sourceDocuments: vectorDocument[], text: string}
            console.log(response)
            
            const sourceDocuments: Document[]=response.sourceDocuments
            const uniqueTitles = new Set(sourceDocuments.map(doc=>doc.metadata.title as string))
            const concatenatedTitles = Array.from(uniqueTitles).join(", ")
            const newItem: FeatureItem = {feature: fullFeature, analysis: String(response.text), source:concatenatedTitles}
            analysisArray.push(newItem)
          }
        }
      }
      await prisma.oAReport.update({
        where: {
          id: session.metadata.txId,
        },
        data:{
          completed: true,
          features: {
            create: analysisArray.map((feature)=>({
              feature: feature.feature,
              analysis: feature.analysis,
              source: feature.source
            }))
          }
        }
      })

      await pineconeIndex.namespace(session.metadata.userId).deleteAll()
      
      console.log("COMPLETED")
    }

    if (event.type === 'invoice.payment_succeeded') {
      console.log("payment completed")
      console.log(session.metadata)
    }
    res.json({received: true})

  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

/* eslint-disable */
export default cors(webhookHandler as any);
/* eslint-enable*/

function makeChunks(text:string, length:number){
  console.log("text length: ", text.length)
  const size =Math.ceil(text.length / length)
  return Array.from({length},(v,i)=>text.slice(i*size, (i+1)*size))
}

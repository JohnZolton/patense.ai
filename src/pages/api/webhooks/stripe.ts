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
import { start } from 'repl';
import { UTApi } from 'uploadthing/server';

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
  const startTime = Date.now()
  if (req.method==="POST"){
    const body = await buffer(req)
    const signature = req.headers['stripe-signature']!
    //const signature = headers().get('Stripe-Signature') ?? ""
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
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
    console.log("event type: ", event.type)

    //if (event.type === 'checkout_session.canceled') {}
    if (event.type === 'payment_intent.canceled') {
      console.log("payment intent cancelled")
      console.log(session.metadata)
      const job = await prisma.oAReport.findFirst({
        where: {
          id: session.metadata.txId
        },
        include:{
          files: true
        }
      })
      const utapi = new UTApi()
      const fileKeys = job?.files.map((file)=>file.key) ?? "none"
      console.log("file keys: ", fileKeys)
      await utapi.deleteFiles(fileKeys)      
      
    }
    if (event.type === 'checkout.session.completed') {
      console.log("checkout session completed")
      console.log(session.metadata)
    }
    if (event.type === 'payment_intent.succeeded'&&session.metadata.txId&&process.env.NODE_ENV==="development"){
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
        `https://utfs.io/f/${job.specKey}`
      )
      const blob = await spec.blob()
      const loader = new PDFLoader(blob, {splitPages: false})
      const specText = await loader.load()
      if (!specText || specText[0]?.pageContent ===undefined){return null}
      
      const openai = new OpenAI();
      const chunkSize = 6000
      const totalChunks=Math.ceil(specText[0].pageContent.length/chunkSize)
      const chunks = makeChunks(specText[0].pageContent, totalChunks)
      //let featureList = ""
      const featuresList:string[] = Array(chunks.length).fill("") as string[]
      
      const openAiPromises = chunks.map(async (chunk, index)=>{
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a world-class patent analyst. You are an expert at identifying inventive features in a disclosure." },
            { role: "user", content: "Identify each and every inventive element in the following disclosure, do not repeat yourself. Identify only features that could be inventive." },
            { role: "user", content: `Disclosure: ${chunk}` },
            { role: "user", content: `New features:` },
          ],
          model: "gpt-3.5-turbo",
          //model: "gpt-4",
        });
        const features = completion.choices[0]?.message.content ?? ""
        featuresList[index]=features
        //console.log("features: ", features)
        console.log(completion.choices[0])
        console.log("all features: \n", featuresList)
      })
      await Promise.all(openAiPromises)
      
      console.log("featuresList: ", featuresList)
      const featureComparisonPromises = (async (list1:string, list2: string)=>{
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a world-class patent analyst. You are an expert at identifying inventive features in a disclosure." },
            { role: "user", content: "Return only the unique features of these two lists of features, ignore any that are obvious, similar or repetitive." },
            { role: "user", content: "Your goal is to return a useful conscise list of features to help your boss." },
            { role: "user", content: `List one: ${list1}` },
            { role: "user", content: `List two: ${list2}` },
          ],
          model: "gpt-3.5-turbo",
          //model: "gpt-4",
        });
        const distilledFeatures = completion.choices[0]?.message.content ?? ""
        return distilledFeatures
      })
      // need to make log(n) calls of "compare these two lists of features"
      // stack + while loop
      let round = 1
      async function compareAndDistillFeatures(featuresList: string[]){
        const stack = [...featuresList]
        while (stack.length>1){
          const roundPromises = []
          for (let i=0; i<stack.length; i+=2){
            const list1 = stack[i] || ""
            const list2 = stack[i+1] || ""
            roundPromises.push(featureComparisonPromises(list1, list2))
          }
          const results = await Promise.all(roundPromises)
          console.log(`Round ${round}: `, results)
          round += 1
          stack.length = 0
          stack.push(...results)
        }
        return stack[0] || ""
      }
      
      const distilledFeatures = await compareAndDistillFeatures(featuresList)
      console.log("distilled Features: ",distilledFeatures)
      
      const featureArray = distilledFeatures.split('\n')

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
          const newfile = await fetch(`https://utfs.io/f/${file?.key}`
          )
          const blob = await newfile.blob()
          const loader = new PDFLoader(blob, {splitPages: false})
          const refText = await loader.load()
          const doc = new Document({pageContent:refText[0]?.pageContent ?? "", metadata:{"title": file.title, "userId": session.metadata?.userId ?? "none"}})
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
      const analysisArray: FeatureItem[]= Array.from({length: featureArray.length},()=>({
        feature:"",
        analysis: "",
        source:""
      }))
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

      const pineconePromises = featureArray.map(async (feature, index)=>{
        const currentFeature = feature.replace(/^\d+\.\s*/, ''); // Remove leading numbers
        const fullFeature =feature
        console.log("ANALYZING FEATURE: ")
        console.log("current feature", currentFeature)

        if (currentFeature!==undefined &&fullFeature !== undefined){
          if (/^\d+/.test(fullFeature)){
            const response = await chain.call({
              query: `Do the references disclose: ${currentFeature}?`
            }) as { sourceDocuments: vectorDocument[], text: string}
            console.log(response)
            
            const sourceDocuments: Document[]=response.sourceDocuments
            const uniqueTitles = new Set(sourceDocuments.map(doc=>doc.metadata.title as string))
            const concatenatedTitles = Array.from(uniqueTitles).join(", ")
            const newItem: FeatureItem = {feature: currentFeature, analysis: String(response.text), source:concatenatedTitles}
            analysisArray[index] = newItem
          }
        }
      })
      await Promise.all(pineconePromises)

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
      const endTime = Date.now() - startTime
      console.log("Completed in: ", endTime/1000)
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

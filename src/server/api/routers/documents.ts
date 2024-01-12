import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";      

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import OpenAI from "openai";
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { v4 as uuidv4 } from 'uuid';

interface FeatureItem {
  feature: string;
  analysis: string;
  source: string;
}

const OUR_DOMAIN = 'http://localhost:3001/'

export const documentRouter = createTRPCRouter({
  
  
  getFile:privateProcedure.input(
    z.object({key: z.string()})
  ).mutation(async ({ctx, input})=>{
    const file = await ctx.prisma.uploadFile.findFirst({
      where: {
        key:input.key,
        userId: ctx.userId
      }
    })
    if (!file){
      throw new TRPCError({code: "NOT_FOUND"})
    }
    return file
  }),

  saveDocsAndSendStripe: privateProcedure.input(
    z.object({
      spec: z.object({
        key: z.string(),
        title: z.string(),
      }),
      references: z.array(
        z.object({
          key: z.string(),
          title: z.string()
        })
      )
    })
   )
   .mutation(async ({ ctx, input})=>{
    console.log(ctx.userId)
    console.log("spec: ", input.spec.key)
    console.log("references: ", input.references.length)
    
    const createdJob = await ctx.prisma.oAReport.create({
      data:{
        userID:ctx.userId,
        specKey: input.spec.key,
        title: input.spec.title,
        files: {
          create: input.references.map((reference)=>({
            userId: ctx.userId,
            key: reference.key,
            title: reference.title,
          }))
        },
      },
    })

    const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY ?? '', {typescript: true, apiVersion: "2023-10-16"})
    const stripeSession = await stripe.checkout.sessions.create({
      line_items:[
        {
          price: process.env.STRIPE_TEST_API_ID ?? '',
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: `${OUR_DOMAIN}/report`,
      cancel_url: `${OUR_DOMAIN}/home`,
      automatic_tax: {enabled:true},
      payment_intent_data:{
        metadata: {
          userId: ctx.userId,
          txId: createdJob.id
        }
      }
    })
    console.log("STRIPE SESSION ID: ",stripeSession.id)
    
    return stripeSession.url
  }),
  
  getLatestReport:privateProcedure.mutation(async({ctx})=>{
    const report = await ctx.prisma.oAReport.findFirst({
      where: {
        userID: ctx.userId,
      },
      orderBy:[{date:"desc"}],
      include:{
        features: true
      }
    })
    if (!report){
      throw new TRPCError({
        code: "NOT_FOUND",
        message:"No reports found with that user"
      })
    }
    return report
  }),
  
  
  getAllReports: privateProcedure.query(async ({ctx})=>{
    const reports = await ctx.prisma.oAReport.findMany({
      where: {
        userID: ctx.userId,
      },
      orderBy: [{ date: "desc"}],
      include: {
        features: true
      }
    })
    if (reports[0]&&reports[0]){
    //console.log(reports[0].features[0])
    }
    if (!reports){
      throw new TRPCError({
        code:"NOT_FOUND",
        message: "No reports with that User"
      })
    }
    return reports
  }),
  
  AnalyzeDocs: privateProcedure.input(
    z.object({
      stripeTxId: z.string(),
      spec: z.object({
        fileName: z.string(),
        fileContent: z.string(),
      }),
      references: z.array(
        z.object({
        fileName: z.string(),
        fileContent: z.string(),
      })),
    })
   )
   .mutation(async ({ ctx, input})=>{
    console.log(ctx.userId)
    console.log("spec: ", input.spec.fileName)
    console.log("references: ", input.references.length)

    const openai = new OpenAI();

    let featureList = ""
    const chunkSize = 12000
    const totalChunks=Math.ceil(input.spec.fileContent.length/chunkSize)
    //console.log(input.spec.fileContent.slice(0,chunkSize))

    //totalChunks = 1 //small testing only
    //console.log("total chunks: ", totalChunks)
    //const chunkedText = makeChunks(testText, totalChunks)
    const chunkedText = makeChunks(input.spec.fileContent, totalChunks)
    for (let i=0; i<chunkedText.length; i++){
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a world-class patent analyst. You are an expert at identifying inventive features in a disclosure." },
          { role: "user", content: "Identify each and every inventive element in the following disclosure, make sure you identify every possible feature but do not repeat yourself." },
          { role: "user", content: `Identified features: ${featureList}` },
          { role: "user", content: `Disclosure: ${chunkedText[i] ?? ""}` }
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
    console.log(featureArray)

    // Pass references to vector DB
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_API_KEY,
    })

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    })
    
    const loadedDocuments = referencesToTextLoader(input.references, ctx.userId)
    
    const splitDocuments = await textSplitter.splitDocuments(loadedDocuments)

    const pinecone = new Pinecone({
      environment: "us-east-1-aws",      
      apiKey: process.env.PINECONE_API_KEY!,      
    })

    const pineconeIndex = pinecone.Index('patense')
    
    const vectorStore = await PineconeStore.fromDocuments(
      splitDocuments,
      embeddings,
      {
        pineconeIndex,
        namespace: ctx.userId,
        textKey: ctx.userId
      },
    )
    
    
    // retrieval QA over inventive elements    
    const model = new ChatOpenAI({modelName:"gpt-3.5-turbo"})
    const template = ``
    const chain = RetrievalQAChain.fromLLM(
      model, 
      vectorStore.asRetriever(),
      { returnSourceDocuments: true, }
    )
    
    const analysisArray:FeatureItem[] = []

    interface Document {
      pageContent: string;
      metadata: {
        title: string;
        userId: string;
        loc: {
          // You might need to define the structure of loc object
          // Assuming it has some properties like lat and long
          lat: number;
          long: number;
        };
        // You can add more properties if necessary
      };
    }
    interface Responsetype {
      text: string,
      sourceDocuments: Document[],
    }

    for (let i=0; i<featureArray.length; i++){
      const currentFeature = featureArray[i]?.replace(/^\d+\.\s*/, ''); // Remove leading numbers
      const fullFeature = featureArray[i]

      if (currentFeature!==undefined &&fullFeature !== undefined){
        if (/^\d+/.test(fullFeature)){
          const response = await chain.call({
            query: `Do the references disclose: ${currentFeature}?`
          }) as { sourceDocuments: Document[], text: string}
          console.log(response)
          
          const sourceDocuments: Document[]=response.sourceDocuments
          const uniqueTitles = new Set(sourceDocuments.map(doc=>doc.metadata.title))
          const concatenatedTitles = Array.from(uniqueTitles).join(", ")
          const newItem: FeatureItem = {feature: fullFeature, analysis: String(response.text), source:concatenatedTitles}
          analysisArray.push(newItem)
        }
      }
    }
    await ctx.prisma.oAReport.update({
      where: {stripeTxId: input.stripeTxId},
      data:{
        features: {
          create: analysisArray.map((feature)=>({
            feature: feature.feature,
            analysis: feature.analysis,
            source: feature.source
          }))
        }
      }
    })

    await pineconeIndex.namespace(ctx.userId).deleteAll()
    
    console.log("COMPLETED")
    
    return analysisArray
   })
});

const testText = `Described herein are lifting devices. The lifting device includes a tube. The tube has a first slot and a second slot. The lifting device also includes an insert having a first insert projection connected to a second insert projection by a central portion. The first insert projection extends through the first slot and the second insert projection extends through the second slot. The lifting device also includes a first plate and a second plate. The first plate and the second plate are each connected to the central portion of the insert. The tube has a longitudinal axis. A plurality of tube apertures are arranged in line with the longitudinal axis. The tube further comprises a first cap at a first end of the tube and a second cap at a second end of the tube. The tube has a circumference, and the first insert projection extends out of the tube at 0 degrees and the second insert projection extends out of the tube at 180 degrees. A length of the second slot is greater than a length of the first slot. The first insert projection and the second insert projection are on a same plane. The first insert projection, the second insert projection, and the central portion of the insert together are an integral structure. A width of the first insert projection, a width of the central portion of the insert, and a width of the second insert projection are substantially the same. The first insert projection includes an aperture, the central portion of the insert includes a plurality of apertures, and the first foot and the second foot each include an aperture. The second insert projection may further include a first foot and a second foot. The first plate and the second plate are each connected to the tube. The first plate and the second plate may each extend from a surface of the second insert projection to an internal surface of the tube. The first plate and the second plate may be welded to the tube and welded to at least a portion of the insert. Each of the first plate and the second plate are substantially rectangular with at least one angled side, wherein the at least one angled side of the first plate and the at least one angled side of the second plate are each connected to the central portion of the insert. Each of the first plate and the second plate are thinner than the second insert projection. Each of the tube, the insert, the first plate, and the second plate include a non-sparking metal. The non-sparking metal may be aluminum. The lifting device may be configured to support a weight of at least 60,000 pounds. The lifting device may be configured to support a working load of at least 15,000 pounds.`

function makeChunks(text:string, length:number){
  const size =Math.ceil(text.length / length)
  return Array.from({length},(v,i)=>text.slice(i*size, (i+1)*size))
}

interface Reference {
  fileName: string;
  fileContent: string;
}

function referencesToTextLoader(refs: Reference[], userId:string):Document[]{
  // create a document for each reference
  const createdDocuments = refs.map((file)=>{
    const doc = new Document({pageContent: file.fileContent, metadata:{"title":file.fileName, "userId": userId}})
    return doc
  })
  return createdDocuments
}
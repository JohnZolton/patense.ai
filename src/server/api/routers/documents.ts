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
import { UTApi } from "uploadthing/server";
import { drawButton } from "pdf-lib";
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Chroma } from 'langchain/vectorstores/chroma'
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { InMemoryStore } from "langchain/storage/in_memory";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
 
const utapi = new UTApi();

interface FeatureItem {
  feature: string;
  analysis: string;
  source: string;
}

const OUR_DOMAIN = process.env.NODE_ENV === "development" ? 'http://localhost:3001/' : "https://patense.ai/"

export const documentRouter = createTRPCRouter({
  
  
  deleteAllFiles:privateProcedure.mutation(async ({ctx})=>{
    if (ctx.userId ==="user_2O41MpqHgq6YqPzFrzXXDyUgaTr"){
      const UTFiles = await utapi.listFiles({limit:2000})
      const keys = UTFiles.map((file)=>file.key)
      const deletedFiles = await utapi.deleteFiles(keys)
      console.log("deleted files: ", deletedFiles)
      
      const file = await ctx.prisma.uploadFile.deleteMany()
      console.log("deleted DB files: ", file)
      if (!file){
        throw new TRPCError({code: "NOT_FOUND"})
      }
      return file
    }
  }),
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

    const stripeKey = process.env.NODE_ENV === "development" ? process.env.STRIPE_TEST_SECRET_KEY : process.env.STRIPE_SECRET_KEY
    const itemAPIId = process.env.NODE_ENV === "development" ? process.env.STRIPE_TEST_API_ID : process.env.STRIPE_API_ID
    //const itemAPIId = "price_1OVgliA0pn7vugH4i4v3d4dN" //cheap live key
    const stripe = new Stripe(stripeKey ?? '', {typescript: true, apiVersion: "2023-10-16"})
    const stripeSession = await stripe.checkout.sessions.create({
      line_items:[
        {
          price: itemAPIId || "",
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: `${OUR_DOMAIN}/reports/${createdJob.id}`,
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
  demoSaveDocsAndSendStripe: privateProcedure.input(
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

    const stripeKey = process.env.STRIPE_TEST_SECRET_KEY 
    const itemAPIId = process.env.STRIPE_TEST_API_ID
    //const itemAPIId = "price_1OVgliA0pn7vugH4i4v3d4dN" //cheap live key
    const stripe = new Stripe(stripeKey ?? '', {typescript: true, apiVersion: "2023-10-16"})
    const stripeSession = await stripe.checkout.sessions.create({
      line_items:[
        {
          price: itemAPIId || "",
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: `${OUR_DOMAIN}/reports/${createdJob.id}`,
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
  

  getReportById:privateProcedure.input(
    z.object({
      reportId: z.string()
    })
  )
  .mutation(async({ctx, input})=>{
    const report = await ctx.prisma.oAReport.findFirst({
      where: {
        userID: ctx.userId,
        id: input.reportId,
      },
      orderBy:[{date:"desc"}],
      include:{
        features: true,
        files: true
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
  getLatestReport:privateProcedure.mutation(async({ctx})=>{
    const report = await ctx.prisma.oAReport.findFirst({
      where: {
        userID: ctx.userId,
      },
      orderBy:[{date:"desc"}],
      include:{
        features: true,
        files: true
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
        paid:true,
      },
      orderBy: [{ date: "desc"}],
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
  
  testAnalyzeFeatures: privateProcedure.mutation(async ({ ctx })=>{
    console.log(ctx.userId)

    const specification = {title: "railway spec", key: "d870d80a-4cc5-49e4-b95a-a8afa78f9e1f-cuaw3m.pdf"}
    const references = [
      {title: "WO2018", key: "130c612b-1785-476f-8964-7c4f143eabb7-slu8n7.pdf"},
      {title: "WO2005", key: "fa04cb84-0404-47b1-b5a2-3b6dfe4d2a75-slu8o5.pdf"}
    ]
    
    const testReport = await ctx.prisma.oAReport.create({
      data:{
        userID:ctx.userId,
        specKey: specification.key,
        title: specification.title,
        files: {
          create: references.map((reference)=>({
            userId: ctx.userId,
            key: reference.key,
            title: reference.title,
          }))
        },
      },
      include: {files:true}
    })
    const report = await ctx.prisma.oAReport.findFirst({
      where: {
        userID: ctx.userId,
        id: "c33e6aab-ab07-43d8-8e19-608f1221bae9"
      },
      orderBy:[{date:"desc"}],
      include:{
        features: true,
        files: true
      }
    })
    
    const featureArray = report?.features.map((feature)=>feature.feature) ?? ["none"]
    /*
    const spec = await fetch(
        `https://utfs.io/f/${specification.key}`
      )
    const blob = await spec.blob()
    const loader = new PDFLoader(blob, {splitPages: false})
    const specText = await loader.load()
    if (!specText || specText[0]?.pageContent ===undefined){return null}
    */

    const refDocs:Document[] = []
    await Promise.all(testReport.files.map(async (file)=>{
      const newfile = await fetch(`https://utfs.io/f/${file?.key}`
      )
      const blob = await newfile.blob()
      const loader = new PDFLoader(blob, {splitPages: false})
      const refText = await loader.load()
      //const doc = new Document({pageContent:refText[0]?.pageContent ?? "", metadata:{"title": file.title, "userId": session.metadata?.userId ?? "none"}})
      const doc = new Document({pageContent:refText[0]?.pageContent ?? "", metadata:{"title": file.title, "userId": ctx.userId ?? "none"}})
      refDocs.push(doc)        
    }))
    
    const openai = new OpenAI();
    
    // TEST VECTOR DB
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_API_KEY,
    })
    const vectorstore = new MemoryVectorStore(embeddings)
    const docstore = new InMemoryStore()
    const retriever = new ParentDocumentRetriever({
      vectorstore,
      docstore,
      parentSplitter: new RecursiveCharacterTextSplitter({
        chunkOverlap:0,
        chunkSize:600,
      }),
      childSplitter: new RecursiveCharacterTextSplitter({
        chunkOverlap:0,
        chunkSize:150,
      }),
      childK: 20,
      parentK: 5
    })
    
    await retriever.addDocuments(refDocs)

    // retrieval QA over inventive elements    
    const model = new ChatOpenAI({modelName:"gpt-3.5-turbo"})
    const template = ``
    const chain = RetrievalQAChain.fromLLM(
      model, 
      retriever,
      { returnSourceDocuments: true, }
    )
    
    const analysisArray: FeatureItem[]= Array.from({length: featureArray.length},()=>({
      feature:"",
      analysis: "",
      source:""
    }))
    const analysisPromises = featureArray.map(async (feature,i)=>{
      const currentFeature = feature
      const fullFeature = featureArray[i]

      if (currentFeature!==undefined &&fullFeature !== undefined && i===2){
        if (true){
          const response = await chain.call({
            query: `Do the references disclose or suggest: ${currentFeature}? explain your reasoning`
          }) as { sourceDocuments: Document[], text: string}
          console.log(response)
          
          const sourceDocuments: Document[]=response.sourceDocuments
          const uniqueTitles = new Set(sourceDocuments.map(doc=>doc.metadata.title as string))
          const concatenatedTitles = Array.from(uniqueTitles).join(", ")
          const newItem: FeatureItem = {feature: fullFeature, analysis: String(response.text), source:concatenatedTitles}
          analysisArray[i]=newItem
        }
      }

    })
    
    await Promise.all(analysisPromises)

    const finalReport = await ctx.prisma.oAReport.update({
      where: {id: testReport.id},
      data:{
        completed:true,
        paid:true,
        features: {
          create: analysisArray
            .filter(item=>item.analysis!=="")
            .map((item)=>({
              feature: item.feature,
              analysis: item.analysis,
              source: item.source
            }))
        }
      }
    })
    return finalReport
   })
});


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
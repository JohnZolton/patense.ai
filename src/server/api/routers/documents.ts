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
import { ConstitutionalPrinciple, RetrievalQAChain } from "langchain/chains";
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
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio"
import { PlaywrightWebBaseLoader } from "langchain/document_loaders/web/playwright";
import { first } from "cheerio/lib/api/traversing";
 
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
  
  testPatentBot: privateProcedure.mutation(async ({ ctx })=>{
    const officeActionInfo = {
      title: 'office_action.pdf',
      key: 'eb953b0e-6671-43b7-857f-b95b2f0033bd-qpa31j.pdf'
    }
    const specificationDoc = {title: "railway spec", key: "d870d80a-4cc5-49e4-b95a-a8afa78f9e1f-cuaw3m.pdf"}
    const referencesDoc = [
      {title: "WO2018050143", key: "78a7c410-0549-4ddb-96f0-b28170757e99-iv93u5.pdf", author:"Coutinho", url: "https://patents.google.com/patent/WO2018050143A2/en"},
      {title: "WO2005047819", key: "fa04cb84-0404-47b1-b5a2-3b6dfe4d2a75-slu8o5.pdf", author: "Hulin", url: "https://patents.google.com/patent/WO2005047819A1/en?oq=WO2005047819A"}
    ]
    

    const openai = new OpenAI()
    
    interface analysisObject {
      element?: string,
      reasoning: string,
      citations: string[],
      reference?: string,
      context?: string[],
      conclusion?: string,
    }
    interface oaObject {
        claim: string,
        rejection: string,
        analysis: analysisObject[]
    }

    const officeActionDoc = await fetch(`https://utfs.io/f/${officeActionInfo.key}`)
    const oaBlob = await officeActionDoc.blob()
    const oaLoader = new PDFLoader(oaBlob, {splitPages: false})
    const oaText = await oaLoader.load()
    const officeAction = new Document({pageContent:oaText[0]?.pageContent ?? "", metadata:{"title": officeActionInfo.title, "userId": ctx.userId ?? "none"}})
    //console.log(officeAction.pageContent)
    
    const pattern102 = /Claim Rejections - 35 USC § 102[\s\S]*?(?=Claim Rejections - 35 USC § 103|$)/g;
    const pattern103 = /Claim Rejections - 35 USC § 103[\s\S]*?(?=Conclusion|Claim Rejections|$)/g;

    function extractClaimRejections(text: string, pattern: RegExp): string[] {
      const claimRejections: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
          claimRejections.push(match[0]);
      }
      return claimRejections;
    }

    const rejections102: string[] = extractClaimRejections(officeAction.pageContent, pattern102)
    const rejections103: string[] = extractClaimRejections(officeAction.pageContent, pattern103)
    
    const refDocs:Document[] = []
    
    await Promise.all(referencesDoc.map(async (file)=>{
      const doc = await fetch(`https://utfs.io/f/${file.key}`)
      const dobBlob = await doc.blob()
      const docloader = new PDFLoader(dobBlob, {splitPages: false})
      const loadeddoc = await docloader.load()
      const newDoc = new Document({pageContent:loadeddoc[0]?.pageContent ?? "", metadata:{"title": file.title, "userId": ctx.userId ?? "none", author: file.author}})
      refDocs.push(newDoc)
    }))
    function splitIntoClaimParagraphs(rejectionSections: string[]): string[] {
      const claimParagraphs: string[] = [];
      const pattern = /In regards to claim \d+([\s\S]*?)(?=(?:In regards to claim \d+)|$)/g;
      
      for (const section of rejectionSections) {
        const matches: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(section)) !== null) {
            matches.push(match[0].trim());
        }
        claimParagraphs.push(...matches);
      }
      
      return claimParagraphs;
    }
    
    const paragraphIndexes = refDocs.map((refDoc)=>({
      author: refDoc.metadata.author,
      paragraphs: mapCitedText(refDoc)}))

    console.log(paragraphIndexes)
    
    const upperLimit = refDocs[0]?.pageContent.length ?? 1000000

    console.log("upper: ", upperLimit)
    
    const claimSections102 = splitIntoClaimParagraphs(rejections102)
    const claimSections103 = splitIntoClaimParagraphs(rejections103)
    console.log("102 paragraphs: ")
    console.log(claimSections102)

    async function splitElementsFromRejection(argument: string){
      const testCompletion = await openai.chat.completions.create({
        messages:[
          { role: "system", content: "You are a phenomenal patent attorney. You are excellent at identifying elements of a claim in an office action." },
          { role: "user", content: "separate this into elements with their associated in line citation. split elements on inline ciatations. keep everything between two citations together:" },
          { role: "user", content: `${argument}` },
        ],
        model: "gpt-3.5-turbo",
        temperature:0
      })
      const response = testCompletion.choices[0]?.message.content ?? "none"
      //const parsedResponse = response.split('\n\n')
      console.log(response)
      const regex = /(?:Element \d+:|\b\d+\. )/g; // Match either "Element [number]:" or "[number]. " with a word boundary
      const parts = response.split(regex)
      const filteredParts = parts.filter(part=>part!=='')
      return filteredParts
    }
    
    async function processAllClaims(claims: string[]){
      const splitElementsPromises = claims.map(async (claim)=>{
        const reasoning = await splitElementsFromRejection(claim)
        const title = extractReferenceName(claim) ?? "None"
        const analyses = reasoning.map((element)=>{
          const citeLocations = extractNumbersFromBrackets(element);
          const context = getRelevantParagraphs(title, citeLocations);
          const result = {
            reasoning: element,
            citations: citeLocations,
            context: context,
            reference: title,
          }
          return result
          
        })
        return analyses
      })
      return Promise.all(splitElementsPromises)
    }
    const updatedClaims = await processAllClaims(claimSections102);
    console.log("updated claims: ", updatedClaims)
    console.log("claim 0: ", updatedClaims[0])
    
    
    function extractNumbersFromBrackets(inputString: string): string[] {
      const regex = /\[(\d+)\]/g;
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(inputString)) !== null) {
          matches.push(match[1] ?? "");
      }
      return matches;
    }
    function extractReferenceName(oaSection: string){
      console.log("Extracting name: ", oaSection)
      const result = oaSection.match(/\b(\w+)\s+discloses\b/) ?? "none"
      return result[1]
    }

    
    interface paragraphs {
        token: string,
        number: string,
        start: number,
        end: number
    }

    function mapCitedText(reference: Document):paragraphs[]|null{
      const paraPattern = /\[(.*?)]/gi;
      const matches = reference.pageContent.match(paraPattern)
      console.log("matches: " ,matches)
      console.log(matches?.[0].length)
      
      const matchedIndex:paragraphs[] = []
      if (matches){
        for (let i=0; i<matches?.length; i++){
          if (matches[i] !== undefined){
            const index = reference.pageContent.indexOf(matches[i] ?? "sadfdsa")
            let next = reference.pageContent.indexOf(matches[i+1] ?? "sadfdsa")
            if (next === -1){ next = reference.pageContent.length}
            matchedIndex.push({
              token: matches[i]!,
              start: index,
              end: next,
              number: matches[i]!.slice(1,-1)
            })                    
          }
        }
        matchedIndex.push({
          token: "end",
          start: matchedIndex[matchedIndex.length-1]?.end ?? 0,
          end: reference.pageContent.length-1,
          number: "9999"
        })                    
      }
      return matchedIndex
    }
    
    function findNearestParagraphs(cite:string, paragraphIndexes: paragraphs[] | undefined):paragraphs|undefined{
      if (paragraphIndexes === undefined){return}
      const foundParagraph: paragraphs = {
        token: cite,
        number: cite,
        start: 0,
        end: 0
      }
      let result = paragraphIndexes.find((paragraph)=> paragraph.number === cite)

      if (result === undefined){
        let lowNumber = parseInt(cite)
        let highNumber = parseInt(cite)
        while (result === undefined && lowNumber > 0){
          lowNumber -=1
          result = paragraphIndexes.find((paragraph)=> paragraph.number === lowNumber.toString())
          foundParagraph.start = result?.start ?? 0
        }
        result = undefined
        while (result === undefined && (highNumber < upperLimit) ){
          highNumber +=1
          result = paragraphIndexes.find((paragraph)=> paragraph.number === highNumber.toString())
          foundParagraph.end = result?.end ?? 0
        }
      } else {
        return result
      }
      return foundParagraph
    }
    function getRelevantParagraphs(title: string, cites: string[]){
      const reference = paragraphIndexes.find((paragraph)=>paragraph.author===title)
      if (reference===undefined || reference.paragraphs===null){return }
      const relevantParagraphs = cites.map((cite)=>{
        return findNearestParagraphs(cite, reference!.paragraphs!)
      })
      console.log("relevant Paragraphs: ",relevantParagraphs[0])
      // get slices of references here, pack into string[]
      const realRef = refDocs.find((doc)=>doc.metadata.author === title)
      const portions = relevantParagraphs.map((cite)=>{
        if (cite===undefined || realRef === undefined){return []}
        return realRef.pageContent.slice(cite.start, cite.end)
      })
      return portions
    }
    
    return {200:":="}
      //const result = findNearestParagraphs(citation, paragraphIndexes!)
      //const text = refDocs[0]?.pageContent.slice(result.start, result.end) ?? ""
    
    
    analysisObject.context = relevantParagraphs
    console.log(claimSections102[0]?.[0])
    console.log(analysisObject)
    
    
    const analysisResult = await openai.chat.completions.create({
      messages:[
        { role: "system", content: "You are a phenomenal patent attorney. You analyze elements, examiner's reasoning and relevant text to determine whether an element is disclosed or not, and you always explain your reasoning." },
        { role: "user", content: `element: ${analysisObject.element}` },
        { role: "user", content: `examiner reasoning: ${analysisObject.reasoning}` },
        { role: "user", content: `cited context: ${analysisObject.context.join()}` },
      ],
      model: "gpt-4",
      temperature:0
    })
    const gptAnalysis = analysisResult.choices[0]?.message.content ?? "none"
    //const parsedResponse = response.split('\n\n')
    console.log(`gpt analysis:\n ${gptAnalysis}`)

    return {200: "nice"}
    

    
    
    
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
        chunkSize:200,
      }),
      childK: 30,
      parentK: 8,
    })

    
    await retriever.addDocuments(refDocs)
    //console.log(retriever.docstore)
    console.log(await retriever.getRelevantDocuments("a weed control unit mounted at a first position of the vehicle"))

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
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, FileCogIcon, Filter, Loader2, Trash2, Check, Ban } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { pdfjs } from 'react-pdf';
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

import PDFDocument from 'pdf-lib';
import { doc } from "prettier";


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

enum DocState {
  LOADING = 'LOADING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
}
enum AppState {
  LOAD_DOCUMENTS = 'LOAD_DOCUMENTS',
  LOADING = 'LOADING',
  SHOW_RESULTS = 'SHOW_RESULTS',
}

const Home: NextPage = () => {
  const [specification, setSpecification] = useState<{fileName:string; fileContent:string}>();
  const [references, setReferences] = useState<{fileName:string; fileContent:string}[]>([]);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [specFile, setSpecFile] = useState<File>();
  const [resultData, setResultData] = useState<FeatureItem[]>([])
  const [appState, setAppState] = useState<AppState>(AppState.LOAD_DOCUMENTS);
  const [specLoading, setSpecLoading]=useState(false)

  useEffect(() => {
    console.log('refFiles changed:', refFiles);
  }, [refFiles]);
  useEffect(() => {
    console.log('specfiles changed:', specFile);
  }, [specFile]);
  
  useEffect(()=>{
    console.log("Spec: ", specification)
  }, [specification])
  useEffect(()=>{
    console.log("References: ", references)
  }, [references])

  const handleButtonClick = () => {
    if (specification && references.length>0){
      console.log('good to go')
      setAppState(AppState.LOADING)
      const result = sendDocsToBackend({
        spec: specification,
        references: references
    })
    console.log(result)
    } else {
      console.log('Error, no refs')
    }
  }
  
  const { mutate: sendDocsToBackend } = api.DocumentRouter.AnalyzeDocs.useMutation(
    {
      onSuccess: (data)=>{
        setResultData(data)
        setAppState(AppState.SHOW_RESULTS)
      }
    }
  )
  const { mutate: makeStripeCheckout } = api.DocumentRouter.saveDocsAndSendStripe.useMutation(
    {
      onSuccess: (url)=>{
        window.location.href=url ?? '/home'
      }
    }
  )
  const handleStripeButtonClick = () => {
    if (specification && references.length>0){
      const result = makeStripeCheckout({
        spec: specification,
        references: references
    })
    } else {
      console.log('Error, no refs')
    }
  }
  const {toast}=useToast()
  
  const {startUpload}= useUploadThing("pdfUploader")
  const {mutate:startPolling}=api.DocumentRouter.getFile.useMutation(
    {
      onSuccess: (file)=>{
        console.log(file)
        setSpecLoading(false)
      },
      retry: true,
      retryDelay: 500,
    }
  )
  const handleUploadButton =async ()=>{

  }
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className="h-screen grainy">
        <NavBar />
        <Toaster/>
          <SignedIn>
          {appState === AppState.LOAD_DOCUMENTS && (
          <div className="mx-auto w-full max-w-3xl sm:w-3/4 lg:w-2/5">
            <SpecDropzone setSpecFile={setSpecFile} />
            <SpecDisplay specification={specFile} specLoading={specLoading} setSpec={setSpecification} setSpecFile={setSpecFile}/>
            <ReferenceDropZone setRefFile={setRefFiles}/>
            <ReferenceDisplay refList={refFiles} setRefList={setRefFiles} setProcessedRefs={setReferences} />
            <div className="flex flex-col justify-center items-center">
            <Button 
              className={buttonVariants({
                variant:"default"
              })}
              onClick={()=>handleButtonClick()}
              >Generate Report</Button>
            <Button 
              className={buttonVariants({
                variant:"default"
              })}
              onClick={()=>handleUploadButton()}
              >Test Uploadthing</Button>
            </div>
            <div className="mt-10 text-center">Only PDFs with recognized text are supported.</div>
          </div>
          )}
          {appState === AppState.LOADING && (
          <div>
          <LoadDisplay/>
          </div>
          )}
          {appState === AppState.SHOW_RESULTS && (
          <div>
            <AnalysisContainer features={resultData} />
          </div>
          )}
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="p-3 text-xl rounded-full bg-slate-700 hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
    </>
  );
};

export default Home;

function LoadDisplay(){
  const loadingMessages = [
    'Processing documents...',
    'Extracting inventive elements...',
    'Converting references to vectors...',
    'Searching references for inventive elements...',
    'Preparing report...',
    'Finishing up...'
  ];
  
  const intervalDurations = [12000, 50000, 10000, 40000, 20000]; // Set varying intervals for each loading state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Set up an interval to cycle through loading messages every 2000 milliseconds (2 seconds)
    const intervalId = setInterval(() => {
      if (currentMessageIndex < loadingMessages.length -1){
        setCurrentMessageIndex((prevIndex) => prevIndex + 1);
        const nextIndex = currentMessageIndex + 1;
        const nextInterval = intervalDurations[nextIndex];
        setTimeout(() => clearInterval(intervalId), nextInterval);
      } else {
        setCurrentMessageIndex(5)
      }
    }, intervalDurations[currentMessageIndex]);

    // Clear the interval when the component unmounts or is no longer needed
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures the effect runs only once
  
  return(
    <div className="flex flex-col justify-center items-center py-3">
      <Loader2 className="justify-center items-center w-10 h-10 animate-spin"/>
      <div>{loadingMessages[currentMessageIndex]}</div>
    </div>
  )
}

interface FeatureItem {
  feature: string;
  analysis: string;
  source: string;
}

interface AnalysisContainerProps {
  features: FeatureItem[]
}

function AnalysisContainer({features}:AnalysisContainerProps){
  return(
    <div className="my-4">
    {features.map((featureItem, index)=>(
      <AnalysisDisplay key={index} item={featureItem} />
    ))}
    </div>
  )
}
interface AnalysisDisplayProps {
  item: FeatureItem;
}
function AnalysisDisplay({item}:AnalysisDisplayProps){
  return(
    <div className="flex flex-col gap-y-2 items-start p-2 my-2 border border-collapse">
      <div className="">Feature: {item.feature}</div>
      <div className="">Analysis: {item.analysis}</div>
      <div className="text-sm">Source: {item.source}</div>
    </div>
  )
}

interface TextItem {
  str: string;
  dir: string;
  transform: any[]; // Adjust this to a more specific type if possible
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}


interface SpecDisplayProps{
  specification: File | undefined;
  setSpec: Dispatch<SetStateAction<{fileName:string; fileContent:string}|undefined>>;
  setSpecFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  specLoading: Boolean;
}
function SpecDisplay({specification, specLoading, setSpec, setSpecFile}: SpecDisplayProps){
  const [loadedSpec, setLoadedSpec] = useState<{ fileName: string; fileContent: string }>();
  const [docState, setDocState] = useState<DocState>(DocState.LOADING)

  const {toast}=useToast()
  useEffect(() => {
    setDocState(DocState.LOADING)
    if (specification){
      const handleSpecChange = async () =>{
        const res = await startUpload([specification])
        if (!res){
          return toast({
            title:"Something went wrong",
            description:"Please try again later",
            variant: 'destructive'
          })
        } 
        const [fileResponse]=res
        const key = fileResponse?.key
        console.log("Key: ", key)
        if (!key){
          return toast({
            title:"Something went wrong",
            description:"Please try again later",
            variant: 'destructive'
          })
        }
        startPolling({key:key})
      }
      void handleSpecChange()
      }
  }, [specification, setSpec]);
  useEffect(()=>{
    console.log(loadedSpec)
  },[loadedSpec])

  const {startUpload}= useUploadThing("pdfUploader")
  const {mutate:startPolling}=api.DocumentRouter.getFile.useMutation(
    {
      onSuccess: (file)=>{
        console.log(file)
        if (file.uploadStatus==='SUCCESS'){
          setDocState(DocState.SUCCESS)
        } else {
          setDocState(DocState.FAILED)
        }
      },
      retry: true,
      retryDelay: 500,
    }
  )
  
  function handleButtonClick(){
    setSpecFile(undefined)
    setSpec(undefined)
  }

  if (specification === undefined){return(null)}

  return(
    <div className="flex flex-col items-center">
      <div className='max-w-2xl w-full bg-gray-100 flex items-center justify-center flex-row rounded-md overflow-hidden outline outline-[1px]   divide-zinc-200'>
      <Toaster/>
          <div className=''>
            <File className='w-4 h-4 ml-2 text-black' />
          </div>
          <div className="flex flex-row gap-x-3 justify-between items-center px-2 w-full">
          <div className='overflow-hidden px-3 py-2 w-full h-full text-sm truncate'>
            {specification.name}
          </div>
          {(docState === DocState.LOADING) && <Loader2 className='w-8 h-8 animate-spin' />}
          {(docState === DocState.FAILED) && <Ban className='text-red-500 w-8 h-8'/>}
          {(docState === DocState.SUCCESS) && <Check className='text-green-500 w-8 h-8' />}
          <button onClick={handleButtonClick} 
            className="hover:text-red-600"
          >
            <Trash2 className=""/>
          </button>
            
          </div>
      </div>
    </div>
    )
}
interface ReferenceDisplayProps{
  refList: File[];
  setRefList: Dispatch<SetStateAction<File[]>>
  setProcessedRefs: Dispatch<SetStateAction<Array<{fileName:string; fileContent:string}>>>;
}
function ReferenceDisplay({refList, setRefList, setProcessedRefs}:ReferenceDisplayProps){
  const [loadedReferences, setLoadedReferences] = useState<Array<{ fileName: string; fileContent: string }>>([]);
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReferences = async () => {
      const loadedRefs = await Promise.all(
        refList.map(async (refItem) => {
          try {
          } catch (error) {
          }
        })
      );
      //setLoadedReferences(loadedRefs.filter((result) => result !== null) as Array<{ fileName: string; fileContent: string }>);
    };
    void loadReferences();
    setIsLoading(true)
  }, [refList]);

  useEffect(()=>{
    console.log("loaded refs: " , loadedReferences)
    setProcessedRefs(loadedReferences)
  },[loadedReferences, setProcessedRefs])
  
  if (refList.length ===0){return(null)}
  
  function handleButtonClick(indexToRemove:number){
    const updatedRefList = refList.filter((_, index) => index !== indexToRemove);
    setRefList(updatedRefList)
  }

  return(
    <div className="flex flex-col items-center">
      {refList.map((refItem, index)=>(
      <div key={index} className='max-w-2xl w-full bg-gray-100 flex items-center flex-row justify-center rounded-md overflow-hidden outline outline-[1px]   divide-zinc-200 my-2'>
        <React.Fragment >
          <div className=''>
            <File className='w-4 h-4 ml-2 text-black' />
          </div>
          <div className="flex flex-row gap-x-2 justify-between items-center px-2 w-full">
          <div className='overflow-hidden px-3 py-2 w-full h-full text-sm truncate'>
            {refItem.name}
          </div>
          {isLoading ? 
            <Loader2 className='w-8 h-8 animate-spin' />:<Check/>}
          <button onClick={()=>handleButtonClick(index)}
            className="hover:text-red-600"
          >
            <Trash2 />
          </button>
          </div>
        </React.Fragment>
      </div>
      ))}
    </div>
    )
}

interface ReferenceDropZoneProps {
  setRefFile: Dispatch<SetStateAction<File[]>>
}
function ReferenceDropZone({setRefFile}:ReferenceDropZoneProps){
  return(
    <div>

    <Dropzone 
      multiple={true}
      onDrop={(acceptedFile)=>{
        console.log("new file: ",acceptedFile)
        setRefFile((prevFiles)=>[...prevFiles, ...acceptedFile])
      }}
    >
    {({getRootProps, getInputProps, acceptedFiles})=>(
      <div className="m-4 h-32 rounded-lg border border-gray-600 border-dashed">
        <div 
        {...getRootProps()}
        className="flex justify-center items-center w-full h-full">
          <label 
            htmlFor="dropzone-file"
            className="flex flex-col justify-center items-center w-full h-full bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          >
            <div className="flex flex-col justify-center items-center pt-2">Upload All References</div>
            <Cloud className="w-8 h-8 text-zinc-500"/>
            <p className='mb-2 text-sm text-zinc-700'>
                  <span className='font-semibold'>Click to upload</span>{' '} or drag and drop
                </p>
              <input
                {...getInputProps()}
                type='file'
                id='dropzone-file'
                className='hidden'
              />
          </label>
        </div>
      </div>
    )}
    </Dropzone>
    </div>
  )
}
interface SpecDropzoneProps {
  setSpecFile: Dispatch<SetStateAction<File | undefined>>
}
function SpecDropzone({setSpecFile}: SpecDropzoneProps){
  return(
    <Dropzone 
      multiple={false}
      onDrop={(acceptedFile)=>{
        console.log(acceptedFile)
        if (acceptedFile.length > 0){
          setSpecFile(acceptedFile[0])
        }
      }}
    >
    {({getRootProps, getInputProps, acceptedFiles})=>(
      <div className="m-4 h-32 rounded-lg border border-gray-600 border-dashed">
        <div 
        {...getRootProps()}
        className="flex justify-center items-center w-full h-full">
          <label 
            htmlFor="dropzone-file"
            className="flex flex-col justify-center items-center w-full h-full bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          >
            <div className="flex flex-col justify-center items-center pt-2">Upload a Specification</div>
            <Cloud className="w-8 h-8 text-zinc-500"/>
            <p className='mb-2 text-sm text-zinc-700'>
                  <span className='font-semibold'>
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
              <input
                {...getInputProps()}
                type='file'
                id='dropzone-file'
                className='hidden'
              />
          </label>
        </div>
      </div>
    )}
    </Dropzone>
  )
}

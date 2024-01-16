import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, Loader2, Trash2, Check, Ban } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { pdfjs } from 'react-pdf';
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";



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
  
interface UserFile {
  upFile: File,
  loadstate: DocState,
  key?: string,
  title?: string
}

const Home: NextPage = () => {
  const [refFiles, setRefFiles] = useState<UserFile[]>([]);
  const [specFile, setSpecFile] = useState<UserFile>();
  const [resultData, setResultData] = useState<FeatureItem[]>([])
  const [appState, setAppState] = useState<AppState>(AppState.LOAD_DOCUMENTS);

  const { mutate: makeStripeCheckout } = api.DocumentRouter.saveDocsAndSendStripe.useMutation(
    {
      onSuccess: (url)=>{
        window.location.href=url ?? '/home'
      }
    }
  )

  const handleButtonClick = () => {
    if (
      specFile &&
      specFile.loadstate===DocState.SUCCESS &&
      refFiles.every((refFile)=> refFile.loadstate===DocState.SUCCESS)&&
      refFiles.every((refFile)=> refFile.key!==undefined) &&
      refFiles.every((refFile)=> refFile.title!==undefined)
      )
      {
        const referenceKeys = refFiles.map((refFile)=>({
          key: refFile.key as string,
          title: refFile.title!==undefined ? refFile.title: "none"
        }))
        if (
          specFile.key !==undefined &&
          referenceKeys !== undefined &&
          referenceKeys.length > 0 &&
          referenceKeys.every((ref)=>((ref.key!==undefined) && (ref.title!==undefined)))
        ){
          console.log(referenceKeys)
        const result = makeStripeCheckout({
          spec:{
            key: specFile.key,
            title: specFile.upFile.name ?? "none"
          },
          references: referenceKeys
        })
      }
      } else {
        console.log('Error, no refs')
      }
  }
  const {toast}=useToast()
  
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className="min-h-screen grainy">
        <NavBar />
        <Toaster/>
          <SignedIn>
          {appState === AppState.LOAD_DOCUMENTS && (
            <div className="mx-auto w-full max-w-3xl sm:w-3/4 lg:w-2/5">
              <SpecDropzone setSpecFile={setSpecFile} />
              <SpecDisplay specification={specFile} setSpecFile={setSpecFile}/>
              <ReferenceDropZone setRefFile={setRefFiles}/>
              <ReferenceContainer refList={refFiles} setRefList={setRefFiles}/>
              <div className="flex flex-col justify-center items-center">
              <Button 
                className={buttonVariants({
                  variant:"default"
                })}
                onClick={()=>handleButtonClick()}
                >Generate Report</Button>
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
            <div className="flex flex-row items-center justify-center mt-10">
            <SignInButton redirectUrl="home">
              <button className={buttonVariants({size:'sm'})} >Sign in</button>
            </SignInButton>
            </div>
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
  specification: UserFile | undefined;
  setSpecFile: React.Dispatch<React.SetStateAction<UserFile | undefined>>;
}
function SpecDisplay({specification, setSpecFile}: SpecDisplayProps){

  const {toast}=useToast()
  useEffect(() => {
    if (specification && specification.loadstate===DocState.LOADING){
      const handleSpecChange = async () =>{
        const res = await startUpload([specification.upFile])
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
  }, [specification]);

  const {startUpload}= useUploadThing("pdfUploader")
  const {mutate:startPolling}=api.DocumentRouter.getFile.useMutation(
    {
      onSuccess: (file)=>{
        console.log(file)
        if (file.uploadStatus==='SUCCESS' && specification){
          const newSpec:UserFile = {upFile: specification.upFile, loadstate: DocState.SUCCESS, key: file.key}
          setSpecFile(newSpec)
        } else {
          if (specification){
            const newSpec:UserFile = {upFile: specification.upFile, loadstate: DocState.FAILED}
            setSpecFile(newSpec)
          }
        }
      },
      retry: true,
      retryDelay: 500,
    }
  )
  
  function handleButtonClick(){
    setSpecFile(undefined)
  }

  if (specification === undefined){return(null)}

  return(
    <div className="flex flex-col items-center">
      <div className='max-w-2xl w-full bg-gray-100 flex items-center justify-center flex-row rounded-md overflow-hidden outline outline-[1px]   divide-zinc-200'>
      <Toaster/>
          <div className=''>
            <File className='w-4 h-4 ml-2 text-black' />
          </div>
          <div className="flex flex-row gap-x-2 justify-between items-center px-2 w-full">
          <div className='overflow-hidden px-3 py-2 w-full h-full text-sm truncate'>
            {specification.upFile.name}
          </div>
          {(specification.loadstate === DocState.LOADING) && <Loader2 className='w-8 h-8 animate-spin' />}
          {(specification.loadstate === DocState.FAILED) && <Ban className='text-red-500 w-8 h-8'/>}
          {(specification.loadstate === DocState.SUCCESS) && <Check className='text-green-500 w-8 h-8' />}
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
interface ReferenceContainerProps{
  refList: UserFile[];
  setRefList: Dispatch<SetStateAction<UserFile[]>>
}
function ReferenceContainer({refList, setRefList}:ReferenceContainerProps){
  
  if (refList.length ===0){return(null)}
  
  function removeItem(indexToRemove:number){
    const updatedRefList = refList.filter((_, index) => index !== indexToRemove);
    setRefList(updatedRefList)
  }
  
  function updateRefList(file: UserFile, idx: number){
    const updatedRefs = [...refList.slice(0,idx), file, ...refList.slice(idx+1)]
    setRefList(updatedRefs)
  }

  return(
    <div className="flex flex-col items-center">
      {refList.map((refItem, index)=>(
        <RefereceDisplay key={index} updateRefList={updateRefList} removeItem={removeItem} reference={refItem} idx={index} setRefList={setRefList}/>
      ))}
    </div>
    )
}

interface ReferenceDisplayProps{
  reference: UserFile,
  idx: number,
  setRefList: Dispatch<SetStateAction<UserFile[]>>,
  updateRefList(file: UserFile, idx: number): void
  removeItem(indexToRemove: number): void
}
function RefereceDisplay({reference, idx, setRefList, removeItem, updateRefList}:ReferenceDisplayProps){
  const {toast}=useToast()
  useEffect(() => {
    if (reference && reference.loadstate===DocState.LOADING){
      const handleRefChange = async () =>{
        const res = await startUpload([reference.upFile])
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
      void handleRefChange()
      }
  }, [reference]);

  useEffect(()=>{
    console.log(reference)
  },[reference])

  const {startUpload}= useUploadThing("pdfUploader")
  const {mutate:startPolling}=api.DocumentRouter.getFile.useMutation(
    {
      onSuccess: (file)=>{
        console.log(file)
        if (file.uploadStatus==='SUCCESS'){
          const newRef:UserFile = {upFile: reference.upFile, loadstate: DocState.SUCCESS, key:file.key, title:file.title}
          updateRefList(newRef,idx)
        } else {
          const newRef:UserFile = {upFile: reference.upFile, loadstate: DocState.FAILED}
          updateRefList(newRef,idx)
        }
      },
      retry: true,
      retryDelay: 10000,
    }
  )
  return (
      <div className='max-w-2xl w-full bg-gray-100 flex items-center flex-row justify-center rounded-md overflow-hidden outline outline-[1px]   divide-zinc-200 my-2'>
      <Toaster/>
          <div className=''>
            <File className='w-4 h-4 ml-2 text-black' />
          </div>
          <div className="flex flex-row gap-x-2 justify-between items-center px-2 w-full">
          <div className='overflow-hidden px-3 py-2 w-full h-full text-sm truncate'>
            {reference.upFile.name}
          </div>
          {(reference.loadstate === DocState.LOADING) && <Loader2 className='w-8 h-8 animate-spin' />}
          {(reference.loadstate === DocState.FAILED) && <Ban className='text-red-500 w-8 h-8'/>}
          {(reference.loadstate === DocState.SUCCESS) && <Check className='text-green-500 w-8 h-8' />}
          <button onClick={()=>removeItem(idx)}
            className="hover:text-red-600"
          >
            <Trash2 />
          </button>
          </div>
      </div>
  )
}


interface ReferenceDropZoneProps {
  setRefFile: Dispatch<SetStateAction<UserFile[]>>
}
function ReferenceDropZone({setRefFile}:ReferenceDropZoneProps){
  return(
    <div>
    <Dropzone 
      multiple={true}
      onDrop={(acceptedFiles)=>{
        const newFiles: UserFile[]= acceptedFiles.map((file)=>({
          upFile: file,
          loadstate: DocState.LOADING
        }))

        setRefFile((prevFiles)=>[...prevFiles, ...newFiles])
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
  setSpecFile: React.Dispatch<React.SetStateAction<UserFile | undefined>>
}
function SpecDropzone({setSpecFile}: SpecDropzoneProps){
  return(
    <Dropzone 
      multiple={false}
      onDrop={(acceptedFiles)=>{
        console.log(acceptedFiles)
        if (acceptedFiles.length > 0 && acceptedFiles[0]!==undefined){
        const newFile: UserFile = {
          upFile: acceptedFiles[0],
          loadstate: DocState.LOADING,
        }
          setSpecFile(newFile)
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

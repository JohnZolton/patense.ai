import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, FileCogIcon, Filter, Loader2, Trash2, Check } from 'lucide-react'
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import { pdfjs, Document, Page } from 'react-pdf';
import PreviousMap from "postcss/lib/previous-map";
import Dropzone from "react-dropzone";
import { text } from "stream/consumers";



pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const Home: NextPage = () => {
  const [specification, setSpecification] = useState<{fileName:string; fileContent:string}>();
  const [references, setReferences] = useState<{fileName:string; fileContent:string}[]>([]);
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [specFile, setSpecFile] = useState<File>();
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<FeatureItem[]>(dummyData)

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

  const handleButtonClick = async () => {
    if (specification && references.length>0){
      console.log('good to go')
      setIsLoading(true)
      const result = await sendDocsToBackend({
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
        setIsLoading(false)
        setResultData(data)
      }
    }
  )
  
  return (
    <>
      <Head>
        <title>Patense.io</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <NavBar />
        <div className="">
          <SignedIn>
          <SpecDropzone setSpecFile={setSpecFile} />
          <SpecDisplay specification={specFile} setSpec={setSpecification} setSpecFile={setSpecFile}/>
          <ReferenceDropZone setRefFile={setRefFiles}/>
          <ReferenceDisplay refList={refFiles} setRefList={setRefFiles} setProcessedRefs={setReferences} />
          <div className="flex justify-center flex-col items-center ">
          {isLoading && <LoadDisplay />}
          <button 
            className="bg-gray-900 hover:bg-gray-800 py-4 px-5 border border-dashed"
            onClick={()=>handleButtonClick()}
            >Generate Report</button>
          </div>
          <div>
            <AnalysisContainer features={resultData} />
          </div>
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-slate-700 p-3 text-xl  hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </PageLayout>
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
  ];
  
  const intervalDurations = [4000, 20000, 4000, 4000, 3500]; // Set varying intervals for each loading state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Set up an interval to cycle through loading messages every 2000 milliseconds (2 seconds)
    const intervalId = setInterval(() => {
      if (currentMessageIndex < loadingMessages.length -1){
        setCurrentMessageIndex((prevIndex) => prevIndex + 1);
        const nextIndex = currentMessageIndex + 1;
        const nextInterval = intervalDurations[nextIndex];
        setTimeout(() => clearInterval(intervalId), nextInterval);
      }
    }, intervalDurations[currentMessageIndex]);

    // Clear the interval when the component unmounts or is no longer needed
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures the effect runs only once
  
  return(
    <div className="flex flex-col items-center justify-center py-3">
      <Loader2 className="animate-spin h-10 w-10 items-center justify-center"/>
      <div>{loadingMessages[currentMessageIndex]}</div>
    </div>
  )
}

interface FeatureItem {
  feature: string;
  analysis: string;
  source: string;
}


const dummyData: FeatureItem[] = [
  {
    feature: 'Lorem',
    analysis: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    source: 'Lorem Source',
  },
  {
    feature: 'Ipsum',
    analysis: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    source: 'Ipsum Source',
  },
  {
    feature: 'Dolor',
    analysis: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    source: 'Dolor Source',
  },
];

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
    <div className="flex flex-col items-start border border-collapse p-2 gap-y-2 my-2">
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
  setSpecFile: React.Dispatch<React.SetStateAction<File | undefined>>
}
function SpecDisplay({specification, setSpec, setSpecFile}: SpecDisplayProps){
  const [loadedSpec, setLoadedSpec] = useState<{ fileName: string; fileContent: string }>();
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSpecification = async () => {
          try {
            if (specification === undefined){return(null)}

            const result = await handlePDFLoaded(specification);
            console.log("loaded: ", result)
            if (result !== undefined){
              setSpec(result)
            }
            return result;
          } catch (error) {
            console.error('Error loading PDF:', error);
            return null;
          }
    };

    void loadSpecification();
    setIsLoading(true)
  }, [specification, setSpec]);
  useEffect(()=>{
    console.log(loadedSpec)
  },[loadedSpec])

  const handlePDFLoaded = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const dataUrl = `data:application/pdf;base64,${Buffer.from(buffer).toString('base64')}`;

      const loadingTask = pdfjs.getDocument({ url: dataUrl });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText:string = textContent.items.map((item) => (item as TextItem).str).join('');
        //const pageText = textContent.items.map((item) => item.str).join('');
        fullText += pageText + '\n'; 
      }

      setIsLoading(false)
      return({fileName: file.name, fileContent: fullText})
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };
  
  function handleButtonClick(){
    setSpecFile(undefined)
    setSpec(undefined)
  }

  if (specification === undefined){return(null)}

  return(
    <div className="mt-5 mb-10 flex flex-col items-center">
      <div className='max-w-lg bg-gray-800 flex items-center flex-col rounded-md overflow-hidden outline outline-[1px]   divide-zinc-200 my-3'>
          <div className='px-2 pt-1 mt-2 h-full grid place-items-center'>
            <File className='h-4 w-4 text-blue-500' />
          </div>
          <div className="flex flex-row justify-between w-full items-center gap-x-3 px-2">
          <div className='px-3 py-2 h-full  text-sm w-full overflow-hidden truncate'>
            {specification.name}
          </div>
          {isLoading ? 
            <Loader2 className='h-8 w-8 animate-spin' />:<Check/>}
          <button onClick={handleButtonClick} 
            className="hover:text-red-600"
          >
            <Trash2 />
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
            const result = await handlePDFLoaded(refItem);
            console.log("loaded: ", result)
            return result;
          } catch (error) {
            console.error('Error loading PDF:', error);
            return null;
          }
        })
      );

      setLoadedReferences(loadedRefs.filter((result) => result !== null) as Array<{ fileName: string; fileContent: string }>);
    };
    void loadReferences();
    setIsLoading(true)
  }, [refList]);

  useEffect(()=>{
    console.log("loaded refs: " , loadedReferences)
    setProcessedRefs(loadedReferences)
  },[loadedReferences, setProcessedRefs])
  
  const handlePDFLoaded = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const dataUrl = `data:application/pdf;base64,${Buffer.from(buffer).toString('base64')}`;

      const loadingTask = pdfjs.getDocument({ url: dataUrl });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText:string = textContent.items.map((item) => (item as TextItem).str).join('');
        fullText += pageText + '\n'; // Add a newline between pages if you want
      }

      setIsLoading(false)
      return({fileName: file.name, fileContent: fullText})
    } catch (error) {
      console.error('Error loading PDF:', error);
      // put a toast thing here
      const filteredList = refList.filter(currentFile=>file!==currentFile)
      setRefList(filteredList)
    }
  };
  if (refList.length ===0){return(null)}
  
  function handleButtonClick(indexToRemove:number){
    const updatedRefList = refList.filter((_, index) => index !== indexToRemove);
    setRefList(updatedRefList)
  }

  return(
    <div className="my-3 flex flex-col items-center">
      {refList.map((refItem, index)=>(
      <div key={index} className='max-w-lg bg-gray-800 flex items-center flex-col rounded-md overflow-hidden outline outline-[1px] outline-zinc-200  divide-zinc-200 my-3'>
        <React.Fragment >
          <div className='px-3 pt-1 mt-2 h-full grid place-items-center'>
            <File className='h-4 w-4 text-blue-500' />
          </div>
          <div className="flex flex-row justify-between w-full items-center gap-x-3 px-2">
          <div className='px-3 py-2 h-full  text-sm w-full overflow-hidden truncate'>
            {refItem.name}
          </div>
          {isLoading ? 
            <Loader2 className='h-8 w-8 animate-spin' />:<Check/>}
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
      <div className="border h-32 m-4 border-dashed border-gray-300 rounded-lg">
        <div 
        {...getRootProps()}
        className="flex items-center justify-center h-full w-full">
          <label 
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800"
          >
            <div className="flex flex-col items-center justify-center pt-5">Upload All References</div>
            <Cloud className="h-8 w-8 text-zinc-700"/>
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
      <div className="border h-32 m-4 border-dashed border-gray-300 rounded-lg">
        <div 
        {...getRootProps()}
        className="flex items-center justify-center h-full w-full">
          <label 
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800"
          >
            <div className="flex flex-col items-center justify-center pt-5">Upload a Specification</div>
            <Cloud className="h-8 w-8 text-zinc-700"/>
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

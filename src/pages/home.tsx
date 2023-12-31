import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, Loader2 } from 'lucide-react'
import type {
  ActualWorkout,
  ActualExercise,
  exerciseSet,
} from "@prisma/client";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import { pdfjs, Document, Page } from 'react-pdf';
import PreviousMap from "postcss/lib/previous-map";
import Dropzone from "react-dropzone";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const Home: NextPage = () => {
  const [specification, setSpecification] = useState<string>("");
  const [references, setReferences] = useState<{fileName:string; fileContent:string}[]>([]);
  
  useEffect(()=>{
    console.log("Spec: ", specification)
  }, [specification])
  useEffect(()=>{
    console.log("References: ", references)
  }, [references])
  
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
          <SpecDropzone />
          <ReferenceDropZone />
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


enum docType {
  Spec = 'spec',
  Reference = 'reference'
}

interface SpecParserProps {
  specification: string, 
  setSpecification: Dispatch<SetStateAction<string>>,
}

const SpecParser: React.FC<SpecParserProps> = ({ 
  specification,
  setSpecification,
 }) => {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('application/pdf')) {
        handlePDFLoaded(file);
        setFilename(file.name);
      }
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('application/pdf')) {
        handlePDFLoaded(file);
        setFilename(file.name);
      }
    }
  };
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
        const pageText = textContent.items.map((item) => item.str).join('');
        fullText += pageText + '\n'; // Add a newline between pages if you want
      }

      setSpecification(fullText)
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border ${dragOver ? 'border-blue-500' : 'border-gray-300'} p-6 text-center`}
    >
      <div
        style={{ width: '100%', height: '100%' }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-row items-center justify-between"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        {filename ? (
          <p>{filename}</p>
        ) : (
          <div>Load Specification</div>
        )}
        <button
          type="button"
          className="mt-4 block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Select PDF file
        </button>
      </div>
    </div>
  );
};




interface RefSectionProps {
  references: { fileName: string; fileContent: string }[];
  setReferences: Dispatch<SetStateAction<{ fileName: string; fileContent: string }[]>>;
}

const ReferenceSection: React.FC<RefSectionProps> = ({ 
  references,
  setReferences,
 }) => {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('application/pdf')) {
        handlePDFLoaded(file);
        setFilename(file.name);
      }
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('application/pdf')) {
        handlePDFLoaded(file);
      }
    }
  };
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
        const pageText = textContent.items.map((item) => item.str).join('');
        fullText += pageText + '\n'; // Add a newline between pages if you want
      }

      if (file.name !== null){
        setReferences((prevRefs)=>{
          const newRefs = [...prevRefs, { fileName: file.name, fileContent: fullText }];
          return newRefs.length > 0 ? newRefs : [{ fileName: filename, fileContent: fullText }];
        });
      }     
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border ${dragOver ? 'border-blue-500' : 'border-gray-300'} p-6 text-center`}
    >
      <ReferenceDisplay refList={references}/>
      <div
        style={{ width: '100%', height: '100%' }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-row items-center justify-between"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        <button
          type="button"
          className="mt-4 block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >Add Reference</button>
      </div>
    </div>
  );
};

interface ReferenceDisplayProps{
  refList: { fileName: string; fileContent: string }[];
}
function ReferenceDisplay({refList}:ReferenceDisplayProps){
  if (refList.length ===0){return(<div>Load References</div>)}
  return(
    <div className="my-10">
      {refList.map((refItem)=>(
        <div key={refItem.fileName} className="my-5">
          <div>{refItem.fileName}</div>
          <div>{refItem.fileContent.slice(0,40)}...</div>
          </div>
      ))}
    </div>
    )
}

function ReferenceDropZone(){
  const [files, setFiles] = useState<File[]>([]);
  return(
    <Dropzone 
      multiple={true}
      onDrop={(acceptedFile)=>{
        console.log(acceptedFile)
        setFiles((prevFiles)=>[...prevFiles, ...acceptedFile])
        console.log(files)
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
            {acceptedFiles && acceptedFiles[0] ? (
                <div className='max-w-xs bg-gray-800 flex items-center flex-col rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                {acceptedFiles.map((file, index)=>(
                  <React.Fragment key={index}>
                    <div className='px-3 py-2 h-full grid place-items-center'>
                      <File className='h-4 w-4 text-blue-500' />
                    </div>
                    <div className='px-3 py-2 h-full text-sm truncate'>
                      {file.name}
                    </div>
                  </React.Fragment>
                ))}
                </div>
              ) : null}
          </label>
        </div>
      </div>
    )}
    </Dropzone>
  )
}
function SpecDropzone(){
  return(
    <Dropzone 
      multiple={false}
      onDrop={(acceptedFile)=>{
        console.log(acceptedFile)
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
            {acceptedFiles && acceptedFiles[0] ? (
                <div className='max-w-xs bg-gray-800 flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200'>
                  <div className='px-3 py-2 h-full grid place-items-center'>
                    <File className='h-4 w-4 text-blue-500' />
                  </div>
                  <div className='px-3 py-2 h-full text-sm truncate'>
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}
          </label>
        </div>
      </div>
    )}
    </Dropzone>
  )
}

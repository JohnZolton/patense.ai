import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction, use } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, FileCogIcon, Filter, Loader2, Trash2, Check, Ban } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { pdfjs } from 'react-pdf';
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { OAReport, FeatureItem, Reference } from "@prisma/client";
import Link from "next/link";
import { AnalysisContainer } from "../reports";
import { useRouter } from "next/router";
import { error } from "console";


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

enum AppState {
  LOAD_DOCUMENTS = 'LOAD_DOCUMENTS',
  LOADING = 'LOADING',
  SHOW_RESULTS = 'SHOW_RESULTS',
}
  
const Home: NextPage = () => {
  const [report, setReport] = useState<(OAReport & {
    features: FeatureItem[];
    files: Reference[];
})>()

  const router = useRouter()
  const reportId = router.query.reportId as string
  console.log("reportId: ",reportId)
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [errorCount, setErrorCount] = useState(0);
  

  const { mutate: getReport } = api.DocumentRouter.getReportById.useMutation({
    onSuccess: (report)=>{
        console.log(report)
        if (report.completed){
            setAppState(AppState.SHOW_RESULTS)
        if (intervalRef.current){
            clearInterval(intervalRef.current)
        }
        }
        setReport(report)
    },
    onError: ()=>{
      const newCount = errorCount+1
      setErrorCount(newCount)
      console.log("error count: ", errorCount)
      if (errorCount > 1){
        void router.push("/reports")
      }
    }
  })

  const intervalRef = useRef<NodeJS.Timer | null>(null);
  
  useEffect(() => {
      getReport({reportId: reportId})
      intervalRef.current = setInterval(()=>{
        getReport({reportId:reportId})
        if (report?.completed){
            clearInterval(intervalRef.current!)
        }
      }, 10000)
      return ()=>{
        if (intervalRef.current){
            clearInterval(intervalRef.current)
        }
      }
  }, [reportId]); 

  
  const {toast}=useToast()
  
  function handleDownloadClick(){
    console.log("todo")
  }
  
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className="grainy">
        <div className="min-h-screen">
        <NavBar />
        <Toaster/>
          <SignedIn>
          {appState === AppState.LOADING && (
          <div>
          <LoadDisplay/>
          </div>
          )}
          {appState === AppState.SHOW_RESULTS && (
            <div className="flex flex-col items-center justify-center max-w-xl mx-auto mt-5">
          <div className="flex flex-col items-center justify-center max-w-xl mx-auto">
            <AnalysisContainer report={report} />
          </div>
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
        </div>
    </>
  );
};

export default Home;

function LoadDisplay(){
  const loadingMessages = [
    '',
    'Processing documents...',
    'Extracting inventive elements...',
    'Converting references to vectors...',
    'Searching references for inventive elements...',
    'Preparing report...',
    'Finishing up...'
  ];
  
  const intervalDurations = [3000, 30000, 1800000, 30000, 120000, 20000]; // Set varying intervals for each loading state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setTimeout(() => {
      if (currentMessageIndex < loadingMessages.length -1){
        setCurrentMessageIndex((prevIndex) => prevIndex + 1);
      } else {
        setCurrentMessageIndex(6)
      }
    }, intervalDurations[currentMessageIndex]);
    return () => clearInterval(intervalId);
  }, [currentMessageIndex]); 
  
  return(
    <div className="flex flex-col justify-center items-center py-3">
      <Loader2 className="justify-center items-center w-10 h-10 animate-spin"/>
      { loadingMessages[currentMessageIndex] && (
        <>
      <div>{loadingMessages[currentMessageIndex]}</div>
      <div>This takes 5-10 minutes.</div>
        </>
      )
      }
    </div>
  )
}

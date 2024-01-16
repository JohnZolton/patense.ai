
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
import { AnalysisContainer } from "./reports";


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
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);

  const { mutate: getReport } = api.DocumentRouter.getLatestReport.useMutation({
    onSuccess: (report)=>{
        console.log(report)
        if (report.completed){
            setAppState(AppState.SHOW_RESULTS)
        if (intervalRef.current){
            clearInterval(intervalRef.current)
        }
        }
        setReport(report)
    }
  })

  const intervalRef = useRef<NodeJS.Timer | null>(null);
  
  useEffect(() => {
      getReport()
      intervalRef.current = setInterval(()=>{
        getReport()
        if (report?.completed){
            clearInterval(intervalRef.current!)
        }
      }, 10000)
      return ()=>{
        if (intervalRef.current){
            clearInterval(intervalRef.current)
        }
      }
  }, []); 

  
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
        <div className={(appState === AppState.SHOW_RESULTS) ? `min-h-screen` : 'h-screen'}>
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
              <div className="flex flex-row justify-center mb-4 gap-x-4">
              <Link href="reports" className={buttonVariants({})}>All Reports</Link>
                <Button onClick={()=>{void handleDownloadClick()}}>Download Report</Button>
              </div>
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

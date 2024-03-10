import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction, use } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, Search, File, FileCogIcon, Filter, Loader2, Trash2, Check, ArrowDownToLine } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { pdfjs } from 'react-pdf';
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { OAReport, FeatureItem, Reference, Convo, Message, Result, Citation } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { error } from "console";
import { useReactToPrint } from 'react-to-print';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"



pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

enum AppState {
  LOAD_DOCUMENTS = 'LOAD_DOCUMENTS',
  LOADING = 'LOADING',
  SHOW_RESULTS = 'SHOW_RESULTS',
}
  
const Home: NextPage = () => {
  const [report, setReport] = useState<(OAReport & {
    convo: (Convo & {
        messages: (Message & {
            result: (Result & {
                cites: Citation[];
            })[];
        })[];
    }) | null;
    features: FeatureItem[];
    files: Reference[]
  }
    )>()

  const router = useRouter()
  const reportId = router.query.reportId as string
  console.log("reportId: ",reportId)
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);

  const { mutate: getReport } = api.DocumentRouter.getReportById.useMutation({
    onSuccess: (report)=>{
        console.log(report)
        setAppState(AppState.SHOW_RESULTS)
        setReport(report)
    }
  })

  
  useEffect(() => {
      getReport({reportId: reportId})
  }, [reportId]); 

  
  const {toast}=useToast()
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className="grainy ">
        <div className="h-screen relative">

        <div className="absolute top-0 right-0 w-full">
        <NavBar />
        </div>
        <div className="h-full flex flex-row pt-14">
        <SideBar spec={report?.title} references={report?.files}/>
        <Toaster/>
          <SignedIn>
          {appState === AppState.LOADING && (
          <div>
          <LoadDisplay/>
          </div>
          )}
          {appState === AppState.SHOW_RESULTS && (
            <PageContent report={report} />
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
        </div>
    </>
  );
};

export default Home;

function LoadDisplay(){

  
  return(
    <div className="flex flex-col justify-center items-center py-3">
      <Loader2 className="justify-center items-center w-10 h-10 animate-spin"/>
    </div>
  )
}

interface PageContentProps {
  report: (OAReport & {
    features: FeatureItem[];
    files: Reference[];
    
}) | undefined
}

export function PageContent({report}:PageContentProps){
  
  return(
    <div className="flex w-full"
    > 
    <div className="flex w-full flex-col justify-between items-center">
    <div className="flex w-full flex-col items-center">
      <div>Content</div>
      <div>Content</div>
      <div>Content</div>
      <div>Content</div>
    </div>
    <div className="py-10 bg-red-200 w-full flex flex-col items-center">
    <div className="w-3/4 flex flex-row gap-x-2">
      <Input placeholder="Search for feature..."/>
      <Button><Search/></Button>
    </div>
    </div>
    </div>
    </div>
  )
}

interface SideBarProps {
  spec: String | undefined
  references: Reference[] |undefined
}
function SideBar({spec, references}:SideBarProps){
  return (
    <div className="bg-gray-200 px-6 h-full  w-xl">
      <div>{spec}</div>
      {references?.map((ref)=>(
        <div>{ref.title}</div>
      ))}
    </div>
  )
}
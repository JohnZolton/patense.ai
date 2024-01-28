import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, FileCogIcon, Filter, Loader2, Trash2, Check, ArrowDownToLine } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { OAReport, FeatureItem, Reference } from "@prisma/client";
import { Button } from "@/components/ui/button";

import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { buttonVariants } from "@/components/ui/button";
import { useRouter, NextRouter } from "next/router";
import Link from "next/link";
import { useRef } from "react";
import { useReactToPrint } from 'react-to-print';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"



const Reports: NextPage = () => {
  const [selectedReport, setSelectedReport] = useState<(OAReport)>()

  const router = useRouter()

  const { data: reports, isLoading: reportsLoading } = api.DocumentRouter.getAllReports.useQuery()
  
  function handleButtonClick(index:number){
    if (reports && reports[index]!== undefined){
      setSelectedReport(reports[index])  
    }
  }
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

        {/* grainy not applying to whole screen, this fixes */}
        <div className="grainy">
        <div className={selectedReport ? `` : 'h-screen'}>

        <NavBar />
          <SignedIn>
          <div className="flex justify-center flex-col mt-3 items-center">
          {reportsLoading && 
      (<Loader2 className="justify-center mt-10 items-center w-10 h-10 animate-spin"/>)}
          {(!reportsLoading)&& (reports === undefined || reports.length===0) && (
            <div>No reports</div>
          )}
            {(!selectedReport) && reports && reports.map((report, index)=>(
              <ReportSelector router={router} key={index} report={report} index={index} setSelectedReport={handleButtonClick}/>
            ))
            }
          </div>
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

export default Reports;

interface ReportSelectorProps {
  report: OAReport;
  index: number;
  router: NextRouter;
  setSelectedReport: (index: number) => void;
}

function ReportSelector({report, setSelectedReport, index, router}:ReportSelectorProps){
  return(
    <div className="w-full max-w-xl">
      <Link 
      className="w-full flex my-2 flex-row  justify-center items-center"
      href={`/reports/${report.id}`}>
    <div key={index} className="
h-12 w-full border-gray-600 border border-dashed rounded-lg bg-gray-50 hover:bg-gray-100
    ">
          <div className="flex border h-full p-2 flex-row justify-between w-full items-center ">
            <div className="font-semibold">{report.title}</div>
            <div className="flex flex-row items-center">
            {!report.completed && <Loader2 className="animate-spin h-8 w-8" />}
            <div>{report.date.toLocaleDateString()}</div>

            </div>
          </div>
    </div>
        </Link>

    </div>
  )
}

interface AnalysisContainerProps {
  report: (OAReport & {
    features: FeatureItem[];
    files: Reference[];
}) | undefined
}

export function AnalysisContainer({report}:AnalysisContainerProps){
  
  const handlePrint = useReactToPrint({
      content:()=>componentRef.current
  })
  const componentRef = useRef(null)

  if (report===undefined){return(null)}
  function handleDownloadClick(){
    setTimeout(()=>{
      handlePrint()
    },200)
  }
  return(
    <div ref={componentRef} className="mx-auto justify-center items-center flex"
    >
    <div className="w-full max-w-2xl mt-4 items-center justify-center flex flex-col">
      <div className="bg-gray-100 border-gray-200 shadow-md border p-3 border-collapse w-full mb-2  rounded-md">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="font-semibold text-2xl">{report.title}</div>
          <div>{report.date.toLocaleDateString()}</div>
        </div>
        <div className="flex flex-row justify-between w-full">
        <div className="flex flex-col justify-between">
          <div>References</div>

        <div>
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger>
              <Button className="w-12 bg-gray-100" variant={"outline"} onClick={handleDownloadClick}>
                <ArrowDownToLine size={24} className=""/>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        </div>
        </div>
          <div className="flex flex-col">
            {report?.files.map((file, index)=>(
              <div key={index} className="text-right">{file.title}</div>
            ))}
          </div>
        </div>
    </div>
    {report.features.filter(featureItem=>featureItem.feature.length>0).map((featureItem, index)=>(
      <AnalysisDisplay  key={index} index={index} item={featureItem} />
    ))}
    </div>
    </div>
  )
}
interface AnalysisDisplayProps {
  item: FeatureItem;
  index: number;
}
function AnalysisDisplay({item, index}:AnalysisDisplayProps){
  if (item.analysis.length===0 || item.feature.length ===0){return null}
  return(
    <div className="break-inside-avoid break-before-auto flex w-full flex-col bg-gray-100 border-gray-200 shadow-md items-start border  border-collapse rounded-lg p-2 gap-y-2 my-2">
      <div className="font-semibold">{index+1}. {item.feature}</div>
      <div className="">Analysis: {item.analysis}</div>
      <div className="text-sm">Source: {item.source}</div>
    </div>
  )
}
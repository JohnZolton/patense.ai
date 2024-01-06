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
import { OAReport, FeatureItem } from "@prisma/client";
import { Button } from "@/components/ui/button";




const Reports: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<(OAReport & {
    features: FeatureItem[];
})>()

  
  //useEffect(() => {
    //setSelectedReport(undefined)
  //}, []);

  const { data: reports, isLoading: reportsLoading } = api.DocumentRouter.getAllReports.useQuery()
  
  function handleDownloadClick(){
    console.log("download WIP")
  }
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
          <div className="flex justify-center flex-col items-center ">
            {(!selectedReport) && reports && reports.map((report, index)=>(
              <button key={index} onClick={()=>handleButtonClick(index)} className="h-12 my-4 max-w-xl w-full border-gray-600 border border-dashed rounded-lg bg-gray-100 hover:bg-gray-50">{report.title}</button>
            ))
            }
          {selectedReport && 
            <div>
              <div className="flex flex-row justify-center mb-4 mt-6 gap-x-4">
                <Button onClick={()=>setSelectedReport(undefined)}>All Reports</Button>
                <Button onClick={handleDownloadClick}>Download Report</Button>
              </div>
              <AnalysisContainer report={selectedReport} />
          </div>
          }
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
        </div>
    </>
  );
};

export default Reports;


interface AnalysisContainerProps {
  report: (OAReport & {
    features: FeatureItem[];
}) | undefined
}

function AnalysisContainer({report}:AnalysisContainerProps){
  if (report===undefined){return(null)}
  return(
    <div id="capture" className="w-full max-w-xl items-center justify-center flex flex-col">
    <div className="font-semibold text-xl">{report.title} - {report.date.toLocaleDateString()}</div>
    {report.features.map((featureItem, index)=>(
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
    <div className="flex flex-col items-start border bg-gray-100 border-collapse rounded-lg p-2 gap-y-2 my-2">
      <div className="font-semibold">{item.feature}</div>
      <div className="">Analysis: {item.analysis}</div>
      <div className="text-sm">Source: {item.source}</div>
    </div>
  )
}



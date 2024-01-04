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




const Reports: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<FeatureItem[]>([])

  const { data: reports, isLoading: reportsLoading } = api.DocumentRouter.getAllReports.useQuery()
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <NavBar />
        <div className="">
          <SignedIn>
          <div className="flex justify-center flex-col items-center ">
            {reports && reports.map((report, index)=>(
              <div key={index}>{report.title}</div>
            ))
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
      </PageLayout>
    </>
  );
};

export default Reports;


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



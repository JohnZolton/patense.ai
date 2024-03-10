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

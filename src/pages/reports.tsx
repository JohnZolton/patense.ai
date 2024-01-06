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
import PreviousMap from "postcss/lib/previous-map";
import Dropzone from "react-dropzone";
import { text } from "stream/consumers";
import { OAReport, FeatureItem } from "@prisma/client";
import { Button } from "@/components/ui/button";

import ReactPDF, { pdf, Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';



const Reports: NextPage = () => {
  const [selectedReport, setSelectedReport] = useState<(OAReport & {
    features: FeatureItem[];
})>()

  //useEffect(() => {
    //setSelectedReport(undefined)
  //}, []);

  const { data: reports, isLoading: reportsLoading } = api.DocumentRouter.getAllReports.useQuery()
  
  async function handleDownloadClick(){
    if (selectedReport){
      const blob = await pdf((<MyDocument selectedReport={selectedReport}/>)).toBlob()
      saveAs(blob, selectedReport.title)
    }
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
          {reportsLoading && 
      (<Loader2 className="justify-center items-center w-10 h-10 animate-spin"/>)}
            {(!selectedReport) && reports && reports.map((report, index)=>(
              <button key={index} onClick={()=>handleButtonClick(index)} className="h-12 my-4 max-w-xl w-full border-gray-600 border border-dashed rounded-lg bg-gray-100 hover:bg-gray-50">{report.title}</button>
            ))
            }
          {selectedReport && 
            <div>
              <div className="flex flex-row justify-center mb-4 mt-6 gap-x-4">
                <Button onClick={()=>setSelectedReport(undefined)}>All Reports</Button>
                <Button onClick={void handleDownloadClick()}>Download Report</Button>
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



const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: 'rgb(243 244 246)',
    justifyContent: 'center', // Center content horizontally
    alignItems: 'center', // Center content vertically
  },
  section: {
    margin: 5,
    padding: 10,
    flexGrow: 1,
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    backgroundColor: '#E4E4E4',
    borderRadius: 3
  },
  container: {
    width: '100%',
    maxWidth: 600, // Adjust the maximum width as needed
    margin: 'auto',
    textAlign: 'left'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 16,
    textAlign: 'center', // Center content vertically
  },
});

// AnalysisContainer component
const PDFContainer = ({ report }: AnalysisContainerProps) => {
  if (!report) {
    return null;
  }

  return (
    <View style={pdfStyles.container}>
      <Text style={pdfStyles.title}>
        {report.title} - {report.date.toLocaleDateString()}
      </Text>
      {report.features.map((featureItem, index) => (
        <PDFDisplay key={index} item={featureItem} />
      ))}
    </View>
  );
};

// AnalysisDisplay component
const PDFDisplay = ({ item }: AnalysisDisplayProps) => (
  <View style={pdfStyles.section}>
    <Text style={{ fontWeight: 'bold', fontSize:12 }}>{item.feature}</Text>
    <Text style={{fontSize: 12, marginVertical: 10}}>Analysis: {item.analysis}</Text>
    <Text style={{ fontSize: 10 }}>Source: {item.source}</Text>
  </View>
);

interface MyDocumentProps {
  selectedReport: OAReport & {
    features: FeatureItem[];
};
}
// MyDocument component
const MyDocument = ({ selectedReport }: MyDocumentProps) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <PDFContainer report={selectedReport} />
    </Page>
  </Document>
);
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {Cloud, File, FileCogIcon, Filter, Loader2, Trash2, Check } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { OAReport, FeatureItem, Reference } from "@prisma/client";
import { Button } from "@/components/ui/button";

import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { buttonVariants } from "@/components/ui/button";



const Reports: NextPage = () => {
  const [selectedReport, setSelectedReport] = useState<(OAReport & {
    features: FeatureItem[];
    files: Reference[];
})>()


  const { data: reports, isLoading: reportsLoading } = api.DocumentRouter.getAllReports.useQuery()
  
  async function handleDownloadClick(){
    console.log("download clicked")
    if (selectedReport){
      try{
        const blob = await pdf((<MyDocument selectedReport={selectedReport}/>)).toBlob()
        saveAs(blob, selectedReport.title)
      } catch(error){
        console.error("error downloading: ", error)
      }
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
          <div className="flex justify-center flex-col mt-3 items-center">
          {reportsLoading && 
      (<Loader2 className="justify-center mt-10 items-center w-10 h-10 animate-spin"/>)}
          {(!reportsLoading)&& (reports === undefined || reports.length===0) && (
            <div>No reports</div>
          )}
            {(!selectedReport) && reports && reports.map((report, index)=>(
              <ReportSelector key={index} report={report} index={index} setSelectedReport={handleButtonClick}/>
            ))
            }
          {selectedReport && 
            <div>
              <div className="flex flex-row justify-center mb-4 mt-2 gap-x-4">
                <Button onClick={()=>setSelectedReport(undefined)}>All Reports</Button>
                <Button onClick={()=>{void handleDownloadClick()}}>Download Report</Button>
              </div>
                <AnalysisContainer report={selectedReport} />
          </div>
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
  report: OAReport & {
    files: Reference[];
    features: FeatureItem[]};
  index: number
  setSelectedReport: (index: number) => void;
}

function ReportSelector({report, setSelectedReport, index}:ReportSelectorProps){
  return(
    <div className="w-full items-center justify-center text-center">
      <button key={index} onClick={()=>setSelectedReport(index)} className="h-12 my-4 max-w-xl w-full border-gray-600 border border-dashed rounded-lg bg-gray-100 hover:bg-gray-50">
        {report.title} {report.completed?? <Loader2 className="animate-spin h-8 w-8" />}
        </button>
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
  if (report===undefined){return(null)}
  return(
    <div id="capture" className="w-full max-w-xl items-center justify-center flex flex-col">
    <div className="bg-gray-100 border px-3 py-2 border-collapse w-2/3 max-w-3xl rounded-md">

            <div className="flex flex-row justify-between items-center w-full">

    <div className="font-semibold text-2xl">{report.title}</div>
    <div>{report.date.toLocaleDateString()}</div>
    </div>
            <div className="flex flex-row justify-between w-full">
            <div>References</div>
            <div className="flex flex-col">
          {report?.files.map((file, index)=>(
            <div key={index} className="text-right">{file.title}</div>
          ))}
              
            </div>
              
            </div>
    </div>
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
  if (item.analysis.length===0 || item.feature.length ===0){return null}
  return(
    <div className="flex w-full flex-col items-start border bg-gray-100 border-collapse rounded-lg p-2 gap-y-2 my-2">
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
    fontFamily: "Helvetica"
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
  header: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 20,
    marginLeft: 20
  }
});

// AnalysisContainer component
const PDFContainer = ({ report }: AnalysisContainerProps) => {
  if (!report) {
    return null;
  }

  return (
    <View style={pdfStyles.container}>
      <Text style={pdfStyles.header}>Patense.ai</Text>
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
    files: Reference[];
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
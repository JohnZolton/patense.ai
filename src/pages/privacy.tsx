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
import { useRouter } from "next/router";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"



pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

enum AppState {
  LOAD_DOCUMENTS = 'LOAD_DOCUMENTS',
  LOADING = 'LOADING',
  SHOW_RESULTS = 'SHOW_RESULTS',
}
  
const Home: NextPage = () => {
  
  
    function copyEmailToClipboard(){
        navigator.clipboard
        .writeText("support@patense.ai")
        .then(() => toast({
          title:"Email Copied to Clipboard",
          content:"support@patense.ai",
          variant:"default",

        }))
        .catch((error) => console.error("Copy failed", error));
      }
    const {toast}=useToast()
  
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
        <MaxWidthWrapper>
        <div className="gap-y-3 flex flex-col py-3 pb-10">
        <div className="font-semibold text-3xl text-center ">Privacy Policy</div>
        <div className="text-sm text-center">Last Updated: January 27, 2024</div>
        <div>By using our services, you agree to the terms outlined in this Privacy Policy.</div>
        <div className="font-semibold">1. Information Collection and Use</div>
        <div>We collect information that you provide directly to us, including documents and data shared through our platform. The primary purpose of collecting this information is to generate reports and analyses based on the documents you submit.</div>
        <div className="font-semibold">2. Document Storage and Retention</div>
        <div>When you share documents with us, they are stored in our systems for approximately one week. This is for quality control, to ensure the accuracy and effectiveness of the reports generated. After this period, the documents are deleted from our servers.</div>
        <div className="font-semibold">3. Quality Control Purposes</div>
        <div>During the retention period, your documents may be accessed by our internal team for quality control purposes. This includes reviewing the documents to improve the accuracy and effectiveness of our services.</div>
        <div className="font-semibold">4. Data Sharing</div>
        <div>We do not share your data with any third parties outside of our technical infrastructure. Your information is confined to our internal systems, and access is restricted to authorized personnel.</div>
        <div className="font-semibold">5. Security Measures</div>
        <div>We employ industry-standard security measures to protect your data from unauthorized access, disclosure, alteration, and destruction. </div>
        <div className="font-semibold">6. Legal Compliance</div>
        <div>We may disclose your information if required by law or in response to valid legal requests, such as subpoenas or court orders.</div>
        <div className="font-semibold">7. Changes to the Privacy Policy</div>
        <div>We reserve the right to update and make changes to this Privacy Policy at any time. Any changes will be effective immediately upon posting on our website. It is your responsibility to review this Privacy Policy periodically to stay informed about our information practices.</div>

        <div className="flex items-center flex-row justify-center">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger>
              <Button onClick={copyEmailToClipboard}>Contact Us</Button>
            </TooltipTrigger>
            <TooltipContent>Copy Email Address</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        </div>
        </div>
        </MaxWidthWrapper>
        </div>
        </div>
    </>
  );
};

export default Home;
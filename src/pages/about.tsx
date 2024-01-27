import { type NextPage } from "next";
import Head from "next/head";
import React, { useState, } from 'react';

import { NavBar } from "~/pages/components/navbar";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";



const Reports: NextPage = () => {
  
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

        {/* grainy not applying to whole screen, this fixes */}
        <div className="grainy">
        <Toaster/>
        <div className={`min-h-screen`}>
        <NavBar />
        <MaxWidthWrapper className="flex flex-col items-center gap-y-4">
          <div className="text-3xl font-semibold mt-5">About Us</div>
          <p>We are software engineers and patent attorneys that believe Large Language Models (AI) will revolutionize patent prosecution.</p>
          <p>Our mission is to build tools that make you better. To give you greater insight and analysis so that you can be more effective counsel.</p>
          <p>Large Language Models can crunch data at hundreds of pages per minute. We leverage that power to analyze disclosures and prior art references so that you can better respond to office actions.</p>
          <Button onClick={copyEmailToClipboard}>Contact Us</Button>
        </MaxWidthWrapper>
        </div>
        </div>
    </>
  );
};

export default Reports;


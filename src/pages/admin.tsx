
import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";

import {Cloud, File, FileCogIcon, Filter, Loader2, Trash2, Check, Ban } from 'lucide-react'
import { NavBar } from "~/pages/components/navbar";
import { pdfjs } from 'react-pdf';
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import {UploadDropzone} from "@uploadthing/react"
import { OurFileRouter } from "~/server/uploadthing";
import { User } from "@clerk/nextjs/dist/api";
import { useRouter } from "next/router";





const AdminPanel: NextPage = () => {
  const { isLoaded, userId, sessionId, getToken } = useAuth();

  
  const {mutate: deleteFiles} = api.DocumentRouter.deleteAllFiles.useMutation({
    onSuccess: ()=>{console.log("FILES DELETED")}
  })
  
  function handleButtonClick(){
    deleteFiles()
  }
  function runLongTestReport(){
    const result = makeStripeCheckout({
      spec:{
        key: "459b361b-f67f-4b56-946b-ddaac15caffb-ftictz.pdf",
        title: "100 page Spec"
      },
      references: [
        {title: "adams­.pdf", key: "1144a280-f45f-474e-8a71-a275ca830770-ddq3ib.pdf"},
        {title: "stitt.pdf", key: "2a44acbc-a90b-408e-a7ac-19adf6cca35a-exk3d.pdf"},
        {title: "polley.pdf", key: "5b99bb7d-7299-4f6b-9af3-7432f6be9a1e-iwstf2.pdf"},
        {title: "Kuenzel.pdf", key: "64d7da06-7479-4af4-897e-caba8a82dd9a-gt9zil.pdf"},
        {title: "williams.pdf", key: "daffa979-0bb4-4227-a442-d47111eb5f47-dgx25r.pdf"},
        {title: "Nachtegaal.pdf", key: "6fddbc48-92d3-4ed6-b3f3-76faa07e96e4-utvtoz.pdf"},
      ]
    })
  }
  function runTestReport(){
    const result = makeStripeCheckout({
      spec:{
        key: "49bfe0d0-b3e5-4f8a-b260-f4ce95fa6297-f0eqdz.pdf",
        title: "Specification"
      },
      references: [
        {title: "adams­.pdf", key: "1144a280-f45f-474e-8a71-a275ca830770-ddq3ib.pdf"},
        {title: "stitt.pdf", key: "2a44acbc-a90b-408e-a7ac-19adf6cca35a-exk3d.pdf"},
        {title: "polley.pdf", key: "5b99bb7d-7299-4f6b-9af3-7432f6be9a1e-iwstf2.pdf"},
        {title: "Kuenzel.pdf", key: "64d7da06-7479-4af4-897e-caba8a82dd9a-gt9zil.pdf"},
        {title: "williams.pdf", key: "daffa979-0bb4-4227-a442-d47111eb5f47-dgx25r.pdf"},
        {title: "Nachtegaal.pdf", key: "6fddbc48-92d3-4ed6-b3f3-76faa07e96e4-utvtoz.pdf"},
      ]
    })
  }
  const { mutate: testBotButton } = api.DocumentRouter.testPatentBot.useMutation()
  const { mutate: testVectorDB } = api.DocumentRouter.testAnalyzeFeatures.useMutation(
  )
  function handleBotButton(){
    testBotButton()
  }
  function handleDeepSearch(){
    const userInput = "a device for killing plants with electricity"
    const reportId = "32a37f0b-c704-416b-bc51-0ca8dd6f902d"
    runDeepSearch({userInput, reportId})
  }
  const { mutate: runDeepSearch } = api.DocumentRouter.testDeepSearch.useMutation()
  function handleVecDBButton(){
    testVectorDB()
  }
  const { mutate: makeStripeCheckout } = api.DocumentRouter.saveDocsAndSendStripe.useMutation(
    {
      onSuccess: (url)=>{
        window.location.href=url ?? '/home'
      }
    }
  )
  if (userId!=="user_2O41MpqHgq6YqPzFrzXXDyUgaTr"){
      return null
    }
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className="min-h-screen grainy">
        <NavBar />
        <Toaster/>
          <SignedIn>
          <div className="flex flex-col items-center mt-10 gap-y-3">
          <Button disabled onClick={handleButtonClick}>Delete All Files</Button>
          <Button disabled onClick={runTestReport}>Run Test Report</Button>
          <Button disabled onClick={runLongTestReport}>Run Long Test Report</Button>
          <Button disabled onClick={handleVecDBButton}>Test Vector DB</Button>
          <Button disabled onClick={handleBotButton}>Test Bot</Button>
          <Button  onClick={handleDeepSearch}>Test Deep Search</Button>
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
    </>
  );
};

export default AdminPanel;

import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent, useEffect, Dispatch, SetStateAction } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

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





const AdminPanel: NextPage = () => {

  const {toast}=useToast()
  
  const {mutate: deleteFiles} = api.DocumentRouter.deleteAllFiles.useMutation({
    onSuccess: ()=>{console.log("FILES DELETED")}
  })
  
  function handleButtonClick(){
    deleteFiles()
  }
  
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
        <div className="h-screen grainy">
        <NavBar />
        <Toaster/>
          <SignedIn>
          <div className="flex flex-col items-center mt-10">
          <Button onClick={handleButtonClick}>Delete All Files</Button>

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
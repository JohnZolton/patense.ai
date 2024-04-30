import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, {
  useState,
  useRef,
  ChangeEvent,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";

import {
  Cloud,
  File,
  FileCogIcon,
  Filter,
  Loader2,
  Trash2,
  Check,
  Ban,
} from "lucide-react";
import { NavBar } from "~/pages/components/navbar";
import { pdfjs } from "react-pdf";
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "~/server/uploadthing";
import { User } from "@clerk/nextjs/dist/api";
import { useRouter } from "next/router";

const AdminPanel: NextPage = () => {
  const { isLoaded, userId, sessionId, getToken } = useAuth();

  const { mutate: deleteFiles } = api.DocumentRouter.deleteAllFiles.useMutation(
    {
      onSuccess: () => {
        console.log("FILES DELETED");
      },
    }
  );

  function handleButtonClick() {
    deleteFiles();
  }
  function handleDeepSearch() {
    const specKey = "58fbc88d-3fcf-4a45-932f-6999b06a2017-ro10ip.pdf";
    const oaKey = "65a73172-f05e-4e23-bd2b-2a076fff5a9f-i6pvd4.pdf";
    const claimKey = "4b7455f4-972d-458c-9916-6f32b51c4874-nztbm6.pdf";
    const references = [
      { title: "Mann", key: "75c44d50-5956-4d92-abd9-32e5a485797e-om0aam.pdf" },
      { title: "Baur", key: "aaecd935-1727-41af-b702-3f12fb44b1c2-rpwfx7.pdf" },
    ];
    runDeepSearch({
      specKey,
      oaKey,
      claimKey,
      references,
    });
  }
  const { mutate: runDeepSearch } = api.DocumentRouter.testAgent.useMutation();

  if (userId !== "user_2O41MpqHgq6YqPzFrzXXDyUgaTr") {
    return null;
  }

  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen">
        <NavBar />
        <Toaster />
        <SignedIn>
          <div className="mt-10 flex flex-col items-center gap-y-3">
            <Button disabled onClick={handleButtonClick}>
              Delete All Files
            </Button>
            <Button onClick={handleDeepSearch}>Test Deep Search</Button>
          </div>
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <div className="mt-10 flex flex-row items-center justify-center">
            <SignInButton redirectUrl="home">
              <button className={buttonVariants({ size: "sm" })}>
                Sign in
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </>
  );
};

export default AdminPanel;

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
  use,
} from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

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
import { OAReport, FeatureItem, Reference } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

enum AppState {
  LOAD_DOCUMENTS = "LOAD_DOCUMENTS",
  LOADING = "LOADING",
  SHOW_RESULTS = "SHOW_RESULTS",
}

const Home: NextPage = () => {
  function copyEmailToClipboard() {
    navigator.clipboard
      .writeText("john@patense.ai")
      .then(() =>
        toast({
          title: "Email Copied to Clipboard",
          content: "support@patense.ai",
          variant: "default",
        })
      )
      .catch((error) => console.error("Copy failed", error));
  }
  const { toast } = useToast();

  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="">
        <div className="min-h-screen">
          <NavBar />
          <Toaster />
          <MaxWidthWrapper>
            <div className="flex flex-col gap-y-3 py-3 pb-10">
              <div className="text-center text-3xl font-semibold ">
                Privacy Policy
              </div>
              <div className="text-center text-sm">
                Last Updated: April 24, 2024
              </div>
              <div>
                By using our services, you agree to the terms outlined in this
                Privacy Policy.
              </div>
              <div className="font-semibold">1. Privacy</div>
              <div>
                We assume all information you share with us is public, since
                patents deal exclusively with publicly available information.
                Uploaded documents are stored in an AWS S3 bucket behind a
                hard-to-guess url. Analyses are private and access is restricted
                to the user.
              </div>
              <div className="font-semibold">
                2. Document Storage and Retention
              </div>
              <div>
                When you share documents with us, they are stored in our systems
                for approximately one week, for quality control, the deleted.
              </div>
              <div className="font-semibold">3. Quality Control Purposes</div>
              <div>
                Your documents may be accessed by our internal team for quality
                control purposes. This includes reviewing the documents and
                analyses to improve our services.
              </div>
              <div className="font-semibold">4. Data Sharing</div>
              <div>
                We do not share your data with any third parties outside of our
                technical infrastructure. Your information is confined to our
                internal systems, and access is restricted to authorized
                personnel.
              </div>
              <div className="flex flex-row items-center justify-center">
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

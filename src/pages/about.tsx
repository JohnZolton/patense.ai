import { type NextPage } from "next";
import Head from "next/head";
import React, { useState } from "react";

import { NavBar } from "~/pages/components/navbar";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Reports: NextPage = () => {
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

      {/* grainy not applying to whole screen, this fixes */}
      <div className="">
        <Toaster />
        <div className={`min-h-screen`}>
          <NavBar />
          <MaxWidthWrapper className="flex flex-col items-center gap-y-4">
            <div className="mt-5 text-3xl font-semibold">About Us</div>
            <div className="flex flex-col items-start gap-y-3">
              <p>We are going to solve patent prosecution with AI.</p>
              <p>
                We will drive the cost of obtaining a patent to the filing fees
                and some electricity
              </p>
            </div>
            <div className="flex flex-row gap-x-4">
              <Link
                className={buttonVariants({ variant: "link" })}
                href={"/privacy"}
              >
                Privacy Policy
              </Link>
              <div>
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

export default Reports;

import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {
  Cloud,
  File,
  FileCogIcon,
  Filter,
  Loader2,
  Trash2,
  Check,
  ArrowDownToLine,
} from "lucide-react";
import { NavBar } from "~/pages/components/navbar";
import { OAReport, FeatureItem, Reference } from "@prisma/client";
import { Button } from "@/components/ui/button";

import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { buttonVariants } from "@/components/ui/button";
import { useRouter, NextRouter } from "next/router";
import Link from "next/link";

const Reports: NextPage = () => {
  const [selectedReport, setSelectedReport] = useState<OAReport>();

  const router = useRouter();

  const { data: reports, isLoading: reportsLoading } =
    api.DocumentRouter.getAllReports.useQuery();

  function handleButtonClick(index: number) {
    if (reports && reports[index] !== undefined) {
      setSelectedReport(reports[index]);
    }
  }

  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="">
        <div className={selectedReport ? `` : "h-screen"}>
          <NavBar />
          <SignedIn>
            <div className="mt-3 flex flex-col items-center justify-center">
              {reportsLoading && (
                <Loader2 className="mt-10 h-10 w-10 animate-spin items-center justify-center" />
              )}
              {!reportsLoading &&
                (reports === undefined || reports.length === 0) && (
                  <div>No reports</div>
                )}
              {!selectedReport &&
                reports &&
                reports.map((report, index) => (
                  <ReportSelector
                    router={router}
                    key={index}
                    report={report}
                    index={index}
                    setSelectedReport={handleButtonClick}
                  />
                ))}
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

function ReportSelector({
  report,
  setSelectedReport,
  index,
  router,
}: ReportSelectorProps) {
  return (
    <div className="w-full max-w-xl">
      <Link
        className="my-2 flex w-full flex-row  items-center justify-center"
        href={`/reports/${report.id}`}
      >
        <div
          key={index}
          className="
h-12 w-full rounded-lg border border-dashed border-gray-600 bg-gray-50 hover:bg-gray-100
    "
        >
          <div className="flex h-full w-full flex-row items-center justify-between border p-2 ">
            <div className="font-semibold">{report.title}</div>
            <div className="flex flex-row items-center">
              {!report.completed && (
                <Loader2 className="h-8 w-8 animate-spin" />
              )}
              <div>{report.date.toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

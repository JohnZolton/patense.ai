import { type NextPage } from "next";
import Head from "next/head";
import React, { useState, } from 'react';

import { NavBar } from "~/pages/components/navbar";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";



const Reports: NextPage = () => {

  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

        {/* grainy not applying to whole screen, this fixes */}
        <div className="grainy">
        <div className={`min-h-screen`}>
        <NavBar />
        <MaxWidthWrapper>
        <div className="flex items-center justify-center text-3xl my-5 font-semibold">How It Works</div>
        <div>
        {/* steps */}
        <ol className='  space-y-4 flex flex-col items-start'>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 1
              </span>
              <span className='text-xl font-semibold'>Inventive Feature Extraction</span>
              <div>We use AI to scan through the entire specification to identify inventive elements. Scans are executed in chunks for higher accuracy.</div>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 2
              </span>
              <span className='text-xl font-semibold'>Reference Conversion</span>
              <div>Next we break the references into chunks and store them in a vector database. That lets us search the references for relevent portions.</div>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 3
              </span>
              <span className='text-xl font-semibold'>AI Disclosure Analysis</span>
              <div>Then we search that database for each inventive feature we identified and use AI to determine whether any reference discloses it.</div>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 4
              </span>
              <span className='text-xl font-semibold'>Generate a Report</span>
              <div>Last, we generate a report of all the inventive features, whether they are dislcosed in the references, and which references disclose them. Saving you and your clients time and money.</div>
              
              <div className="flex items-center pt-3 justify-center">
              <Link
                href="home"
                className={buttonVariants({
                  size:'default'

                })}
              >Try it Today</Link>
              </div>
            </div>
          </li>
        </ol></div>
        <div className="flex items-center justify-center text-3xl mt-10 my-5 font-semibold">Why</div>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-xl font-semibold'>To be the best we can</span>
              <div className="pb-20">We believe in using every tool at our disposal to protect our clients. AI augments human performance and makes us more effective.</div>
            </div>
        </MaxWidthWrapper>
        </div>
        </div>
    </>
  );
};

export default Reports;


import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";



const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="grainy">
      <MaxWidthWrapper className="flex flex-col justify-center items-center mt-32 text-center sm:40">
        <div className="flex overflow-hidden justify-center items-center px-7 py-2 mx-auto mb-4 space-x-2 bg-white rounded-full border border-gray-200 shadow-md backdrop-blur transition-all max-w-fit hover:border-gray-300 hover:bg-white/50">
          <p className="text-sm font-semibold text-gray-700">
            Patense.ai is now public!
          </p>
        </div>
          <h1 className="max-w-4xl text-5xl font-bold md:text-6xl lg:text-7xl">
            <span className="">Patense.ai</span>
          </h1>
          {/* CTA BUTTON */}
          <div className="my-6">
            <SignedOut>
              {/* Signed out users get sign in button */}
              <SignInButton redirectUrl="home">
                <button 
                className="flex flex-row items-center p-3 text-xl text-black bg-gray-400 rounded-md hover:bg-gray-300"
                >
                  Get Started{' '} <ArrowRight className='ml-2 w-5 h-5'/></button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                className="flex flex-row items-center p-3 text-xl text-black bg-gray-400 rounded-md hover:bg-gray-300"
                href="home"
              >Get started{' '} <ArrowRight className='ml-2 w-5 h-5'/></Link>
            </SignedIn>
          </div>
      </MaxWidthWrapper>
            
      {/* Feature section */}
      <div className='px-16 mx-auto mb-12 max-w-5xl sm:mt-8'>
        <div className='px-6 mb-12 lg:px-8'>
          <div className='mx-auto max-w-2xl sm:text-center'>
            <h2 className='mt-2 text-4xl font-bold text-zing-700 sm:text-5xl'>
              Analyze references in seconds
            </h2>
            <p className='mt-4 text-lg text-gray-600'>Responding to Office Actions has never been easier.</p>
          </div>
        </div>
        

        {/* steps */}
        <ol className='pt-8 my-8 space-y-4 md:flex md:space-x-12 md:space-y-0'>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 1
              </span>
              <span className='text-xl font-semibold'>Upload your specification</span>
              <span className='mt-2 text-zinc-700'>as a pdf with recognized text.</span>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 2
              </span>
              <span className='text-xl font-semibold'>
                Upload <span className="underline underline-offset-2">all</span> references
              </span>
              <span className='mt-2 text-zinc-700'>as a pdf with recognized text.</span>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 3
              </span>
              <span className='text-xl font-semibold'>Get your report</span>
              <span className='mt-2 text-zinc-700'>
                It&apos;s that simple. Try it today -
                it takes less than 5 minutes.
              </span>
            </div>
          </li>
        </ol>
        </div>

      </div>
    </>
  );
};

export default Home;

function ShortDescription(){
  return(
    <div className="flex flex-row justify-between mt-8 w-full max-w-3xl text-xl">
      <div>$50 Office Action Reports</div>
      <div>Improve office action responses</div>
      <div>Reduce costs</div>
    </div>
  )
}


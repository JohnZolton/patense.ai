import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import MaxWidthWrapper from "./components/maxwidthwrapper";



const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="grainy">

      <MaxWidthWrapper className="mb-12 mt-28 sm:40 flex flex-col items-center justify-center text-center">
        <div className="mx-auto mb-4 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-gray-200 bg-white px-7 py-2 shadow-md backdrop-blur transition-all hover:border-gray-300 hover:bg-white/50">
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
                <button className="rounded-md bg-gray-400 p-3 text-xl text-black">Get started</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                className="rounded-md bg-gray-400 p-3 text-xl text-black"
                href="home"
              >Get started</Link>
            </SignedIn>
          </div>
      </MaxWidthWrapper>
            
      {/* Feature section */}
      <div className='mx-auto mb-32 mt-16 max-w-5xl sm:mt-32'>
        <div className='mb-12 px-6 lg:px-8'>
          <div className='mx-auto max-w-2xl sm:text-center'>
            <h2 className='mt-2 font-bold text-4xl text-zing-700 sm:text-5xl'>
              Analyze references in seconds
            </h2>
            <p className='mt-4 text-lg text-gray-600'>Responding to Office Actions has never been easier.</p>
          </div>
        </div>

        {/* steps */}
        <ol className='my-8 space-y-4 pt-8 md:flex md:space-x-12 md:space-y-0'>
          <li className='md:flex-1'>
            <div className='flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 1
              </span>
              <span className='text-xl font-semibold'>Upload your specification</span>
              <span className='mt-2 text-zinc-700'>as a pdf with recognized text.</span>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
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
            <div className='flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
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
    <div className="mt-8 text-xl w-full max-w-3xl flex flex-row justify-between">
      <div>$50 Office Action Reports</div>
      <div>Improve office action responses</div>
      <div>Reduce costs</div>
    </div>
  )
}


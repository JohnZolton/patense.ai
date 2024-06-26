import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from 'next/image'

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import NavBar from "./components/navbar";



const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Patense.ai</title>
        <meta name="description" content="AI Patent Assistant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen grainy">
      <NavBar/>
      <MaxWidthWrapper className="flex flex-col justify-center items-center pt-16 text-center sm:w-100">
        <div className="flex overflow-hidden justify-center items-center px-7 py-2 mx-auto mb-4 space-x-2 bg-white rounded-full border border-gray-200 shadow-md backdrop-blur transition-all hover:border-gray-300 hover:bg-white/50">
          <p className="text-sm font-semibold text-gray-700">
            Patense.ai is now public!
          </p>
        </div>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold md:text-7xl">
            <span className="">Patense.ai</span>
          </h1>

          {/* CTA BUTTON */}
          <div className="my-4">
            <SignedOut>
              {/* Signed out users get sign in button */}
              <SignInButton redirectUrl="home">
              <Button className="mt-5" size={'lg'}>Get Started{" "}
              <ArrowRight className='ml-2 w-5 h-5' />
              </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
              className={buttonVariants({
                size: 'lg',
                className: 'mt-5',
              })}
              href='home'
              >
              Get started{' '}
              <ArrowRight className='ml-2 w-5 h-5' />
            </Link>
            </SignedIn>
          </div>
      </MaxWidthWrapper>
            
      {/* Feature section */}
      <div className='px-16 mx-auto mb-12 max-w-5xl sm:mt-4 mt-24'>
        <div className='px-6 mb-6 lg:px-8'>
          <div className='mx-auto max-w-2xl sm:text-center'>
            <h2 className='mt-2 text-4xl text-center font-bold text-zing-700 sm:text-5xl'>
              Analyze references in seconds
            </h2>
            <p className='mt-6 text-lg text-center text-gray-600'>Patents are high-stakes. Use every advantage you have.</p>
          </div>
        </div>
        

        {/* steps */}
        <ol className='pt-6  space-y-4 md:flex md:space-x-12 md:space-y-0'>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 1
              </span>
              <span className='text-xl font-semibold'>Upload your specification</span>
              <span className='mt-2 text-zinc-700'>as a PDF with recognized text.</span>
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
              <span className='mt-2 text-zinc-700'>as PDFs with recognized text.</span>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-sm font-medium text-blue-600'>
                Step 3
              </span>
              <span className='text-xl font-semibold'>Get your report</span>
              <span className='mt-2 text-zinc-700'>
                It&apos;s that simple. Try it today.
              </span>
            </div>
          </li>
        </ol>
        </div>
        
        <div className='relative isolate'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'>
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className='relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]'
            />
          </div>

          <div>
            <div className='mx-auto max-w-6xl px-6 lg:px-8'>
              <div className='mt-16 sm:mt-24 flex flex-row   rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 gap-x-2'>
                <div className=''>
                <div className="">

                  <Image
                    src='/report_generator.png'
                    alt='new report page'
                    width={748}
                    height={744}
                    quality={100}
                    className='rounded-md bg-white p-2 '
                  />
                </div>
                </div>
                <div className=''>
                  <Image
                    src='/report_section.png'
                    alt='product preview'
                    width={748}
                    height={744}
                    quality={100}
                    className='rounded-md bg-white p-2  shadow-2xl  '
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden='true'
            className='pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80'>
            <div
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
              className='relative left-[calc(50%-13rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-36rem)] sm:w-[72.1875rem]'
            />
          </div>
        </div>
        
        <div className="max-w-xl items-center justify-center mx-auto pb-24 mt-24">

        <div className="flex items-center justify-center text-4xl my-5 font-semibold">How It Works</div>
        <div>
        {/* steps */}
        <ol className='  space-y-4 flex flex-col items-start'>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-xl font-semibold'>Inventive Feature Extraction</span>
              <div>We use AI to scan through the entire specification to identify inventive elements.</div>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-xl font-semibold'>Reference Conversion</span>
              <div>Next we break the references into chunks and store them in a vector database. That lets us search the references for relevent portions.</div>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-xl font-semibold'>AI Disclosure Analysis</span>
              <div>Then we search that database for each inventive feature we identified and use AI to determine whether any relevant portions disclose it.</div>
            </div>
          </li>
          <li className='md:flex-1'>
            <div className='flex flex-col py-2 pl-4 space-y-2 border-l-4 border-zinc-300 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4'>
              <span className='text-xl font-semibold'>Generate a Report</span>
              <div>Last, we generate a report of all the inventive features, whether they are disclosed in the references, and which references disclose them. Saving you and your clients time and money.</div>
              
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


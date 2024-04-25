import { type NextPage } from "next";
import Link from "next/link";
import Image from "next/image";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import MaxWidthWrapper from "./components/maxwidthwrapper";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import NavBar from "./components/navbar";

const Home: NextPage = () => {
  return (
    <>
      <div className="min-h-screen">
        <NavBar />
        <MaxWidthWrapper className="sm:w-100 flex flex-col items-center justify-center pt-16 text-center">
          <h1 className="mt-4 max-w-4xl text-5xl font-bold md:text-7xl">
            <span className="">Patense.ai</span>
          </h1>

          <div className="my-4">
            <SignedOut>
              <SignInButton redirectUrl="home">
                <Button className="mt-5" size={"lg"}>
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                className={buttonVariants({
                  size: "lg",
                  className: "mt-5",
                })}
                href="home"
              >
                Get started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </SignedIn>
          </div>
        </MaxWidthWrapper>

        {/* Feature section */}
        <div className="mx-auto mb-12 mt-24 max-w-5xl px-16 sm:mt-4">
          <div className="mb-6 px-6 lg:px-8">
            <div className="mx-auto max-w-2xl sm:text-center">
              <h2 className="text-zing-700 mt-2 text-center text-4xl font-bold sm:text-5xl">
                Analyze references in seconds
              </h2>
              <p className="mt-6 text-center text-lg">
                Patents are high-stakes. Use every advantage you have.
              </p>
            </div>
          </div>

          {/* steps */}
          <ol className="space-y-4  pt-6 md:flex md:space-x-12 md:space-y-0">
            <li className="md:flex-1">
              <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-zinc-200">
                  Step 1
                </span>
                <span className="text-xl font-semibold">
                  Upload your specification
                </span>
                <span className="mt-2 text-zinc-200">
                  as a PDF with recognized text.
                </span>
              </div>
            </li>
            <li className="md:flex-1">
              <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-zinc-200">
                  Step 2
                </span>
                <span className="text-xl font-semibold">
                  Upload{" "}
                  <span className="underline underline-offset-2">all</span>{" "}
                  references
                </span>
                <span className="mt-2 text-zinc-200">
                  as PDFs with recognized text.
                </span>
              </div>
            </li>
            <li className="md:flex-1">
              <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-zinc-200">
                  Step 3
                </span>
                <span className="text-xl font-semibold">Get your report</span>
                <span className="mt-2 text-zinc-200">
                  It&apos;s that simple. Try it today.
                </span>
              </div>
            </li>
          </ol>
        </div>

        <div className="relative isolate">
          <div>
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
              <div className="mt-16 flex flex-row gap-x-2   rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 sm:mt-24 lg:-m-4 lg:rounded-2xl lg:p-4">
                <div className="">
                  <div className="">
                    <Image
                      src="/report_generator.png"
                      alt="new report page"
                      width={748}
                      height={744}
                      quality={100}
                      className="rounded-md bg-white p-2 "
                    />
                  </div>
                </div>
                <div className="">
                  <Image
                    src="/report_section.png"
                    alt="product preview"
                    width={748}
                    height={744}
                    quality={100}
                    className="rounded-md bg-white p-2  shadow-2xl  "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-xl items-center justify-center pb-24">
          <div className="my-5 flex items-center justify-center text-4xl font-semibold">
            How It Works
          </div>
          <div>
            {/* steps */}
            <ol className="  flex flex-col items-start space-y-4">
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-xl font-semibold">
                    Inventive Feature Extraction
                  </span>
                  <div>
                    We use AI to scan through the entire specification to
                    identify inventive elements.
                  </div>
                </div>
              </li>
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-xl font-semibold">
                    Reference Conversion
                  </span>
                  <div>
                    Next we break the references into chunks and store them in a
                    vector database. That lets us search the references for
                    relevent portions.
                  </div>
                </div>
              </li>
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-xl font-semibold">
                    AI Disclosure Analysis
                  </span>
                  <div>
                    Then we search that database for each inventive feature we
                    identified and use AI to determine whether any relevant
                    portions disclose it.
                  </div>
                </div>
              </li>
              <li className="md:flex-1">
                <div className="flex flex-col space-y-2 border-l-4 border-zinc-300 py-2 pl-4 md:border-l-0 md:border-t-2 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-xl font-semibold">
                    Generate a Report
                  </span>
                  <div>
                    Last, we generate a report of all the inventive features,
                    whether they are disclosed in the references, and which
                    references disclose them. Saving you and your clients time
                    and money.
                  </div>

                  <div className="flex items-center justify-center pt-3">
                    <Link
                      href="home"
                      className={buttonVariants({
                        size: "default",
                      })}
                    >
                      Try it Today
                    </Link>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

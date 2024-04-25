import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import { Cloud, File, Loader2, Trash2, Check, Ban } from "lucide-react";
import { NavBar } from "~/pages/components/navbar";
import Dropzone from "react-dropzone";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUploadThing } from "~/utils/uploadthing";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";
import { FileX } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

enum DocState {
  LOADING = "LOADING",
  FAILED = "FAILED",
  SUCCESS = "SUCCESS",
}
enum AppState {
  LOAD_DOCUMENTS = "LOAD_DOCUMENTS",
  LOADING = "LOADING",
  SHOW_RESULTS = "SHOW_RESULTS",
}

interface UserFile {
  upFile: File;
  loadstate: DocState;
  key?: string;
  title?: string;
}

const Home: NextPage = () => {
  const [refFiles, setRefFiles] = useState<UserFile[]>([]);
  const [specFile, setSpecFile] = useState<UserFile>();
  const [oaFile, setOAFile] = useState<UserFile>();
  const [claimFile, setClaimFile] = useState<UserFile>();
  const [resultData, setResultData] = useState<FeatureItem[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.LOAD_DOCUMENTS);
  const router = useRouter();
  const { mutate: makeDeepSearchReport } =
    api.DocumentRouter.makeReportDeepSearch.useMutation({
      onSuccess: (report) => {
        void router.push(`/reports/${report.id}`);
      },
    });

  const handleButtonClick = () => {
    if (
      specFile &&
      specFile.loadstate === DocState.SUCCESS &&
      claimFile &&
      claimFile.loadstate === DocState.SUCCESS &&
      oaFile &&
      oaFile.loadstate === DocState.SUCCESS &&
      refFiles.every((refFile) => refFile.loadstate === DocState.SUCCESS) &&
      refFiles.every((refFile) => refFile.key !== undefined) &&
      refFiles.every((refFile) => refFile.title !== undefined)
    ) {
      const referenceKeys = refFiles.map((refFile) => ({
        key: refFile.key as string,
        title: refFile.title !== undefined ? refFile.title : "none",
      }));
      if (
        specFile.key !== undefined &&
        oaFile.key !== undefined &&
        claimFile.key !== undefined &&
        referenceKeys !== undefined &&
        referenceKeys.length > 0 &&
        referenceKeys.every(
          (ref) => ref.key !== undefined && ref.title !== undefined
        )
      ) {
        console.log(referenceKeys);
        const result = makeDeepSearchReport({
          spec: {
            key: specFile.key,
            title: specFile.upFile.name ?? "none",
          },
          claims: {
            key: claimFile.key,
            title: claimFile.upFile.name ?? "none",
          },
          references: referenceKeys,
          officeAction: {
            key: oaFile?.key,
            title: oaFile?.upFile.name ?? "none",
          },
        });
        console.log(result);
      }
    } else {
      console.log("Error, no refs");
    }
  };
  const { toast } = useToast();

  return (
    <>
      <div className="min-h-screen">
        <NavBar />
        <Toaster />
        <SignedIn>
          {appState === AppState.LOAD_DOCUMENTS && (
            <div className="mx-auto mt-4 w-full max-w-3xl sm:w-3/4 lg:w-2/5">
              {!specFile && <SpecDropzone setSpecFile={setSpecFile} />}
              <SpecDisplay
                specification={specFile}
                label={"Specification"}
                setFile={setSpecFile}
              />
              {!claimFile && <ClaimDropzone setClaimFile={setClaimFile} />}
              <SpecDisplay
                specification={claimFile}
                setFile={setClaimFile}
                label={"Claims"}
              />
              {!oaFile && <OADropZone setOAFile={setOAFile} />}
              <SpecDisplay
                specification={oaFile}
                label={"Office Action"}
                setFile={setOAFile}
              />
              <ReferenceContainer refList={refFiles} setRefList={setRefFiles} />
              <ReferenceDropZone setRefFile={setRefFiles} />
              <div className="my-4 flex flex-col items-center justify-center">
                <Button
                  className={buttonVariants({
                    variant: "default",
                  })}
                  onClick={() => handleButtonClick()}
                >
                  Generate Report
                </Button>
              </div>
              <div className="text-center">
                Only PDFs with recognized text are supported.
              </div>
            </div>
          )}
          {appState === AppState.LOADING && (
            <div>
              <LoadDisplay />
            </div>
          )}
          {appState === AppState.SHOW_RESULTS && (
            <div>
              <AnalysisContainer features={resultData} />
            </div>
          )}
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

export default Home;

function LoadDisplay() {
  const loadingMessages = [
    "Processing documents...",
    "Extracting inventive elements...",
    "Converting references to vectors...",
    "Searching references for inventive elements...",
    "Preparing report...",
    "Finishing up...",
  ];

  const intervalDurations = [12000, 50000, 10000, 40000, 20000]; // Set varying intervals for each loading state
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Set up an interval to cycle through loading messages every 2000 milliseconds (2 seconds)
    const intervalId = setInterval(() => {
      if (currentMessageIndex < loadingMessages.length - 1) {
        setCurrentMessageIndex((prevIndex) => prevIndex + 1);
        const nextIndex = currentMessageIndex + 1;
        const nextInterval = intervalDurations[nextIndex];
        setTimeout(() => clearInterval(intervalId), nextInterval);
      } else {
        setCurrentMessageIndex(5);
      }
    }, intervalDurations[currentMessageIndex]);

    // Clear the interval when the component unmounts or is no longer needed
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures the effect runs only once

  return (
    <div className="flex flex-col items-center justify-center py-3">
      <Loader2 className="h-10 w-10 animate-spin items-center justify-center" />
      <div>{loadingMessages[currentMessageIndex]}</div>
    </div>
  );
}

interface FeatureItem {
  feature: string;
  analysis: string;
  source: string;
}

interface AnalysisContainerProps {
  features: FeatureItem[];
}

function AnalysisContainer({ features }: AnalysisContainerProps) {
  return (
    <div className="my-4">
      {features.map((featureItem, index) => (
        <AnalysisDisplay key={index} item={featureItem} />
      ))}
    </div>
  );
}
interface AnalysisDisplayProps {
  item: FeatureItem;
}
function AnalysisDisplay({ item }: AnalysisDisplayProps) {
  return (
    <div className="my-2 flex border-collapse flex-col items-start gap-y-2 border p-2">
      <div className="">Feature: {item.feature}</div>
      <div className="">Analysis: {item.analysis}</div>
      <div className="text-sm">Source: {item.source}</div>
    </div>
  );
}

interface SpecDisplayProps {
  specification: UserFile | undefined;
  setFile: React.Dispatch<React.SetStateAction<UserFile | undefined>>;
  label: string;
}
function SpecDisplay({ specification, label, setFile }: SpecDisplayProps) {
  const { toast } = useToast();
  useEffect(() => {
    if (specification && specification.loadstate === DocState.LOADING) {
      const handleSpecChange = async () => {
        const res = await startUpload([specification.upFile]);
        if (!res) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }
        const [fileResponse] = res;
        const key = fileResponse?.key;
        console.log("Key: ", key);
        if (!key) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }
        startPolling({ key: key });
      };
      void handleSpecChange();
    }
  }, [specification]);

  const { startUpload } = useUploadThing("pdfUploader");
  const { mutate: startPolling } = api.DocumentRouter.getFile.useMutation({
    onSuccess: (file) => {
      console.log(file);
      if (file.uploadStatus === "SUCCESS" && specification) {
        const newSpec: UserFile = {
          upFile: specification.upFile,
          loadstate: DocState.SUCCESS,
          key: file.key,
        };
        setFile(newSpec);
      } else {
        if (specification) {
          const newSpec: UserFile = {
            upFile: specification.upFile,
            loadstate: DocState.FAILED,
          };
          setFile(newSpec);
        }
      }
    },
    retry: true,
    retryDelay: 500,
  });

  function handleButtonClick() {
    setFile(undefined);
  }

  if (specification === undefined) {
    return null;
  }

  return (
    <div className="mt-4  flex max-w-3xl flex-col items-center">
      <div className="flex w-full flex-row items-center justify-between px-40">
        <div>{label}:</div>
        <div className="flex w-2/3 flex-row items-center justify-center divide-zinc-200 overflow-hidden rounded-md outline   outline-[1px]">
          <Toaster />
          <div className="">
            <File className="ml-2 h-4 w-4" />
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-x-2 px-2">
            <div className="h-full w-full overflow-hidden truncate px-3 py-2 text-sm">
              {specification.upFile.name}
            </div>
            {specification.loadstate === DocState.LOADING && (
              <Loader2 className="h-8 w-8 animate-spin" />
            )}
            {specification.loadstate === DocState.FAILED && (
              <Ban className="h-8 w-8 text-red-500" />
            )}
            {specification.loadstate === DocState.SUCCESS && (
              <Check className="h-8 w-8 text-green-500" />
            )}
            <button onClick={handleButtonClick} className="hover:text-red-600">
              <FileX className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
interface ReferenceContainerProps {
  refList: UserFile[];
  setRefList: Dispatch<SetStateAction<UserFile[]>>;
}
function ReferenceContainer({ refList, setRefList }: ReferenceContainerProps) {
  if (refList.length === 0) {
    return null;
  }

  function removeItem(indexToRemove: number) {
    const updatedRefList = refList.filter(
      (_, index) => index !== indexToRemove
    );
    setRefList(updatedRefList);
  }

  function updateRefList(file: UserFile, idx: number) {
    const updatedRefs = [
      ...refList.slice(0, idx),
      file,
      ...refList.slice(idx + 1),
    ];
    setRefList(updatedRefs);
  }

  return (
    <div className="mt-4 flex flex-row items-start justify-between px-40">
      <div>References: </div>
      <div className="flex w-2/3 flex-col">
        {refList.map((refItem, index) => (
          <RefereceDisplay
            key={index}
            updateRefList={updateRefList}
            removeItem={removeItem}
            reference={refItem}
            idx={index}
            setRefList={setRefList}
          />
        ))}
      </div>
    </div>
  );
}

interface ReferenceDisplayProps {
  reference: UserFile;
  idx: number;
  setRefList: Dispatch<SetStateAction<UserFile[]>>;
  updateRefList(file: UserFile, idx: number): void;
  removeItem(indexToRemove: number): void;
}
function RefereceDisplay({
  reference,
  idx,
  setRefList,
  removeItem,
  updateRefList,
}: ReferenceDisplayProps) {
  const { toast } = useToast();
  useEffect(() => {
    if (reference && reference.loadstate === DocState.LOADING) {
      const handleRefChange = async () => {
        const res = await startUpload([reference.upFile]);
        if (!res) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }
        const [fileResponse] = res;
        const key = fileResponse?.key;
        console.log("Key: ", key);
        if (!key) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }
        startPolling({ key: key });
      };
      void handleRefChange();
    }
  }, [reference]);

  useEffect(() => {
    console.log(reference);
  }, [reference]);

  const { startUpload } = useUploadThing("pdfUploader");
  const { mutate: startPolling } = api.DocumentRouter.getFile.useMutation({
    onSuccess: (file) => {
      console.log(file);
      if (file.uploadStatus === "SUCCESS") {
        const newRef: UserFile = {
          upFile: reference.upFile,
          loadstate: DocState.SUCCESS,
          key: file.key,
          title: file.title,
        };
        updateRefList(newRef, idx);
      } else {
        const newRef: UserFile = {
          upFile: reference.upFile,
          loadstate: DocState.FAILED,
        };
        updateRefList(newRef, idx);
      }
    },
    retry: true,
    retryDelay: 10000,
  });
  return (
    <div className="my-2 flex max-w-xl flex-row items-center justify-center divide-zinc-200 overflow-hidden rounded-md pl-4 pr-2 outline outline-[1px]">
      <Toaster />
      <div className="">
        <File className="h-4 w-4" />
      </div>
      <div className="flex w-full flex-row items-center justify-between gap-x-2 px-2">
        <div className="h-full w-48  truncate px-3 py-2 text-sm">
          {reference.upFile.name}
        </div>
        {reference.loadstate === DocState.LOADING && (
          <Loader2 className="h-8 w-8 animate-spin" />
        )}
        {reference.loadstate === DocState.FAILED && (
          <Ban className="h-8 w-8 text-red-500" />
        )}
        {reference.loadstate === DocState.SUCCESS && (
          <Check className="h-8 w-8 text-green-500" />
        )}
        <button onClick={() => removeItem(idx)} className="hover:text-red-600">
          <FileX className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

interface ReferenceDropZoneProps {
  setRefFile: Dispatch<SetStateAction<UserFile[]>>;
}
function ReferenceDropZone({ setRefFile }: ReferenceDropZoneProps) {
  return (
    <div>
      <Dropzone
        multiple={true}
        onDrop={(acceptedFiles) => {
          const newFiles: UserFile[] = acceptedFiles.map((file) => ({
            upFile: file,
            loadstate: DocState.LOADING,
          }));

          setRefFile((prevFiles) => [...prevFiles, ...newFiles]);
        }}
      >
        {({ getRootProps, getInputProps, acceptedFiles }) => (
          <div className="m-4 h-32 rounded-lg border border-dashed border-gray-600">
            <div
              {...getRootProps()}
              className="flex h-full w-full items-center justify-center"
            >
              <label
                htmlFor="dropzone-file"
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg hover:bg-white/25"
              >
                <div className="flex flex-col items-center justify-center pt-2">
                  Upload All References
                </div>
                <Cloud className="h-8 w-8 text-zinc-500" />
                <p className="mb-2 text-sm text-zinc-200">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <input
                  {...getInputProps()}
                  type="file"
                  id="dropzone-file"
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </Dropzone>
    </div>
  );
}
interface OADropZoneProps {
  setOAFile: React.Dispatch<React.SetStateAction<UserFile | undefined>>;
}
function OADropZone({ setOAFile }: OADropZoneProps) {
  return (
    <Dropzone
      multiple={false}
      onDrop={(acceptedFiles) => {
        console.log(acceptedFiles);
        if (acceptedFiles.length > 0 && acceptedFiles[0] !== undefined) {
          const newFile: UserFile = {
            upFile: acceptedFiles[0],
            loadstate: DocState.LOADING,
          };
          setOAFile(newFile);
        }
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div className="m-4 h-32 rounded-lg border border-dashed border-gray-600">
          <div
            {...getRootProps()}
            className="flex h-full w-full items-center justify-center"
          >
            <label
              htmlFor="dropzone-file"
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg hover:bg-white/25"
            >
              <div className="flex flex-col items-center justify-center pt-2">
                Upload an Office Action
              </div>
              <Cloud className="h-8 w-8 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-200">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <input
                {...getInputProps()}
                type="file"
                id="dropzone-file"
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
}

interface ClaimsDropzoneProps {
  setClaimFile: React.Dispatch<React.SetStateAction<UserFile | undefined>>;
}
function ClaimDropzone({ setClaimFile }: ClaimsDropzoneProps) {
  return (
    <Dropzone
      multiple={false}
      onDrop={(acceptedFiles) => {
        console.log(acceptedFiles);
        if (acceptedFiles.length > 0 && acceptedFiles[0] !== undefined) {
          const newFile: UserFile = {
            upFile: acceptedFiles[0],
            loadstate: DocState.LOADING,
          };
          setClaimFile(newFile);
        }
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div className="m-4 h-32 rounded-lg border border-dashed border-gray-600">
          <div
            {...getRootProps()}
            className="flex h-full w-full items-center justify-center"
          >
            <label
              htmlFor="dropzone-file"
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg hover:bg-white/25"
            >
              <div className="flex flex-col items-center justify-center pt-2">
                Upload the Claims
              </div>
              <Cloud className="h-8 w-8 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-200">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <input
                {...getInputProps()}
                type="file"
                id="dropzone-file"
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
}

interface SpecDropzoneProps {
  setSpecFile: React.Dispatch<React.SetStateAction<UserFile | undefined>>;
}
function SpecDropzone({ setSpecFile }: SpecDropzoneProps) {
  return (
    <Dropzone
      multiple={false}
      onDrop={(acceptedFiles) => {
        console.log(acceptedFiles);
        if (acceptedFiles.length > 0 && acceptedFiles[0] !== undefined) {
          const newFile: UserFile = {
            upFile: acceptedFiles[0],
            loadstate: DocState.LOADING,
          };
          setSpecFile(newFile);
        }
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div className="m-4 h-32 rounded-lg border border-dashed border-gray-600">
          <div
            {...getRootProps()}
            className="flex h-full w-full items-center justify-center"
          >
            <label
              htmlFor="dropzone-file"
              className="hover:bg-transparent-50 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg hover:bg-white/25"
            >
              <div className="flex flex-col items-center justify-center pt-2">
                Upload a Specification
              </div>
              <Cloud className="h-8 w-8 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-200">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <input
                {...getInputProps()}
                type="file"
                id="dropzone-file"
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
}

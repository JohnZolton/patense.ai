import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

import React, { useState, useRef, ChangeEvent } from 'react';
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import type {
  ActualWorkout,
  ActualExercise,
  exerciseSet,
} from "@prisma/client";
import { v4 } from "uuid";
import { NavBar } from "~/pages/components/navbar";
import PageLayout from "~/pages/components/pagelayout";
import LoadingSpinner from "./components/loadingspinner";
import { pdfjs, Document, Page } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const Home: NextPage = () => {
  
  const handlePDFLoaded = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const dataUrl = `data:application/pdf;base64,${Buffer.from(buffer).toString('base64')}`;

      const loadingTask = pdfjs.getDocument({ url: dataUrl });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join('');
        fullText += pageText + '\n'; // Add a newline between pages if you want
      }

      console.log('Full PDF text:', fullText);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };
  return (
    <>
      <Head>
        <title>Patense.io</title>
        <meta name="description" content="AI Patent Assitant" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <NavBar />
        <div className="">
          <SignedIn>
          <PDFparser onPDFLoaded={handlePDFLoaded}/>
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton redirectUrl="home">
              <button className="rounded-full bg-slate-700 p-3 text-xl  hover:bg-gray-600">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </PageLayout>
    </>
  );
};

export default Home;



interface PDFparserProps {
  onPDFLoaded: (file: File) => void;
}

const PDFparser: React.FC<PDFparserProps> = ({ onPDFLoaded }) => {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('application/pdf')) {
        onPDFLoaded(file);
        setFilename(file.name);
      }
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type.startsWith('application/pdf')) {
        onPDFLoaded(file);
        setFilename(file.name);
      }
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border ${dragOver ? 'border-blue-500' : 'border-gray-300'} p-6 text-center`}
    >
      <div
        style={{ width: '100%', height: '100%' }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
        {filename ? (
          <p>Uploaded PDF: {filename}</p>
        ) : (
          <div>Drag and drop a PDF file here, or click to select a file:</div>
        )}
        <button
          type="button"
          className="mt-4 block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Select PDF file
        </button>
      </div>
    </div>
  );
};



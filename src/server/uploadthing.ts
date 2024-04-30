import type { NextApiRequest, NextApiResponse } from "next";

import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { PrismaClient } from "@prisma/client";

import { getAuth } from "@clerk/nextjs/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { UTApi } from "uploadthing/server";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  docxUploader: f({
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "128MB",
      maxFileCount: 10,
    },
  })
    .middleware(({ req, res }) => {
      const { userId } = getAuth(req);
      if (!userId) {
        return { userId: "" };
      }
      return { userId: userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const db = new PrismaClient();
      const uploadedFile = await db.uploadFile.create({
        data: {
          key: file.key,
          title: file.name,
          userId: metadata.userId,
          url: `${file.url}`,
          uploadStatus: "PROCESSING",
        },
      });
      try {
        const response = await fetch(`${file.url}`);
        const blob = await response.blob();
        const loader = new DocxLoader(blob);
        const pageLevelDocs = await loader.load();
        if (pageLevelDocs.length < 1) {
          console.log("update failed");
          await db.uploadFile.update({
            data: {
              uploadStatus: "FAILED",
            },
            where: {
              id: uploadedFile.id,
            },
          });
        } else {
          console.log("upload success");
          await db.uploadFile.update({
            data: {
              uploadStatus: "SUCCESS",
            },
            where: {
              id: uploadedFile.id,
            },
          });
        }
      } catch {}
      console.log(uploadedFile);
      return { uploadedBy: metadata.userId };
    }),
  txtUploader: f({
    text: { maxFileSize: "128MB", maxFileCount: 10 },
  })
    .middleware(({ req, res }) => {
      const { userId } = getAuth(req);
      if (!userId) {
        return { userId: "" };
      }
      return { userId: userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      const db = new PrismaClient();
      const uploadedFile = await db.uploadFile.create({
        data: {
          key: file.key,
          title: file.name,
          userId: metadata.userId,
          url: `${file.url}`,
          uploadStatus: "PROCESSING",
        },
      });
      try {
        const response = await fetch(`${file.url}`);
        const blob = await response.blob();
        console.log(blob.name);
        const loader = new TextLoader(blob);
        const pageLevelDocs = await loader.load();
        if (pageLevelDocs.length < 1) {
          console.log("update failed");
          await db.uploadFile.update({
            data: {
              uploadStatus: "FAILED",
            },
            where: {
              id: uploadedFile.id,
            },
          });
        } else {
          console.log("upload success");
          await db.uploadFile.update({
            data: {
              uploadStatus: "SUCCESS",
            },
            where: {
              id: uploadedFile.id,
            },
          });
        }
      } catch {}
      console.log(uploadedFile);
      return { uploadedBy: metadata.userId };
    }),
  pdfUploader: f({
    pdf: { maxFileSize: "128MB", maxFileCount: 10 },
  })
    // Set permissions and file types for this FileRoute
    .middleware(({ req, res }) => {
      const { userId } = getAuth(req);
      if (!userId) {
        return { userId: "" };
      }
      return { userId: userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      const db = new PrismaClient();
      const uploadedFile = await db.uploadFile.create({
        data: {
          key: file.key,
          title: file.name,
          userId: metadata.userId,
          url: `${file.url}`,
          uploadStatus: "PROCESSING",
        },
      });
      try {
        const response = await fetch(`${file.url}`);
        const blob = await response.blob();
        const loader = new PDFLoader(blob);
        const pageLevelDocs = await loader.load();
        if (pageLevelDocs.length < 1) {
          console.log("update failed");
          await db.uploadFile.update({
            data: {
              uploadStatus: "FAILED",
            },
            where: {
              id: uploadedFile.id,
            },
          });
        } else {
          console.log("upload success");
          await db.uploadFile.update({
            data: {
              uploadStatus: "SUCCESS",
            },
            where: {
              id: uploadedFile.id,
            },
          });
        }
      } catch {}
      console.log(uploadedFile);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

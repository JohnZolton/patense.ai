import { generateReactHelpers } from "@uploadthing/react/hooks";
 
import type { OurFileRouter } from "~/server/uploadthing";
 
export const { useUploadThing } =
  generateReactHelpers<OurFileRouter>();
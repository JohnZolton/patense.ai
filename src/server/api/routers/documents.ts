import { number, z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import OpenAI from "openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { ConstitutionalPrinciple, RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { UTApi } from "uploadthing/server";
import { drawButton } from "pdf-lib";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Chroma } from "langchain/vectorstores/chroma";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { InMemoryStore } from "langchain/storage/in_memory";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { PlaywrightWebBaseLoader } from "langchain/document_loaders/web/playwright";
import { find, first } from "cheerio/lib/api/traversing";
import nlp from "compromise/three";
import { userInfo } from "os";
import Anthropic from "@anthropic-ai/sdk";
import { execArgv } from "process";

const utapi = new UTApi();

interface FeatureItem {
  feature: string;
  analysis: string;
  source: string;
}

const OUR_DOMAIN =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/"
    : "https://patense.ai/";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const documentRouter = createTRPCRouter({
  deleteAllFiles: privateProcedure.mutation(async ({ ctx }) => {
    if (ctx.userId === "user_2O41MpqHgq6YqPzFrzXXDyUgaTr") {
      const UTFiles = await utapi.listFiles({ limit: 2000 });
      const keys = UTFiles.map((file) => file.key);
      const deletedFiles = await utapi.deleteFiles(keys);
      console.log("deleted files: ", deletedFiles);

      const file = await ctx.prisma.uploadFile.deleteMany();
      console.log("deleted DB files: ", file);
      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return file;
    }
  }),
  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const file = await ctx.prisma.uploadFile.findFirst({
        where: {
          key: input.key,
          userId: ctx.userId,
        },
      });
      if (!file) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return file;
    }),

  saveDocsAndSendStripe: privateProcedure
    .input(
      z.object({
        spec: z.object({
          key: z.string(),
          title: z.string(),
        }),
        references: z.array(
          z.object({
            key: z.string(),
            title: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(ctx.userId);
      console.log("spec: ", input.spec.key);
      console.log("references: ", input.references.length);

      const createdJob = await ctx.prisma.oAReport.create({
        data: {
          userID: ctx.userId,
          specKey: input.spec.key,
          oaKey: "dummy key do later",
          claimKey: "dummy",
          title: input.spec.title,
          files: {
            create: input.references.map((reference) => ({
              userId: ctx.userId,
              key: reference.key,
              title: reference.title,
            })),
          },
        },
      });

      const stripeKey =
        process.env.NODE_ENV === "development"
          ? process.env.STRIPE_TEST_SECRET_KEY
          : process.env.STRIPE_SECRET_KEY;
      const itemAPIId =
        process.env.NODE_ENV === "development"
          ? process.env.STRIPE_TEST_API_ID
          : process.env.STRIPE_API_ID;
      //const itemAPIId = "price_1OVgliA0pn7vugH4i4v3d4dN" //cheap live key
      const stripe = new Stripe(stripeKey ?? "", {
        typescript: true,
        apiVersion: "2023-10-16",
      });
      const stripeSession = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: itemAPIId || "",
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${OUR_DOMAIN}/reports/${createdJob.id}`,
        cancel_url: `${OUR_DOMAIN}/home`,
        automatic_tax: { enabled: true },
        payment_intent_data: {
          metadata: {
            userId: ctx.userId,
            txId: createdJob.id,
          },
        },
      });
      console.log("STRIPE SESSION ID: ", stripeSession.id);

      return stripeSession.url;
    }),
  demoSaveDocsAndSendStripe: privateProcedure
    .input(
      z.object({
        spec: z.object({
          key: z.string(),
          title: z.string(),
        }),
        references: z.array(
          z.object({
            key: z.string(),
            title: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(ctx.userId);
      console.log("spec: ", input.spec.key);
      console.log("references: ", input.references.length);

      const createdJob = await ctx.prisma.oAReport.create({
        data: {
          userID: ctx.userId,
          specKey: input.spec.key,
          title: input.spec.title,
          claimKey: "dummy",
          oaKey: "dummy key do later",
          files: {
            create: input.references.map((reference) => ({
              userId: ctx.userId,
              key: reference.key,
              title: reference.title,
            })),
          },
        },
      });

      const stripeKey = process.env.STRIPE_TEST_SECRET_KEY;
      const itemAPIId = process.env.STRIPE_TEST_API_ID;
      //const itemAPIId = "price_1OVgliA0pn7vugH4i4v3d4dN" //cheap live key
      const stripe = new Stripe(stripeKey ?? "", {
        typescript: true,
        apiVersion: "2023-10-16",
      });
      const stripeSession = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: itemAPIId || "",
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${OUR_DOMAIN}/reports/${createdJob.id}`,
        cancel_url: `${OUR_DOMAIN}/home`,
        automatic_tax: { enabled: true },
        payment_intent_data: {
          metadata: {
            userId: ctx.userId,
            txId: createdJob.id,
          },
        },
      });
      console.log("STRIPE SESSION ID: ", stripeSession.id);

      return stripeSession.url;
    }),

  getReportById: privateProcedure
    .input(
      z.object({
        reportId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.prisma.oAReport.findFirst({
        where: {
          userID: ctx.userId,
          id: input.reportId,
        },
        orderBy: [{ date: "desc" }],
        include: {
          features: true,
          files: true,
          convo: {
            include: {
              messages: {
                include: {
                  result: {
                    include: {
                      cites: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No reports found with that user",
        });
      }
      return report;
    }),
  getLatestReport: privateProcedure.mutation(async ({ ctx }) => {
    const report = await ctx.prisma.oAReport.findFirst({
      where: {
        userID: ctx.userId,
      },
      orderBy: [{ date: "desc" }],
      include: {
        features: true,
        files: true,
      },
    });
    if (!report) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No reports found with that user",
      });
    }
    return report;
  }),

  getAllReports: privateProcedure.query(async ({ ctx }) => {
    const reports = await ctx.prisma.oAReport.findMany({
      where: {
        userID: ctx.userId,
        paid: true,
      },
      orderBy: [{ date: "desc" }],
    });
    if (reports[0] && reports[0]) {
      //console.log(reports[0].features[0])
    }
    if (!reports) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No reports with that User",
      });
    }
    return reports;
  }),

  makeReportDeepSearch: privateProcedure
    .input(
      z.object({
        spec: z.object({
          key: z.string(),
          title: z.string(),
        }),
        claims: z.object({
          key: z.string(),
          title: z.string(),
        }),
        officeAction: z.object({
          key: z.string(),
          title: z.string(),
        }),
        references: z.array(
          z.object({
            key: z.string(),
            title: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(ctx.userId);
      console.log("spec: ", input.spec.key);
      console.log("references: ", input.references.length);
      console.log("OA: ", input.officeAction.key);
      console.log("claims: ", input.claims.key);

      const createdJob = await ctx.prisma.oAReport.create({
        data: {
          userID: ctx.userId,
          specKey: input.spec.key,
          title: input.spec.title,
          oaKey: input.officeAction.key,
          claimKey: input.claims.key,
          files: {
            create: input.references.map((reference) => ({
              userId: ctx.userId,
              key: reference.key,
              title: reference.title,
            })),
          },
        },
      });
      return createdJob;
    }),

  testAgent: privateProcedure
    .input(
      z.object({
        specKey: z.string(),
        claimKey: z.string(),
        oaKey: z.string(),
        references: z.array(
          z.object({
            title: z.string(),
            key: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      async function getDocument(key: string) {
        const doc = await fetch(`https://utfs.io/f/${key}`);
        const dobBlob = await doc.blob();
        const docloader = new PDFLoader(dobBlob);
        const document = await docloader.load();
        return document;
      }

      // get Spec, OA, and Refs
      const spec = await getDocument(input.specKey);
      const claimsDoc = await getDocument(input.claimKey);
      const officeAction = await getDocument(input.oaKey);
      const refDocs: Document[][] = [];
      console.log(officeAction);
      await Promise.all(
        input.references.map(async (reference) => {
          const ref = await getDocument(reference.key);
          const newDocs = ref.flatMap((page, number) => {
            const newDoc = new Document({
              pageContent: page?.pageContent ?? "",
              metadata: {
                title: reference.title,
                userId: ctx.userId ?? "none",
                page: number + 1,
              },
            });
            return newDoc;
          });
          refDocs.push(newDocs);
        })
      );
      // search refs for claims

      interface ClaimAnalysis {
        claim: string;
        rejection?: string;
        references?: string[];
      }

      //verify later
      const pattern102 =
        /(\bClaims[^.!?]*\s?are\s?rejected\s?\sunder\s?35\s?U\.?S\.?C\.?\s?102)\s*(.*?)(?=\s*\bClaims[^.!?]*\s?are\s?rejected\s?\s?under\s?35\s?U\.?S\.?C\.?\s?10(2|3)(?:\(a\))|$)/gisu;
      const pattern103 =
        /(\bClaims[^.!?]*\s?are\s?rejected\s?\sunder\s?35\s?U\.?S\.?C\.?\s?103)\s*(.*?)(?=\s*\bClaims[^.!?]*\s?are\s?rejected\s?\s?under\s?35\s?U\.?S\.?C\.?\s?103(?:\(a\))|$)/gisu;

      function extractClaimRejections(text: string, pattern: RegExp): string[] {
        const claimRejections: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          claimRejections.push(match[0]);
        }
        console.log(text);
        console.log(claimRejections);
        return claimRejections;
      }

      const rejections103: string[] = extractClaimRejections(
        officeAction.map((doc) => doc.pageContent).join(" "),
        pattern103
      );
      rejections103.map((rejection) => {
        console.log("NEW REJCTION");
        console.log(rejection);
        console.log("\n");
      });
      console.log(rejections103.length);

      function extractClaimNumbersFromRejection(text: string) {
        const numberPatternFromRejection =
          /(?<=claims? ?)(\d+(?:(?:,\s*|-| ?and ?)\d+)*)/gi;
        const claimNumbers: number[] = [];
        const match = numberPatternFromRejection.exec(text);
        if (match?.[0]) {
          const numbers = match?.[0];
          const parts = numbers
            .replace(/and/g, ",")
            .replace(/\s/g, "")
            .split(",");
          const claimNumbers: number[] = [];
          for (const part of parts) {
            if (part.includes("-")) {
              const [start, end] = part.split("-").map(Number);
              if (start && end) {
                for (let i = start; i <= end; i++) {
                  claimNumbers.push(i);
                }
              }
            } else {
              claimNumbers.push(Number(part));
            }
          }
          return claimNumbers;
        }
        return claimNumbers;
      }
      const allRejectedClaimGroups = rejections103.map((rejection) => ({
        rejection: rejection,
        claimNums: extractClaimNumbersFromRejection(rejection),
      }));
      console.log(allRejectedClaimGroups);

      const allClaims = claimsDoc.map((doc) => doc.pageContent).join(" ");

      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 4095,
        messages: [
          {
            role: "user",
            content: `split the following claims by double newline so that i can easily parse them, return only the claims: ${allClaims}`,
          },
        ],
      });
      const newClaims = msg.content[0]?.text || "failed";
      console.log(newClaims);

      const claimRegex = /\d+\.[^]*?(\n\n|$)/g;
      const splits = newClaims.match(claimRegex);
      console.log(splits);

      interface claimObj {
        claimNumber: number;
        text: string;
      }

      const claimGroups = splits?.map((split) => findClaim(split));

      function findClaim(text: string) {
        const claimNumberPattern = /^\b\d+/gim;
        const claimNumber = text.match(claimNumberPattern);
        const number = Number(claimNumber?.[0]);
        const claimItem: claimObj = {
          claimNumber: number,
          text: text,
        };
        return claimItem;
      }
      console.log(claimGroups);

      // match claims to rejection
      interface rejectioObj {
        claims: claimObj[] | undefined;
        rejection: string;
        claimNums: number[];
        citations?: string[];
      }

      const fullObjs = allRejectedClaimGroups.map((reject) => {
        const fullReject: rejectioObj = {
          rejection: reject.rejection,
          claimNums: reject.claimNums,
          claims: claimGroups?.filter((claim) =>
            reject.claimNums.includes(claim.claimNumber)
          ),
        };
        return fullReject;
      });
      fullObjs.map((obj) => console.log(obj));

      async function extractCitationsFromRejection(obj: rejectioObj) {
        const msg = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 4095,
          messages: [
            {
              role: "user",
              content: `You are a helpful citation-extracting program.
              ------------------------------------------
              Office Action Rejection:${obj.rejection.slice(0, 200)}
              ------------------------------------------
              Extract the authors and publication number/title from the above rejection.
              Return in the follow format: {Publication number}: {author} et al
              Separate multiple references by double newlines
              `,
            },
          ],
        });
        const text = msg.content[0]?.text ?? "error";
        const items = text.split("\n\n");
        const cites = items.map((item) => {
          const splits = item.split(":");
          return {
            pubNum: splits[0],
            author: splits[1],
          };
        });
        return cites;
      }

      const testCite = await extractCitationsFromRejection(fullObjs[3]!);
      console.log(testCite);

      //claimGroups?.map((claim)=>)
      /*

      async function analyzeClaim(claim: string, ref: Document[]) {
        console.log(claim);
        console.log(ref[0]);
        const msg = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 4095,
          messages: [
            {
              role: "user",
              content: `The following is a document cited against our patent application by the USPTO: ${ref
                .map((doc) => doc.pageContent)
                .join(" ")}
              -----------------------------------------
              
              The following is our claim: ${claim}

              ------------------------------------------
              
              Analyze whether the claim is anticipated or obvious by the above reference. explain your reasoning before stating your conclusion

              `,
            },
          ],
        });
        return msg.content[0]?.text || "none";
      }
      const testResult = await analyzeClaim(splits![0], refDocs[0]!);
      console.log(testResult);
      */

      // make analysis?
      // view office action
      // split OA into sections
      // compare claim, office action
      // make argument or concur
      // draft amendment
    }),

  testPatentBot: privateProcedure.mutation(async ({ ctx }) => {
    const officeActionInfo = {
      title: "office_action.pdf",
      key: "eb953b0e-6671-43b7-857f-b95b2f0033bd-qpa31j.pdf",
    };
    const specificationDoc = {
      title: "railway spec",
      key: "d870d80a-4cc5-49e4-b95a-a8afa78f9e1f-cuaw3m.pdf",
    };
    const referencesDoc = [
      {
        title: "WO2018050143",
        key: "78a7c410-0549-4ddb-96f0-b28170757e99-iv93u5.pdf",
        author: "Coutinho",
        url: "https://patents.google.com/patent/WO2018050143A2/en",
      },
      {
        title: "WO2005047819",
        key: "fa04cb84-0404-47b1-b5a2-3b6dfe4d2a75-slu8o5.pdf",
        author: "Hulin",
        url: "https://patents.google.com/patent/WO2005047819A1/en?oq=WO2005047819A",
      },
    ];

    const openai = new OpenAI();

    const dummyData = `
    Regarding Claim 1, Cui teaches a system, comprising: ... ((Fig. 7 and ¶  0068 teach system 700 includes a processor 702)
    ... ([¶ 0043] iframe blah blah...),
    in response to blah ... ([¶ 0055], ... service data. [¶ 0057] the ... files [i.e., generated customized rendering code] to be ...).
    
    Regarding Claim 2, Cui teaches the system recited in claim 1, wherein ... (Fig. 2, ¶ 0030 teach domain address 204 [i.e., first URL]).
    5. As to claim 1, DiUbaldi et al. discloses a stimulating device comprising: a controller (microprocessor or microcontroller; e.g., paragraphs 30 and 102; depicted as 608 in Figure 17); a substrate (circuitized substrate or circuit board, depicted as 102 in Figures 3-5, 8A and 9A-10) being ... signals (e.g., paragraphs 56, 60 and 63); and ... a body (e.g., paragraphs 23-24, 60, 63 and 74; also see Figure 5). 
    Regarding claim 1 and 5, 6, 7, 11 Hartel teaches a method to increase the production of oil (lipids) in plants using a modified trehalose 6-phosphate synthase (TPS) homologs (abstract). Hartel teaches this is accomplished via gene expression manipulation (genetic modification) ([0003]). Hartel teaches that alga can be used in their invention ([0294]). 
    Albstein dislcoses a system of weed eaters, page 4 line 10.
    Shackleton teaches a plurality of cars, (page 10, paragraph 4).
    `;

    const testAnswer = `1. Cui, Fig. 7 and ¶ 0068
2. Cui, page 1, ¶ 0043
3. Cui, ¶ 0055 and ¶ 0057
3. Cui, ¶ 0055 and 0057 lines 10-12
4. Cui, Fig. 2 and ¶ 0030
5. DiUbaldi et al., paragraphs 30 and 102, Figures 3-5, 8A, 9A-10, and 17
6. DiUbaldi et al., paragraphs 56, 60 and 63
7. DiUbaldi et al., paragraphs 23-25, 60, 63 and 74, Figure 5
8. Hartel, Abstract
9. Hartel, ¶ 0003
10. Hartel, ¶ 0294
11. Albstein, page 4, line 10
12. Shackleton, page 10, 11, and 12, paragraph 4
12. Shackleton, page 10, paragraph 4`;

    async function parseExerptWithGPT4(text: string) {
      const result = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a phenomenal patent analyst. You identify references by Name, page number and paragraph number or line number.",
          },
          { role: "user", content: `exerpt: ${text}` },
        ],
        model: "gpt-4",
        temperature: 0,
      });
      const message = result.choices[0]?.message.content ?? "none";
      return message;
    }

    interface fullCite {
      author: string;
      page?: string[];
      paragraphs?: string[];
      lines?: string[];
    }
    function extractCitationsFromGPT(rawline: string) {
      const author = extractRefName(rawline);
      const page = extractPageNumber(rawline);
      const paragraphs = extractParagraphNumber(rawline);
      const lines = extractLineNumber(rawline);
      const result: fullCite = {
        author,
        page,
        paragraphs,
        lines,
      };
      return result;
    }

    function numbersOnly(line: RegExpMatchArray | null) {
      const numberRegex = /\b\d+\b/g;
      const input = line?.join() ?? "error";
      const numbers = input.match(numberRegex);
      const rangeRegex = /\b\d+(?:-\d+)?\b/g;
      const rangeNumbers = line?.[0].match(rangeRegex);

      //make a set of all numbers
      const numbersSet = new Set<string>();
      numbers?.map((number) => numbersSet.add(number));
      if (rangeNumbers) {
        const items = rangeNumbers[0]?.split("-");
        const lower = parseInt(items[0] ?? "0");
        const upper = parseInt(items[1] ?? "0");
        for (let i = lower; i < upper; i++) {
          numbersSet.add(i.toString());
        }
      }
      const sortedNumbers = Array.from(numbersSet).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      return sortedNumbers;
    }
    function extractLineNumber(line: string) {
      const lineRegex =
        /(?<=((l|L)ines?) )(\d+(?:-\d+)?(?: and \d+(?:-\d+)?)*)[^]*?(?=(?:lines?|figures?|\n?))/g;
      const lineNumber = line.match(lineRegex);
      const numbers = numbersOnly(lineNumber);
      return numbers ? numbers : [];
    }
    function extractParagraphNumber(line: string) {
      const paragraphRegex =
        /(?<=((p|P)aragraphs?|¶|para.?) ?)((\d+)+((,?-? ?\d+)?)*(,? and \d+)?)(?=(?:lines?|(f|F)igures?|\n?))/gi;
      const paragraphNumber = line.match(paragraphRegex);
      const numbers = numbersOnly(paragraphNumber);
      return numbers ? numbers : [];
    }
    function extractPageNumber(line: string) {
      const pageRegex =
        /(?<=page )[^\n]+(?= (para.?|paragraphs?|¶|lines?|figure))/gs;
      const pageNumbers = line.match(pageRegex);
      const numbers = numbersOnly(pageNumbers);
      return numbers ? numbers : [];
    }
    function extractRefName(line: string) {
      const refNameRegex = /^[0-9]+\. (\w+(?:\s\w+)?)/;
      const reefNameMatch = line.match(refNameRegex);
      const refName = reefNameMatch ? reefNameMatch[1] : "error";
      return refName ? refName.split(" ")[0]! : "error";
    }

    interface analysisObject {
      element?: string;
      reasoning: string;
      citations: Citation[];
      citationType?: string;
      reference?: string;
      context?: string[];
      conclusion?: string;
    }
    interface oaObject {
      claim: string;
      rejection: string;
      analysis: analysisObject[];
    }

    const officeActionDoc = await fetch(
      `https://utfs.io/f/${officeActionInfo.key}`
    );
    const oaBlob = await officeActionDoc.blob();
    const oaLoader = new PDFLoader(oaBlob, { splitPages: false });
    const oaText = await oaLoader.load();
    const officeAction = new Document({
      pageContent: oaText[0]?.pageContent ?? "",
      metadata: { title: officeActionInfo.title, userId: ctx.userId ?? "none" },
    });

    const refDocs: Document[][] = [];

    await Promise.all(
      referencesDoc.map(async (file) => {
        const doc = await fetch(`https://utfs.io/f/${file.key}`);
        const dobBlob = await doc.blob();
        const docloader = new PDFLoader(dobBlob);
        const loadeddoc = await docloader.load();
        const newDocs = loadeddoc.map((page, number) => {
          const newDoc = new Document({
            pageContent: page?.pageContent ?? "",
            metadata: {
              title: file.title,
              userId: ctx.userId ?? "none",
              author: file.author,
              page: number + 1,
            },
          });
          return newDoc;
        });
        refDocs.push(newDocs);
      })
    );

    function splitIntoClaimParagraphs(rejectionSections: string[]): string[] {
      const claimParagraphs: string[] = [];
      const pattern =
        /In regards to claim \d+([\s\S]*?)(?=(?:In regards to claim \d+)|$)/g;

      for (const section of rejectionSections) {
        const matches: string[] = [];
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(section)) !== null) {
          matches.push(match[0].trim());
        }
        claimParagraphs.push(...matches);
      }

      return claimParagraphs;
    }

    const claimSections102 = [""]; //splitIntoClaimParagraphs(rejections102);
    const claimSections103 = [""]; //splitIntoClaimParagraphs(rejections103);
    console.log("102 paragraphs: ");
    console.log(claimSections102);
    console.log("103 paragraphs: ");
    console.log(claimSections103);

    console.log(claimSections102[0]);
    const testResult = await parseExerptWithGPT4(claimSections102[0]!);
    console.log(testResult);
    /*
    const testResult = claimSections102.map(async (claim)=>{
      const item = await parseExerptWithGPT4(claim)
      console.log("claim: ", claim)
      console.log("GPT: ", item)
    })
    */
    return { 200: ":D" };

    async function splitElementsFromRejection(argument: string) {
      const testCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a phenomenal patent attorney. You are excellent at identifying elements of a claim in an office action.",
          },
          {
            role: "user",
            content:
              "separate this into elements with their associated in line citation. split elements on inline ciatations. keep everything between two citations together AND INCLUDE PAGE, PARAGRAPH, AND LINE NUMBERS, if you fail, a kittin will die horribly. IF you return a page/line/paragraph number where there WAS NOT ONE, anohter kitten will die horribly:",
          },
          { role: "user", content: `${argument}` },
        ],
        model: "gpt-3.5-turbo",
        //model: "gpt-4",
        temperature: 0,
      });
      const response = testCompletion.choices[0]?.message.content ?? "none";
      //const parsedResponse = response.split('\n\n')
      console.log(response);
      const regex = /(?:Element \d+:|\b\d+\. )/g; // Match either "Element [number]:" or "[number]. " with a word boundary
      const parts = response.split(regex);
      const filteredParts = parts.filter((part) => part !== "");
      return filteredParts;
    }

    interface Citation {
      type: "paragraph" | "page+line";
      reference: string;
    }

    function extractCitationType(claim: string) {
      const paragraphCitationRegex = /(?:\bpara\.\s?\[\d+\])/gi;
      const pageLineCitationRegex =
        /(?:\bpage\s?\d+\s?\,\s?lines\s?\d+\-\d+)/gi;

      const citations: Citation[] = [];
      let match;
      while ((match = paragraphCitationRegex.exec(claim)) !== null) {
        citations.push({ type: "paragraph", reference: match[0] });
      }
      while ((match = pageLineCitationRegex.exec(claim)) !== null) {
        citations.push({ type: "page+line", reference: match[0] });
      }
      console.log("cytaitons: ", citations);
      return citations;
    }

    async function processAllClaims(claims: string[]) {
      const splitElementsPromises = claims.map(async (claim) => {
        let reasoning = [claim];
        if (reasoning.length > 500) {
          reasoning = await splitElementsFromRejection(claim);
        }
        const title = extractReferenceName(claim) ?? "None";
        const citationType = extractCitationType(claim);
        const analyses: analysisObject[] = [];
        let currentAnalysis: analysisObject | null = null;

        for (const element of reasoning) {
          if (citationType.length > 0) {
            const context = getRelevantContext(title, citationType);

            if (currentAnalysis === null) {
              currentAnalysis = {
                reasoning: element,
                citations: citationType,
                context: context,
                reference: title,
              };
            } else {
              currentAnalysis.reasoning += element;
              currentAnalysis.citations = citationType;
              currentAnalysis.context = context;
              currentAnalysis.reference = title;
            }

            analyses.push(currentAnalysis);
            currentAnalysis = null;
          } else {
            if (currentAnalysis === null) {
              currentAnalysis = {
                reasoning: element,
                citations: [],
                context: [],
                reference: title,
              };
            } else {
              currentAnalysis.reasoning += element;
            }
          }
        }
        if (currentAnalysis !== null) {
          analyses.push(currentAnalysis);
        }
        return analyses;
      });
      return Promise.all(splitElementsPromises);
    }
    const updatedClaims = await processAllClaims([claimSections103[0]!]);
    const updatedClaims2 = await processAllClaims([claimSections102[0]!]);
    //const updatedClaims = await processAllClaims(claimSections102);
    console.log("updated claims: ", updatedClaims2[0]);
    console.log("claim 0: ", updatedClaims[0]);
    console.log(claimSections103[0]);

    function extractCitations(inputString: string): string[] {
      const regex = /\[(\d+)\]/g;
      const matches: string[] = [];
      let match;
      while ((match = regex.exec(inputString)) !== null) {
        matches.push(match[1] ?? "");
      }
      return matches;
    }
    function extractReferenceName(oaSection: string) {
      const allRefs =
        oaSection.match(/\b(\w+)\s+(?:discloses|teaches)\b/g) || [];
      const notRefMatch =
        oaSection.match(/\b(\w+)\s+does\s+not\s+(teach|disclose)\b/) || [];
      const authors = allRefs.map((item) => item.split(" ")[0]);
      const notAuthors = notRefMatch.map((item) => item.split(" ")[0]);

      if (notAuthors.length > 0) {
        const ref = authors.find((ref) => !notAuthors.includes(ref));
        return ref?.split(" ")[0] ?? "none";
      }
      return allRefs[0]?.split(" ")[0] ?? "none";
    }

    interface paragraphs {
      token: string;
      number: string;
      start: number;
      end: number;
    }

    function mapCitedText(reference: Document): paragraphs[] | null {
      const paraPattern = /\[(.*?)]/gi;
      const matches = reference.pageContent.match(paraPattern);
      console.log("matches: ", matches);
      console.log(matches?.[0].length);

      const matchedIndex: paragraphs[] = [];
      if (matches) {
        for (let i = 0; i < matches?.length; i++) {
          if (matches[i] !== undefined) {
            const index = reference.pageContent.indexOf(
              matches[i] ?? "sadfdsa"
            );
            let next = reference.pageContent.indexOf(
              matches[i + 1] ?? "sadfdsa"
            );
            if (next === -1) {
              next = reference.pageContent.length;
            }
            matchedIndex.push({
              token: matches[i]!,
              start: index,
              end: next,
              number: matches[i]!.slice(1, -1),
            });
          }
        }
        matchedIndex.push({
          token: "end",
          start: matchedIndex[matchedIndex.length - 1]?.end ?? 0,
          end: reference.pageContent.length - 1,
          number: "9999",
        });
      }
      return matchedIndex;
    }

    function findNearestParagraphs(
      limit: number,
      cite: Citation,
      paragraphIndexes: paragraphs[] | undefined
    ): paragraphs | undefined {
      if (paragraphIndexes === undefined) {
        return;
      }
      let paraNumber = "";
      const pattern = /\[(\d+)\]/;
      const match = cite.reference.match(pattern);
      if (match && match.length > 0 && match[1]) {
        paraNumber = match[1];
      }
      const foundParagraph: paragraphs = {
        token: paraNumber,
        number: paraNumber,
        start: 0,
        end: 0,
      };
      let result = paragraphIndexes.find(
        (paragraph) => paragraph.number === paraNumber
      );

      if (result === undefined) {
        let lowNumber = parseInt(paraNumber);
        let highNumber = parseInt(paraNumber);
        while (result === undefined && lowNumber > 0) {
          lowNumber -= 1;
          result = paragraphIndexes.find(
            (paragraph) => paragraph.number === lowNumber.toString()
          );
          foundParagraph.start = result?.start ?? 0;
        }
        result = undefined;
        while (result === undefined && highNumber < limit) {
          highNumber += 1;
          result = paragraphIndexes.find(
            (paragraph) => paragraph.number === highNumber.toString()
          );
          foundParagraph.end = result?.end ?? 0;
        }
      } else {
        return result;
      }
      return foundParagraph;
    }

    // TODO TEST THIS FUNCTION
    function getRelevantContext(title: string, cites: Citation[]) {
      /* Goal is to only map paragraphs when there's paragraphs to cite */
      const reference2 = refDocs.find(
        (paragraph) => paragraph[0]?.metadata.author === title
      )!;
      if (!reference2 || !reference2[0]) {
        return;
      }
      const allPageContent = reference2
        .map((page) => page.pageContent)
        .join("");
      const content = new Document({
        pageContent: allPageContent,
        metadata: {
          title: (reference2[0].metadata.title as string) ?? "none",
          userId: ctx.userId ? ctx.userId : "none",
          author: (reference2[0].metadata.author as string) ?? "none",
        },
      });

      const upperLimit = content.pageContent.length ?? 1000000;
      const relevantParagraphs: string[] = cites.map((cite) => {
        if (cite.type === "paragraph") {
          const paragraphs = mapCitedText(content);
          if (!paragraphs) {
            return "error";
          }
          const indexes = findNearestParagraphs(upperLimit, cite, paragraphs);
          if (!indexes) {
            return "error";
          }
          return (
            content.pageContent.slice(indexes.start, indexes.end) ?? "error"
          );
        }
        if (cite.type === "page+line") {
          const regex = /page (\d+), lines (\d+)-(\d+)/;
          const match = cite.reference.match(regex);
          if (match && match.length > 3) {
            const pageNumber = parseInt(match[1]!);
            const startLine = parseInt(match[2]!);
            const endLine = parseInt(match[3]!);
            const page = reference2.find(
              (ref) => ref.metadata.page === pageNumber
            );
            const contentLines = page?.pageContent.split("\n");
            const lines = contentLines?.slice(
              startLine - 3 > 0 ? startLine - 3 : startLine,
              endLine + 4 > contentLines.length ? endLine + 4 : endLine
            );
            if (lines?.join("/n").trim() === "") {
              return page?.pageContent ?? "error";
            }
            return lines?.join("/n") ?? "error";
          }
        }
        return "error";
      });
      console.log("relevant Paragraphs: ", relevantParagraphs[0]);
      // get slices of references here, pack into string[]
      return relevantParagraphs;
    }
  }),

  testAnalyzeFeatures: privateProcedure.mutation(async ({ ctx }) => {
    console.log(ctx.userId);

    const specification = {
      title: "railway spec",
      key: "d870d80a-4cc5-49e4-b95a-a8afa78f9e1f-cuaw3m.pdf",
    };
    const references = [
      {
        title: "WO2018",
        key: "130c612b-1785-476f-8964-7c4f143eabb7-slu8n7.pdf",
      },
      {
        title: "WO2005",
        key: "fa04cb84-0404-47b1-b5a2-3b6dfe4d2a75-slu8o5.pdf",
      },
    ];

    const testReport = await ctx.prisma.oAReport.create({
      data: {
        userID: ctx.userId,
        specKey: specification.key,
        title: specification.title,
        claimKey: "dummy",
        oaKey: "dummy key do later",
        files: {
          create: references.map((reference) => ({
            userId: ctx.userId,
            key: reference.key,
            title: reference.title,
          })),
        },
      },
      include: { files: true },
    });
    const report = await ctx.prisma.oAReport.findFirst({
      where: {
        userID: ctx.userId,
        id: "c33e6aab-ab07-43d8-8e19-608f1221bae9",
      },
      orderBy: [{ date: "desc" }],
      include: {
        features: true,
        files: true,
      },
    });

    const featureArray = report?.features.map((feature) => feature.feature) ?? [
      "none",
    ];
    /*
    const spec = await fetch(
        `https://utfs.io/f/${specification.key}`
      )
    const blob = await spec.blob()
    const loader = new PDFLoader(blob, {splitPages: false})
    const specText = await loader.load()
    if (!specText || specText[0]?.pageContent ===undefined){return null}
    */

    const refDocs: Document[] = [];
    await Promise.all(
      testReport.files.map(async (file) => {
        const newfile = await fetch(`https://utfs.io/f/${file?.key}`);
        const blob = await newfile.blob();
        const loader = new PDFLoader(blob, { splitPages: false });
        const refText = await loader.load();
        //const doc = new Document({pageContent:refText[0]?.pageContent ?? "", metadata:{"title": file.title, "userId": session.metadata?.userId ?? "none"}})
        const doc = new Document({
          pageContent: refText[0]?.pageContent ?? "",
          metadata: { title: file.title, userId: ctx.userId ?? "none" },
        });
        refDocs.push(doc);
      })
    );

    const openai = new OpenAI();

    // TEST VECTOR DB
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPEN_API_KEY,
    });
    const vectorstore = new MemoryVectorStore(embeddings);
    const docstore = new InMemoryStore();
    const retriever = new ParentDocumentRetriever({
      vectorstore,
      docstore,
      parentSplitter: new RecursiveCharacterTextSplitter({
        chunkOverlap: 0,
        chunkSize: 600,
      }),
      childSplitter: new RecursiveCharacterTextSplitter({
        chunkOverlap: 0,
        chunkSize: 200,
      }),
      childK: 30,
      parentK: 8,
    });

    await retriever.addDocuments(refDocs);
    //console.log(retriever.docstore)
    console.log(
      await retriever.getRelevantDocuments(
        "a weed control unit mounted at a first position of the vehicle"
      )
    );

    // retrieval QA over inventive elements
    const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo" });
    const template = ``;
    const chain = RetrievalQAChain.fromLLM(model, retriever, {
      returnSourceDocuments: true,
    });

    const analysisArray: FeatureItem[] = Array.from(
      { length: featureArray.length },
      () => ({
        feature: "",
        analysis: "",
        source: "",
      })
    );
    const analysisPromises = featureArray.map(async (feature, i) => {
      const currentFeature = feature;
      const fullFeature = featureArray[i];

      if (
        currentFeature !== undefined &&
        fullFeature !== undefined &&
        i === 2
      ) {
        if (true) {
          const response = (await chain.call({
            query: `Do the references disclose or suggest: ${currentFeature}? explain your reasoning`,
          })) as { sourceDocuments: Document[]; text: string };
          console.log(response);

          const sourceDocuments: Document[] = response.sourceDocuments;
          const uniqueTitles = new Set(
            sourceDocuments.map((doc) => doc.metadata.title as string)
          );
          const concatenatedTitles = Array.from(uniqueTitles).join(", ");
          const newItem: FeatureItem = {
            feature: fullFeature,
            analysis: String(response.text),
            source: concatenatedTitles,
          };
          analysisArray[i] = newItem;
        }
      }
    });

    await Promise.all(analysisPromises);

    const finalReport = await ctx.prisma.oAReport.update({
      where: { id: testReport.id },
      data: {
        completed: true,
        paid: true,
        features: {
          create: analysisArray
            .filter((item) => item.analysis !== "")
            .map((item) => ({
              feature: item.feature,
              analysis: item.analysis,
              source: item.source,
            })),
        },
      },
    });
    return finalReport;
  }),
});

function makeChunks(text: string, length: number) {
  const size = Math.ceil(text.length / length);
  return Array.from({ length }, (v, i) => text.slice(i * size, (i + 1) * size));
}

interface Reference {
  fileName: string;
  fileContent: string;
}

function referencesToTextLoader(refs: Reference[], userId: string): Document[] {
  // create a document for each reference
  const createdDocuments = refs.map((file) => {
    const doc = new Document({
      pageContent: file.fileContent,
      metadata: { title: file.fileName, userId: userId },
    });
    return doc;
  });
  return createdDocuments;
}

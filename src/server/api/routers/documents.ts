import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import OpenAI from "openai";

export const documentRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),
  
  AnalyzeDocs: privateProcedure.input(
    z.object({
      spec: z.object({
        fileName: z.string(),
        fileContent: z.string(),
      }),
      references: z.array(
        z.object({
        fileName: z.string(),
        fileContent: z.string(),
      })),
    })
   )
   .mutation(async ({ ctx, input})=>{
    console.log(ctx.userId)
    console.log("spec: ", input.spec.fileName)
    console.log("references: ", input.references.length)

    const openai = new OpenAI();
    //const featureList = ""
    
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a world-class patent analyst. You are an expert at identifying inventive features in a disclosure." },
        { role: "user", content: "Identify each and every inventive element in the following disclosure, make sure you identify every possible feature but do not repeat yourself." },
        //{ role: "user", content: `Identified features: ${featureList}` },
        { role: "user", content: `Disclosure: ${testText}` }
      ],
      model: "gpt-3.5-turbo",
    });
  
    console.log(completion.choices[0]?.message.content);
   })

});

const testText = `Described herein are lifting devices. The lifting device includes a tube. The tube has a first slot and a second slot. The lifting device also includes an insert having a first insert projection connected to a second insert projection by a central portion. The first insert projection extends through the first slot and the second insert projection extends through the second slot. The lifting device also includes a first plate and a second plate. The first plate and the second plate are each connected to the central portion of the insert. The tube has a longitudinal axis. A plurality of tube apertures are arranged in line with the longitudinal axis. The tube further comprises a first cap at a first end of the tube and a second cap at a second end of the tube. The tube has a circumference, and the first insert projection extends out of the tube at 0 degrees and the second insert projection extends out of the tube at 180 degrees. A length of the second slot is greater than a length of the first slot. The first insert projection and the second insert projection are on a same plane. The first insert projection, the second insert projection, and the central portion of the insert together are an integral structure. A width of the first insert projection, a width of the central portion of the insert, and a width of the second insert projection are substantially the same. The first insert projection includes an aperture, the central portion of the insert includes a plurality of apertures, and the first foot and the second foot each include an aperture. The second insert projection may further include a first foot and a second foot. The first plate and the second plate are each connected to the tube. The first plate and the second plate may each extend from a surface of the second insert projection to an internal surface of the tube. The first plate and the second plate may be welded to the tube and welded to at least a portion of the insert. Each of the first plate and the second plate are substantially rectangular with at least one angled side, wherein the at least one angled side of the first plate and the at least one angled side of the second plate are each connected to the central portion of the insert. Each of the first plate and the second plate are thinner than the second insert projection. Each of the tube, the insert, the first plate, and the second plate include a non-sparking metal. The non-sparking metal may be aluminum. The lifting device may be configured to support a weight of at least 60,000 pounds. The lifting device may be configured to support a working load of at least 15,000 pounds.`

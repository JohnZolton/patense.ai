import { Pinecone } from "@pinecone-database/pinecone";      

export const pinecone = new Pinecone({
	environment: "us-east-1-aws",      
	apiKey: process.env.PINECONE_API_KEY!,      
});      
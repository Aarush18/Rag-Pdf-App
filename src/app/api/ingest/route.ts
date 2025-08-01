import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";

import path from "path";
import { config } from "dotenv";

config(); // Load env variables

async function run() {
    const file = path.join(process.cwd(), "HarryPotterSorcererStone.pdf");
    const loader = new PDFLoader(file);
    const docs = await loader.load();

    // Log the number of documents loaded
    console.log("✅ Documents loaded:", docs.length);

    const text_splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    // Split the documents into chunks
    const splitDocs = await text_splitter.splitDocuments(docs);
    console.log("✅ Documents split into chunks:", splitDocs.length);

    // Create embeddings with API key
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Store embeddings in Qdrant under the correct collection
    const client = new QdrantClient({ url: "http://localhost:6335" });

    await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
        client,
        collectionName: "harry_potter_sorcerer_stone", // <-- Use the collection that exists in your Qdrant
    });
    console.log("🎉 Indexing complete! Stored in Qdrant.");
}

run().catch((err) => console.error("❌ Error in ingestion:", err));

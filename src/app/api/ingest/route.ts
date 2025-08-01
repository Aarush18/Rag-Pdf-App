import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";
import path from "path";
import { config } from "dotenv";
import fs from "fs";

// Load environment variables
config();

async function run() {
  // 🛑 Prevent running on production environments like Vercel
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Ingestion should not run in production.");
    return;
  }

  // 📄 Local PDF file path
  const filePath = path.join(process.cwd(), "HarryPotterSorcererStone.pdf");

  if (!fs.existsSync(filePath)) {
    console.error("❌ PDF file not found at:", filePath);
    return;
  }

  // 1. Load the PDF
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  console.log("✅ Documents loaded:", docs.length);

  // 2. Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocs = await splitter.splitDocuments(docs);
  console.log("✅ Documents split into chunks:", splitDocs.length);

  // 3. Generate embeddings
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // 4. Connect to Qdrant and store
  const client = new QdrantClient({ url: "http://localhost:6335" });

  await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
    client,
    collectionName: "harry_potter_sorcerer_stone",
  });

  console.log("🎉 Indexing complete! Stored in Qdrant.");
}

// Execute
run().catch((err) => console.error("❌ Error in ingestion:", err));

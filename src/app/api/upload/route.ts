import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";

config();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tempFilename = `${Date.now()}-${file.name}`;
    const tempPath = path.join("/tmp", tempFilename);
    await writeFile(tempPath, buffer);

    const loader = new PDFLoader(tempPath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-ada-002",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const client = new QdrantClient({ url: "http://localhost:6335" });

    const rawName = file.name.replace(".pdf", "").toLowerCase().replace(/\s+/g, "_");
    const collectionName = `${rawName}_${uuidv4().slice(0, 8)}`;

    // ✅ MANUAL BATCHING
    const batchSize = 25;
    for (let i = 0; i < splitDocs.length; i += batchSize) {
      const chunk = splitDocs.slice(i, i + batchSize);
      await QdrantVectorStore.fromDocuments(chunk, embeddings, {
        client,
        collectionName,
      });
      console.log(`✅ Indexed batch ${i / batchSize + 1}`);
    }

    return NextResponse.json({ message: "Upload complete", collectionName });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

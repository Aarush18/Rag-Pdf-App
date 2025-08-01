import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { OpenAI } from "openai";
import { config } from "dotenv";

config(); // Load env variables

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { query, collectionName } = await request.json();

    if (!query || !collectionName) {
      return NextResponse.json({ error: "Query or collection name missing" }, { status: 400 });
    }

    const cleanedQuery = query.trim().toLowerCase().slice(0, 500);

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-ada-002",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const client = new QdrantClient({ url: "http://localhost:6335" });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      client,
      collectionName, // ✅ use dynamic collection!
    });

    const results = await vectorStore.similaritySearch(cleanedQuery, 3);

    console.log(`🔍 Results from collection: ${collectionName} →`, results.length);

    const context = results
      .map((res, i) => `Result ${i + 1}:\n${res.pageContent}\n`)
      .join("\n");

    const SYSTEM_PROMPT = `
You are a helpful assistant answering questions strictly based on the context extracted from a PDF uploaded by the user.
If the question is unrelated to the provided content, reply with:
"I don't know the answer to that question, please ask something related to the uploaded document."

Context:\n\n${context}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    });

    const answer = response.choices[0]?.message?.content || "❌ No answer returned.";

    return NextResponse.json({ answer });

  } catch (error) {
    console.error("❌ Error in /api/query:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

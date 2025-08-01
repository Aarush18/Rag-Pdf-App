"use client";

import { useState, useEffect } from "react";
import UploadModal from "@/components/UploadModal";
import { motion, AnimatePresence } from "framer-motion";

// Sleek Navbar Component
function Navbar() {
  return (
    <nav className="w-full fixed top-0 left-0 z-20 bg-gradient-to-r from-black via-zinc-900 to-black shadow-lg border-b border-purple-900">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-2xl font-extrabold text-purple-400 tracking-wide glow">✨ PDF Sage </span>
        <div className="flex items-center gap-6">
          <a href="#" className="text-zinc-300 hover:text-purple-400 transition font-medium">Home</a>
          <a href="#" className="text-zinc-300 hover:text-purple-400 transition font-medium">Docs</a>
          <a href="#" className="text-zinc-300 hover:text-purple-400 transition font-medium">About</a>
        </div>
      </div>
      <style>{`
        .glow {
          text-shadow: 0 0 8px #a855f7, 0 0 16px #a855f7;
        }
      `}</style>
    </nav>
  );
}

export default function ChatUI() {
  const [collection, setCollection] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState([
    { type: "ai", text: "Welcome! Ask me anything from your uploaded PDF." },
  ]);
  const [input, setInput] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("pdfsage_messages");
    const savedInput = localStorage.getItem("pdfsage_input");
    const savedCollection = localStorage.getItem("pdfsage_collection");
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedInput) setInput(savedInput);
    if (savedCollection) setCollection(savedCollection);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("pdfsage_messages", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    localStorage.setItem("pdfsage_input", input);
  }, [input]);
  useEffect(() => {
    localStorage.setItem("pdfsage_collection", collection);
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input, collectionName: collection }),
    });

    const data = await res.json();
    const aiMsg = { type: "ai", text: data.answer };
    setMessages((prev) => [...prev, aiMsg]);
  };

  return (
    <>
      <Navbar />
      {showModal && (
        <UploadModal
          onUploaded={(collectionName) => {
            setCollection(collectionName);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="flex h-screen bg-gradient-to-tr from-[#1a102a] via-[#2d1847] to-[#0f0f1f] text-white font-[Poppins] overflow-hidden pt-20">
        {/* Sidebar */}
        <aside className="w-80 bg-gradient-to-b from-black/60 via-zinc-900/70 to-black/80 backdrop-blur-xl p-8 border-r border-purple-900 hidden sm:flex flex-col shadow-xl rounded-r-3xl">
          <h2 className="text-2xl font-bold mb-10 text-purple-300 tracking-wide">Sidebar</h2>
          <nav className="space-y-8 text-base text-zinc-300">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-purple-900/40 transition font-semibold shadow-md border border-purple-800"
            >
              <span className="text-purple-400 text-xl">📄</span>
              <span>Upload PDF</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-purple-900/40 transition font-semibold shadow-md border border-purple-800 cursor-pointer">
              <span className="text-purple-400 text-xl">💬</span>
              <span>My Chats</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-purple-900/40 transition font-semibold shadow-md border border-purple-800 cursor-pointer">
              <span className="text-purple-400 text-xl">⚙️</span>
              <span>Settings</span>
            </div>
          </nav>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col relative z-10">
          {collection && (
            <div className="border-b border-purple-900 p-6 bg-black/30 backdrop-blur-lg text-purple-300 font-semibold text-lg shadow-lg">
              Chatting with: <span className="text-white">{collection}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-16 space-y-10 bg-transparent">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className={`max-w-2xl px-6 py-8 rounded-3xl backdrop-blur-xl shadow-2xl border-2 ${
                    msg.type === "user"
                      ? "ml-auto bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 border-purple-500"
                      : "bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100 border-zinc-700"
                  }`}
                  style={{
                    fontSize: "1.35rem",
                    letterSpacing: "0.01em",
                    boxShadow: "0 4px 32px 0 rgba(168,85,247,0.15)",
                  }}
                >
                  {msg.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-purple-900 p-8 bg-black/40 backdrop-blur-lg"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-6">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write your text here..."
                className="flex-1 resize-none rounded-2xl bg-zinc-900 text-white p-5 text-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
                style={{ fontFamily: "Poppins" }}
              />
              <button
                type="submit"
                disabled={!collection}
                className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-4 px-10 rounded-2xl disabled:opacity-50 shadow-lg font-bold text-xl transition-all duration-200"
              >
                Send
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

"use client";
import { useRef, useState } from "react";

export default function UploadModal({
  onUploaded,
  onClose,
}: {
  onUploaded: (collection: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!inputRef.current?.files?.[0]) return;

    const formData = new FormData();
    formData.append("file", inputRef.current.files[0]);

    setUploading(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (data.collectionName) {
      onUploaded(data.collectionName);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#2d1847] via-[#1a102a] to-[#0f0f1f] p-16 rounded-3xl shadow-2xl border-2 border-purple-900 w-[35vw] max-w-[700px] space-y-8 relative">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-extrabold text-purple-300 tracking-wide glow">
            📄 Upload a PDF
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-purple-300 transition-colors duration-200 text-sm"
          >
            ❌
          </button>
        </div>

        <input
          type="file"
          accept="application/pdf"
          ref={inputRef}
          className="text-white file:cursor-pointer file:rounded-md file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm hover:file:bg-purple-700 transition-all duration-200"
        />

        <button
          onClick={handleUpload}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl w-full transition-all duration-200 flex items-center justify-center"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="4" />
              </svg>
              Uploading...
            </>
          ) : (
            "Upload & Process"
          )}
        </button>

        {/* 🟡 Uploading Message */}
        {uploading && (
          <div className="text-yellow-400 text-sm mt-2 text-center">
            ⏳ Hold on! This might take a while...
          </div>
        )}
      </div>
    </div>
  );
}

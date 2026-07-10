"use client";

import React, { useRef, useState } from "react";
import { ArrowDownToLine, X, CheckCircle, Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

interface FileUploadProps {
  label: string;
  required?: boolean;
  accept?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export const FileUpload = ({
  label,
  required = false,
  accept = "image/jpeg,image/png,image/heic,image/webp",
  value,
  onChange,
  className = "",
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB");
      return;
    }

    setError(null);
    setUploading(true);

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url;
      if (url) {
        setPreview(url);
        onChange(url);
      } else {
        throw new Error("No URL returned");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Upload failed";
      setError(msg);
      setPreview(null);
      onChange(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35 leading-none">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {preview && !uploading ? (
        <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <img
            src={preview}
            alt={label}
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-black/60 border border-white/[0.1] text-white/70 hover:text-white hover:bg-red-500/60 transition-all"
            >
              <X size={14} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/[0.1]">
            <CheckCircle size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-medium">Uploaded</span>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-3 p-4 rounded-xl border border-dashed transition-all cursor-pointer ${
            error
              ? "border-red-500/30 bg-red-500/[0.03] hover:bg-red-500/[0.05]"
              : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.12]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className={`p-2.5 rounded-xl border ${error ? "bg-red-500/10 border-red-500/10" : "bg-blue-500/10 border-blue-500/10"}`}>
            {uploading ? (
              <Loader2 size={18} className="text-blue-400 animate-spin" />
            ) : (
              <ArrowDownToLine size={18} className={error ? "text-red-400" : "text-blue-400"} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/60">
              {uploading ? "Uploading..." : error || "Click to upload or drag & drop"}
            </p>
            <p className="text-[10px] text-white/25 mt-0.5">JPG, PNG, HEIC, WEBP up to 10 MB</p>
          </div>
        </div>
      )}
    </div>
  );
};

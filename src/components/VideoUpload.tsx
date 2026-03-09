import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Film } from "lucide-react";

interface VideoUploadProps {
  onVideoSelected: (file: File) => void;
  isProcessing: boolean;
}

export function VideoUpload({ onVideoSelected, isProcessing }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) onVideoSelected(file);
  }, [onVideoSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onVideoSelected(file);
  }, [onVideoSelected]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("video-input")?.click()}
    >
      <input
        id="video-input"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          {isDragging ? <Film className="w-8 h-8 text-primary" /> : <Upload className="w-8 h-8 text-primary" />}
        </div>
        <div>
          <p className="text-foreground font-heading font-semibold text-lg">
            {isDragging ? "Drop video here" : "Upload a video"}
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Drag & drop or click to browse · MP4, WebM, MOV
          </p>
        </div>
      </div>
    </motion.div>
  );
}

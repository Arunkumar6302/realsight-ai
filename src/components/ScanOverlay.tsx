import { motion } from "framer-motion";
import { Scan } from "lucide-react";

interface ScanOverlayProps {
  progress: number;
  currentFrame: number;
  totalFrames: number;
}

export function ScanOverlay({ progress, currentFrame, totalFrames }: ScanOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-primary glow-primary"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />

      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-primary opacity-60" />
      <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-primary opacity-60" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-primary opacity-60" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-primary opacity-60" />

      {/* Status */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 border border-primary/30 rounded-md px-4 py-2 flex items-center gap-2">
        <Scan className="w-4 h-4 text-primary animate-pulse-glow" />
        <span className="font-mono text-xs text-primary">
          SCANNING {currentFrame}/{totalFrames} · {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
        <motion.div
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

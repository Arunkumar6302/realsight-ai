import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FrameAnalysis } from "@/components/ResultsDisplay";

const FRAMES_TO_ANALYZE = 6;

export function useVideoAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [results, setResults] = useState<FrameAnalysis[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const extractFrame = useCallback((video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve) => {
      video.currentTime = time;
      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.min(video.videoWidth, 640);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
    });
  }, []);

  const analyzeVideo = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setCurrentFrame(0);

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.preload = "auto";
    videoRef.current = video;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    const duration = video.duration;
    const framesToAnalyze = Math.min(FRAMES_TO_ANALYZE, Math.max(1, Math.floor(duration)));
    setTotalFrames(framesToAnalyze);

    const interval = duration / (framesToAnalyze + 1);

    for (let i = 0; i < framesToAnalyze; i++) {
      setCurrentFrame(i + 1);
      const time = interval * (i + 1);

      try {
        const dataUrl = await extractFrame(video, time);
        const base64 = dataUrl.split(",")[1];
        const thumbnail = dataUrl;

        const { data, error } = await supabase.functions.invoke("analyze-frame", {
          body: { imageBase64: base64, frameIndex: i + 1 },
        });

        if (error) {
          console.error("Frame analysis error:", error);
          toast.error(`Frame ${i + 1} analysis failed`);
          continue;
        }

        if (data?.error) {
          toast.error(data.error);
          if (data.error.includes("Rate limit") || data.error.includes("Payment")) break;
          continue;
        }

        const analysis = data.analysis;
        setResults(prev => [...prev, {
          frameIndex: i + 1,
          faces: analysis.faces || [],
          frameAnalysis: analysis.frameAnalysis || "",
          thumbnail,
        }]);
      } catch (err) {
        console.error("Error analyzing frame:", err);
        toast.error(`Error on frame ${i + 1}`);
      }

      setProgress(((i + 1) / framesToAnalyze) * 100);
    }

    setIsProcessing(false);
    toast.success("Analysis complete!");
  }, [extractFrame]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setCurrentFrame(0);
    setTotalFrames(0);
    setResults([]);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
  }, [videoUrl]);

  return { isProcessing, progress, currentFrame, totalFrames, results, videoUrl, analyzeVideo, reset };
}

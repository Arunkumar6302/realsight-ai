import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, CameraOff, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FrameResult {
  verdict: "REAL" | "FAKE" | "ANALYZING" | "NO_FACE";
  confidence: number;
  explanation: string;
}

const ANALYSIS_INTERVAL_MS = 3000; // analyze every 3 seconds

export function WebcamCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<FrameResult | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
      setCurrentResult(null);
      setFrameCount(0);
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access webcam. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsAnalyzing(false);
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = Math.min(video.videoWidth || 640, 640);
    canvas.height = Math.round(canvas.width * ((video.videoHeight || 480) / (video.videoWidth || 640)));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (isAnalyzing || !isStreaming) return;

    const dataUrl = captureFrame();
    if (!dataUrl) return;

    setIsAnalyzing(true);
    const base64 = dataUrl.split(",")[1];

    try {
      const { data, error } = await supabase.functions.invoke("analyze-frame", {
        body: { imageBase64: base64, frameIndex: frameCount + 1 },
      });

      if (error) {
        console.error("Analysis error:", error);
        setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: "Analysis failed" });
        return;
      }

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Rate limit reached. Slowing down...");
        }
        setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: data.error });
        return;
      }

      const analysis = data.analysis;
      const faces = analysis?.faces || [];

      if (faces.length === 0) {
        setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: analysis?.frameAnalysis || "No face detected" });
      } else {
        const primary = faces[0];
        setCurrentResult({
          verdict: primary.verdict,
          confidence: primary.confidence,
          explanation: primary.explanation,
        });
      }

      setFrameCount((c) => c + 1);
    } catch (err) {
      console.error("Frame analysis error:", err);
      setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: "Network error" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isStreaming, captureFrame, frameCount]);

  // Start/stop analysis interval when streaming changes
  useEffect(() => {
    if (isStreaming) {
      // Run first analysis after a short delay
      const timeout = setTimeout(() => analyzeFrame(), 1000);
      intervalRef.current = setInterval(() => analyzeFrame(), ANALYSIS_INTERVAL_MS);
      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const verdictColor =
    currentResult?.verdict === "REAL"
      ? "text-success"
      : currentResult?.verdict === "FAKE"
        ? "text-destructive"
        : "text-muted-foreground";

  const verdictBorder =
    currentResult?.verdict === "REAL"
      ? "border-success/40"
      : currentResult?.verdict === "FAKE"
        ? "border-destructive/40"
        : "border-border";

  return (
    <div className="space-y-4">
      {/* Video feed */}
      <div className={`relative rounded-xl overflow-hidden border ${verdictBorder} bg-card`}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full max-h-[400px] object-contain bg-background"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Live result overlay */}
        {isStreaming && currentResult && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="bg-card/90 border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              {currentResult.verdict === "REAL" && <ShieldCheck className="w-5 h-5 text-success" />}
              {currentResult.verdict === "FAKE" && <ShieldAlert className="w-5 h-5 text-destructive" />}
              {currentResult.verdict === "NO_FACE" && <AlertTriangle className="w-5 h-5 text-warning" />}
              {currentResult.verdict === "ANALYZING" && <Camera className="w-5 h-5 text-primary animate-pulse" />}

              <span className={`font-mono text-sm font-bold ${verdictColor}`}>
                {currentResult.verdict === "NO_FACE" ? "NO FACE" : currentResult.verdict}
              </span>

              {currentResult.confidence > 0 && (
                <span className="font-mono text-xs text-muted-foreground">
                  {Math.round(currentResult.confidence * 100)}%
                </span>
              )}
            </div>

            {isAnalyzing && (
              <div className="bg-card/90 border border-primary/30 rounded-lg px-3 py-2">
                <span className="font-mono text-xs text-primary animate-pulse">SCANNING...</span>
              </div>
            )}
          </div>
        )}

        {/* Placeholder when camera is off */}
        {!isStreaming && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Click "Start Camera" to begin live detection</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isStreaming ? (
          <Button onClick={startCamera} className="flex-1">
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="destructive" className="flex-1">
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Current result detail */}
      {currentResult && currentResult.verdict !== "ANALYZING" && (
        <div className={`rounded-xl border p-4 ${
          currentResult.verdict === "FAKE"
            ? "border-destructive/40 bg-destructive/5"
            : currentResult.verdict === "REAL"
              ? "border-success/40 bg-success/5"
              : "border-border bg-card"
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {currentResult.verdict === "REAL" && <ShieldCheck className="w-8 h-8 text-success" />}
            {currentResult.verdict === "FAKE" && <ShieldAlert className="w-8 h-8 text-destructive" />}
            {currentResult.verdict === "NO_FACE" && <AlertTriangle className="w-8 h-8 text-warning" />}
            <div>
              <h3 className={`text-lg font-heading font-bold ${verdictColor}`}>
                {currentResult.verdict === "FAKE" ? "Deepfake Detected" : currentResult.verdict === "REAL" ? "Appears Authentic" : "No Face Detected"}
              </h3>
              {currentResult.confidence > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden w-32">
                    <div
                      className={`h-full rounded-full ${currentResult.verdict === "FAKE" ? "bg-destructive" : "bg-success"}`}
                      style={{ width: `${currentResult.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {Math.round(currentResult.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{currentResult.explanation}</p>
          <p className="text-xs text-muted-foreground mt-2 font-mono">Frames analyzed: {frameCount}</p>
        </div>
      )}
    </div>
  );
}

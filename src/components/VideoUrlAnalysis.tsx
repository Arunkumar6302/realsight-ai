import { useRef, useState, useCallback, useEffect } from "react";
import { Link2, Play, Square, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FrameResult {
  verdict: "REAL" | "FAKE" | "NO_FACE";
  confidence: number;
  explanation: string;
}

const ANALYSIS_INTERVAL_MS = 3000;

export function VideoUrlAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [url, setUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<FrameResult | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState("");

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = Math.min(video.videoWidth || 640, 640);
    canvas.height = Math.round(canvas.width * ((video.videoHeight || 480) / (video.videoWidth || 640)));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (isAnalyzing) return;

    const dataUrl = captureFrame();
    if (!dataUrl) return;

    setIsAnalyzing(true);
    const base64 = dataUrl.split(",")[1];

    try {
      const { data, error: fnError } = await supabase.functions.invoke("analyze-frame", {
        body: { imageBase64: base64, frameIndex: frameCount + 1 },
      });

      if (fnError) {
        console.error("Analysis error:", fnError);
        setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: "Analysis failed" });
        return;
      }

      if (data?.error) {
        if (data.error.includes("Rate limit")) toast.error("Rate limit reached. Slowing down...");
        setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: data.error });
        return;
      }

      const analysis = data.analysis;
      const faces = analysis?.faces || [];

      if (faces.length === 0) {
        setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: analysis?.frameAnalysis || "No face detected" });
      } else {
        setCurrentResult({
          verdict: faces[0].verdict,
          confidence: faces[0].confidence,
          explanation: faces[0].explanation,
        });
      }

      setFrameCount((c) => c + 1);
    } catch (err) {
      console.error("Frame analysis error:", err);
      setCurrentResult({ verdict: "NO_FACE", confidence: 0, explanation: "Network error" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame, frameCount]);

  const startAnalysis = useCallback(() => {
    if (!url.trim()) {
      setError("Please enter a video URL");
      return;
    }
    setError("");
    setCurrentResult(null);
    setFrameCount(0);
    setIsPlaying(true);
  }, [url]);

  const stopAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setIsAnalyzing(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  // Start interval when playing
  useEffect(() => {
    if (isPlaying) {
      const timeout = setTimeout(() => analyzeFrame(), 1500);
      intervalRef.current = setInterval(() => analyzeFrame(), ANALYSIS_INTERVAL_MS);
      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => stopAnalysis();
  }, [stopAnalysis]);

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
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="Paste a direct video URL (MP4, WebM...)"
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/60"
            disabled={isPlaying}
          />
        </div>
        {!isPlaying ? (
          <Button onClick={startAnalysis} disabled={!url.trim()}>
            <Play className="w-4 h-4 mr-2" />
            Analyze
          </Button>
        ) : (
          <Button onClick={stopAnalysis} variant="destructive">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Video player */}
      {isPlaying && (
        <div className={`relative rounded-xl overflow-hidden border ${verdictBorder} bg-card`}>
          <video
            ref={videoRef}
            src={url}
            autoPlay
            muted
            playsInline
            crossOrigin="anonymous"
            className="w-full max-h-[400px] object-contain bg-background"
            onError={() => {
              toast.error("Failed to load video. Make sure the URL points directly to a video file.");
              stopAnalysis();
            }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Result overlay */}
          {currentResult && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="bg-card/90 border border-border rounded-lg px-3 py-2 flex items-center gap-2">
                {currentResult.verdict === "REAL" && <ShieldCheck className="w-5 h-5 text-success" />}
                {currentResult.verdict === "FAKE" && <ShieldAlert className="w-5 h-5 text-destructive" />}
                {currentResult.verdict === "NO_FACE" && <AlertTriangle className="w-5 h-5 text-warning" />}

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
        </div>
      )}

      {/* Placeholder when not playing */}
      {!isPlaying && (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-20 text-center">
          <Link2 className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Paste a direct video URL above to begin analysis</p>
          <p className="text-muted-foreground text-xs mt-1">Supports MP4, WebM, and other browser-compatible formats</p>
        </div>
      )}

      {/* Result detail */}
      {currentResult && currentResult.verdict !== "NO_FACE" && (
        <div className={`rounded-xl border p-4 ${
          currentResult.verdict === "FAKE"
            ? "border-destructive/40 bg-destructive/5"
            : "border-success/40 bg-success/5"
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {currentResult.verdict === "REAL" && <ShieldCheck className="w-8 h-8 text-success" />}
            {currentResult.verdict === "FAKE" && <ShieldAlert className="w-8 h-8 text-destructive" />}
            <div>
              <h3 className={`text-lg font-heading font-bold ${verdictColor}`}>
                {currentResult.verdict === "FAKE" ? "Deepfake Detected" : "Appears Authentic"}
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

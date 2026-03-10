import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { VideoUpload } from "@/components/VideoUpload";
import { ScanOverlay } from "@/components/ScanOverlay";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { useVideoAnalysis } from "@/hooks/useVideoAnalysis";
import { Button } from "@/components/ui/button";

type View = "hero" | "analyze";

const Index = () => {
  const [view, setView] = useState<View>("hero");
  const { isProcessing, progress, currentFrame, totalFrames, results, videoUrl, analyzeVideo, reset } = useVideoAnalysis();
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const handleReset = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {view === "hero" ? (
          <div key="hero">
            <HeroSection onGetStarted={() => setView("analyze")} />
          </div>
        ) : (
          <div
            key="analyze"
            className="max-w-4xl mx-auto px-4 py-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => { handleReset(); setView("hero"); }}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-heading font-bold text-foreground">
                    Real-Time Deepfake Detection
                  </h1>
                  <p className="text-sm text-muted-foreground">Video Face Analysis</p>
                </div>
              </div>
              {(videoUrl || results.length > 0) && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              )}
            </div>

            {/* Upload or Video Player */}
            {!videoUrl ? (
              <VideoUpload onVideoSelected={analyzeVideo} isProcessing={isProcessing} />
            ) : (
              <div className="space-y-6">
                {/* Video with scan overlay */}
                <div className="relative rounded-xl overflow-hidden border border-border bg-card">
                  <video
                    ref={videoPlayerRef}
                    src={videoUrl}
                    controls={!isProcessing}
                    className="w-full max-h-[400px] object-contain bg-background"
                  />
                  {isProcessing && (
                    <ScanOverlay
                      progress={progress}
                      currentFrame={currentFrame}
                      totalFrames={totalFrames}
                    />
                  )}
                </div>

                {/* Results */}
                <ResultsDisplay results={results} isProcessing={isProcessing} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

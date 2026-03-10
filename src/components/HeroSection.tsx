import { Shield, Upload, Cpu, BarChart3, Camera } from "lucide-react";

const features = [
  { icon: Upload, title: "Upload Video", desc: "Drop any video file for analysis" },
  { icon: Camera, title: "Live Webcam", desc: "Real-time detection from your camera" },
  { icon: Cpu, title: "AI Detection", desc: "Frame-by-frame deepfake analysis" },
  { icon: BarChart3, title: "Detailed Results", desc: "Confidence scores & explanations" },
];

interface HeroSectionProps {
  onGetStarted: () => void;
  onLiveDetection: () => void;
}

export function HeroSection({ onGetStarted, onLiveDetection }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 text-center max-w-3xl">
        <div className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Shield className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight mb-4 text-foreground">
          Real-Time Deepfake Face from Video
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
          AI-powered deepfake detection. Upload a video or use your webcam for real-time face authenticity analysis.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-primary text-primary-foreground font-heading font-semibold rounded-lg text-lg tracking-wide hover:bg-primary/90 transition-colors"
          >
            Upload Video
          </button>
          <button
            onClick={onLiveDetection}
            className="px-8 py-4 bg-card border border-primary/30 text-primary font-heading font-semibold rounded-lg text-lg tracking-wide hover:bg-primary/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Webcam
            </span>
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-card border border-border rounded-xl p-5 text-center hover:border-primary/30 transition-colors"
          >
            <f.icon className="w-7 h-7 text-primary mx-auto mb-2" />
            <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

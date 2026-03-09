import { motion } from "framer-motion";
import { Shield, Upload, Cpu, BarChart3 } from "lucide-react";

const features = [
  { icon: Upload, title: "Upload Video", desc: "Drop any video file for analysis" },
  { icon: Cpu, title: "AI Detection", desc: "Frame-by-frame deepfake analysis" },
  { icon: BarChart3, title: "Detailed Results", desc: "Confidence scores & explanations" },
];

export function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(185 80% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(185 80% 50%) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-3xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto mb-8 w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center glow-primary"
        >
          <Shield className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight mb-4">
          <span className="text-foreground">Deep</span>
          <span className="text-primary text-glow-primary">Guard</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
          AI-powered deepfake detection. Upload any video and get real-time face authenticity analysis with confidence scoring.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGetStarted}
          className="px-8 py-4 bg-primary text-primary-foreground font-heading font-semibold rounded-lg glow-primary text-lg tracking-wide hover:bg-primary/90 transition-colors"
        >
          Analyze a Video
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative z-10 mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.15 }}
            className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-colors"
          >
            <f.icon className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-heading font-semibold text-foreground mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

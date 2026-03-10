import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

export interface FaceResult {
  faceId: number;
  verdict: "REAL" | "FAKE";
  confidence: number;
  explanation: string;
}

export interface FrameAnalysis {
  frameIndex: number;
  faces: FaceResult[];
  frameAnalysis: string;
  thumbnail?: string;
}

interface ResultsDisplayProps {
  results: FrameAnalysis[];
  isProcessing: boolean;
}

export function ResultsDisplay({ results, isProcessing }: ResultsDisplayProps) {
  if (results.length === 0 && !isProcessing) return null;

  const allFaces = results.flatMap(r => r.faces);
  const realCount = allFaces.filter(f => f.verdict === "REAL").length;
  const fakeCount = allFaces.filter(f => f.verdict === "FAKE").length;
  const avgConfidence = allFaces.length > 0
    ? allFaces.reduce((sum, f) => sum + f.confidence, 0) / allFaces.length
    : 0;

  const overallVerdict = fakeCount > realCount ? "FAKE" : "REAL";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary */}
      {allFaces.length > 0 && (
        <div className={`rounded-xl border p-6 ${
          overallVerdict === "FAKE"
            ? "border-destructive/40 bg-destructive/5"
            : "border-success/40 bg-success/5"
        }`}>
          <div className="flex items-center gap-4">
            {overallVerdict === "FAKE" ? (
              <ShieldAlert className="w-12 h-12 text-destructive" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-success" />
            )}
            <div>
              <h2 className={`text-2xl font-heading font-bold ${
                overallVerdict === "FAKE" ? "text-destructive" : "text-success"
              }`}>
                {overallVerdict === "FAKE" ? "Deepfake Detected" : "Appears Authentic"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {results.length} frames analyzed · {allFaces.length} faces detected · {Math.round(avgConfidence * 100)}% avg confidence
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Stat label="Real Faces" value={realCount} color="text-success" />
            <Stat label="Fake Faces" value={fakeCount} color="text-destructive" />
            <Stat label="Confidence" value={`${Math.round(avgConfidence * 100)}%`} color="text-primary" />
          </div>
        </div>
      )}

      {/* Frame-by-frame results */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-foreground text-lg">Frame Analysis</h3>
        {results.map((result, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-start gap-4">
              {result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt={`Frame ${result.frameIndex}`}
                  className="w-24 h-16 object-cover rounded border border-border"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    FRAME #{result.frameIndex}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {result.faces.length} face(s)
                  </span>
                </div>

                {result.faces.length === 0 ? (
                  <div className="flex items-center gap-2 text-warning text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>No faces detected in this frame</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.faces.map((face) => (
                      <div key={face.faceId} className="flex items-start gap-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold ${
                          face.verdict === "FAKE"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-success/20 text-success"
                        }`}>
                          {face.verdict}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  face.verdict === "FAKE" ? "bg-destructive" : "bg-success"
                                }`}
                                style={{ width: `${face.confidence * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {Math.round(face.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{face.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.frameAnalysis && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{result.frameAnalysis}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-background/50 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

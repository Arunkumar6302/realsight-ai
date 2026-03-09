import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, frameIndex } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert deepfake detection AI. Analyze the provided image frame from a video and determine if the face(s) shown appear to be real or AI-generated/manipulated (deepfake).

For each face detected, provide:
1. A verdict: "REAL" or "FAKE"
2. A confidence score from 0.0 to 1.0
3. A brief explanation of why you made this determination

Look for these deepfake indicators:
- Unnatural skin texture or lighting inconsistencies
- Asymmetric facial features
- Blurring around face boundaries
- Inconsistent eye reflections
- Unnatural hair-face boundaries
- Warping artifacts
- Temporal inconsistencies in expressions

Respond ONLY with valid JSON in this exact format:
{
  "faces": [
    {
      "faceId": 1,
      "verdict": "REAL" or "FAKE",
      "confidence": 0.0 to 1.0,
      "explanation": "Brief explanation of detection reasoning"
    }
  ],
  "frameAnalysis": "Overall frame quality assessment"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze frame #${frameIndex} from a video for deepfake detection. Examine all visible faces carefully.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let analysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysisResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { faces: [], frameAnalysis: "Could not parse analysis" };
    } catch {
      analysisResult = { faces: [], frameAnalysis: content };
    }

    return new Response(JSON.stringify({ success: true, analysis: analysisResult, frameIndex }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-frame error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

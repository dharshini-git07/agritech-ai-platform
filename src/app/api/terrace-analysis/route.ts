import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

function cleanJsonText(text: string): string {
  let cleaned = text.trim();

  // Remove markdown formatting
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // Extract exactly the JSON object boundaries
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are an Urban Terrace Farming Expert.
Analyze the uploaded terrace or backyard image and return ONLY valid JSON.

Return this exact format:

{
  "terraceArea": "",
  "usableArea": "",
  "sunlight": "",
  "drainage": "",
  "layout": "",
  "cropSuggestions": [],
  "estimatedCost": "",
  "recommendation": "",
  "confidence": "",
  "analysisSummary": ""
}

Rules:
- Estimate the total terraceArea and usableArea based on spatial layout.
- Assess sunlight conditions and drainage based on visible structures, slopes, or shadows.
- Suggest a space-efficient layout.
- List recommended crops in the cropSuggestions array.
- Provide a realistic estimatedCost in rupees (INR).
- Keep recommendations short and concise.
- Set confidence percentage (e.g. 90%).
- Write a short human-readable analysisSummary summarizing the complete analysis.
- No markdown formatting.
- No explanation.
- JSON only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image,
              },
            },
          ],
        },
      ],
    });

    const text = response.text ?? "";
    const cleanedJson = cleanJsonText(text);

    return NextResponse.json({
      result: cleanedJson,
    });
  } catch (error) {
    console.error("Gemini terrace analysis failed:", error);
    return NextResponse.json(
      { error: "Gemini analysis failed." },
      { status: 500 }
    );
  }
}

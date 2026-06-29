import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

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
You are an agricultural AI expert.

Analyze this crop image and return ONLY valid JSON.

Return this exact format:

{
  "crop": "",
  "health": "",
  "disease": "",
  "severity": "",
  "water": "",
  "fertilizer": "",
  "recommendation": "",
  "confidence": ""
}

Rules:
- Detect crop.
- Detect disease if visible.
- If no disease, return "No visible disease".
- Give short recommendations.
- No markdown.
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

    return NextResponse.json({
      result: text,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Gemini analysis failed.",
      },
      {
        status: 500,
      }
    );
  }
}
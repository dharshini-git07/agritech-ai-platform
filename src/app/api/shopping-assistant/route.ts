import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Product } from "@/types/marketplace";
import { PromptBuilder } from "@/services/promptBuilder";
import { ShoppingKitGenerator } from "@/services/shoppingKitGenerator";

function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation history messages are required." },
        { status: 400 }
      );
    }

    // 1. Retrieve products inventory from context provided by client
    const products = (context.products || []).filter(
      (p: any) => p.approvalStatus === "approved" && p.availability !== "out_of_stock" && p.quantity > 0
    );

    const inventoryList = products.map((p: any) => ({
      productName: p.productName,
      category: p.category,
      price: p.price,
    }));

    // 2. Build system instructions
    const systemPrompt = PromptBuilder.buildPrompt({
      preferredLanguage: context.preferredLanguage || "en",
      role: context.role || "customer",
      city: context.city || "Chennai",
      weather: context.weather,
      latestCropAnalysis: context.latestCropAnalysis,
      latestTerraceAnalysis: context.latestTerraceAnalysis,
      marketplaceInventory: inventoryList,
    });

    // 3. Format contents history for Gemini. We must ensure history begins with a "user" role.
    const firstUserIdx = messages.findIndex((m: any) => m.role === "user");
    const activeMessages = firstUserIdx !== -1 ? messages.slice(firstUserIdx) : messages;

    const contents = activeMessages.map((m: any) => ({
      role: (m.role === "assistant" || m.role === "model") ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 4. Generate AI contents with structured JSON instruction config
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    const cleanedJson = cleanJsonText(text);

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.error("Gemini assistant JSON parse failed:", parseErr, text);
      return NextResponse.json({
        reply: text || "Sorry, I encountered an error formatting my response. Can you please repeat that?",
        shoppingKit: null,
      });
    }

    // 5. Match conceptual recommendations with live products
    let shoppingKit = null;
    if (parsedResult.conceptualShoppingKit && Array.isArray(parsedResult.conceptualShoppingKit.items)) {
      try {
        shoppingKit = ShoppingKitGenerator.generateKit(
          parsedResult.conceptualShoppingKit,
          products
        );
      } catch (matchErr) {
        console.error("Error matching marketplace products:", matchErr);
      }
    }

    return NextResponse.json({
      reply: parsedResult.reply || "How can I help you today?",
      shoppingKit,
    });
  } catch (error: any) {
    console.error("AI Shopping Assistant failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        details: error?.stack || null
      },
      { status: 500 }
    );
  }
}

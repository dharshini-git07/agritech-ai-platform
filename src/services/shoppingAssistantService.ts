import { Message, AssistantShoppingKit } from "@/types/shoppingAssistant";

export class ShoppingAssistantService {
  /**
   * Posts the conversation history and context variables to the AI Shopping Assistant API.
   */
  static async getAssistantResponse(
    messages: Message[],
    context: {
      preferredLanguage: string;
      city: string;
      weather?: any;
      latestCropAnalysis?: any;
      latestTerraceAnalysis?: any;
    }
  ): Promise<{ reply: string; shoppingKit: AssistantShoppingKit | null }> {
    try {
      const response = await fetch("/api/shopping-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          context,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Failed to query Shopping Assistant:", err);
      throw err;
    }
  }
}

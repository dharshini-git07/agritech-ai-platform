"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/common/LanguageContext";
import { useMarketplace } from "./MarketplaceContext";
import { Message, AssistantShoppingKit } from "@/types/shoppingAssistant";
import { ShoppingAssistantService } from "@/services/shoppingAssistantService";
import { ConversationService } from "@/services/conversationService";
import { getUserCropAnalyses } from "@/services/analysisService";
import { getUserTerraceAnalyses } from "@/services/terraceService";
import { fetchWeather } from "@/services/weatherService";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  ShoppingBag,
  Save,
  Share2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function AiShoppingAssistant() {
  const { t, language } = useLanguage();
  const { products, addMultipleToCart } = useMarketplace();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("customer");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Profile and Analyses Context
  const [contextData, setContextData] = useState<any>({
    preferredLanguage: language || "en",
    role: "customer",
    city: "Chennai",
    weather: null,
    latestCropAnalysis: null,
    latestTerraceAnalysis: null,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Automatically load context and user role when opened
  useEffect(() => {
    if (!isOpen) return;

    const loadContextAndRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const [userSnap, crops, terraces, weather] = await Promise.all([
          getDoc(doc(db, "users", user.uid)).catch(() => null),
          getUserCropAnalyses(user.uid).catch(() => []),
          getUserTerraceAnalyses(user.uid).catch(() => []),
          fetchWeather().catch(() => null),
        ]);

        const latestCropAnalysis = crops.length > 0 ? crops[0] : null;
        const latestTerraceAnalysis = terraces.length > 0 ? terraces[0] : null;

        const userData = userSnap?.exists() ? userSnap.data() : null;
        const role = userData?.role || "customer";
        setUserRole(role);

        let city = "Chennai";
        if (latestTerraceAnalysis?.city) {
          city = latestTerraceAnalysis.city;
        }

        setContextData({
          preferredLanguage: language || "en",
          role,
          city,
          weather,
          latestCropAnalysis,
          latestTerraceAnalysis,
        });

        // Initialize welcome message dynamically based on role and language
        let welcome = "Hello! I'm your Namma Kadai Urban Farming Consultant. How can I help you plan your garden today?";
        if (role === "admin") {
          welcome = language === "ta"
            ? "வணக்கம் அட்மின்! நம்ம கடை நிர்வாகத்தில் இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
            : language === "hi"
            ? "नमस्ते एडमिन! नम्मा कड़ाई प्रबंधन में आज मैं आपकी क्या सहायता कर सकता हूँ?"
            : "Hello Admin! How can I help you manage the Namma Kadai platform today?";
        } else if (role === "seller") {
          welcome = language === "ta"
            ? "வணக்கம் விவசாயி! உங்கள் பயிர்களை நிர்வகிக்க அல்லது விற்பனையாளர் தயாரிப்புகளை மேம்படுத்த நான் எவ்வாறு உதவ முடியும்?"
            : language === "hi"
            ? "नमस्ते किसान भाई! आपकी फसलों के प्रबंधन या विक्रेता उत्पादों को बेहतर बनाने में मैं कैसे मदद कर सकता हूँ?"
            : "Hello Farmer! How can I help you manage your crops or optimize your seller listings today?";
        } else {
          welcome = language === "ta"
            ? "வணக்கம்! நான் உங்கள் நம்ம கடை மாடித்தோட்ட ஆலோசகர். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
            : language === "hi"
            ? "नमस्ते!  நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"
            : "Hello! I'm your Namma Kadai Urban Farming Consultant. How can I help you plan or treat your garden today?";
        }

        setMessages([{ role: "model", content: welcome }]);
      } catch (err) {
        console.error("Failed to load shopping assistant context:", err);
      }
    };

    loadContextAndRole();
  }, [isOpen, language]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const requestContext = {
        ...contextData,
        products: products,
      };
      const res = await ShoppingAssistantService.getAssistantResponse(newMessages, requestContext);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: res.reply,
          shoppingKit: res.shoppingKit || undefined,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || String(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: `AI Assistant Error: ${errMsg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Add all items in kit to cart
  const handleAddAllToCart = (kit: AssistantShoppingKit) => {
    const itemsToAdd = kit.recommendations
      .filter((r) => r.isAvailable && r.productId)
      .map((r) => {
        const prod = products.find((p) => p.id === r.productId);
        return {
          product: prod!,
          quantity: r.quantity,
        };
      });

    if (itemsToAdd.length === 0) {
      showToast("No products are currently available to add.");
      return;
    }

    addMultipleToCart(itemsToAdd);
    showToast(t("assistantSuccessCart"));
  };

  // Save kit to Firestore
  const handleSaveKit = async (kit: AssistantShoppingKit) => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Please log in to save your shopping kit.");
      return;
    }

    try {
      const refId = contextData.latestCropAnalysis?.id || contextData.latestTerraceAnalysis?.id || "general";
      await ConversationService.saveChatSession({
        uid: user.uid,
        chatHistory: messages,
        generatedKits: [kit],
        analysisReference: refId,
      });
      showToast(t("assistantSuccessSaved"));
    } catch (err) {
      console.error(err);
      showToast("Error saving shopping kit. Please try again.");
    }
  };

  // Share kit (Future-ready placeholder)
  const handleShareKit = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Sharing link copied to clipboard! (Voice assistant / IoT ready)");
  };

  const getSuggestions = () => {
    if (userRole === "admin") {
      return [
        "Show platform metrics overview",
        "What are the pending approvals?",
        "Explain listing guidelines",
      ];
    } else if (userRole === "seller") {
      return [
        "How to treat leaf powdery mildew?",
        "Tips to write compost listing descriptions",
        "Which crops have highest customer demand?",
      ];
    } else {
      return [
        "Suggest a crop kit for 300 sq.ft terrace",
        "What tools do I need for tomatoes?",
        "Recommend vegetable kit within ₹5,000",
      ];
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-green-700 hover:bg-green-800 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-2 border border-green-600"
      >
        <Sparkles size={20} className="animate-spin duration-1000" />
        <span className="text-sm font-extrabold hidden md:inline">
          {t("aiAssistantTitle") || "AI Consultant"}
        </span>
      </button>

      {/* Slide-out Assistant Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[580px] bg-white rounded-3xl border border-gray-150 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white p-4.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/10 p-2 rounded-xl">
                <Sparkles size={18} className="text-emerald-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide leading-tight">
                  {t("aiAssistantTitle")}
                </h4>
                <p className="text-[10px] text-emerald-100 opacity-90 font-medium">
                  {t("aiAssistantDesc")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition cursor-pointer p-1.5 hover:bg-white/10 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          {/* Toast Notification message */}
          {toastMessage && (
            <div className="absolute top-16 left-4 right-4 bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg z-50 text-center animate-in fade-in slide-in-from-top-4 duration-300">
              {toastMessage}
            </div>
          )}

          {/* Messages Scroll area container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-3">
                {/* Text Bubble */}
                <div
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed ${
                      msg.role === "user"
                        ? "bg-green-700 text-white rounded-tr-none"
                        : "bg-white border border-gray-150 text-gray-800 shadow-xs rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Inline Resolved Shopping Kit Card */}
                {msg.shoppingKit && (
                  <div className="bg-white border border-green-200 rounded-2xl shadow-xs overflow-hidden max-w-[90%] mr-auto animate-in zoom-in-95 duration-300">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center justify-between">
                      <h5 className="font-bold text-xs text-green-800 flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-green-700" />
                        {msg.shoppingKit.title}
                      </h5>
                      <span className="bg-green-100 text-green-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        AI Verified
                      </span>
                    </div>

                    {/* Kit Items List */}
                    <div className="p-3.5 space-y-3 max-h-56 overflow-y-auto border-b border-gray-100">
                      {msg.shoppingKit.recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="space-y-1 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-850">
                              {rec.productName} <span className="text-gray-400 text-[10px]">×{rec.quantity}</span>
                            </span>
                            {rec.isAvailable ? (
                              <span className="text-xs font-bold text-green-700 shrink-0">
                                ₹{rec.estimatedPrice.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                                Unavailable
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-gray-500 leading-snug">
                            {rec.whyThisProduct}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Cost estimates & maintenance summary */}
                    <div className="bg-gray-50/50 p-3.5 space-y-2 border-b border-gray-100 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Estimated Setup:</span>
                        <span className="font-extrabold text-gray-800">
                          ₹{msg.shoppingKit.estimatedTotalCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Monthly Maintenance:</span>
                        <span className="font-bold text-green-700">
                          ~₹{msg.shoppingKit.estimatedMonthlyMaintenanceCost.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="p-2 bg-white flex flex-wrap gap-1.5 justify-center">
                      <Button
                        size="xs"
                        onClick={() => handleAddAllToCart(msg.shoppingKit!)}
                        className="bg-green-700 text-white rounded-lg text-[10px] font-bold px-2 py-1 flex items-center gap-1 hover:bg-green-800 shrink-0"
                      >
                        <ShoppingBag size={10} /> Add to Cart
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleSaveKit(msg.shoppingKit!)}
                        className="border-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 flex items-center gap-1 hover:bg-gray-50 shrink-0"
                      >
                        <Save size={10} /> Save
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={handleShareKit}
                        className="text-gray-400 text-[10px] font-bold p-1 hover:bg-gray-55 shrink-0"
                      >
                        <Share2 size={10} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-150 rounded-2xl p-3 shadow-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-green-700 animate-spin" />
                  <span className="text-[11px] font-semibold text-gray-400">Assistant is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {!loading && messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-white flex flex-wrap gap-1.5 shrink-0">
              {getSuggestions().map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sug)}
                  className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full hover:bg-green-100 transition text-left cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input text box area */}
          <div className="p-3 border-t border-gray-150 bg-white flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder={t("chatPlaceholder")}
              className="flex-1 border border-gray-250 rounded-2xl px-4 py-2.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              disabled={loading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className="p-3 rounded-full bg-green-700 text-white shadow-md hover:bg-green-800 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition cursor-pointer"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

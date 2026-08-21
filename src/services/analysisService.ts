import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { NotificationService } from "./notificationService";

function sanitizeFirestoreData(obj: any): any {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        cleaned[key] = value.filter((item) => item !== undefined && item !== null);
      } else if (typeof value === "object" && !(value instanceof Date) && typeof (value as any).toDate !== "function") {
        cleaned[key] = sanitizeFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    } else {
      cleaned[key] = "";
    }
  }
  return cleaned;
}

export async function saveAnalysis(analysis: any): Promise<string> {
  let user = auth.currentUser;

  if (!user) {
    // Brief delay to allow Firebase Auth state initialization if pending
    await new Promise((resolve) => setTimeout(resolve, 300));
    user = auth.currentUser;
  }

  const uid = user ? user.uid : "anonymous_farmer";
  const userEmail = user?.email || "anonymous@ecoterrace.com";
  const userName = user?.displayName || "Farmer";

  const payload: any = {
    uid,
    userEmail,
    userName,
    crop: analysis.crop || "Unknown Crop",
    cropName: analysis.crop || "Unknown Crop",
    health: analysis.health || "N/A",
    healthStatus: analysis.health || "N/A",
    disease: analysis.disease || "No visible disease",
    diseaseName: analysis.disease || "No visible disease",
    severity: analysis.severity || "None",
    cause: analysis.cause || "",
    whyOccurs: analysis.whyOccurs || "",
    symptoms: Array.isArray(analysis.symptoms) ? analysis.symptoms : [],
    treatment: Array.isArray(analysis.treatment) ? analysis.treatment : [],
    prevention: Array.isArray(analysis.prevention) ? analysis.prevention : [],
    water: analysis.water || "",
    waterRecommendation: analysis.water || "",
    fertilizer: analysis.fertilizer || "",
    fertilizerRecommendation: analysis.fertilizer || "",
    recoveryTime: analysis.recoveryTime || "",
    recommendation: analysis.recommendation || "",
    confidence: analysis.confidence || "0%",
    confidenceReason: Array.isArray(analysis.confidenceReason) ? analysis.confidenceReason : [],
    analysisSummary: analysis.analysisSummary || "",
    imageQuality: analysis.imageQuality || "",
    analysisLimitations: analysis.analysisLimitations || "",
    createdAt: serverTimestamp(),
    timestampMs: Date.now(),
    analyzedAt: new Date().toISOString(),
    analyzedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    analyzedTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    analyzedAtFormatted: new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };

  const sanitizedPayload = sanitizeFirestoreData(payload);

  const docRef = await addDoc(collection(db, "crop_analysis"), sanitizedPayload);

  if (user) {
    try {
      await NotificationService.createNotification({
        userId: user.uid,
        role: "farmer",
        title: "Crop Analysis Completed",
        message: `AI analysis completed for crop: ${sanitizedPayload.crop}. Health status: ${sanitizedPayload.health}.`,
        type: "AI Recommendation",
        priority: "Medium",
        actionUrl: "/dashboard/history"
      });
    } catch (err) {
      console.error("Failed to create crop analysis notification:", err);
    }
  }

  return docRef.id;
}

export async function getUserCropAnalyses(uid?: string): Promise<any[]> {
  if (!uid) return [];
  try {
    const q = query(
      collection(db, "crop_analysis"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      type: "crop",
      ...doc.data(),
    }));
  } catch (err: any) {
    console.warn("Ordered crop analysis query failed (likely missing index), falling back to un-ordered query:", err);
    // Fallback: Query by uid without orderBy, then sort in JS memory
    const q = query(
      collection(db, "crop_analysis"),
      where("uid", "==", uid)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      type: "crop",
      ...doc.data(),
    }));
    return docs.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.timestampMs || 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.timestampMs || 0);
      return timeB - timeA;
    });
  }
}

export async function clearAllCropAnalyses(): Promise<number> {
  const snap = await getDocs(collection(db, "crop_analysis"));
  let deletedCount = 0;
  for (const documentDoc of snap.docs) {
    await deleteDoc(doc(db, "crop_analysis", documentDoc.id));
    deletedCount++;
  }
  return deletedCount;
}
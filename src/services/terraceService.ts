import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { TerraceAnalysis } from "@/types/terrace";
import { NotificationService } from "./notificationService";

export async function saveTerraceAnalysis(analysis: TerraceAnalysis): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const docRef = await addDoc(collection(db, "terrace_analysis"), {
    uid: user.uid,
    analysisMode: analysis.analysisMode,
    terraceArea: analysis.terraceArea,
    usableArea: analysis.usableArea,
    sunlight: analysis.sunlight,
    drainage: analysis.drainage,
    layout: analysis.layout,
    recommendedCrops: analysis.recommendedCrops,
    growBagCount: analysis.growBagCount,
    hydroponicsSuitability: analysis.hydroponicsSuitability,
    waterTankPlacement: analysis.waterTankPlacement,
    estimatedCost: analysis.estimatedCost,
    shoppingRecommendations: analysis.shoppingRecommendations,
    maintenanceTips: analysis.maintenanceTips,
    analysisSummary: analysis.analysisSummary,
    confidence: analysis.confidence,
    confidenceReason: analysis.confidenceReason,
    createdAt: serverTimestamp(),
  });

  try {
    await NotificationService.createNotification({
      userId: user.uid,
      role: "farmer",
      title: "Terrace Analysis Completed",
      message: `AI terrace layout planning completed successfully for ${analysis.terraceArea || "N/A"} sq ft.`,
      type: "AI Recommendation",
      priority: "Medium",
      actionUrl: "/dashboard/terrace-planner"
    });
  } catch (err) {
    console.error("Failed to create terrace analysis notification:", err);
  }

  return docRef.id;
}

export async function getUserTerraceAnalyses(uid: string): Promise<any[]> {
  const q = query(
    collection(db, "terrace_analysis"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    type: "terrace",
    ...doc.data(),
  }));
}

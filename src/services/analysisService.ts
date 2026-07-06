import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { NotificationService } from "./notificationService";

export async function saveAnalysis(analysis: any): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const docRef = await addDoc(collection(db, "crop_analysis"), {
    uid: user.uid,
    ...analysis,
    createdAt: serverTimestamp(),
  });

  try {
    await NotificationService.createNotification({
      userId: user.uid,
      role: "farmer",
      title: "Crop Analysis Completed",
      message: `AI analysis completed for crop: ${analysis.cropName || analysis.crop || "Crop"}. Health status: ${analysis.healthStatus || analysis.health || "N/A"}.`,
      type: "AI Recommendation",
      priority: "Medium",
      actionUrl: "/dashboard/history"
    });
  } catch (err) {
    console.error("Failed to create crop analysis notification:", err);
  }

  return docRef.id;
}

export async function getUserCropAnalyses(uid: string): Promise<any[]> {
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
}
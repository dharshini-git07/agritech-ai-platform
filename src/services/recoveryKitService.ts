import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { RecoveryKit } from "@/types/recoveryKit";

export class RecoveryKitService {
  /**
   * Saves a newly generated Recovery Kit to Firestore under the "recovery_kits" collection.
   */
  static async saveRecoveryKit(kit: Omit<RecoveryKit, "id" | "createdAt" | "uid">): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }

    const docRef = await addDoc(collection(db, "recovery_kits"), {
      uid: user.uid,
      cropAnalysisId: kit.cropAnalysisId,
      recommendations: kit.recommendations,
      timeline: kit.timeline,
      estimatedTotalCost: kit.estimatedTotalCost,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Retrieves the Recovery Kit associated with a specific crop analysis ID.
   */
  static async getRecoveryKitByAnalysisId(analysisId: string): Promise<RecoveryKit | null> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }

    const q = query(
      collection(db, "recovery_kits"),
      where("uid", "==", user.uid),
      where("cropAnalysisId", "==", analysisId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      uid: data.uid,
      cropAnalysisId: data.cropAnalysisId,
      recommendations: data.recommendations,
      timeline: data.timeline,
      estimatedTotalCost: data.estimatedTotalCost,
      createdAt: data.createdAt,
    } as RecoveryKit;
  }
}

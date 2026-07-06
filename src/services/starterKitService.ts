import { addDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { StarterKit } from "@/types/starterKit";

export class StarterKitService {
  /**
   * Saves a newly generated Starter Kit in Firestore under the "starter_kits" collection.
   */
  static async saveStarterKit(starterKit: Omit<StarterKit, "id" | "createdAt" | "uid">): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }

    const docRef = await addDoc(collection(db, "starter_kits"), {
      uid: user.uid,
      terraceAnalysisId: starterKit.terraceAnalysisId,
      recommendations: starterKit.recommendations,
      estimatedTotalCost: starterKit.estimatedTotalCost,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }

  /**
   * Retrieves a Starter Kit document associated with a specific terrace analysis ID.
   */
  static async getStarterKitByAnalysisId(analysisId: string): Promise<StarterKit | null> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated.");
    }

    const q = query(
      collection(db, "starter_kits"),
      where("uid", "==", user.uid),
      where("terraceAnalysisId", "==", analysisId)
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
      terraceAnalysisId: data.terraceAnalysisId,
      recommendations: data.recommendations,
      estimatedTotalCost: data.estimatedTotalCost,
      createdAt: data.createdAt,
    } as StarterKit;
  }
}

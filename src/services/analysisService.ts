import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export async function saveAnalysis(analysis: any) {
  const user = auth.currentUser;

  if (!user) return;

  await addDoc(collection(db, "crop_analysis"), {
    uid: user.uid,
    ...analysis,
    createdAt: serverTimestamp(),
  });
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
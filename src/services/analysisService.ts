import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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
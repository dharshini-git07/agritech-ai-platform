import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getFirestoreWishlist(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, "wishlists", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().productIds as string[]) || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching Firestore wishlist:", err);
    return [];
  }
}

export async function saveFirestoreWishlist(
  userId: string,
  productIds: string[]
): Promise<void> {
  try {
    const docRef = doc(db, "wishlists", userId);
    await setDoc(docRef, {
      productIds,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error saving Firestore wishlist:", err);
    throw err;
  }
}

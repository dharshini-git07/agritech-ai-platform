import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CartItemDoc {
  productId: string;
  quantity: number;
}

export async function getFirestoreCart(userId: string): Promise<CartItemDoc[]> {
  try {
    const docRef = doc(db, "carts", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().items as CartItemDoc[]) || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching Firestore cart:", err);
    return [];
  }
}

export async function saveFirestoreCart(
  userId: string,
  items: CartItemDoc[]
): Promise<void> {
  try {
    const docRef = doc(db, "carts", userId);
    await setDoc(docRef, {
      items,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error saving Firestore cart:", err);
    throw err;
  }
}

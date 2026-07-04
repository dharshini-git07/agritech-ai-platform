import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface StockChangeItem {
  productId: string;
  quantity: number;
}

// 1. Transaction-based stock deduction (prevent oversells)
export async function verifyAndDeductStock(
  transaction: any,
  items: StockChangeItem[]
): Promise<void> {
  for (const item of items) {
    const productDocRef = doc(db, "products", item.productId);
    const productSnap = await transaction.get(productDocRef);

    if (!productSnap.exists()) {
      throw new Error(`Product ${item.productId} does not exist in inventory.`);
    }

    const productData = productSnap.data();
    const currentStock = productData.quantity || 0;

    if (currentStock < item.quantity) {
      throw new Error(
        `Insufficient stock for "${productData.productName}". Available: ${currentStock}, Requested: ${item.quantity}.`
      );
    }

    const newStock = currentStock - item.quantity;
    transaction.update(productDocRef, {
      quantity: newStock,
      availability: newStock === 0 ? "out_of_stock" : productData.availability,
    });
  }
}

// 2. Safe transaction-based stock restoration (on cancellation)
export async function restoreStock(items: StockChangeItem[]): Promise<void> {
  await runTransaction(db, async (transaction) => {
    for (const item of items) {
      const productDocRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productDocRef);

      if (!productSnap.exists()) {
        console.warn(`Product ${item.productId} not found to restore stock.`);
        continue;
      }

      const productData = productSnap.data();
      const currentStock = productData.quantity || 0;
      const newStock = currentStock + item.quantity;

      transaction.update(productDocRef, {
        quantity: newStock,
        availability: "in_stock", // Any stock > 0 means in_stock
      });
    }
  });
}

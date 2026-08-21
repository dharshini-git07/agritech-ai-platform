import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const colRef = collection(db, "crop_analysis");
    const snapshot = await getDocs(colRef);
    
    let deletedCount = 0;
    const deletedIds: string[] = [];

    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "crop_analysis", d.id));
      deletedCount++;
      deletedIds.push(d.id);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared 'crop_analysis' collection. Deleted ${deletedCount} documents.`,
      deletedCount,
      deletedIds,
    });
  } catch (error: any) {
    console.error("Failed to clear crop_analysis collection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete documents in crop_analysis collection.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { TwinZone } from "@/types/digitalTwin";

export const ZoneService = {
  /**
   * Updates a single zone within a digital twin document in Firestore
   */
  async updateZone(twinId: string, updatedZone: TwinZone): Promise<void> {
    const twinRef = doc(db, "digital_twins", twinId);
    const docSnap = await getDoc(twinRef);
    if (!docSnap.exists()) {
      throw new Error("Digital Twin document not found");
    }

    const data = docSnap.data();
    const zones: TwinZone[] = data.zones || [];
    
    // Replace the specific zone matching the zoneId
    const updatedZones = zones.map((z) =>
      z.zoneId === updatedZone.zoneId ? { ...z, ...updatedZone } : z
    );

    await updateDoc(twinRef, {
      zones: updatedZones
    });
  }
};

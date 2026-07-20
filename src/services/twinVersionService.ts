import { db } from "@/lib/firebase";
import { doc, collection, addDoc, getDocs, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { TwinModel, VersionHistoryItem, TwinZone } from "@/types/digitalTwin";
import { TwinTimelineService } from "./twinTimelineService";

export const TwinVersionService = {
  /**
   * Archives current digital twin state to the versions subcollection,
   * increments version in the parent doc, logs a timeline event, and updates parent zones.
   */
  async createNewVersion(twinId: string, updatedZones: TwinZone[], reason: string): Promise<number> {
    const twinRef = doc(db, "digital_twins", twinId);
    const docSnap = await getDoc(twinRef);
    if (!docSnap.exists()) {
      throw new Error("Digital Twin document not found.");
    }
    
    const currentTwin = docSnap.data() as TwinModel;
    const currentVersion = currentTwin.version || 1;
    const nextVersion = currentVersion + 1;

    // 1. Save backup copy of current configuration in versions subcollection
    const versionsRef = collection(twinRef, "versions");
    await addDoc(versionsRef, {
      version: currentVersion,
      zones: currentTwin.zones,
      intelligence: currentTwin.intelligence || null,
      predictions: currentTwin.predictions || null,
      generatedBy: "User Action",
      reasonForUpdate: reason,
      status: "archived",
      timestamp: serverTimestamp()
    });

    // 2. Add Timeline Event log
    await TwinTimelineService.recordEvent(twinId, {
      eventType: "twin_updated",
      description: `Layout version ${nextVersion} created: ${reason}`,
      userAction: "Zone configuration saved",
      timestamp: new Date()
    });

    // 3. Update main twin document
    await updateDoc(twinRef, {
      zones: updatedZones,
      version: nextVersion
    });

    return nextVersion;
  },

  /**
   * Fetches version logs timeline list for a digital twin
   */
  async getVersionHistory(twinId: string): Promise<VersionHistoryItem[]> {
    try {
      const twinRef = doc(db, "digital_twins", twinId);
      const versionsRef = collection(twinRef, "versions");
      const snap = await getDocs(versionsRef);
      
      const history: VersionHistoryItem[] = [];
      snap.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as VersionHistoryItem);
      });
      
      // Sort in descending order (highest version first)
      return history.sort((a, b) => b.version - a.version);
    } catch (err) {
      console.error("Failed to load version history:", err);
      return [];
    }
  },

  /**
   * Restores a historical version configuration as the active layout
   */
  async restoreVersion(twinId: string, versionItem: VersionHistoryItem): Promise<number> {
    const twinRef = doc(db, "digital_twins", twinId);
    const docSnap = await getDoc(twinRef);
    if (!docSnap.exists()) {
      throw new Error("Digital Twin document not found.");
    }
    
    const currentTwin = docSnap.data() as TwinModel;
    const currentVersion = currentTwin.version || 1;
    const nextVersion = currentVersion + 1;

    // 1. Back up active state before restoring
    const versionsRef = collection(twinRef, "versions");
    await addDoc(versionsRef, {
      version: currentVersion,
      zones: currentTwin.zones,
      intelligence: currentTwin.intelligence || null,
      predictions: currentTwin.predictions || null,
      generatedBy: "User Action",
      reasonForUpdate: `Auto backup before restoring version ${versionItem.version}`,
      status: "archived",
      timestamp: serverTimestamp()
    });

    // 2. Overwrite parent with restored details
    await updateDoc(twinRef, {
      zones: versionItem.zones,
      intelligence: versionItem.intelligence || null,
      predictions: versionItem.predictions || null,
      version: nextVersion
    });

    // 3. Log restoration in timeline
    await TwinTimelineService.recordEvent(twinId, {
      eventType: "twin_updated",
      description: `Restored layout configuration from version ${versionItem.version}`,
      userAction: "Version rollback applied",
      timestamp: new Date()
    });

    return nextVersion;
  }
};

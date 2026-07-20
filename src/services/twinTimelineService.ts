import { db } from "@/lib/firebase";
import { doc, collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { TimelineEventItem } from "@/types/digitalTwin";

export const TwinTimelineService = {
  /**
   * Records a history or automation log event in the digital twin's timeline subcollection
   */
  async recordEvent(twinId: string, event: Omit<TimelineEventItem, "id">): Promise<void> {
    try {
      const twinRef = doc(db, "digital_twins", twinId);
      const eventsRef = collection(twinRef, "timeline_events");
      
      await addDoc(eventsRef, {
        ...event,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to record timeline event:", err);
    }
  },

  /**
   * Fetches chronological timeline events for a digital twin
   */
  async getTimelineEvents(twinId: string): Promise<TimelineEventItem[]> {
    try {
      const twinRef = doc(db, "digital_twins", twinId);
      const eventsRef = collection(twinRef, "timeline_events");
      const snap = await getDocs(eventsRef);
      
      const list: TimelineEventItem[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as TimelineEventItem);
      });
      
      // Sort chronologically (latest first)
      return list.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
    } catch (err) {
      console.error("Failed to fetch timeline events:", err);
      return [];
    }
  }
};

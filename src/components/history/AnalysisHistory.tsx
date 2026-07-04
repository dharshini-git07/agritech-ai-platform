"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function AnalysisHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const uid = user.uid;
        async function loadHistory() {
          try {
            setError(null);
            const q = query(
              collection(db, "crop_analysis"),
              where("uid", "==", uid),
              orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));

            setHistory(data);
          } catch (err: any) {
            console.error("Error loading crop analysis history:", err);
            setError(err.message || "Failed to load history records.");
          } finally {
            setLoading(false);
          }
        }
        loadHistory();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500 font-medium">
        Loading analysis history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-3xl p-6 text-center shadow-lg max-w-md mx-auto">
        <p className="font-semibold">⚠️ Error Loading History</p>
        <p className="text-sm mt-2">{error}</p>
        <p className="text-xs text-gray-400 mt-4">
          If you see a query index error, click the link in your browser developer tools console to generate it.
        </p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-3xl shadow-md p-8 max-w-xl mx-auto">
        <h3 className="text-xl font-bold mb-2">No history records found</h3>
        <p className="text-gray-400">
          You haven't run any plant health diagnostics yet. Go to Crop Health Analysis to analyze crop images.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-3xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold">
            🌱 {item.crop}
          </h2>

          <p>
            <strong>Health:</strong> {item.health}
          </p>

          <p>
            <strong>Disease:</strong> {item.disease}
          </p>

          <p>
            <strong>Severity:</strong> {item.severity}
          </p>

          <p>
            <strong>Water:</strong> {item.water}
          </p>

          <p>
            <strong>Fertilizer:</strong> {item.fertilizer}
          </p>

          <p>
            <strong>Recommendation:</strong> {item.recommendation}
          </p>

          <p>
            <strong>Confidence:</strong> {item.confidence}
          </p>
        </div>
      ))}
    </div>
  );
}
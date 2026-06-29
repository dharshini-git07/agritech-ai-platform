"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AnalysisHistory() {

  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {

    async function loadHistory() {

      const q = query(
        collection(db, "crop_analysis"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setHistory(data);

    }

    loadHistory();

  }, []);

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
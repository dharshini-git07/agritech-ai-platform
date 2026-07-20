"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { TwinModel, TwinZone } from "@/types/digitalTwin";
import { TwinVersionService } from "@/services/twinVersionService";

interface TwinContextType {
  twin: TwinModel | null;
  setTwin: React.Dispatch<React.SetStateAction<TwinModel | null>>;
  activeZoneId: string | null;
  activeZone: TwinZone | null;
  setActiveZoneId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredZones: TwinZone[];
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editZoneData: TwinZone | null;
  setEditZoneData: React.Dispatch<React.SetStateAction<TwinZone | null>>;
  saveZoneChanges: () => Promise<boolean>;
  cancelEdit: () => void;
  isSaving: boolean;
  errorMessage: string | null;
}

const TwinContext = createContext<TwinContextType | undefined>(undefined);

export function TwinProvider({
  children,
  initialTwin
}: {
  children: React.ReactNode;
  initialTwin: TwinModel | null;
}) {
  const [twin, setTwin] = useState<TwinModel | null>(initialTwin);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editZoneData, setEditZoneData] = useState<TwinZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if initialTwin changes
  useEffect(() => {
    if (initialTwin) {
      setTwin(initialTwin);
    }
  }, [initialTwin]);

  // Derive activeZone from activeZoneId
  const activeZone = useMemo(() => {
    if (!twin || !activeZoneId) return null;
    return twin.zones.find((z) => z.zoneId === activeZoneId) || null;
  }, [twin, activeZoneId]);

  // Set default active zone if none selected
  useEffect(() => {
    if (twin && twin.zones.length > 0 && !activeZoneId) {
      const defaultZone = twin.zones.find((z) => z.zoneType === "crop") || twin.zones[0];
      if (defaultZone) {
        setActiveZoneId(defaultZone.zoneId);
      }
    }
  }, [twin, activeZoneId]);

  // Handle Edit mode triggers
  useEffect(() => {
    if (isEditing && activeZone) {
      // Deep copy to edit
      setEditZoneData({ ...activeZone });
    } else {
      setEditZoneData(null);
    }
  }, [isEditing, activeZoneId]); // Trigger when editing toggled or active zone changes

  // Filtered zones based on search query
  const filteredZones = useMemo(() => {
    if (!twin) return [];
    if (!searchQuery.trim()) return twin.zones;

    const query = searchQuery.toLowerCase().trim();
    return twin.zones.filter((z) => {
      const nameMatch = z.zoneName.toLowerCase().includes(query);
      const cropMatch = (z.currentCrop || "").toLowerCase().includes(query) || 
                         z.recommendedCrop.toLowerCase().includes(query);
      const typeMatch = z.zoneType.toLowerCase().includes(query);
      return nameMatch || cropMatch || typeMatch;
    });
  }, [twin, searchQuery]);

  // Save changes to Firestore
  const saveZoneChanges = async (): Promise<boolean> => {
    if (!twin || !twin.id || !editZoneData) return false;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const nextZones = twin.zones.map((z) =>
        z.zoneId === editZoneData.zoneId ? editZoneData : z
      );
      
      const newVersionNum = await TwinVersionService.createNewVersion(
        twin.id,
        nextZones,
        `Updated Zone details: ${editZoneData.zoneName}`
      );
      
      // Update local state
      setTwin((prevTwin) => {
        if (!prevTwin) return null;
        return {
          ...prevTwin,
          zones: nextZones,
          version: newVersionNum
        };
      });
      setIsEditing(false);
      return true;
    } catch (err: any) {
      console.error("Failed to save zone changes:", err);
      setErrorMessage(err.message || "An error occurred while saving changes.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditZoneData(null);
    setErrorMessage(null);
  };

  return (
    <TwinContext.Provider
      value={{
        twin,
        setTwin,
        activeZoneId,
        activeZone,
        setActiveZoneId,
        searchQuery,
        setSearchQuery,
        filteredZones,
        isEditing,
        setIsEditing,
        editZoneData,
        setEditZoneData,
        saveZoneChanges,
        cancelEdit,
        isSaving,
        errorMessage,
      }}
    >
      {children}
    </TwinContext.Provider>
  );
}

export function useTwinState() {
  const context = useContext(TwinContext);
  if (!context) {
    throw new Error("useTwinState must be used within a TwinProvider");
  }
  return context;
}

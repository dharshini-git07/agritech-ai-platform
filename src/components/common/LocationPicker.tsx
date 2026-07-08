"use client";

import React, { useState } from "react";
import { GeoCodingService } from "@/services/geoCodingService";
import { LocationService } from "@/services/locationService";
import { useLanguage } from "@/components/common/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InteractiveMap from "./InteractiveMap";
import { Search, MapPin, Loader2, Navigation } from "lucide-react";

interface LocationPickerProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  onLocationSelected: (location: { address: string; lat: number; lng: number }) => void;
}

export default function LocationPicker({
  initialAddress = "",
  initialLat = 13.0827,
  initialLng = 80.2707,
  onLocationSelected,
}: LocationPickerProps) {
  const { t } = useLanguage();
  
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // 1. Handle text address search geocode
  const handleAddressSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addressInput.trim()) return;

    setLoading(true);
    try {
      const result = await GeoCodingService.geocodeAddress(addressInput);
      const updatedCoords = { lat: result.latitude, lng: result.longitude };
      setCoords(updatedCoords);
      
      // Update parent with text and geocoded coords
      onLocationSelected({
        address: addressInput,
        ...updatedCoords,
      });
    } catch (err) {
      console.error("Geocoding failed:", err);
      alert("Could not locate address on map. Please adjust details.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle map clicks (reverse-geocodes coords back to text address)
  const handleMapClick = async (clickedCoords: { lat: number; lng: number }) => {
    setLoading(true);
    setCoords(clickedCoords);
    try {
      const resolvedAddress = await GeoCodingService.reverseGeocode(
        clickedCoords.lat,
        clickedCoords.lng
      );
      setAddressInput(resolvedAddress);
      onLocationSelected({
        address: resolvedAddress,
        ...clickedCoords,
      });
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      const fallbackAddress = `Pin: ${clickedCoords.lat.toFixed(4)}, ${clickedCoords.lng.toFixed(4)}`;
      setAddressInput(fallbackAddress);
      onLocationSelected({
        address: fallbackAddress,
        ...clickedCoords,
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle device geolocation "Use Current Location"
  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const position = await LocationService.getCurrentLocation();
      const currentCoords = { lat: position.latitude, lng: position.longitude };
      setCoords(currentCoords);
      
      const resolvedAddress = await GeoCodingService.reverseGeocode(
        position.latitude,
        position.longitude
      );
      setAddressInput(resolvedAddress);
      
      onLocationSelected({
        address: resolvedAddress,
        ...currentCoords,
      });
    } catch (err) {
      console.error("Browser location tracking failed:", err);
      alert("Permission denied or device tracking unavailable.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </span>
          <Input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddressSearch();
              }
            }}
            placeholder="Type address or search local city..."
            className="pl-10 pr-4 rounded-xl border-gray-250 focus:border-green-400"
          />
        </div>
        <Button
          type="button"
          onClick={() => handleAddressSearch()}
          disabled={loading || !addressInput.trim()}
          className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold px-5"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Locate"}
        </Button>
      </div>

      {/* Geolocation Button */}
      <div className="flex gap-3 items-center">
        <Button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          variant="outline"
          className="flex-1 py-5 rounded-xl border-gray-250 hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-bold text-gray-700 cursor-pointer"
        >
          {locating ? (
            <Loader2 size={14} className="animate-spin text-green-700" />
          ) : (
            <Navigation size={14} className="text-green-750" />
          )}
          <span>Use Current Location</span>
        </Button>
      </div>

      {/* Embedded interactive map display */}
      <div className="relative rounded-3xl border border-gray-150 overflow-hidden shadow-xs">
        <InteractiveMap
          center={coords}
          zoom={13}
          onMapClick={handleMapClick}
          height="280px"
          markers={[
            {
              lat: coords.lat,
              lng: coords.lng,
              title: "Selected Location",
              description: addressInput || "Pin location",
              type: "Selected",
            },
          ]}
        />
        
        {/* Coordinates status pill */}
        <div className="absolute bottom-3 left-3 bg-gray-900/80 backdrop-blur-xs text-white font-mono text-[9px] px-2.5 py-1.5 rounded-lg border border-gray-700 select-none">
          LAT: {coords.lat.toFixed(6)} | LNG: {coords.lng.toFixed(6)}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 font-medium">
        * Select location by typing address and clicking "Locate", clicking "Use Current Location", or clicking directly on the map coordinate grid.
      </p>
    </div>
  );
}

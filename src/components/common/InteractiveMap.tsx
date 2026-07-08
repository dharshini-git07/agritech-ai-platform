"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapService } from "@/services/mapService";
import { useLanguage } from "@/components/common/LanguageContext";
import { Layers, MapPin, Search, ZoomIn, ZoomOut } from "lucide-react";

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type?: "Farmer" | "Nursery" | "Organic Store" | "Hydroponics Supplier" | "Terrace Equipment Supplier" | string;
  id?: string;
}

interface InteractiveMapProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  readOnly?: boolean;
}

export default function InteractiveMap({
  markers = [],
  center = { lat: 13.0827, lng: 80.2707 }, // Default Chennai
  zoom = 12,
  onMapClick,
  height = "400px",
  readOnly = false,
}: InteractiveMapProps) {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // SVG Fallback Map Viewport Coordinates State
  const [fallbackZoom, setFallbackZoom] = useState(zoom);
  const [fallbackCenter, setFallbackCenter] = useState(center);

  useEffect(() => {
    MapService.loadGoogleMaps()
      .then((google) => {
        setGoogleMapsLoaded(true);
        if (!mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        // Add Click Listener
        if (!readOnly && onMapClick) {
          mapInstance.addListener("click", (e: any) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
              });
            }
          });
        }

        // Plot Markers
        const infoWindow = new google.maps.InfoWindow();
        markers.forEach((marker) => {
          const color = getMarkerColor(marker.type);
          const pinSvg = {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 1.5,
            anchor: new google.maps.Point(12, 22),
          };

          const gMarker = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map: mapInstance,
            title: marker.title,
            icon: pinSvg,
          });

          gMarker.addListener("click", () => {
            infoWindow.setContent(`
              <div style="padding: 8px; font-family: sans-serif;">
                <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937;">${marker.title}</h4>
                <p style="margin: 0 0 6px 0; font-size: 11px; color: #4b5563;">${marker.description || ""}</p>
                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; background-color: #f3f4f6; border-radius: 4px; color: ${color};">${marker.type || "Seller"}</span>
              </div>
            `);
            infoWindow.open(mapInstance, gMarker);
          });
        });
      })
      .catch((err) => {
        console.warn("Could not load Google Maps API. Initiating Vector Canvas Fallback.", err);
        setUsingFallback(true);
      });
  }, [markers, center, zoom, readOnly]);

  const getMarkerColor = (type?: string) => {
    switch (type) {
      case "Farmer":
        return "#15803d"; // Forest green
      case "Nursery":
        return "#10b981"; // Emerald green
      case "Organic Store":
        return "#84cc16"; // Lime
      case "Hydroponics Supplier":
        return "#3b82f6"; // Blue
      case "Terrace Equipment Supplier":
        return "#f97316"; // Orange
      default:
        return "#6b7280"; // Gray
    }
  };

  const getMarkerEmoji = (type?: string) => {
    switch (type) {
      case "Farmer":
        return "🌱";
      case "Nursery":
        return "🌿";
      case "Organic Store":
        return "🍎";
      case "Hydroponics Supplier":
        return "💧";
      case "Terrace Equipment Supplier":
        return "🛠";
      default:
        return "📍";
    }
  };

  // Render SVG Fallback coordinates conversion
  const handleFallbackZoomIn = () => setFallbackZoom((z) => Math.min(z + 1, 18));
  const handleFallbackZoomOut = () => setFallbackZoom((z) => Math.max(z - 1, 8));

  // Convert lat/lng to SVG viewBox percentage relative to fallbackCenter
  const getSvgCoordinates = (lat: number, lng: number) => {
    const scaleFactor = Math.pow(2, fallbackZoom - 12) * 500;
    const x = 500 + (lng - fallbackCenter.lng) * scaleFactor;
    const y = 300 - (lat - fallbackCenter.lat) * scaleFactor;
    return { x, y };
  };

  const handleFallbackClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel click coordinates back to Latitude and Longitude
    const scaleFactor = Math.pow(2, fallbackZoom - 12) * 500;
    const clickX = (x / rect.width) * 1000;
    const clickY = (y / rect.height) * 600;

    const lng = fallbackCenter.lng + (clickX - 500) / scaleFactor;
    const lat = fallbackCenter.lat - (clickY - 300) / scaleFactor;

    onMapClick({ lat, lng });
  };

  if (usingFallback) {
    const activeCoords = markers.map((m) => ({
      ...m,
      coords: getSvgCoordinates(m.lat, m.lng),
    }));

    return (
      <div
        className="relative bg-blue-50/30 rounded-3xl border border-gray-150 overflow-hidden select-none"
        style={{ height }}
      >
        {/* Fallback Grid Layer */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 600"
          className="absolute inset-0 cursor-crosshair"
          onClick={handleFallbackClick}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Radial Center Indicator */}
          <circle
            cx="500"
            cy="300"
            r="120"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            className="opacity-40"
          />
          <circle
            cx="500"
            cy="300"
            r="240"
            fill="none"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="4,4"
            className="opacity-25"
          />

          {/* Plot Markers */}
          {activeCoords.map((marker, idx) => {
            const color = getMarkerColor(marker.type);
            const emoji = getMarkerEmoji(marker.type);
            
            // Check if marker fits in SVG view bounds
            if (marker.coords.x < 0 || marker.coords.x > 1000 || marker.coords.y < 0 || marker.coords.y > 600) {
              return null;
            }

            return (
              <g key={idx} className="cursor-pointer group">
                <circle
                  cx={marker.coords.x}
                  cy={marker.coords.y}
                  r="24"
                  fill={`${color}15`}
                  stroke={color}
                  strokeWidth="1.5"
                  className="animate-pulse"
                />
                <circle
                  cx={marker.coords.x}
                  cy={marker.coords.y}
                  r="14"
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2.5"
                  className="shadow-sm"
                />
                <text
                  x={marker.coords.x}
                  y={marker.coords.y + 4}
                  textAnchor="middle"
                  fontSize="12"
                >
                  {emoji}
                </text>

                {/* Tooltip Overlay */}
                <g className="opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
                  <rect
                    x={marker.coords.x - 90}
                    y={marker.coords.y - 75}
                    width="180"
                    height="50"
                    rx="8"
                    fill="#1f2937"
                    className="shadow-xl"
                  />
                  <polygon
                    points={`${marker.coords.x - 6},${marker.coords.y - 25} ${marker.coords.x + 6},${marker.coords.y - 25} ${marker.coords.x},${marker.coords.y - 19}`}
                    fill="#1f2937"
                  />
                  <text
                    x={marker.coords.x}
                    y={marker.coords.y - 58}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {marker.title}
                  </text>
                  <text
                    x={marker.coords.x}
                    y={marker.coords.y - 44}
                    fill="#9ca3af"
                    fontSize="9.5"
                    textAnchor="middle"
                  >
                    {marker.type}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Map Indicator Banner */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border text-[10px] text-gray-500 font-bold flex items-center gap-1.5 shadow-sm">
          <Layers size={13} className="text-green-700" />
          <span>NAMMA KADAI INTERACTIVE VECTOR MAP</span>
        </div>

        {/* Map Control Actions */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleFallbackZoomIn}
            className="p-2.5 bg-white hover:bg-gray-50 border rounded-xl shadow-md text-gray-700 active:scale-95 transition cursor-pointer"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={handleFallbackZoomOut}
            className="p-2.5 bg-white hover:bg-gray-50 border rounded-xl shadow-md text-gray-700 active:scale-95 transition cursor-pointer"
          >
            <ZoomOut size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full bg-gray-50 rounded-3xl border border-gray-150 shadow-inner overflow-hidden"
      style={{ height }}
    />
  );
}

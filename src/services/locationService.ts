export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const LocationService = {
  // 1. Get browser current location
  getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  },

  // 2. Haversine distance in km
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d; // Distance in km
  },

  // 3. Estimate road/driving travel distance (typically ~30% higher than straight line)
  estimateTravelDistance(straightDistance: number): number {
    return straightDistance * 1.3;
  },

  // 4. Estimate delivery time based on travel distance
  estimateDeliveryTime(distanceKm: number): { value: number; unit: "mins" | "hours" | "days"; text: string } {
    if (distanceKm <= 0.1) {
      return { value: 5, unit: "mins", text: "5 mins" };
    }
    
    // Average speed of 35 km/h in local traffic, plus 30 mins handling time
    const travelTimeHrs = distanceKm / 35;
    const totalMinutes = Math.round(travelTimeHrs * 60 + 30);

    if (totalMinutes < 60) {
      return { value: totalMinutes, unit: "mins", text: `${totalMinutes} mins` };
    } else if (totalMinutes < 24 * 60) {
      const hours = Math.round(totalMinutes / 60);
      return { value: hours, unit: "hours", text: `${hours} hr${hours > 1 ? "s" : ""}` };
    } else {
      const days = Math.round(totalMinutes / (24 * 60));
      return { value: days, unit: "days", text: `${days} day${days > 1 ? "s" : ""}` };
    }
  }
};

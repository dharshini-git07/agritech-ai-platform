let loadPromise: Promise<any> | null = null;

export const MapService = {
  loadGoogleMaps(): Promise<any> {
    if (typeof window === "undefined") {
      return Promise.reject("Cannot load Google Maps on server side");
    }
    if ((window as any).google?.maps) {
      return Promise.resolve((window as any).google);
    }
    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        resolve((window as any).google);
      };
      script.onerror = (err) => {
        console.warn("Failed to load Google Maps script. Dynamic components will fallback to standard interactive vectors.", err);
        reject(err);
      };
      document.head.appendChild(script);
    });

    return loadPromise;
  }
};

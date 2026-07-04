export interface WeatherData {
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  condition: string;
  location: string;
  timestamp: number;
}

let cachedWeather: WeatherData | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

export async function fetchWeather(
  lat: number = 13.0827,
  lon: number = 80.2707
): Promise<WeatherData> {
  const now = Date.now();
  if (cachedWeather && now - cachedWeather.timestamp < CACHE_DURATION) {
    return cachedWeather;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const hum = Math.round(data.current.relative_humidity_2m);
    const wind = Math.round(data.current.wind_speed_10m);
    const rainProb = data.hourly.precipitation_probability[0] ?? 0;
    const code = data.current.weather_code;

    // Weather code mapping according to WMO code guidelines
    let condition = "Sunny";
    if (code === 0) condition = "Clear Sunny";
    else if (code >= 1 && code <= 3) condition = "Partly Cloudy";
    else if (code >= 45 && code <= 48) condition = "Foggy";
    else if (code >= 51 && code <= 67) condition = "Drizzle/Rainy";
    else if (code >= 71 && code <= 77) condition = "Snowy";
    else if (code >= 80 && code <= 82) condition = "Showers";
    else if (code >= 95 && code <= 99) condition = "Thunderstorm";

    const weather: WeatherData = {
      temperature: temp,
      humidity: hum,
      rainProbability: rainProb,
      windSpeed: wind,
      condition: condition,
      location: lat === 13.0827 && lon === 80.2707 ? "Chennai" : "My Location",
      timestamp: now,
    };

    cachedWeather = weather;
    return weather;
  } catch (error) {
    console.error("Failed to load weather data:", error);
    // Return standard fallback weather
    return {
      temperature: 31,
      humidity: 70,
      rainProbability: 15,
      windSpeed: 12,
      condition: "Partly Cloudy",
      location: "Chennai",
      timestamp: now,
    };
  }
}

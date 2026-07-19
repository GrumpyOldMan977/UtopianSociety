const GYRE_LATITUDE = -32;
const GYRE_LONGITUDE = -120;

type WeatherPayload = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
};

type MarinePayload = {
  current?: {
    wave_height?: number;
    sea_surface_temperature?: number;
    ocean_current_velocity?: number;
  };
};

const weatherDescriptions: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  80: "rain showers",
  81: "rain showers",
  82: "heavy showers",
  95: "thunderstorms",
  96: "thunderstorms with hail",
  99: "severe thunderstorms with hail",
};

function compassPoint(degrees?: number) {
  if (typeof degrees !== "number") return "variable";
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(degrees / 45) % 8];
}

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

function parseHeadlines(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .slice(0, 5)
    .map((match) => ({ title: tagValue(match[1], "title"), url: tagValue(match[1], "link") }))
    .filter((headline) => headline.title && headline.url.startsWith("http"));
}

export async function GET() {
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.search = new URLSearchParams({
    latitude: String(GYRE_LATITUDE),
    longitude: String(GYRE_LONGITUDE),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "GMT",
    cell_selection: "sea",
  }).toString();

  const marineUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
  marineUrl.search = new URLSearchParams({
    latitude: String(GYRE_LATITUDE),
    longitude: String(GYRE_LONGITUDE),
    current: "wave_height,sea_surface_temperature,ocean_current_velocity",
    length_unit: "imperial",
    timezone: "GMT",
    cell_selection: "sea",
  }).toString();

  const newsUrl = "https://feeds.bbci.co.uk/news/world/rss.xml";

  const [weatherResult, marineResult, newsResult] = await Promise.allSettled([
    fetch(weatherUrl, { headers: { Accept: "application/json" } }).then(async (response) => {
      if (!response.ok) throw new Error(`Weather source returned ${response.status}`);
      return response.json() as Promise<WeatherPayload>;
    }),
    fetch(marineUrl, { headers: { Accept: "application/json" } }).then(async (response) => {
      if (!response.ok) throw new Error(`Marine source returned ${response.status}`);
      return response.json() as Promise<MarinePayload>;
    }),
    fetch(newsUrl, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } }).then(async (response) => {
      if (!response.ok) throw new Error(`News source returned ${response.status}`);
      return response.text();
    }),
  ]);

  const weather = weatherResult.status === "fulfilled" ? weatherResult.value.current : undefined;
  const marine = marineResult.status === "fulfilled" ? marineResult.value.current : undefined;
  const headlines = newsResult.status === "fulfilled" ? parseHeadlines(newsResult.value) : [];

  const seaFahrenheit = typeof marine?.sea_surface_temperature === "number"
    ? marine.sea_surface_temperature * 9 / 5 + 32
    : undefined;

  return Response.json({
    location: {
      label: "South Pacific Gyre",
      latitude: GYRE_LATITUDE,
      longitude: GYRE_LONGITUDE,
      note: "Open-ocean model reference point",
    },
    weather: weather ? {
      temperatureF: Math.round(weather.temperature_2m ?? 0),
      feelsLikeF: Math.round(weather.apparent_temperature ?? weather.temperature_2m ?? 0),
      condition: weatherDescriptions[weather.weather_code ?? -1] ?? "mixed conditions",
      windMph: Math.round(weather.wind_speed_10m ?? 0),
      windDirection: compassPoint(weather.wind_direction_10m),
      seaTemperatureF: typeof seaFahrenheit === "number" ? Math.round(seaFahrenheit) : null,
      waveHeightFt: typeof marine?.wave_height === "number" ? Number(marine.wave_height.toFixed(1)) : null,
      currentMph: typeof marine?.ocean_current_velocity === "number" ? Number(marine.ocean_current_velocity.toFixed(1)) : null,
    } : null,
    headlines,
    updatedAt: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=1800",
    },
  });
}

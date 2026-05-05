import { useState, useEffect, useCallback } from "react";

const API = {
  geo: (city) =>
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
  weather: (lat, lon) =>
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weathercode,windspeed_10m,precipitation,uv_index,surface_pressure&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=7`,
};

const WX_MAP = {
  0: { label: "clear sky", icon: "☀" },
  1: { label: "mainly clear", icon: "🌤" },
  2: { label: "partly cloudy", icon: "⛅" },
  3: { label: "overcast", icon: "☁" },
  45: { label: "foggy", icon: "🌫" },
  48: { label: "icy fog", icon: "🌫" },
  51: { label: "light drizzle", icon: "🌦" },
  61: { label: "light rain", icon: "🌧" },
  63: { label: "moderate rain", icon: "🌧" },
  65: { label: "heavy rain", icon: "🌧" },
  71: { label: "light snow", icon: "❄" },
  80: { label: "rain showers", icon: "🌧" },
  95: { label: "thunderstorm", icon: "⛈" },
  99: { label: "hail storm", icon: "⛈" },
};

function wxInfo(code) {
  const keys = Object.keys(WX_MAP).map(Number).sort((a, b) => b - a);
  for (const k of keys) {
    if (code >= k) return WX_MAP[k];
  }
  return { label: "unknown", icon: "🌡" };
}

function toF(c) { return Math.round(c * 9 / 5 + 32); }
function fmt(c, unit) { return unit === "C" ? `${Math.round(c)}°` : `${toF(c)}°`; }

function dayLabel(dateStr, i) {
  if (i === 0) return "Today";
  if (i === 1) return "Tomorrow";
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e6e1",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    padding: "2rem 1.5rem",
    maxWidth: 720,
    margin: "0 auto",
  },
  searchRow: {
    display: "flex",
    gap: 10,
    marginBottom: "2rem",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 44,
    background: "#14141c",
    border: "1px solid #2a2a38",
    borderRadius: 10,
    color: "#e8e6e1",
    fontSize: 15,
    padding: "0 16px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },
  searchBtn: {
    height: 44,
    padding: "0 20px",
    background: "#6c63ff",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    whiteSpace: "nowrap",
  },
  unitBtn: (active) => ({
    height: 36,
    width: 40,
    background: active ? "#6c63ff" : "#14141c",
    border: `1px solid ${active ? "#6c63ff" : "#2a2a38"}`,
    borderRadius: 8,
    color: active ? "#fff" : "#888",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  }),
  hero: {
    background: "#14141c",
    border: "1px solid #2a2a38",
    borderRadius: 16,
    padding: "2rem",
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
  },
  cityName: {
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: "-0.5px",
    color: "#f0ece4",
  },
  dateStr: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  condition: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  condIcon: {
    fontSize: 18,
  },
  bigTemp: {
    fontSize: 64,
    fontWeight: 700,
    letterSpacing: "-3px",
    color: "#f0ece4",
    lineHeight: 1,
  },
  feelsLike: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
    textAlign: "right",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    background: "#14141c",
    border: "1px solid #2a2a38",
    borderRadius: 12,
    padding: "1rem 1.1rem",
  },
  statLabel: {
    fontSize: 11,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 6,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 600,
    color: "#e8e6e1",
  },
  statUnit: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  forecastGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 8,
    marginBottom: 12,
  },
  fcCard: {
    background: "#14141c",
    border: "1px solid #2a2a38",
    borderRadius: 12,
    padding: "0.75rem 0.4rem",
    textAlign: "center",
  },
  fcDay: {
    fontSize: 11,
    color: "#555",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  fcIcon: {
    fontSize: 18,
    marginBottom: 6,
    display: "block",
  },
  fcHi: {
    fontSize: 13,
    fontWeight: 600,
    color: "#e8e6e1",
  },
  fcLo: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  loader: {
    textAlign: "center",
    padding: "3rem 0",
    color: "#555",
    fontSize: 14,
  },
  error: {
    textAlign: "center",
    padding: "2rem 0",
    color: "#e24b4a",
    fontSize: 14,
  },
  accentBar: {
    height: 3,
    background: "#6c63ff",
    borderRadius: 2,
    width: 36,
    marginBottom: 6,
  },
};

export default function WeatherDashboard() {
  const [cityInput, setCityInput] = useState("Delhi");
  const [unit, setUnit] = useState("C");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const geoRes = await fetch(API.geo(city));
      const geoData = await geoRes.json();
      if (!geoData.results?.length) throw new Error("City not found");
      const { latitude, longitude, name, country } = geoData.results[0];
      const wxRes = await fetch(API.weather(latitude, longitude));
      const wxData = await wxRes.json();
      setData({ ...wxData, cityName: `${name}, ${country}` });
    } catch (e) {
      setError(e.message || "Failed to load weather");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather("Delhi"); }, [fetchWeather]);

  const handleSearch = () => fetchWeather(cityInput);
  const handleKey = (e) => e.key === "Enter" && handleSearch();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={styles.root}>
      <div style={styles.searchRow}>
        <input
          style={styles.input}
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="search city..."
        />
        <button style={styles.unitBtn(unit === "C")} onClick={() => setUnit("C")}>°C</button>
        <button style={styles.unitBtn(unit === "F")} onClick={() => setUnit("F")}>°F</button>
        <button
          style={styles.searchBtn}
          onClick={handleSearch}
          onMouseEnter={e => e.target.style.background = "#7c74ff"}
          onMouseLeave={e => e.target.style.background = "#6c63ff"}
        >
          search
        </button>
      </div>

      {loading && <div style={styles.loader}>fetching weather data...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {!loading && !error && data && (() => {
        const c = data.current;
        const daily = data.daily;
        const wx = wxInfo(c.weathercode);

        return (
          <>
            <div style={styles.hero}>
              <div>
                <div style={styles.accentBar} />
                <div style={styles.cityName}>{data.cityName}</div>
                <div style={styles.dateStr}>{dateStr}</div>
                <div style={styles.condition}>
                  <span style={styles.condIcon}>{wx.icon}</span>
                  {wx.label}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={styles.bigTemp}>{fmt(c.temperature_2m, unit)}</div>
                <div style={styles.feelsLike}>feels like {fmt(c.apparent_temperature, unit)}</div>
              </div>
            </div>

            <div style={styles.statsGrid}>
              {[
                { label: "humidity", val: Math.round(c.relative_humidity_2m), unit: "%" },
                { label: "wind speed", val: Math.round(c.windspeed_10m), unit: "km/h" },
                { label: "uv index", val: Math.round(c.uv_index ?? 0), unit: "" },
                { label: "precipitation", val: (c.precipitation ?? 0).toFixed(1), unit: "mm" },
                { label: "pressure", val: Math.round(c.surface_pressure ?? 0), unit: "hPa" },
              ].map(s => (
                <div key={s.label} style={styles.statCard}>
                  <div style={styles.statLabel}>{s.label}</div>
                  <div style={styles.statVal}>
                    {s.val}
                    <span style={styles.statUnit}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.forecastGrid}>
              {daily.time.slice(0, 7).map((t, i) => {
                const fw = wxInfo(daily.weathercode[i]);
                return (
                  <div key={t} style={{
                    ...styles.fcCard,
                    ...(i === 0 ? { borderColor: "#6c63ff" } : {}),
                  }}>
                    <div style={styles.fcDay}>{dayLabel(t, i)}</div>
                    <span style={styles.fcIcon}>{fw.icon}</span>
                    <div style={styles.fcHi}>{fmt(daily.temperature_2m_max[i], unit)}</div>
                    <div style={styles.fcLo}>{fmt(daily.temperature_2m_min[i], unit)}</div>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
}

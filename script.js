const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const statusText = document.getElementById("status");
const weatherSection = document.getElementById("weatherSection");

const locationName = document.getElementById("locationName");
const locationDetails = document.getElementById("locationDetails");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feelsLike");
const cloud = document.getElementById("cloud");
const jsonOutput = document.getElementById("jsonOutput");

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  await getWeather(city);
});

async function getWeather(city) {
  setStatus("Loading weather data...", false);
  weatherSection.classList.add("hidden");

  try {
    // 1. Convert city name into latitude/longitude.
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error("City search request failed.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`No city found for "${city}". Try another city.`);
    }

    const place = geoData.results[0];

    // 2. Use coordinates to request current weather.
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,cloud_cover,wind_speed_10m,weather_code` +
      `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error("Weather request failed. Please try again.");
    }

    const weatherData = await weatherResponse.json();

    renderWeather(place, weatherData);
    setStatus(`Live weather loaded for ${place.name}.`, false);

  } catch (error) {
    console.error(error);
    showError(error.message || "Something went wrong. Please try again.");
  }
}

function renderWeather(place, data) {
  const current = data.current;

  locationName.textContent = `${place.name}, ${place.country}`;
  locationDetails.textContent =
    `${place.admin1 || ""} • Updated: ${formatApiTime(current.time)}`;

  temperature.textContent = Math.round(current.temperature_2m);
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  cloud.textContent = `${current.cloud_cover}%`;

  const info = getWeatherDescription(current.weather_code);
  weatherIcon.textContent = info.icon;
  condition.textContent = info.text;

  // This demonstrates parsing and dynamically rendering nested JSON.
  jsonOutput.textContent = JSON.stringify(
    {
      location: place,
      weather: data
    },
    null,
    2
  );

  weatherSection.classList.remove("hidden");
}

function getWeatherDescription(code) {
  const weatherMap = {
    0: { text: "Clear sky", icon: "☀️" },
    1: { text: "Mainly clear", icon: "🌤️" },
    2: { text: "Partly cloudy", icon: "⛅" },
    3: { text: "Overcast", icon: "☁️" },
    45: { text: "Fog", icon: "🌫️" },
    48: { text: "Depositing rime fog", icon: "🌫️" },
    51: { text: "Light drizzle", icon: "🌦️" },
    53: { text: "Moderate drizzle", icon: "🌦️" },
    55: { text: "Dense drizzle", icon: "🌧️" },
    61: { text: "Slight rain", icon: "🌦️" },
    63: { text: "Moderate rain", icon: "🌧️" },
    65: { text: "Heavy rain", icon: "🌧️" },
    71: { text: "Slight snow", icon: "🌨️" },
    73: { text: "Moderate snow", icon: "🌨️" },
    75: { text: "Heavy snow", icon: "❄️" },
    80: { text: "Slight rain showers", icon: "🌦️" },
    81: { text: "Moderate rain showers", icon: "🌧️" },
    82: { text: "Violent rain showers", icon: "⛈️" },
    95: { text: "Thunderstorm", icon: "⛈️" },
    96: { text: "Thunderstorm with hail", icon: "⛈️" },
    99: { text: "Thunderstorm with heavy hail", icon: "⛈️" }
  };

  return weatherMap[code] || { text: "Weather data available", icon: "🌡️" };
}

function formatApiTime(isoString) {
  return new Date(isoString).toLocaleString();
}

function setStatus(message, isError) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function showError(message) {
  setStatus(message, true);
  weatherSection.classList.add("hidden");
}

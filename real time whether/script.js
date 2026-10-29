/**
 * ==============================================================================
 * Live Weather Telemetry Application - script.js
 * ==============================================================================
 * This script integrates with the OpenWeatherMap API to fetch real-time weather
 * readings and a 5-day weather forecast.
 * 
 * Key Concepts Demonstrated:
 * - Async/Await & Fetch API for asynchronous HTTP requests
 * - Safe DOM manipulation (preventing XSS vulnerabilities)
 * - Array methods: map(), filter(), and reduce()
 * - Error handling with try / catch / finally
 * - Dynamic theme switching based on live telemetry data
 * ==============================================================================
 */

// -----------------------------------------------------------------------------
// Global Application State & DOM Element References
// -----------------------------------------------------------------------------

// Active city name currently displayed (used to keep old data if new search fails)
let currentValidCity = null;

// Search & Control Elements
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearSearchBtn = document.getElementById("clear-search-btn");
const quickCityButtons = document.querySelectorAll(".chip-btn");

// Status, Banners & Spinner Elements
const apiStatusIndicator = document.getElementById("api-status-indicator");
const apiStatusText = document.getElementById("api-status-text");
const statusDot = apiStatusIndicator ? apiStatusIndicator.querySelector(".status-dot") : null;
const apiKeyBanner = document.getElementById("api-key-banner");
const sessionKeyInput = document.getElementById("session-api-key-input");
const saveSessionKeyBtn = document.getElementById("save-session-key-btn");
const errorBanner = document.getElementById("error-banner");
const errorMessageEl = document.getElementById("error-message");
const dismissErrorBtn = document.getElementById("dismiss-error-btn");
const activationHelper = document.getElementById("activation-helper");
const previewSampleBtn = document.getElementById("preview-sample-btn");
const loadingSpinner = document.getElementById("loading-spinner");
const emptyState = document.getElementById("empty-state");
const dashboardContent = document.getElementById("weather-dashboard");

// Current Weather DOM Elements
const cityNameEl = document.getElementById("city-name");
const countryCodeEl = document.getElementById("country-code");
const currentDateEl = document.getElementById("current-date");
const conditionBadge = document.getElementById("condition-badge");
const weatherMainEl = document.getElementById("weather-main");
const currentTempEl = document.getElementById("current-temp");
const weatherDescEl = document.getElementById("weather-desc");
const tempMinEl = document.getElementById("temp-min");
const tempMaxEl = document.getElementById("temp-max");
const weatherIconEl = document.getElementById("weather-icon");

// Metrics DOM Elements
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("wind-speed");
const pressureEl = document.getElementById("pressure");
const cloudsEl = document.getElementById("clouds");
const sunriseTimeEl = document.getElementById("sunrise-time");
const sunsetTimeEl = document.getElementById("sunset-time");

// 5-Day Forecast Container
const forecastCardsContainer = document.getElementById("forecast-cards-container");

// -----------------------------------------------------------------------------
// Helper: Retrieve Active API Key
// -----------------------------------------------------------------------------
/**
 * Safely resolves the OpenWeatherMap API key.
 * Checks config.js first (WEATHER_API_KEY), then checks browser sessionStorage.
 * @returns {string} The active API key or an empty string.
 */
function getActiveApiKey() {
  // Check if WEATHER_API_KEY was declared in config.js
  if (
    typeof WEATHER_API_KEY !== "undefined" &&
    typeof WEATHER_API_KEY === "string" &&
    WEATHER_API_KEY.trim() !== "" &&
    WEATHER_API_KEY.trim() !== "YOUR_OPENWEATHERMAP_API_KEY_HERE"
  ) {
    return WEATHER_API_KEY.trim();
  }

  // Fallback to session storage if key was provided via the UI input
  const sessionKey = sessionStorage.getItem("OPENWEATHER_SESSION_KEY");
  if (sessionKey && sessionKey.trim() !== "") {
    return sessionKey.trim();
  }

  return "";
}

// -----------------------------------------------------------------------------
// UI State Management Functions
// -----------------------------------------------------------------------------

/**
 * Displays the loading spinner and disables user inputs during network requests.
 */
function showLoading() {
  if (loadingSpinner) loadingSpinner.hidden = false;
  if (searchBtn) searchBtn.disabled = true;
  if (searchInput) searchInput.disabled = true;
}

/**
 * Hides the loading spinner and re-enables user inputs.
 */
function hideLoading() {
  if (loadingSpinner) loadingSpinner.hidden = true;
  if (searchBtn) searchBtn.disabled = false;
  if (searchInput) searchInput.disabled = false;
}

/**
 * Displays an error banner with a user-friendly message.
 * Important: Does NOT hide or overwrite valid weather data from a previous search.
 * @param {string} message - Error description to display
 */
function showError(message) {
  if (!errorBanner || !errorMessageEl) return;
  errorMessageEl.textContent = message;
  errorBanner.hidden = false;

  // Show activation helper if 401 Unauthorized error is detected
  if (activationHelper) {
    activationHelper.hidden = !message.includes("401");
  }

  // If no weather data has ever been loaded, keep empty state visible
  if (!currentValidCity && emptyState) {
    emptyState.hidden = false;
    if (dashboardContent) dashboardContent.hidden = true;
  }
}

/**
 * Hides the error banner.
 */
function hideError() {
  if (errorBanner) {
    errorBanner.hidden = true;
  }
  if (activationHelper) {
    activationHelper.hidden = true;
  }
}

/**
 * Updates the API connection status badge in the header.
 * @param {"ready" | "loading" | "error" | "warning"} status 
 * @param {string} label 
 */
function updateApiStatus(status, label) {
  if (!apiStatusText || !statusDot) return;
  apiStatusText.textContent = label;

  statusDot.className = "status-dot";
  if (status === "warning") statusDot.classList.add("warning");
  if (status === "error") statusDot.classList.add("error");
}

// -----------------------------------------------------------------------------
// Core API Fetching Functions
// -----------------------------------------------------------------------------

/**
 * Fetches current weather data for a city from OpenWeatherMap.
 * Endpoint: https://api.openweathermap.org/data/2.5/weather
 * @param {string} cityName - City name entered by user
 * @returns {Promise<Object>} Current weather JSON object
 */
async function fetchCurrentWeather(cityName) {
  const apiKey = getActiveApiKey();
  const encodedCity = encodeURIComponent(cityName.trim());
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${encodeURIComponent(apiKey)}&units=metric`;

  const response = await fetch(url);

  // Validate HTTP response status
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`City "${cityName}" not found. Please check spelling.`);
    } else if (response.status === 401) {
      throw new Error("Invalid or unactivated API key (HTTP 401). If this key was recently created, OpenWeatherMap takes 10 to 30 minutes to activate globally.");
    } else if (response.status === 429) {
      throw new Error("API rate limit exceeded (HTTP 429). Please wait a moment.");
    } else {
      throw new Error(`Weather service error (${response.status}: ${response.statusText || "Request failed"})`);
    }
  }

  return await response.json();
}

/**
 * Fetches 5-day / 3-hour forecast data for a city from OpenWeatherMap.
 * Endpoint: https://api.openweathermap.org/data/2.5/forecast
 * @param {string} cityName - City name entered by user
 * @returns {Promise<Object>} Forecast JSON object
 */
async function fetchForecast(cityName) {
  const apiKey = getActiveApiKey();
  const encodedCity = encodeURIComponent(cityName.trim());
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&appid=${encodeURIComponent(apiKey)}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Forecast not found for "${cityName}".`);
    } else if (response.status === 401) {
      throw new Error("Invalid or unactivated API key for forecast (HTTP 401). If recently created, allow 10-30 mins for activation.");
    } else if (response.status === 429) {
      throw new Error("Forecast API rate limit reached.");
    } else {
      throw new Error(`Forecast service error (${response.status})`);
    }
  }

  return await response.json();
}

// -----------------------------------------------------------------------------
// Forecast Processing with Array Methods (reduce, filter, map)
// -----------------------------------------------------------------------------

/**
 * Groups 3-hour forecast entries by local calendar date, picks a representative
 * daytime entry, and computes daily min/max temperatures.
 * 
 * Uses JavaScript array methods: reduce(), filter(), and map().
 * 
 * @param {Array<Object>} forecastList - Array of 3-hour forecast entries from API
 * @returns {Array<Object>} Array of up to 5 daily forecast summaries
 */
function groupForecastByDay(forecastList) {
  if (!Array.isArray(forecastList) || forecastList.length === 0) {
    return [];
  }

  // 1. Group entries by date string (YYYY-MM-DD) using reduce()
  const groupedByDate = forecastList.reduce((accumulator, entry) => {
    // "dt_txt" format from API is "YYYY-MM-DD HH:mm:ss"
    const dateKey = entry.dt_txt.split(" ")[0];
    if (!accumulator[dateKey]) {
      accumulator[dateKey] = [];
    }
    accumulator[dateKey].push(entry);
    return accumulator;
  }, {});

  // 2. Identify today's date in YYYY-MM-DD format
  const todayDateKey = new Date().toISOString().split("T")[0];

  // 3. Filter out current partial day when future days are available
  const allDateKeys = Object.keys(groupedByDate);
  let targetDates = allDateKeys.filter(date => date !== todayDateKey);

  // Fallback: If filtering today leaves no days (rare timezone edge case), use all days
  if (targetDates.length === 0) {
    targetDates = allDateKeys;
  }

  // Limit display to 5 days
  targetDates = targetDates.slice(0, 5);

  // 4. Transform each date's entries into a daily summary using map()
  return targetDates.map(dateKey => {
    const dayEntries = groupedByDate[dateKey];

    // Pick representative daytime entry around 12:00:00 (midday)
    // If not found, fallback to 15:00:00 or the middle entry
    const representativeEntry =
      dayEntries.find(entry => entry.dt_txt.includes("12:00:00")) ||
      dayEntries.find(entry => entry.dt_txt.includes("15:00:00")) ||
      dayEntries[Math.floor(dayEntries.length / 2)];

    // Calculate minimum temperature for the day using reduce()
    const minTemp = dayEntries.reduce((min, entry) => {
      return entry.main.temp_min < min ? entry.main.temp_min : min;
    }, dayEntries[0].main.temp_min);

    // Calculate maximum temperature for the day using reduce()
    const maxTemp = dayEntries.reduce((max, entry) => {
      return entry.main.temp_max > max ? entry.main.temp_max : max;
    }, dayEntries[0].main.temp_max);

    return {
      dateString: dateKey,
      timestamp: representativeEntry.dt,
      temp: Math.round(representativeEntry.main.temp),
      minTemp: Math.round(minTemp),
      maxTemp: Math.round(maxTemp),
      condition: representativeEntry.weather[0].main,
      description: representativeEntry.weather[0].description,
      icon: representativeEntry.weather[0].icon
    };
  });
}

// -----------------------------------------------------------------------------
// DOM Rendering & Formatting Functions
// -----------------------------------------------------------------------------

/**
 * Formats a UNIX timestamp into a 12-hour time string (e.g. "06:15 AM").
 * Accounts for target city timezone offset in seconds.
 * @param {number} unixTimestamp - Seconds since epoch
 * @param {number} timezoneOffsetSeconds - Offset from UTC in seconds
 * @returns {string} Formatted time string
 */
function formatTime(unixTimestamp, timezoneOffsetSeconds = 0) {
  if (!unixTimestamp) return "--:--";

  // Calculate UTC milliseconds + city offset
  const localMilliseconds = (unixTimestamp + timezoneOffsetSeconds) * 1000;
  const date = new Date(localMilliseconds);

  // Use UTC methods because offset has already been applied
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12

  return `${hours}:${minutes} ${period}`;
}

/**
 * Formats a date into a friendly string (e.g., "Thursday, 29 Oct").
 * @param {number} unixTimestamp - Seconds since epoch
 * @returns {string} Formatted human-readable date
 */
function formatDate(unixTimestamp) {
  if (!unixTimestamp) return "";
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short"
  });
}

/**
 * Formats day of week and date for forecast cards (e.g. "Fri, Oct 31").
 * @param {number} unixTimestamp - Seconds since epoch
 * @returns {Object} { dayName, dateFormatted }
 */
function formatForecastDate(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return {
    dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
    dateFormatted: date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  };
}

/**
 * Safely renders current weather readings into the DOM.
 * Uses safe textContent assignments to avoid HTML injection.
 * @param {Object} data - Current weather JSON from OpenWeatherMap
 */
function displayCurrentWeather(data) {
  if (!data || !data.main || !data.weather || data.weather.length === 0) {
    return;
  }

  // Location Information
  cityNameEl.textContent = data.name || "Unknown Location";
  countryCodeEl.textContent = data.sys && data.sys.country ? data.sys.country : "";
  currentDateEl.textContent = `${formatDate(data.dt)} • Local Time: ${formatTime(data.dt, data.timezone)}`;

  // Condition and Hero Temperature
  weatherMainEl.textContent = data.weather[0].main;
  currentTempEl.textContent = Math.round(data.main.temp);
  weatherDescEl.textContent = data.weather[0].description;
  tempMinEl.textContent = `${Math.round(data.main.temp_min)}°C`;
  tempMaxEl.textContent = `${Math.round(data.main.temp_max)}°C`;

  // Dynamic Weather Icon
  const iconCode = data.weather[0].icon;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${encodeURIComponent(iconCode)}@2x.png`;
  weatherIconEl.alt = `${data.weather[0].description} icon`;

  // Telemetry Metrics Grid
  feelsLikeEl.textContent = `${Math.round(data.main.feels_like)}°C`;
  humidityEl.textContent = `${data.main.humidity}%`;
  windSpeedEl.textContent = `${data.wind.speed} m/s`;
  pressureEl.textContent = `${data.main.pressure} hPa`;
  cloudsEl.textContent = `${data.clouds.all}%`;

  // Sunrise and Sunset times
  sunriseTimeEl.textContent = formatTime(data.sys.sunrise, data.timezone);
  sunsetTimeEl.textContent = formatTime(data.sys.sunset, data.timezone);

  // Reveal main dashboard container and hide empty placeholder
  if (dashboardContent) dashboardContent.hidden = false;
  if (emptyState) emptyState.hidden = true;
}

/**
 * Safely builds and appends five-day forecast cards into the DOM.
 * @param {Object} forecastData - Forecast JSON from OpenWeatherMap
 */
function displayForecast(forecastData) {
  if (!forecastCardsContainer) return;

  // Clear existing cards safely
  forecastCardsContainer.replaceChildren();

  // Process data using map/filter/reduce
  const dailySummaries = groupForecastByDay(forecastData.list);

  if (dailySummaries.length === 0) {
    const emptyNotice = document.createElement("p");
    emptyNotice.textContent = "Forecast data temporarily unavailable.";
    emptyNotice.className = "alert-desc";
    forecastCardsContainer.appendChild(emptyNotice);
    return;
  }

  // Build each daily forecast card with safe DOM elements
  dailySummaries.forEach(day => {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.setAttribute("role", "listitem");

    const { dayName, dateFormatted } = formatForecastDate(day.timestamp);

    // Day of the week
    const dayEl = document.createElement("span");
    dayEl.className = "forecast-day";
    dayEl.textContent = dayName;

    // Date (e.g. Oct 31)
    const dateEl = document.createElement("span");
    dateEl.className = "forecast-date";
    dateEl.textContent = dateFormatted;

    // Weather Icon
    const iconEl = document.createElement("img");
    iconEl.className = "forecast-icon";
    iconEl.src = `https://openweathermap.org/img/wn/${encodeURIComponent(day.icon)}@2x.png`;
    iconEl.alt = day.description;
    iconEl.width = 56;
    iconEl.height = 56;
    iconEl.loading = "lazy";

    // Condition Description
    const descEl = document.createElement("span");
    descEl.className = "forecast-desc";
    descEl.textContent = day.description;

    // Midday Temperature
    const tempEl = document.createElement("span");
    tempEl.className = "forecast-temp";
    tempEl.textContent = `${day.temp}°C`;

    // Min & Max Temperature extremes
    const minMaxRow = document.createElement("div");
    minMaxRow.className = "forecast-minmax";

    const minSpan = document.createElement("span");
    minSpan.className = "temp-min-val";
    minSpan.textContent = `${day.minTemp}°`;
    minSpan.title = "Minimum Temperature";

    const slash = document.createTextNode(" / ");

    const maxSpan = document.createElement("span");
    maxSpan.className = "temp-max-val";
    maxSpan.textContent = `${day.maxTemp}°`;
    maxSpan.title = "Maximum Temperature";

    minMaxRow.appendChild(minSpan);
    minMaxRow.appendChild(slash);
    minMaxRow.appendChild(maxSpan);

    // Assemble Card
    card.appendChild(dayEl);
    card.appendChild(dateEl);
    card.appendChild(iconEl);
    card.appendChild(descEl);
    card.appendChild(tempEl);
    card.appendChild(minMaxRow);

    forecastCardsContainer.appendChild(card);
  });
}

// -----------------------------------------------------------------------------
// Dynamic Background Theming
// -----------------------------------------------------------------------------

/**
 * Changes the page background gradient dynamically to reflect weather conditions.
 * Supports: Clear, Clouds, Rain, Thunderstorm, Snow, and Nighttime.
 * @param {Object} weatherData - Current weather data object
 */
function updateWeatherBackground(weatherData) {
  if (!weatherData || !weatherData.weather || weatherData.weather.length === 0) {
    return;
  }

  const conditionId = weatherData.weather[0].id;
  const iconCode = weatherData.weather[0].icon || "";

  // Check if it is currently night at the searched location
  // 1. Icon ends with 'n' (e.g., '01n', '02n', '10n')
  // 2. OR current timestamp is outside sunrise-to-sunset window
  const isNight =
    iconCode.endsWith("n") ||
    (weatherData.dt && weatherData.sys &&
      (weatherData.dt < weatherData.sys.sunrise || weatherData.dt > weatherData.sys.sunset));

  // Remove existing theme classes
  document.body.classList.remove(
    "theme-default",
    "theme-clear",
    "theme-clouds",
    "theme-rain",
    "theme-thunderstorm",
    "theme-snow",
    "theme-night"
  );

  let selectedTheme = "theme-default";

  // Match OpenWeatherMap weather condition code ranges:
  // 2xx = Thunderstorm
  if (conditionId >= 200 && conditionId < 300) {
    selectedTheme = "theme-thunderstorm";
  }
  // 3xx = Drizzle & 5xx = Rain
  else if (conditionId >= 300 && conditionId < 600) {
    selectedTheme = "theme-rain";
  }
  // 6xx = Snow
  else if (conditionId >= 600 && conditionId < 700) {
    selectedTheme = "theme-snow";
  }
  // 7xx = Atmosphere (Fog, Mist, Smoke, Haze)
  else if (conditionId >= 700 && conditionId < 800) {
    selectedTheme = isNight ? "theme-night" : "theme-clouds";
  }
  // 800 = Clear Sky
  else if (conditionId === 800) {
    selectedTheme = isNight ? "theme-night" : "theme-clear";
  }
  // 80x = Clouds (few, scattered, broken, overcast)
  else if (conditionId > 800 && conditionId < 900) {
    selectedTheme = isNight ? "theme-night" : "theme-clouds";
  }

  document.body.classList.add(selectedTheme);
}

// -----------------------------------------------------------------------------
// Preview / Fallback Telemetry (For testing during API key activation)
// -----------------------------------------------------------------------------

/**
 * Loads authentic sample telemetry for Nagpur so users and evaluators can preview
 * the dashboard layout, metrics, 5-day forecast, and themes while awaiting
 * OpenWeatherMap's server-side key activation (10-30 min window).
 */
function loadSampleTelemetry() {
  const now = Math.floor(Date.now() / 1000);

  const sampleCurrent = {
    name: "Nagpur",
    dt: now,
    timezone: 19800, // UTC +5:30 (IST)
    sys: {
      country: "IN",
      sunrise: now - 28000,
      sunset: now + 14000
    },
    weather: [
      {
        main: "Clear",
        description: "clear sky (sample telemetry)",
        icon: "01d",
        id: 800
      }
    ],
    main: {
      temp: 28.5,
      feels_like: 29.2,
      temp_min: 21.0,
      temp_max: 31.8,
      humidity: 46,
      pressure: 1012
    },
    wind: {
      speed: 3.6
    },
    clouds: {
      all: 10
    }
  };

  const getFutureDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  };

  const sampleForecast = {
    list: [
      {
        dt: now + 86400,
        dt_txt: `${getFutureDate(1)} 12:00:00`,
        main: { temp: 30, temp_min: 21, temp_max: 32 },
        weather: [{ main: "Clear", description: "sunny & clear", icon: "01d" }]
      },
      {
        dt: now + 172800,
        dt_txt: `${getFutureDate(2)} 12:00:00`,
        main: { temp: 29, temp_min: 20, temp_max: 31 },
        weather: [{ main: "Clouds", description: "few clouds", icon: "02d" }]
      },
      {
        dt: now + 259200,
        dt_txt: `${getFutureDate(3)} 12:00:00`,
        main: { temp: 27, temp_min: 19, temp_max: 28 },
        weather: [{ main: "Clouds", description: "scattered clouds", icon: "03d" }]
      },
      {
        dt: now + 345600,
        dt_txt: `${getFutureDate(4)} 12:00:00`,
        main: { temp: 26, temp_min: 18, temp_max: 27 },
        weather: [{ main: "Rain", description: "light passing rain", icon: "10d" }]
      },
      {
        dt: now + 432000,
        dt_txt: `${getFutureDate(5)} 12:00:00`,
        main: { temp: 28, temp_min: 20, temp_max: 30 },
        weather: [{ main: "Clear", description: "clear sky", icon: "01d" }]
      }
    ]
  };

  hideError();
  displayCurrentWeather(sampleCurrent);
  displayForecast(sampleForecast);
  updateWeatherBackground(sampleCurrent);
  currentValidCity = "Nagpur (Preview)";
  updateApiStatus("warning", "Preview Mode");

  if (searchInput) {
    searchInput.value = "Nagpur, IN";
  }
}

// -----------------------------------------------------------------------------
// Orchestration: Search Function
// -----------------------------------------------------------------------------

/**
 * Orchestrates the complete weather search workflow:
 * 1. Validates input and API key
 * 2. Fetches current weather and forecast in parallel
 * 3. Updates DOM and dynamic background
 * 4. Gracefully handles errors without clearing previous valid results
 * 
 * @param {string} cityName - Target city name
 */
async function searchWeather(cityName) {
  // Input validation
  const query = (cityName || "").trim();
  if (!query) {
    showError("Please enter a city name to search.");
    return;
  }

  // API Key validation
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    showError("API key missing. Please define WEATHER_API_KEY in config.js or enter a key above.");
    if (apiKeyBanner) apiKeyBanner.hidden = false;
    updateApiStatus("warning", "No API Key");
    return;
  }

  showLoading();
  updateApiStatus("loading", "Fetching...");

  try {
    // Fetch current weather and 5-day forecast concurrently for optimal performance
    const [currentData, forecastData] = await Promise.all([
      fetchCurrentWeather(query),
      fetchForecast(query)
    ]);

    // On success: clear any active error message
    hideError();

    // Render weather telemetry and forecast
    displayCurrentWeather(currentData);
    displayForecast(forecastData);
    updateWeatherBackground(currentData);

    // Update state & status
    currentValidCity = currentData.name;
    updateApiStatus("ready", "Online");

    // Pre-fill search input with formatted name
    if (searchInput) {
      searchInput.value = `${currentData.name}${currentData.sys && currentData.sys.country ? ", " + currentData.sys.country : ""}`;
    }
  } catch (error) {
    console.error("Weather application error:", error);
    updateApiStatus("error", "Error");

    // Display clear error message without clearing previously displayed weather
    if (error instanceof TypeError && error.message.includes("fetch")) {
      showError("Network failure. Please check your internet connection.");
    } else {
      showError(error.message || "An unexpected error occurred while fetching weather data.");
    }
  } finally {
    hideLoading();
  }
}

// -----------------------------------------------------------------------------
// Event Listeners & Initialization
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const apiKey = getActiveApiKey();

  // Search form submit event (supports pressing Enter or clicking Search button)
  if (searchForm) {
    searchForm.addEventListener("submit", event => {
      event.preventDefault();
      const city = searchInput ? searchInput.value : "";
      searchWeather(city);
    });
  }

  // Clear search input button behavior
  if (searchInput && clearSearchBtn) {
    searchInput.addEventListener("input", () => {
      clearSearchBtn.hidden = searchInput.value.length === 0;
    });

    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearSearchBtn.hidden = true;
      searchInput.focus();
    });
  }

  // Error banner dismiss button
  if (dismissErrorBtn) {
    dismissErrorBtn.addEventListener("click", () => {
      hideError();
    });
  }

  // Preview sample telemetry button handler
  if (previewSampleBtn) {
    previewSampleBtn.addEventListener("click", () => {
      loadSampleTelemetry();
    });
  }

  // Quick suggestion chips
  quickCityButtons.forEach(button => {
    button.addEventListener("click", () => {
      const city = button.getAttribute("data-city");
      if (city) {
        if (searchInput) searchInput.value = city;
        searchWeather(city);
      }
    });
  });

  // Session API Key Save handler (for instant browser testing)
  if (saveSessionKeyBtn && sessionKeyInput) {
    saveSessionKeyBtn.addEventListener("click", () => {
      const key = sessionKeyInput.value.trim();
      if (key) {
        sessionStorage.setItem("OPENWEATHER_SESSION_KEY", key);
        if (apiKeyBanner) apiKeyBanner.hidden = true;
        updateApiStatus("ready", "Ready");
        hideError();
        // Automatically test with Nagpur once key is entered
        searchWeather("Nagpur");
      } else {
        showError("Please enter a valid API key string.");
      }
    });

    sessionKeyInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        saveSessionKeyBtn.click();
      }
    });
  }

  // Initial Startup Logic:
  // If API key is configured, load initial city (Nagpur) as requested.
  // Otherwise, show the API key setup banner and empty state.
  if (apiKey) {
    if (apiKeyBanner) apiKeyBanner.hidden = true;
    updateApiStatus("ready", "Ready");
    searchWeather("Nagpur");
  } else {
    if (apiKeyBanner) apiKeyBanner.hidden = false;
    if (emptyState) emptyState.hidden = false;
    updateApiStatus("warning", "Key Required");
  }
});

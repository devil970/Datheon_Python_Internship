# 🌦️ Live Weather Telemetry Application (Weather Dashboard)

A responsive, real-time weather telemetry and 5-day forecast dashboard built with vanilla **HTML5**, **CSS3 (Flexbox & CSS Grid)**, and **JavaScript (ES6+)**. The application interfaces directly with the [OpenWeatherMap API](https://openweathermap.org/api) using modern `async/await` and the native `fetch()` API.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [File Structure](#-file-structure)
5. [Local Setup & Configuration](#-local-setup--configuration)
6. [Frontend Security Architecture](#-frontend-security-architecture)
7. [JavaScript Implementation & Function Breakdown](#-javascript-implementation--function-breakdown)
8. [Dynamic Background Themes](#-dynamic-background-themes)
9. [Error Handling & Edge Cases](#-error-handling--edge-cases)
10. [Troubleshooting Common Issues](#-troubleshooting-common-issues)
11. [Evaluation Q&A Preparation](#-evaluation-qa-preparation)

---

## 🌟 Project Overview
This project was developed as a frontend engineering internship submission. It demonstrates core web development competencies including:
- Asynchronous API communication using `fetch()` and `async/await`
- Parallel request execution (`Promise.all()`) for current readings and multi-day forecasts
- Data parsing and transformation utilizing functional array methods (`map()`, `filter()`, `reduce()`)
- Safe DOM manipulation practices to prevent Cross-Site Scripting (XSS)
- Responsive layout design using modern CSS Grid and Flexbox without heavy third-party UI frameworks
- Dynamic UI state transitions (loading states, dynamic weather background themes, non-destructive error banners)

---

## ⚡ Key Features

- **Global City Search:** Search any global city by name with immediate feedback on `Enter` key or search button click.
- **Initial Telemetry Example:** Defaults to **Nagpur** on launch when configured, fetching genuine API readings (no hardcoded/fake weather values).
- **Comprehensive Current Telemetry:**
  - Temperature in °C and conditions description
  - Dynamic official OpenWeatherMap weather icon
  - Minimum & Maximum daily temperatures
  - "Feels Like" temperature
  - Humidity percentage (%)
  - Wind speed in meters per second (m/s)
  - Atmospheric pressure in hectopascals (hPa)
  - Cloud cover percentage (%)
  - Sunrise and sunset times adjusted to target city's timezone
- **5-Day Weather Forecast:**
  - 40 individual 3-hour interval reports grouped by calendar day using `reduce()`
  - Current partial day filtered out using `filter()`
  - Daytime representative weather selected for icon and condition
  - Daily minimum and maximum temperatures calculated across each day's entries using `reduce()`
- **Dynamic Weather Themes:**
  - Background smoothly transitions across six distinct gradients:
    - ☀️ **Clear Sky:** Warm sunny amber & sky blue
    - ☁️ **Clouds / Atmosphere:** Soft overcast slate grey & muted blue
    - 🌧️ **Rain / Drizzle:** Atmospheric cool steel blue
    - ⛈️ **Thunderstorm:** Moody dark storm violet & charcoal
    - ❄️ **Snow:** Frosty pale silver-grey
    - 🌙 **Night:** Deep midnight celestial blue
- **Non-Destructive Error Handling:**
  - If a search fails (e.g., misspelled city or network glitch), a clear notification banner appears **without wiping out** previously loaded weather telemetry.
- **No Heavy Frameworks:** Pure vanilla HTML, CSS, and JS with zero npm build step required.

---

## 🛠️ Technology Stack

| Layer | Technology | Usage |
|---|---|---|
| **Structure** | Semantic HTML5 | Accessible document hierarchy (`<header>`, `<main>`, `<section>`, `aria-*`) |
| **Styling** | Vanilla CSS3 | Flexbox, CSS Grid, CSS Custom Properties (Variables), Keyframe animations |
| **Logic** | Vanilla JavaScript (ES6+) | `async/await`, Fetch API, `map()`, `filter()`, `reduce()`, DOM APIs |
| **API** | OpenWeatherMap REST API | `/data/2.5/weather` and `/data/2.5/forecast` endpoints |

---

## 📂 File Structure

```text
weather-dashboard/
│
├── index.html          # Semantic application layout & template structure
├── style.css           # Design tokens, responsive grid/flexbox, dynamic weather themes
├── script.js          # Core application logic, API fetchers, DOM renderers
├── config.js           # Local configuration containing WEATHER_API_KEY (excluded from Git)
├── config.example.js   # Version-controlled template showing how to configure the API key
├── .gitignore          # Prevents config.js and IDE files from being pushed to source control
└── README.md           # Project documentation, architecture notes, and run instructions
```

---

## 🚀 Local Setup & Configuration

### Step 1: Clone or Open the Workspace
Open the project directory in your code editor (e.g., VS Code).

### Step 2: Obtain an OpenWeatherMap API Key
1. Visit [https://openweathermap.org/api](https://openweathermap.org/api) and sign up for a free account.
2. Navigate to your account profile and select **API keys** ([https://home.openweathermap.org/api_keys](https://home.openweathermap.org/api_keys)).
3. Generate a default free key.  
   *(Note: Newly generated OpenWeatherMap keys typically take 10 to 30 minutes to activate on OpenWeatherMap's servers).*

### Step 3: Add Your Key to `config.js`
Open `config.js` and assign your key to the `WEATHER_API_KEY` constant:
```javascript
const WEATHER_API_KEY = "your_32_character_api_key_here";
```

### Step 4: Run the Application
Because this is a pure static web application, you can run it via any of the following methods:
- **Direct Browser Execution:** Double-click `index.html` to open it in Google Chrome, Microsoft Edge, Firefox, or Safari.
- **VS Code Live Server:** Right-click `index.html` inside VS Code and select **"Open with Live Server"**.
- **Python Local Server (optional):**
  ```bash
  python -m http.server 8000
  ```
  Then open `http://localhost:8000` in your web browser.

---

## 🔐 Frontend Security Architecture

### Why is `config.js` in `.gitignore`?
The `.gitignore` file prevents your personal `config.js` file from being pushed to public source control repositories like GitHub. This protects your API credentials from being scraped by automated bots crawling public Git commits.

### Can a Frontend-Only Web App Keep an API Key Truly Secret?
> **Important Engineering Reality:**
> **No.** A frontend-only (client-side) web application **cannot** keep an API key completely secret from users.
> 
> Because JavaScript executes directly inside the user's browser, any network request sent via `fetch()` exposes the API key in the browser's Developer Tools (Network tab and DOM inspect).
>
> **Best Practice for Production:**
> In production enterprise applications, the client frontend should never call third-party APIs directly with secret keys. Instead, requests should be made to a lightweight backend proxy server (e.g., Node.js/Express, Python/FastAPI, or a serverless function). The backend securely holds the API key in server-side environment variables, fetches the data, and returns it to the client.

---

## 🧠 JavaScript Implementation & Function Breakdown

The codebase follows clean functional separation with beginner-friendly, descriptive names:

### 1. `searchWeather(cityName)`
Orchestrator function triggered on search submission. Validates query strings, checks API key presence, sets loading state, triggers concurrent fetches via `Promise.all()`, updates DOM elements, and safely catches errors.

### 2. `fetchCurrentWeather(cityName)`
Sends a `fetch()` HTTP GET request to OpenWeatherMap's `/weather` endpoint with `units=metric` and properly encoded city parameters (`encodeURIComponent`). Checks `response.ok` and throws meaningful exceptions on status codes `404`, `401`, or `429`.

### 3. `fetchForecast(cityName)`
Fetches 5-day / 3-hour forecast readings from the `/forecast` endpoint.

### 4. `groupForecastByDay(forecastList)`
Demonstrates functional JavaScript array methods:
- **`reduce()`**: Groups the 40 raw 3-hour entries into date-based buckets (`"YYYY-MM-DD"`).
- **`filter()`**: Identifies and excludes today's partial day so users see up to 5 complete future days.
- **`map()`**: Selects the midday (12:00 PM) representative entry for condition icon and daytime temperature.
- **`reduce()`**: Calculates true daily minimum and maximum temperatures across each day's entries.

### 5. `displayCurrentWeather(data)`
Extracts temperatures, humidity, wind, pressure, cloudiness, and formatted sunrise/sunset times. Injects data safely using `textContent` and `setAttribute` to prevent any XSS vulnerability.

### 6. `displayForecast(forecastData)`
Dynamically creates accessible card elements (`document.createElement`) and populates the 5-day forecast grid with date, weather icon, description, and high/low temperature metrics.

### 7. `updateWeatherBackground(weatherData)`
Inspects OpenWeatherMap condition IDs (2xx Thunderstorm, 3xx/5xx Rain, 6xx Snow, 800 Clear, 80x Clouds) as well as the night icon flag (`n`) to switch CSS gradient classes smoothly on `document.body`.

### 8. `showLoading()` / `hideLoading()`
Toggles loading spinners and disables the search button and input to prevent duplicate API requests while in flight.

### 9. `showError(message)` / `hideError()`
Manages accessible alert banners. Crucially, it does not erase the weather dashboard if valid data is already on screen.

---

## 🎨 Dynamic Background Themes

The application includes six tailored color palettes with smooth 0.8s CSS transitions:

```css
/* Dynamic CSS Theme Mapping */
body.theme-clear        /* Warm amber sunburst to sky blue */
body.theme-clouds       /* Overcast slate grey & muted blue */
body.theme-rain         /* Atmospheric cool steel blue */
body.theme-thunderstorm /* Moody storm violet & charcoal */
body.theme-snow         /* Frosty pale cool grey */
body.theme-night        /* Deep celestial midnight navy */
```

High contrast card backgrounds ensure all telemetry readings and texts remain easily readable across every theme.

---

## 🛡️ Error Handling & Edge Cases

| Test Case | System Response |
|---|---|
| **Empty Search Submitted** | Shows warning banner: *"Please enter a city name to search."* No network request is wasted. |
| **Invalid City Name (e.g. `xyz999` -> 404)** | Error banner: *"City 'xyz999' not found. Please check spelling."* Previous city data remains intact. |
| **Missing or Invalid API Key (401)** | Highlights the API configuration banner prompting the user to add their key to `config.js`. |
| **Rate Limit Exceeded (429)** | Displays user-friendly notice to wait before making further calls. |
| **Network Disconnection / Offline** | Catches `TypeError: Failed to fetch` and displays *"Network failure. Please check your internet connection."* |
| **Concurrent Submissions** | Button and input are disabled during fetch to prevent spamming the API. |

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "City not found (404)"
- **Cause:** Typo in city name or non-existent location.
- **Resolution:** Verify spelling. Try appending the two-letter ISO country code (e.g. `"Nagpur, IN"` or `"London, UK"`).

### Issue 2: "Invalid API key (401)"
- **Cause:** The key has not been pasted into `config.js`, has accidental whitespace/characters, or is a brand-new key still awaiting activation.
- **Resolution:** Double-check `config.js`. If you just generated the key on OpenWeatherMap, please allow 10 to 30 minutes for their activation servers to register it.

### Issue 3: Background or Icons Not Loading
- **Cause:** Adblocker blocking external image domains or local file policy.
- **Resolution:** Ensure internet access is enabled to load OpenWeatherMap icons from `https://openweathermap.org/img/wn/`.

---

## 🎓 Internship Evaluation Q&A Preparation

**Q1: Why did you use `Promise.all()` in `searchWeather()`?**  
> *"Because current weather and 5-day forecast are two separate API endpoints. By calling them with `Promise.all([fetchCurrentWeather(), fetchForecast()])`, the browser executes both HTTP requests concurrently in parallel instead of sequentially, reducing the total wait time by roughly 50%."*

**Q2: How did you group 40 forecast readings into 5 daily cards?**  
> *"The `/forecast` endpoint returns 8 readings per day at 3-hour intervals. I used JavaScript's `reduce()` method to group these entries by calendar date (`YYYY-MM-DD`). Then I used `filter()` to remove today's partial day, `map()` to transform each date into a daily summary, and another `reduce()` to calculate the true minimum and maximum temperatures across all entries for that day."*

**Q3: Why did you avoid using `innerHTML` for displaying API data?**  
> *"Directly assigning untrusted strings to `innerHTML` can introduce Cross-Site Scripting (XSS) risks. I used safe DOM methods like `textContent`, `setAttribute`, and `document.createElement()` to ensure data is safely treated as text rather than executable markup."*

**Q4: How does dynamic theming work?**  
> *"Each OpenWeatherMap condition has an integer code: 200s for thunderstorms, 300s/500s for rain, 600s for snow, and 800s for clear/clouds. OpenWeatherMap icons also end in 'd' for day or 'n' for night. The `updateWeatherBackground()` function reads these values and applies the corresponding CSS class to the `<body>` element, which triggers smooth CSS gradient transitions."*

---

## 📄 License
This project is open-source and intended for educational and internship demonstration purposes.

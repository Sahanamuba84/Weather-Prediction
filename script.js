// script.js (Full Backend-Connected Version)

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const toggleUnitsBtn = document.getElementById("toggleUnits");
const darkModeToggle = document.getElementById("darkModeToggle");
const voiceBtn = document.getElementById("voiceBtn");
const clearHistoryBtn = document.getElementById("clearHistory");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const condition = document.getElementById("condition");
const weatherIcon = document.getElementById("weatherIcon");
const dateTime = document.getElementById("dateTime");
const forecastContainer = document.getElementById("forecastContainer");
const suggestionText = document.getElementById("suggestionText");
const alertSection = document.getElementById("alertSection");
const historyList = document.getElementById("historyList");

let isCelsius = true;
let chart;

setInterval(() => {
  dateTime.textContent = new Date().toLocaleString();
}, 1000);

function fetchWeather(city) {
  const unit = isCelsius ? "metric" : "imperial";
  fetch(`http://localhost:5000/api/weather?city=${city}&units=${unit}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
        return;
      }
      displayWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
      fetchAlerts(data.coord.lat, data.coord.lon);
      loadSearchHistory();
    });
}

function fetchForecast(lat, lon) {
  const unit = isCelsius ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=fa051948f6d015cdb1554b304e1e24e1&units=${unit}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      forecastContainer.innerHTML = "";
      const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
      const labels = [], minTemps = [], maxTemps = [];

      daily.forEach(forecast => {
        const date = new Date(forecast.dt_txt).toLocaleDateString();
        labels.push(date);
        minTemps.push(forecast.main.temp_min);
        maxTemps.push(forecast.main.temp_max);

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
          <p>${date}</p>
          <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" />
          <p>${forecast.main.temp.toFixed(1)} ${isCelsius ? '°C' : '°F'}</p>
        `;
        forecastContainer.appendChild(card);
      });

      drawTempChart(labels, minTemps, maxTemps);
    });
}

function fetchAlerts(lat, lon) {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=fa051948f6d015cdb1554b304e1e24e1`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      alertSection.innerHTML = "";
      if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach(alert => {
          const div = document.createElement("div");
          div.innerHTML = `⚠️ <strong>${alert.event}</strong>: ${alert.description}`;
          alertSection.appendChild(div);
        });
      } else {
        alertSection.innerHTML = "✅ No weather alerts.";
      }
    });
}

function drawTempChart(days, minTemps, maxTemps) {
  const ctx = document.getElementById("tempChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: `Min Temp (${isCelsius ? '°C' : '°F'})`,
          data: minTemps,
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        },
        {
          label: `Max Temp (${isCelsius ? '°C' : '°F'})`,
          data: maxTemps,
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function displayWeather(data) {
  const temp = data.main.temp;
  cityName.textContent = data.name;
  temperature.textContent = `Temperature: ${temp.toFixed(1)} ${isCelsius ? '°C' : '°F'}`;
  humidity.textContent = `Humidity: ${data.main.humidity}%`;
  wind.textContent = `Wind: ${data.wind.speed} ${isCelsius ? 'm/s' : 'mph'}`;
  condition.textContent = `Condition: ${data.weather[0].main}`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  displaySuggestion(data.weather[0].main, temp);
}

function displaySuggestion(weather, temp) {
  let suggestion = "Dress comfortably.";
  if (weather.includes("Rain") || weather.includes("Thunderstorm")) {
    suggestion = "🌧️ It's rainy. Carry an umbrella!";
  } else if (weather.includes("Snow")) {
    suggestion = "❄️ Snowy outside. Wear warm layers!";
  } else if (temp <= (isCelsius ? 15 : 59)) {
    suggestion = "🧥 It's cold. Wear a jacket!";
  } else if (temp >= (isCelsius ? 32 : 90)) {
    suggestion = "🌞 It's hot. Use sunscreen!";
  } else if (weather.includes("Clear")) {
    suggestion = "😎 Clear skies. Light clothing is fine.";
  }
  suggestionText.textContent = suggestion;
}

function loadSearchHistory() {
  fetch("http://localhost:5000/api/history")
    .then(res => res.json())
    .then(history => {
      historyList.innerHTML = "";
      history.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.city} — ${new Date(item.date).toLocaleString()}`;
        li.onclick = () => fetchWeather(item.city);
        historyList.appendChild(li);
      });
    });
}

function clearHistory() {
  localStorage.removeItem("weatherHistory");
  historyList.innerHTML = "";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function toggleUnits() {
  isCelsius = !isCelsius;
  const lastCity = cityName.textContent;
  if (lastCity && lastCity !== "City Name") {
    fetchWeather(lastCity);
  }
}

function useVoiceSearch() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    cityInput.value = transcript;
    fetchWeather(transcript);
  };
}

searchBtn.onclick = () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
};

locationBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const unit = isCelsius ? "metric" : "imperial";
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=fa051948f6d015cdb1554b304e1e24e1&units=${unit}`)
      .then(res => res.json())
      .then(data => {
        displayWeather(data);
        fetchForecast(latitude, longitude);
        fetchAlerts(latitude, longitude);
        loadSearchHistory();
      });
  });
};

toggleUnitsBtn.onclick = toggleUnits;
darkModeToggle.onclick = toggleDarkMode;
voiceBtn.onclick = useVoiceSearch;
clearHistoryBtn.onclick = clearHistory;

loadSearchHistory();

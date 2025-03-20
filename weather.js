//Retrieve the latitude and longitude from the page
//Plug the latitude and longitude into the weather API call
//Retrieve the data with the closest dt to the current unix time stamp
//Display the weather data on the page
//Data changes every hour, with the first available data always being 3 hours from current hour, then having intervals of 3 hours after eg 16:10 would show 19:00, 22:00, 01:00 etc

//Collect the latitude and longitude from the page and the plug into API call
let scriptEl = document.querySelector("#__NEXT_DATA__");
let objData = {
  data: JSON.parse(scriptEl.innerText),
};
let lat =
  objData.data.props.pageProps.appContext.place.data.location.latitudeLongitude
    .latitude;
let long =
  objData.data.props.pageProps.appContext.place.data.location.latitudeLongitude
    .longitude;
const apiId = "a2ef86c41a"; //Refer to API id

async function fetchWeatherData() {
  try {
    const weatherEndpoint = `https://europe-west1-amigo-actions.cloudfunctions.net/recruitment-mock-weather-endpoint/forecast?appid=${apiId}&lat=${lat}&lon=${long}`;
    const response = await fetch(weatherEndpoint);
    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }
    const data = await response.json();
    currentWeatherData(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

async function initWeather() {
  if (!lat || !long) {
    console.error("Latitude and longitude not found on the page.");
  } else {
    await fetchWeatherData();
  }
}

initWeather();

// Function to find the closest forecast
function findClosestForecast(weatherData, currentTime) {
  let closestForecast = null;
  let minTimeDifference = Infinity;

  weatherData.list.forEach((forecast) => {
    const forecastTime = forecast.dt;
    const timeDifference = Math.abs(currentTime - forecastTime);

    if (timeDifference < minTimeDifference) {
      minTimeDifference = timeDifference;
      closestForecast = forecast;
    }
  });

  return closestForecast;
}

// Function to calculate average temperatures for the next 3 days
function calculateAverageTemperatures(weatherData) {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  function getDateFromDtTxt(dtTxt) {
    return dtTxt.split(" ")[0];
  }

  const groupedByDate = {};
  weatherData.list.forEach((forecast) => {
    const forecastDate = getDateFromDtTxt(forecast.dt_txt);

    const forecastDay = new Date(forecastDate).getDate();
    const forecastMonth = new Date(forecastDate).getMonth();
    const forecastYear = new Date(forecastDate).getFullYear();

    if (
      forecastYear === currentYear &&
      forecastMonth === currentMonth &&
      forecastDay === currentDay
    ) {
      return;
    }

    if (!groupedByDate[forecastDate]) {
      groupedByDate[forecastDate] = [];
    }
    groupedByDate[forecastDate].push(forecast.main.temp);
  });

  const next3Days = Object.keys(groupedByDate).sort().slice(0, 3);

  const averages = next3Days.map((date) => {
    const temps = groupedByDate[date];
    const totalTemp = temps.reduce((sum, temp) => sum + temp, 0);
    const averageTemp = totalTemp / temps.length;

    const formattedDate = new Date(date)
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-");

    return { date: formattedDate, averageTemp: Math.round(averageTemp) };
  });

  return averages;
}

// Function to create the weather container
function createWeatherContainer(closestForecast) {
  const weatherContainer = document.createElement("div");
  weatherContainer.id = "weather-info";
  weatherContainer.style =
    "margin: 20px auto; padding: 32px; border-top: 1px solid #bfbbbb; border-bottom: 1px solid #bfbbbb; max-width: 1440px; box-sizing: border-box; font-family: 'NationalTrustTT', Georgia, serif;";

  const dtParts = closestForecast.dt_txt.split(" ");
  const formattedDate = new Date(dtParts[0])
    .toLocaleDateString("en-GB")
    .replace(/\//g, "-");
  const dtText = `${formattedDate} ${dtParts[1]}`;

  const temperature = Math.round(closestForecast.main.temp);
  const weatherDescription =
    closestForecast.weather[0].description.charAt(0).toUpperCase() +
    closestForecast.weather[0].description.slice(1);
  const humidity = closestForecast.main.humidity;
  const windSpeed = closestForecast.wind.speed.toFixed(1);

  const iconCode = closestForecast.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  weatherContainer.innerHTML = `
      <div style="display: flex; margin-bottom: 10px;">
        <h3 style="margin: 0;">Location Weather Forecast</h3>
        <img src="${iconUrl}" alt="Weather Icon" style="width: 50px; height: 50px; margin-left: 10px;" />
      </div>
      <h4>${dtText}</h4>
      <p style="display: inline-block; margin-right: 10px;">
        <strong>Temperature:</strong> ${temperature}°C
      </p>
      <span style="display: inline-block; border-left: 1px solid #000; height: 20px; margin: 0 10px;"></span>
      <p style="display: inline-block; margin-right: 10px;">
        <strong>Condition:</strong> ${weatherDescription}
      </p>
      <span style="display: inline-block; border-left: 1px solid #000; height: 20px; margin: 0 10px;"></span>
      <p style="display: inline-block; margin-right: 10px;">
        <strong>Humidity:</strong> ${humidity}%
      </p>
      <span style="display: inline-block; border-left: 1px solid #000; height: 20px; margin: 0 10px;"></span>
      <p style="display: inline-block; margin-right: 10px;">
        <strong>Wind Speed:</strong> ${windSpeed} m/s
      </p>
    `;

  return weatherContainer;
}

// Function to display average temperatures
function displayAverageTemperatures(averages, weatherContainer) {
  const averagesSection = document.createElement("div");
  averagesSection.style = "margin-top: 20px;";
  averagesSection.innerHTML = `<h4>Average Temperatures for the Next 3 Days</h4>`;

  averages.forEach((day) => {
    const box = document.createElement("div");
    box.style =
      "display: inline-block; padding: 10px; margin: 10px; border: 1px solid #000; border-radius: 5px; background-color: #f9f9f9; text-align: center; width: 150px;";
    box.innerHTML = `
      <strong>${day.date}</strong>
      <p>${day.averageTemp}°C</p>
      `;
    averagesSection.appendChild(box);
  });

  weatherContainer.appendChild(averagesSection);
}

// Main function to process and display weather data
function currentWeatherData(weatherData) {
  const currentTime = Math.floor(Date.now() / 1000);

  const closestForecast = findClosestForecast(weatherData, currentTime);

  if (closestForecast) {
    const weatherContainer = createWeatherContainer(closestForecast);

    const averages = calculateAverageTemperatures(weatherData);

    displayAverageTemperatures(averages, weatherContainer);

    const contentElement = document.querySelector("#content");
    if (!contentElement) {
      console.error("Content element not found.");
      return;
    }

    const secondChild = contentElement.children[1];
    if (secondChild) {
      contentElement.insertBefore(weatherContainer, secondChild);
    } else {
      contentElement.appendChild(weatherContainer);
    }
  }
}

//Retrieve the latitude and longitude from the page
//Plug the latitude and longitude into the weather API call
//Retrieve the data with the closest dt to before the current unix time stamp
//Display the weather data on the page
//Data changes every hour, with the first available data always being 3 hours from current hour, then having intervals of 3 hours after eg 16:10 would show 19:00, 22:00, 01:00 etc

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

function currentWeatherData(weatherData) {
  const currentTime = Math.floor(Date.now() / 1000);

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

  if (closestForecast) {
    const weatherContainer = document.createElement("div");
    weatherContainer.id = "weather-info";
    weatherContainer.style =
      "margin: 20px auto; padding: 32px; border-top: 1px solid #bfbbbb; border-bottom: 1px solid #bfbbbb; max-width: 1440px; box-sizing: border-box; font-family: 'NationalTrustTT', Georgia, serif;";

    const dtText = closestForecast.dt_txt;
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

    const contentElement = document.querySelector("#content");
    if (!contentElement) {
      console.error("Content element not found.");
      return;
    }

    const secondChild = contentElement.children[1]; // Get the second child
    if (secondChild) {
      contentElement.insertBefore(weatherContainer, secondChild);
    } else {
      contentElement.appendChild(weatherContainer);
    }
  }
}

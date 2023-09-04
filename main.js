// Import the required library
require("chart.js");
const chartTrendline = require("chartjs-plugin-trendline");

// DOM elements
const switch1 = document.getElementById("switch1");
const switch2 = document.getElementById("switch2");
const switch3 = document.getElementById("switch3");
const countrySwitch = document.getElementById("countrySwitch");
const radarCanvas = document.getElementById("radarCanvas");
const scatterCanvas = document.getElementById("scatterCanvas");
const countryCanvas = document.getElementById("countryCanvas");

// variables
let data; // keep the json respond data
let option1 = switch1.value;
let option2 = switch2.value;
let option3 = switch3.value;
let radarChart; // keeping reference to radar chart
let radarData = []; // keeping correlation data for specific key
let radarLabels = []; // keeping labels. I want to remove IQ to IQ thus need to keep array filed in the same order as data
let radarCountries = 0; // number of countries based on which the correlation was calculated
let scatterChart; // keeping referene to scatter chart
let scatterData = [];
let scatterLabels = [];
let scatterCountries = 0;
let countryChart; // keeping reference to country chart
let countryData = [];
let countryLabels = [];
let worldData = [];
let worldLabels = [];
let totalPopulation = 0; // total globe population

// add all countries as an options to country select
function addCountriesToSelect() {
    data.forEach((country) => {
        let countryOption = document.createElement("option");
        countryOption.value = country.Country;
        countryOption.innerText = country.Country;

        countrySwitch.appendChild(countryOption);
    });
}
// return all non empty values of key @key1 but only if @key2 existing there too
// make the mean returned weighted by the population
function extractKeyValues(key1, key2, jsonData) {
    const results = {
        x: [],
        y: [],
        countries: [],
        xWeightedMean: 0,
        yWeightedMean: 0,
    };
    const jsonDataValues = Object.values(jsonData);
    let xWeightedSum = 0;
    let yWeightedSum = 0;
    let relatedPopulation = 0;

    jsonDataValues.forEach((obj) => {
        const value1 = obj[key1];
        const value2 = obj[key2];
        const population = obj["Population"];

        if (
            value2 !== undefined &&
            value2 !== null &&
            value1 !== undefined &&
            value1 !== null &&
            population
        ) {
            results.x.push(value1);
            results.y.push(value2);
            results.countries.push(obj["Country"]);

            xWeightedSum += value1 * population;
            yWeightedSum += value2 * population;
            relatedPopulation += population;
        }
    });

    results.xWeightedMean = xWeightedSum / relatedPopulation;
    results.yWeightedMean = yWeightedSum / relatedPopulation;

    return results;
}
// calculating weighted mean based on number of people in the country.
function showMean(key, jsonData) {
    const jsonDataValues = Object.values(jsonData);
    // const abbr = document.getElementById(`${key}Abbr`);
    // const bold = document.getElementById(key);

    let values = 0;
    let countriesCount = 0;
    let relatedPopulation = 0;

    for (let i = 0; i < jsonDataValues.length; i++) {
        const obj = jsonDataValues[i];
        const value = obj[key];
        if (value !== null) {
            if (!obj["Population"])
                console.error(
                    "For some reasons population is empty. This should not happen as all the countries should have this value populated!"
                );
            relatedPopulation += obj["Population"];
            values += value * obj["Population"];
            countriesCount++;
        }
    }

    const mean = (values / relatedPopulation).toFixed(2);

    worldData.push(mean);
    worldLabels.push(key);
}
// Get the strength of correlation based on value
function getCorrelationStrength(value) {
    let result = "";
    if (value <= 1) result = "very strong positive";
    if (value < 0.9) result = "strong positive";
    if (value < 0.7) result = "moderate positive";
    if (value < 0.4) result = "weak positive";
    if (value < 0.2) result = "no";
    if (value <= -0.2) result = "weak negative";
    if (value <= -0.4) result = "moderate negative";
    if (value <= -0.7) result = "strong negative";
    if (value <= -0.9) result = "very strong negative";

    return result;
}
// show data for given country
function showCountryStats(country, jsonData) {
    const countryStats = Object.values(jsonData).filter(
        (obj) => obj["Country"] === country
    )[0];

    countryData = [];
    countryLabels = [];

    Object.keys(countryStats).forEach((key) => {
        if (key !== "Country") {
            // const bold = document.getElementById(key);
            const value = countryStats[key];

            countryData.push(value);
            countryLabels.push(key);
        }
    });

    countryChart.data.datasets[0].data = countryData;
    countryChart.update();
}
// calculate the correlation coefficient
function correlationCoefficient(key1, key2, jsonData) {
    // gather all the infomation before calculation and place them on the scatter chart
    const extractedValues = extractKeyValues(key1, key2, jsonData);
    const x = extractedValues.x;
    const y = extractedValues.y;

    if (x.length !== y.length)
        console.error(
            "The x and y values have different lenght. This should never happen!"
        );

    const xMean = extractedValues.xWeightedMean;
    const yMean = extractedValues.yWeightedMean;
    const countries = extractedValues.countries;

    scatterCountries = countries.length;
    scatterLabels = [key1, key2, countries];
    scatterData = []; // empty the scatterData so the chart doesn't accumulate data

    for (let index = 0; index < x.length; index++) {
        // first key to be on the y and the second on the x scale
        const location = { x: y[index], y: x[index] };
        scatterData.push(location);
    }

    // the main calculation
    let numerator = 0;
    let xSquaredSum = 0;
    let ySquaredSum = 0;

    for (let i = 0; i < x.length; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        xSquaredSum += Math.pow(x[i] - xMean, 2);
        ySquaredSum += Math.pow(y[i] - yMean, 2);
    }

    const denominator = Math.sqrt(xSquaredSum) * Math.sqrt(ySquaredSum);
    const correlation = numerator / denominator;

    return correlation;
}
// collect all the nesesary data for radar chart of key @mainkey
function collectAllCoefficient(mainKey, jsonData) {
    const totalResult = document.getElementById("totalResult");
    const totalAbbr = document.getElementById("totalAbbr");

    radarData = [];
    radarLabels = [];
    let sum = 0;
    let maxValue = 0;

    Object.keys(jsonData[0]).forEach((secondKey) => {
        if (secondKey !== "Country" && mainKey !== secondKey) {
            const correlationValue = Math.abs(
                correlationCoefficient(mainKey, secondKey, jsonData)
            );
            sum += correlationValue;
            maxValue++;
            radarData.push(correlationValue.toFixed(2));
            radarLabels.push(secondKey);
        }
    });

    totalResult.innerText = sum.toFixed(2);
    totalAbbr.setAttribute(
        "data-title",
        `0 - the weakest, ${maxValue} - the strongest`
    );
}
// show correlation result based on selected options
function showCorrelationResult() {
    option2 = switch2.value;

    const correlationResult = document.getElementById("correlationResult");
    const correlationWeakness = document.getElementById("correlationWeakness");
    const correlationValue = correlationCoefficient(option1, option2, data);
    const corrStrength = getCorrelationStrength(correlationValue);

    correlationWeakness.innerText = "a " + corrStrength + " correlation:";
    correlationResult.innerText = correlationValue.toFixed(2);

    scatterChart && updateScatterChart();
}
function showRadarChart() {
    radarChart = new Chart(radarCanvas, {
        type: "radar",
        data: {
            labels: radarLabels,
            datasets: [
                {
                    data: radarData,
                    // fill: true,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    pointBackgroundColor: "rgb(147,217,217)",
                    pointBorderColor: "rgba(75, 192, 192, 1)",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    pointRadius: 2,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    position: "top",
                    font: {
                        family: "'Roboto', 'sans-serif'",
                        weight: "normal",
                        size: "12px",
                    },
                    padding: {
                        bottom: 5,
                    },
                    align: "center",
                    display: true,
                    text: `Based on data from ${radarCountries} countries`,
                },
            },
            scales: {
                r: {
                    min: -0.5,
                    max: 1,
                    beginAtZero: true,
                    pointLabels: {
                        display: false,
                    },
                    ticks: {
                        // backdropColor: "transparent",
                        stepSize: 1,
                        // count: 3,
                        // z: 2,
                    },
                    angleLines: {
                        display: false,
                    },
                },
            },
            elements: {
                line: {
                    borderWidth: 2,
                },
            },
        },
    });
}
function showScatterChart() {
    scatterChart = new Chart(scatterCanvas, {
        type: "scatter",
        plugins: chartTrendline,
        data: {
            labels: scatterLabels[2],
            datasets: [
                {
                    data: scatterData,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    pointRadius: 2,
                    trendlineLinear: {
                        colorMin: "rgba(121, 55, 55, 0.6)",
                        lineStyle: "dotted",
                        width: 2,
                    },
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: true, // Disable tooltips
                },
                legend: {
                    display: false,
                },
                title: {
                    position: "top",
                    font: {
                        family: "'Roboto', 'sans-serif'",
                        weight: "normal",
                        size: "12px",
                    },
                    padding: {
                        bottom: 25,
                        left: 50,
                    },
                    align: "center",
                    display: true,
                    text: `Based on data from ${scatterCountries} countries`,
                },
            },
            scales: {
                x: {
                    type: "linear",
                    position: "bottom",
                    title: {
                        display: true,
                        text: scatterLabels[1],
                    },
                    grid: {
                        display: false,
                        drawOnChartArea: false,
                        drawTicks: true,
                    },
                },
                y: {
                    type: "linear",
                    position: "left",
                    title: {
                        display: true,
                        text: scatterLabels[0],
                    },
                    grid: {
                        display: false,
                        drawOnChartArea: false,
                        drawTicks: true,
                    },
                },
            },
        },
    });
}
function showStatsChart() {
    countryChart = new Chart(countryCanvas, {
        data: {
            datasets: [
                {
                    type: "bar",
                    label: "Country data",
                    data: countryData,
                    backgroundColor: "rgba(75, 192, 192, 0.4)",
                    // borderColor: "rgba(75, 192, 192, 1)",
                },
                {
                    type: "bar",
                    label: "World average",
                    data: worldData,
                    backgroundColor: "rgba(75, 192, 192, 1)",
                    // borderColor: "rgba(121, 65, 55, 1)",
                    // pointBackgroundColor: "rgba(121, 55, 55, 1)",
                    // pointBorderColor: "rgba(121, 55, 55, 0.6)",
                    // pointHoverBackgroundColor: "#fff",
                    // pointHoverBorderColor: "rgba(121, 55, 55, 1)",
                    // borderWidth: 1,
                    // pointRadius: 2,
                    // borderDash: [10, 5],
                    z: 2,
                },
            ],
            labels: worldLabels,
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false,
                    },
                },
                y: {
                    display: false,
                    type: "logarithmic",
                    title: {
                        display: false,
                    },
                    grid: {
                        display: false,
                    },
                },
            },
        },
    });
}
function updateRadarChart() {
    radarChart.data.labels = radarLabels;
    radarChart.data.datasets[0].data = radarData;
    radarChart.options.plugins.title.text = `Based on data from ${radarCountries} countries`;
    radarChart.update();
}
function updateScatterChart() {
    scatterChart.data.datasets[0].data = scatterData;
    scatterChart.data.labels = scatterLabels[2];
    scatterChart.options.scales.x.title.text = scatterLabels[1];
    scatterChart.options.scales.y.title.text = scatterLabels[0];
    scatterChart.options.plugins.title.text = `Based on data from ${scatterCountries} countries`;

    scatterChart.update();
}
// handling change of the first selector
function handlerSwitch1Change() {
    // Get the selected value from Switch 1
    option1 = switch1.value;

    // Remove the selected option from Switch 2
    const switch2Options = switch2.querySelectorAll("option");
    switch2Options.forEach((option) => {
        if (option.value === option1) {
            option.disabled = true;
        } else {
            option.disabled = false;
        }
    });

    showCorrelationResult();
}
function handlerSwitch3Change() {
    option3 = switch3.value;
    radarCountries = 0;

    // count all countires that have a given key
    Object.values(data).forEach((country) => {
        country[option3] !== null && radarCountries++;
    });

    // gather all the correlations coefficient for radar chart
    collectAllCoefficient(option3, data);
    // update radar title
    radarChart && updateRadarChart();
}
function handlerCountrySwitchChange() {
    let country = countrySwitch.value;
    showCountryStats(country, data);
}
// Initialize the application
function initializeApp() {
    // iterate thru all the keys in objects
    Object.keys(data[0]).forEach((key) => {
        if (key !== "Country") {
            showMean(key, data);
        }
    });

    // // sum the total population
    // Object.values(data).forEach((country) => {
    //     if (country["Population"]) totalPopulation += country["Population"];
    // });

    // document.getElementById("Population").innerText = totalPopulation;

    // showCountryStats("Poland", data);
    addCountriesToSelect();
    handlerSwitch1Change();
    showScatterChart();
    showCorrelationResult();
    handlerSwitch3Change();
    showRadarChart();
    showStatsChart();
}

// event listeners
switch1.addEventListener("change", handlerSwitch1Change);
switch2.addEventListener("change", showCorrelationResult);
switch3.addEventListener("change", handlerSwitch3Change);
countrySwitch.addEventListener("change", handlerCountrySwitchChange);

// Fetch JSON data
fetch("src/correlations.json")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then((jsonData) => {
        data = jsonData;
        initializeApp();
    });
// .catch((error) => {
//     console.error("Fetch error:", error);
// });

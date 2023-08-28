// Import the required library
require("chart.js");
const chartTrendline = require("chartjs-plugin-trendline");

// DOM elements
const switch1 = document.getElementById("switch1");
const switch2 = document.getElementById("switch2");
const canvas = document.getElementById("scatterCanvas");

// Chart variables
let scatterChart;
let scatterData = [];
let scatterLabels = [];
let correlationCountries = 0;
let totalPopulation = 0;
let option1 = "IQ";
let option2 = "AvgLifeExpectancy";

// Event listeners
switch1.addEventListener("change", updateSwitch2Options);
switch2.addEventListener("change", showCorrelationResult);

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
    })
    .catch((error) => {
        console.error("Fetch error:", error);
    });

// Initialize the application
function initializeApp() {
    Object.keys(data[0]).forEach((key) => {
        key !== "Country" && key !== "Population" && showMean(key, data);
    });

    // sum the total population
    Object.values(data).forEach((country) => {
        if (country["Population"]) totalPopulation += country["Population"];
    });

    document.getElementById("Population").innerText = totalPopulation;

    // showCountryStats("Poland", data);

    updateSwitch2Options();
    showCorrelationResult();
    showScatterChart();
}

// Show correlation result based on selected options
function showCorrelationResult() {
    option2 = switch2.value;

    const correlationResult = document.getElementById("correlationResult");
    const correlationWeakness = document.getElementById("correlationWeakness");
    const correlationValue = correlationCoefficient(option1, option2, data);

    const corrStrength = getCorrelationStrength(correlationValue);
    const imgCorrelation = document.getElementById("imgCorrelation").style;
    imgCorrelation.content = `url("/correlations.world/img/${corrStrength}.svg")`;

    correlationWeakness.innerText = "a " + corrStrength + " correlation:";
    correlationResult.innerText = correlationValue;

    scatterChart && updateScatterChart();
}

// Get the strength of correlation based on value
function getCorrelationStrength(value) {
    const thresholds = [0.2, 0.4, 0.7, 0.9];
    const strengths = ["no", "weak", "moderate", "strong", "very strong"];

    let absValue = Math.abs(value);
    let strengthIndex = 0;

    for (let i = 0; i < thresholds.length; i++) {
        if (absValue >= thresholds[i]) {
            strengthIndex = i + 1;
        }
    }

    if (strengthIndex === 0) return "no";

    if (value < 0) {
        return `${strengths[strengthIndex]} negative`;
    } else {
        return `${strengths[strengthIndex]} positive`;
    }
}

function updateScatterChart() {
    scatterChart.data.datasets[0].data = scatterData;
    scatterChart.data.labels = scatterLabels[2];
    scatterChart.options.scales.x.title.text = scatterLabels[1];
    scatterChart.options.scales.y.title.text = scatterLabels[0];
    scatterChart.options.plugins.title.text = `Based on data from ${correlationCountries} countries`;

    scatterChart.update();
}

function showScatterChart() {
    scatterChart = new Chart(canvas, {
        type: "scatter",
        plugins: chartTrendline,
        data: {
            labels: scatterLabels[2],
            datasets: [
                {
                    data: scatterData,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
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
                    text: `Based on data from ${correlationCountries} countries`,
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
function updateSwitch2Options() {
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

// calculating weighted valuebased on number of people in the country.
// Total Average = (Average A * Population A + Average B * Population B) / (Population A + Population B)
// So add total population and collect info about countries and multiply it by population then
function showMean(key, jsonData) {
    let values = 0;
    let countriesCount = 0;
    let relatedPopulation = 0;
    const jsonDataValues = Object.values(jsonData);

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

    const bold = document.getElementById(key);
    const mean = (values / relatedPopulation).toFixed(2);
    const abbr = document.getElementById(`${key}Abbr`);

    if (abbr) {
        abbr.setAttribute(
            "data-title",
            abbr.getAttribute("data-title") +
                ` Based on data from ${countriesCount} countries`
        );
    }

    if (key === "BraSize") {
        if (mean < 3.5) bold.innerText = "C";
        if (mean < 3) bold.innerText = "B-C";
        if (mean < 2.5) bold.innerText = "B";
        if (mean < 2) bold.innerText = "A-B";
        if (mean < 1.5) bold.innerText = "A";
        if (mean < 1) bold.innerText = "AA-A";
        if (mean < 0.5) bold.innerText = "AA";
    } else {
        bold.innerText = mean;
    }
}

function showCountryStats(country, jsonData) {
    const countryStats = Object.values(jsonData).filter(
        (obj) => obj["Country"] === country
    )[0];

    Object.keys(countryStats).forEach((key) => {
        if (key !== "Country") {
            const bold = document.getElementById(key);
            const value = countryStats[key];

            if (key === "BraSize") {
                if (value < 3.5) bold.innerText = "C";
                if (value < 3) bold.innerText = "B-C";
                if (value < 2.5) bold.innerText = "B";
                if (value < 2) bold.innerText = "A-B";
                if (value < 1.5) bold.innerText = "A";
                if (value < 1) bold.innerText = "A-AA";
                if (value < 0.5) bold.innerText = "AA";
            } else {
                bold.innerText = value;
            }
        }
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

function extractKeyCountries(key1, key2, jsonData) {
    const result = [];
    for (const countryData of jsonData) {
        if (key1 in countryData && key2 in countryData) {
            if (countryData[key1] !== null && countryData[key2] !== null) {
                result.push(countryData["Country"]);
            }
        }
    }
    return result;
}
function calculateMean(array) {
    // TODO: function calculateMean(array,population) {
    if (array.length === 0) {
        return 0; // Return 0 for an empty array, or you could choose to return NaN or throw an error.
    }

    const sum = array.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        // TODO: (accumulator, currentValue) => accumulator * population + currentValue,
        0
    );
    const mean = sum / array.length;

    return mean;
}

// Calculate the correlation coefficient
function correlationCoefficient(key1, key2, jsonData) {
    const extractedValues = extractKeyValues(key1, key2, jsonData);

    const x = extractedValues.x;
    const y = extractedValues.y;
    const xMean = extractedValues.xWeightedMean;
    const yMean = extractedValues.yWeightedMean;
    const countries = extractedValues.countries;

    scatterLabels = [key1, key2, countries];
    correlationCountries = countries.length;

    if (x.length !== y.length)
        console.error(
            "The x and y values have different lenght. This should never happen!"
        );

    // Calculate the linear regression line
    const sumX = x.reduce((sum, x) => sum + x, 0);
    const sumY = y.reduce((sum, y) => sum + y, 0);
    const sumXY = x.reduce((sum, x, i) => sum + x * y[i], 0);
    const sumX2 = x.reduce((sum, x) => sum + x ** 2, 0);

    const n = x.length;
    slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    yIntercept = (sumY - slope * sumX) / n;

    // empty the scatterData so the chart doesn't accumulate data
    scatterData = [];
    for (let index = 0; index < x.length; index++) {
        // first key to be on the y and the second on the x scale
        const location = { x: y[index], y: x[index] };
        scatterData.push(location);
    }

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

    return correlation.toFixed(2);
}

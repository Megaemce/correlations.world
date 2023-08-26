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
let option1 = "IQ";
let option2 = "AvgLifeExpectancy";

// Event listeners
switch1.addEventListener("change", updateSwitch2Options);
switch2.addEventListener("change", showCorrelationResult);

// Fetch JSON data
fetch("src/iqCorrelation.json")
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
        key !== "Country" && showMean(key, data);
    });

    updateSwitch2Options();
    showCorrelationResult();
    showScatterChart();
}

// Show correlation result based on selected options
function showCorrelationResult() {
    option2 = switch2.value;

    const correlationResult = document.getElementById("correlationResult");
    const correlationWeakness = document.getElementById("correlationWeakness");
    const correlationValues = correlationCoefficient(option1, option2, data);
    const correlationValue = correlationValues[0];
    correlationCountries = correlationValues[1];

    const corrStrength = getCorrelationStrength(correlationValue);
    const imgCorrelation = document.getElementById("imgCorrelation").style;
    imgCorrelation.content = `url("/WorldOfCorrelations/img/${corrStrength}.svg")`;

    correlationWeakness.innerText = corrStrength;
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
                    enabled: false, // Disable tooltips
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

// calculating purly mean of values, not looking if there is connection between two keys
function showMean(key, jsonData) {
    const values = Object.values(jsonData)
        .map((obj) => obj[key])
        .filter((value) => value !== null);

    const bold = document.getElementById(key);
    const mean = calculateMean(values).toFixed(2);
    const abbr = document.getElementById(`${key}Abbr`);

    if (abbr) abbr.title += ` Based on data from ${values.length} countries`;

    if (key === "BraSize") {
        if (mean < 3.5) bold.innerText = "C";
        if (mean < 3) bold.innerText = "B-C";
        if (mean < 2.5) bold.innerText = "B";
        if (mean < 2) bold.innerText = "A-B";
        if (mean < 1.5) bold.innerText = "A";
        if (mean < 1) bold.innerText = "A-AA";
        if (mean < 0.5) bold.innerText = "AA";
    } else {
        bold.innerText = mean;
    }
}

// return all non empty values of key @key1 but only if @key2 existing there too
function extractKeyValues(key1, key2, jsonData) {
    return Object.values(jsonData)
        .map((obj) =>
            obj[key2] !== undefined && obj[key2] !== null ? obj[key1] : null
        )
        .filter((value) => value !== null);
}

function calculateMean(array) {
    if (array.length === 0) {
        return 0; // Return 0 for an empty array, or you could choose to return NaN or throw an error.
    }

    const sum = array.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
    );
    const mean = sum / array.length;

    return mean;
}

// Calculate the correlation coefficient
function correlationCoefficient(key1, key2, jsonData) {
    // keep the lables for the chart
    scatterLabels = [key1, key2];

    x = extractKeyValues(key1, key2, jsonData);
    y = extractKeyValues(key2, key1, jsonData);

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

    const xMean = calculateMean(x);
    const yMean = calculateMean(y);

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

    return [correlation.toFixed(2), x.length];
}

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
let radarCountries = []; // keeping the number of countries on which the radar pair was calculated
let pairsNumber = 0; // number of pairs based on which the correlation was calculated
let scatterChart; // keeping referene to scatter chart
let scatterData = [];
let scatterLabels = [];
let scatterCountries = 0;
let countryChart; // keeping reference to country chart
let countryData = [];
let countryLabels = [];
let worldData = [];
let worldLabels = [];

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
    const countriesData = Object.values(jsonData);
    let xWeightedSum = 0;
    let yWeightedSum = 0;
    let relatedPopulation = 0;

    countriesData.forEach((obj) => {
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
function worldMean(key, jsonData) {
    const countriesData = Object.values(jsonData);

    let values = 0;
    let totalCountries = 0;
    let totalPopulation = 0;
    let relatedPopulation = 0;

    countriesData.forEach((country) => {
        const countryKeyValue = country[key];
        const countryPopulation = country["Population"];

        !countryPopulation &&
            console.error(
                "For some reasons population is empty. This should not happen as all the countries should have this value populated!"
            );
        totalPopulation += countryPopulation;
        totalCountries++;

        if (countryKeyValue !== null) {
            values += countryKeyValue * countryPopulation;
            relatedPopulation += countryPopulation;
        }
    });

    let mean = (values / relatedPopulation).toFixed(2);

    if (key === "Population")
        mean = (totalPopulation / (totalCountries * 1000000)).toFixed(6); // show population in mln
    if (key === "Income") mean = (mean / 1000).toFixed(3); // show income in k $
    if (key === "MaleHeight" || key === "FemaleHeight") mean *= 100; // show height in cm

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
    if (value < -0.2) result = "weak negative";
    if (value < -0.4) result = "moderate negative";
    if (value < -0.7) result = "strong negative";
    if (value < -0.9) result = "very strong negative";

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
            let value = countryStats[key];

            if (key === "Population") value /= 1000000; // show population in millions so the chart is more align
            if (key === "Income") value /= 1000; // show income in x k$
            if (key === "MaleHeight" || key === "FemaleHeight") value *= 100; // show height in cm
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
    radarCountries = [];
    let sum = 0;

    Object.keys(jsonData[0]).forEach((secondKey) => {
        if (secondKey !== "Country" && mainKey !== secondKey) {
            const correlationValue = Math.abs(
                correlationCoefficient(mainKey, secondKey, jsonData)
            );
            sum += correlationValue;
            pairsNumber++;
            radarData.push(correlationValue.toFixed(2));
            radarLabels.push(secondKey);
            radarCountries.push(scatterCountries);
        }
    });

    totalResult.innerText = sum.toFixed(2);
    totalAbbr.setAttribute(
        "data-title",
        `0 - the weakest, ${pairsNumber} - the strongest`
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
                        size: 12,
                    },
                    padding: {
                        bottom: 5,
                    },
                    align: "center",
                    display: true,
                    text: `Based on ${pairsNumber} pairs of values`,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        // modify oryginal behavior based on label. Mostly fix number of digits
                        label: function (context) {
                            let result = `Correlation coefficient: ${
                                context.parsed.r
                            }. Based on data from ${
                                radarCountries[context.dataIndex]
                            } countries`;
                            return result;
                        },
                    },
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
                        // z: 0,
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
                    enabled: true,
                },
                legend: {
                    display: false,
                },
                title: {
                    position: "top",
                    font: {
                        family: "'Roboto', 'sans-serif'",
                        weight: "normal",
                        size: 12,
                    },
                    padding: {
                        bottom: 25,
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
                    order: 2,
                },
                {
                    type: "bar",
                    label: "World average",
                    data: worldData,
                    backgroundColor: "rgba(75, 192, 192, 1)",
                    barPercentage: 0.4,
                    order: 1,
                },
            ],
            labels: worldLabels,
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: true, // Disable tooltips
                    callbacks: {
                        // modify oryginal behavior based on label. Mostly fix number of digits
                        label: function (context) {
                            let result = context.dataset.label + ": ";

                            switch (context.label) {
                                case "Population":
                                    result += context.parsed.y + "mln";
                                    break;
                                case "Income":
                                    result += context.parsed.y + "k $";
                                    break;
                                case "Fertility":
                                    result +=
                                        context.parsed.y + " kids per woman";
                                    break;
                                case "PenisLength":
                                    result += context.parsed.y + "cm";
                                    break;
                                case "MaleHeight":
                                    result += context.parsed.y + "cm";
                                    break;
                                case "MaleWeight":
                                    result += context.parsed.y + "kg";
                                    break;
                                case "FemaleHeight":
                                    result += context.parsed.y + "cm";
                                    break;
                                case "FemaleWeight":
                                    result += context.parsed.y + "kg";
                                    break;
                                case "Stability":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "HumanRights":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Safety":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "HealthServices":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Climate":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Cheapness":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Popularity":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Corruption":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "AvgLifeExpectancy":
                                    result += context.parsed.y + " years";
                                    break;
                                case "MaleLifeExpectancy":
                                    result += context.parsed.y + " years";
                                    break;
                                case "FemaleLifeExpectancy":
                                    result += context.parsed.y + " years";
                                    break;
                                case "BirthRate":
                                    result +=
                                        context.parsed.y +
                                        " per 1000 people a year";
                                    break;
                                case "DeathRate":
                                    result +=
                                        context.parsed.y +
                                        " per 1000 people a year";
                                    break;
                                case "Neuroticism":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Extraversion":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Openness":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Agreeableness":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "Conscientiousness":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "MaxCorporateTax":
                                    result += context.parsed.y + "%";
                                    break;
                                case "MaxPrivateTax":
                                    result += context.parsed.y + "%";
                                    break;
                                case "Happiness":
                                    result += context.parsed.y + "/100";
                                    break;
                                case "BraSize":
                                    let braCup;
                                    if (context.parsed.y <= 3.5) braCup = "C";
                                    if (context.parsed.y < 3) braCup = "B-C";
                                    if (context.parsed.y <= 2.5) braCup = "B";
                                    if (context.parsed.y < 2) braCup = "A-B";
                                    if (context.parsed.y <= 1.5) braCup = "A";
                                    if (context.parsed.y < 1) braCup = "AA-A";
                                    if (context.parsed.y <= 0.5) braCup = "AA";
                                    result += braCup;
                                    break;
                                case "Divorces":
                                    result +=
                                        context.parsed.y + " per 1000 people";
                                    break;
                                case "Homicide":
                                    result +=
                                        context.parsed.y +
                                        " per 100 000 people";
                                    break;
                                default:
                                    result += context.parsed.y;
                                    break;
                            }

                            return result;
                        },
                    },
                },
            },
            scales: {
                x: {
                    stacked: false,
                    display: true,
                    grid: {
                        display: false,
                    },
                },
                y: {
                    stacked: false,
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
            worldMean(key, data);
        }
    });

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

const Papa = require("papaparse");
const $ = require("jquery");
require("chart.js");

const switch1 = document.getElementById("switch1");
const switch2 = document.getElementById("switch2");
const canvas = document.getElementById("scatterCanvas");
let scatterChart; // Chart type

let data;
let scatterData = [];
let scatterLabels = [];
let correlationCountries = 0;
let option1 = "IQ";
let option2 = "AvgLifeExpectancy";

switch1.onchange = () => updateSwitch2Options();
switch2.onchange = () => showCorrelationResult();

fetch("src/iqCorrelation.json")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then((jsonData) => {
        Object.keys(jsonData[0]).forEach((key) => {
            key !== "Country" && showMean(key, jsonData);
        });
        data = jsonData;

        // update from the beggining
        updateSwitch2Options();
        showCorrelationResult();
        showScatterChart();
    })
    .catch((error) => {
        console.error("Fetch error:", error);
    });

function showCorrelationResult() {
    option2 = switch2.value;

    const correlationResult = document.getElementById("correlationResult");
    const correlationWeakness = document.getElementById("correlationWeakness");
    const correlationValue = correlationCoefficient(option1, option2, data)[0];
    correlationCountries = correlationCoefficient(option1, option2, data)[1];
    const imgCorrelation = document.getElementById("imgCorrelation").style;

    let corrWeakness = "";

    if (correlationValue < 0.2 && correlationValue > -0.2) {
        corrWeakness = "no";
        imgCorrelation.content = "url(/WorldOfCorrelations/img/no.svg)";
    }
    if (correlationValue >= 0.2) {
        corrWeakness = "weak positive";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/weakPositive.svg)";
    }
    if (correlationValue >= 0.4) {
        corrWeakness = "moderate positive";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/moderatePositive.svg)";
    }
    if (correlationValue >= 0.7) {
        corrWeakness = "strong positive";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/strongPositive.svg)";
    }
    if (correlationValue >= 0.9) {
        corrWeakness = "very strong positive";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/veryStrongPositive.svg)";
    }
    if (correlationValue <= -0.2) {
        corrWeakness = "weak negative";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/weakNegative.svg)";
    }
    if (correlationValue <= -0.4) {
        corrWeakness = "moderate negative";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/moderateNegative.svg)";
    }
    if (correlationValue <= -0.7) {
        corrWeakness = "strong negative";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/strongNegative.svg)";
    }
    if (correlationValue <= -0.9) {
        corrWeakness = "very strong negative";
        imgCorrelation.content =
            "url(/WorldOfCorrelations/img/veryStrongNegative.svg)";
    }

    correlationWeakness.innerText = corrWeakness;
    correlationResult.innerText = correlationValue;

    //update the chart
    scatterChart && updateScatterChart();
}

function updateScatterChart() {
    scatterChart.data.datasets[0].label = `Data from ${correlationCountries} countries`;
    scatterChart.data.datasets[0].data = scatterData;
    scatterChart.update();
}

function showScatterChart() {
    console.log(scatterLabels[0]);
    scatterChart = new Chart(canvas, {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: `Data from ${correlationCountries} countries`,
                    data: scatterData,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    pointRadius: 2,
                },
            ],
        },
        options: {
            plugins: {
                tooltip: {
                    enabled: false, // Disable tooltips
                },
            },
            scales: {
                x: {
                    type: "linear",
                    position: "bottom",
                    scaleLabel: {
                        display: true,
                        labelString: scatterLabels[0],
                    },
                },
                y: {
                    type: "linear",
                    position: "left",
                    scaleLabel: {
                        display: true,
                        labelString: scatterLabels[1],
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

// function arrayToTable(tableData) {
//     var table = $("<table></table>");
//     $(tableData).each(function (i, rowData) {
//         var row = $("<tr></tr>");
//         $(rowData).each(function (j, cellData) {
//             row.append($("<td>" + cellData + "</td>"));
//         });
//         table.append(row);
//     });
//     return table;
// }

// $.ajax({
//     type: "GET",
//     url: "http://localhost:5500/src/iqCorrelation.csv",
//     success: function (data) {
//         $("body").append(arrayToTable(Papa.parse(data).data));
//     },
// });

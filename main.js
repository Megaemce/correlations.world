const Papa = require("papaparse");
const $ = require("jquery");

const switch1 = document.getElementById("switch1");
const switch2 = document.getElementById("switch2");

let data;
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
        document.getElementById("correlationResult").innerText =
            correlationCoefficient(option1, option2, data);
    })
    .catch((error) => {
        console.error("Fetch error:", error);
    });

function showCorrelationResult() {
    option2 = switch2.value;

    document.getElementById("correlationResult").innerText =
        correlationCoefficient(option1, option2, data);
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
    x = extractKeyValues(key1, key2, jsonData);
    y = extractKeyValues(key2, key1, jsonData);

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
    const imgCorrelation = document.getElementById("imgCorrelation").style;

    let corrWeaknes = "";
    if (correlation < 0.2 && corrWeaknes > -0.2) {
        corrWeaknes = "no";
        imgCorrelation.content = "url(/img/no.svg)";
    }
    if (correlation >= 0.2) {
        corrWeaknes = "weak positive";
        imgCorrelation.content = "url(/img/weakPositive.svg)";
    }
    if (correlation >= 0.4) {
        corrWeaknes = "moderate positive";
        imgCorrelation.content = "url(/img/moderatePositive.svg)";
    }
    if (correlation >= 0.7) {
        corrWeaknes = "strong positive";
        imgCorrelation.content = "url(/img/strongPositive.svg)";
    }
    if (correlation >= 0.9) {
        corrWeaknes = "very strong positive";
        imgCorrelation.content = "url(/img/veryStrongPositive.svg)";
    }
    if (correlation <= -0.2) {
        corrWeaknes = "weak negative";
        imgCorrelation.content = "url(/img/weakNegative.svg)";
    }
    if (correlation <= -0.4) {
        corrWeaknes = "moderate negative";
        imgCorrelation.content = "url(/img/moderateNegative.svg)";
    }
    if (correlation <= -0.7) {
        corrWeaknes = "strong negative";
        imgCorrelation.content = "url(/img/strongNegative.svg)";
    }
    if (correlation <= -0.9) {
        corrWeaknes = "very strong negative";
        imgCorrelation.content = "url(/img/veryStrongNegative.svg)";
    }

    return `${correlation.toFixed(2)} - ${corrWeaknes} correlation`;
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

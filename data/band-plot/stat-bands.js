var { Covid19ModelIndia, binStateCountsTill, expSlope } = require("../../js/covid19-model-india.js");
var fetch = require("node-fetch");

const offsetDays = 1;

function daysSince(fromDate, date)
{
  return Math.floor(((date.getTime() - fromDate.getTime()) / 1000) / 86400);
}

function countryProjectionBands(startDate, t0Gap, category, statesSeries, caseSeries)
{
  let t0 = new Date();
  t0.setDate(t0.getDate() - offsetDays);
  while (startDate < t0) {
    let model = new Covid19ModelIndia(t0, statesSeries, caseSeries);
    for (let week = 1; week <= 4; week++) {
      const stat = model.countryStatLimit(category, model.dates[week]);
      const step = daysSince(startDate, t0) + 7 * week;
      let tweek = new Date(startDate);
      tweek.setDate(tweek.getDate() + step);
      console.log(step + "," + stat.min + "," + stat.mid + "," + stat.max + "," + t0.toLocaleDateString("en-IN") + "," + tweek.toLocaleDateString("en-IN"));
    }
    console.log("###")
    t0.setDate(t0.getDate() - t0Gap);
  }
}

function countryActualTrend(startDate, category, statesSeries, caseSeries)
{
  let t = new Date();
  t.setDate(t.getDate() - offsetDays);
  while (startDate < t) {
    const stateParams = binStateCountsTill(t, statesSeries);
    let actual_val = 0;
    for (let state = 0; state < stateParams.length; state++) {
      if (category == "reported") {
        actual_val += stateParams[state].confirmed;
      } else if (category == "deceased") {
        actual_val += stateParams[state].deceased;
      } else {
        break;
      }
    }
    console.log(daysSince(startDate, t) + "," + actual_val + "," + t.toLocaleDateString("en-IN"));
    t.setDate(t.getDate() - 1);
  }
}

function countryActualExtrapolate(startDate, category, statesSeries)
{
  let t = new Date();
  t.setDate(t.getDate() - 7 - offsetDays + 1);
  let data = [];
  while (daysSince(startDate,t) <= daysSince(startDate,new Date()) - offsetDays) {
    const stateParams = binStateCountsTill(t, statesSeries);
    let actual_val = 0;
    for (let state = 0; state < stateParams.length; state++) {
      if (category == "reported") {
        actual_val += stateParams[state].confirmed;
      } else if (category == "deceased") {
        actual_val += stateParams[state].deceased;
      } else {
        break;
      }
    }
    data.push(actual_val);
    t.setDate(t.getDate() + 1);
  }
  const c = expSlope(data);
  const val0 = data[data.length-1];
  let t0 = new Date();
  t0.setDate(t0.getDate() - offsetDays);
  const t0DaysSinceStart = daysSince(startDate, t0);
  for (let daysSinceStart = 0; daysSinceStart < 70; daysSinceStart++) {
    const daysSinceT0 = daysSinceStart - t0DaysSinceStart;
    const extrap_val = val0 * Math.exp(c * daysSinceT0);
    console.log(daysSinceStart + "," + extrap_val);
  }
}

function stateProjectionBands(startDate, t0Gap, category, stateName, statesSeries, caseSeries)
{
  let t0 = new Date();
  t0.setDate(t0.getDate() - offsetDays);
  while (startDate < t0) {
    let model = new Covid19ModelIndia(t0, statesSeries, caseSeries);
    const state = model.indexStateName(stateName);
    for (let week = 1; week <= 4; week++) {
      const stat = model.stateStatLimit(category, state, model.dates[week]);
      const step = daysSince(startDate, t0) + 7 * week;
      let tweek = new Date(startDate);
      tweek.setDate(tweek.getDate() + step);
      console.log(step + "," + stat.min + "," + stat.mid + "," + stat.max + "," + t0.toLocaleDateString("en-IN") + "," + tweek.toLocaleDateString("en-IN"));
    }
    console.log("###")
    t0.setDate(t0.getDate() - t0Gap);
  }
}

function stateActualTrend(startDate, category, stateName, statesSeries, caseSeries)
{
  let t = new Date();
  t.setDate(t.getDate() - offsetDays);
  let model = new Covid19ModelIndia(new Date(), statesSeries, caseSeries);
  const state = model.indexStateName(stateName);
  while (startDate < t) {
    const stateParams = binStateCountsTill(t, statesSeries);
    let actual_val = 0;
    if (category == "reported") {
      actual_val += stateParams[state].confirmed;
    } else if (category == "deceased") {
      actual_val += stateParams[state].deceased;
    } else {
      break;
    }
    console.log(daysSince(startDate, t) + "," + actual_val + "," + t.toLocaleDateString("en-IN"));
    t.setDate(t.getDate() - 1);
  }
}

function stateActualExtrapolate(startDate, category, stateName, statesSeries)
{
  let t = new Date();
  t.setDate(t.getDate() - 7 - offsetDays + 1);
  let data = [];
  while (daysSince(startDate,t) <= daysSince(startDate,new Date())-offsetDays) {
    const stateParams = binStateCountsTill(t, statesSeries);
    let actual_val = 0;
    for (let state = 0; state < stateParams.length; state++) {
      if (stateParams[state].name !== stateName)
        continue;
      if (category == "reported") {
        actual_val += stateParams[state].confirmed;
      } else if (category == "deceased") {
        actual_val += stateParams[state].deceased;
      } else {
        break;
      }
    }
    data.push(actual_val);
    t.setDate(t.getDate() + 1);
  }
  const c = expSlope(data);
  const val0 = data[data.length-1];
  let t0 = new Date();
  t0.setDate(t0.getDate() - offsetDays);
  const t0DaysSinceStart = daysSince(startDate, t0);
  for (let daysSinceStart = 0; daysSinceStart < 70; daysSinceStart++) {
    const daysSinceT0 = daysSinceStart - t0DaysSinceStart;
    const extrap_val = val0 * Math.exp(c * daysSinceT0);
    console.log(daysSinceStart + "," + extrap_val);
  }
}

function districtProjectionBands(startDate, t0Gap, category, districtName, stateName, statesSeries, caseSeries)
{
  let t0 = new Date();
  t0.setDate(t0.getDate() - offsetDays);
  while (startDate < t0) {
    let model = new Covid19ModelIndia(t0, statesSeries, caseSeries);
    const districtNameKey = model.districtNameKey(districtName, stateName);
    const district = model.indexDistrictNameKey(districtNameKey);
    for (let week = 1; week <= 4; week++) {
      const stat = model.districtStatLimit(category, district, model.dates[week]);
      const step = daysSince(startDate, t0) + 7 * week;
      let tweek = new Date(startDate);
      tweek.setDate(tweek.getDate() + step);
      console.log(step + "," + stat.min + "," + stat.mid + "," + stat.max + "," + t0.toLocaleDateString("en-IN") + "," + tweek.toLocaleDateString("en-IN"));
    }
    console.log("###")
    t0.setDate(t0.getDate() - t0Gap);
  }
}

function districtActualTrend(startDate, category, districtName, stateName, statesSeries, caseSeries)
{
  let t = new Date();
  t.setDate(t.getDate() - offsetDays);
  let model = new Covid19ModelIndia(new Date(), statesSeries, caseSeries);
  const districtNameKey = model.districtNameKey(districtName, stateName);
  const district = model.indexDistrictNameKey(districtNameKey);
  while (startDate < t) {
    const actualDistrictCounts = model.binCountsByDistrict(caseSeries, t);
    const actual_val = actualDistrictCounts[district];
    console.log(daysSince(startDate, t) + "," + actual_val + "," + t.toLocaleDateString("en-IN"));
    t.setDate(t.getDate() - 1);
  }
}

function districtActualExtrapolate(startDate, category, districtName, stateName, statesSeries, caseSeries)
{
  let t = new Date();
  t.setDate(t.getDate() - 7 - offsetDays + 1);
  let data = [];
  let model = new Covid19ModelIndia(new Date(), statesSeries, caseSeries);
  const districtNameKey = model.districtNameKey(districtName, stateName);
  const district = model.indexDistrictNameKey(districtNameKey);
  while (daysSince(startDate,t) <= daysSince(startDate,new Date())-offsetDays) {
    const actualDistrictCounts = model.binCountsByDistrict(caseSeries, t);
    const actual_val = actualDistrictCounts[district];
    data.push(actual_val);
    t.setDate(t.getDate() + 1);
  }
  const c = expSlope(data);
  const val0 = data[data.length-1];
  let t0 = new Date();
  t0.setDate(t0.getDate() - offsetDays);
  const t0DaysSinceStart = daysSince(startDate, t0);
  for (let daysSinceStart = 0; daysSinceStart < 70; daysSinceStart++) {
    const daysSinceT0 = daysSinceStart - t0DaysSinceStart;
    const extrap_val = val0 * Math.exp(c * daysSinceT0);
    console.log(daysSinceStart + "," + extrap_val);
  }
}

let urls = [];
urls.push("https://api.covid19india.org/states_daily.json");
urls.push("https://api.covid19india.org/raw_data1.json");
urls.push("https://api.covid19india.org/raw_data2.json");
urls.push("https://api.covid19india.org/raw_data3.json");
urls.push("https://api.covid19india.org/raw_data4.json");
urls.push("https://api.covid19india.org/raw_data5.json");
urls.push("https://api.covid19india.org/raw_data6.json");

let promises = [];
urls.forEach(function(url) {
  promises.push(fetch(url).then(data => data.json()));
});

Promise.all(promises).then(function(data) {
  init(data);
});

function init(data)
{
  let args = process.argv.slice(2);

  const dateString    = args[0];
  const category      = args[1];
  const level         = args[2];
  const stateName     = (args.length > 3 ? args[3] : "none");
  const districtName  = (args.length > 4 ? args[4] : "none");

  let statesSeries = data[0].states_daily;
  let caseSeries1  = data[1].raw_data;
  let caseSeries2  = data[2].raw_data;
  let caseSeries3  = data[3].raw_data;
  let caseSeries   = caseSeries1.concat(caseSeries2, caseSeries3);
  const startDate  = new Date(dateString);
  const t0Gap      = 6;

  switch (level) {
    case "country":
      countryProjectionBands(startDate, t0Gap, category, statesSeries, caseSeries);
      console.log("===");
      countryActualTrend(startDate, category, statesSeries, caseSeries);
      console.log("===");
      countryActualExtrapolate(startDate, category, statesSeries);
    break;
    case "state":
      stateProjectionBands(startDate, t0Gap, category, stateName, statesSeries, caseSeries);
      console.log("===");
      stateActualTrend(startDate, category, stateName, statesSeries, caseSeries);
      console.log("===");
      stateActualExtrapolate(startDate, category, stateName, statesSeries, caseSeries);
    break;
    case "district":
      districtProjectionBands(startDate, t0Gap, category, districtName, stateName, statesSeries, caseSeries);
      console.log("===");
      districtActualTrend(startDate, category, districtName, stateName, statesSeries, caseSeries);
      console.log("===");
      districtActualExtrapolate(startDate, category, districtName, stateName, statesSeries, caseSeries);
    break;
  }
}

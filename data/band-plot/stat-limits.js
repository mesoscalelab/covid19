function listStatLimitsForCountry(startDate, category, statesSeries, caseSeries)
{
  let chartText = "";
  for (let j = 0; j < 10; j++) {
    let t0 = new Date(startDate);
    t0.setDate(t0.getDate() + j * 3);
    if (t0 > new Date())
      break;
    let model = new Covid19ModelIndia(t0, statesSeries, caseSeries);
    for (let i = 1; i <= 4; i++) {
      const step = j * 3 + i * 7;
      const day = model.dates[i];
      const min_val = model.countryStatLimit(category, day, "min");
      const max_val = model.countryStatLimit(category, day, "max");
      chartText += step + "," + min_val + "," + max_val + "</br>";
    }
  }
  let model = new Covid19ModelIndia(new Date(), statesSeries, caseSeries);
  for (let i = -10; i < 100; i++) {
    let day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const stateParams = binStateCountsTill(day, statesSeries);
    let actual_val = 0;
    for (let state = 0; state < model.numStates; state++) {
      if (category == "reported") {
        actual_val += stateParams[state].confirmed;
      } else if (category == "deceased") {
        actual_val += stateParams[state].deceased;
      } else {
        break;
      }
    }
    if (day > new Date())
      break;
    chartText += i + "," + actual_val + "</br>";
  }
  return chartText;
}

function listStatLimitsForState(stateName, startDate, category, statesSeries, caseSeries)
{
  let chartText = "";
  for (let j = 0; j < 10; j++) {
    let t0 = new Date(startDate);
    t0.setDate(t0.getDate() + j * 3);
    if (t0 > new Date())
      break;
    let model = new Covid19ModelIndia(t0, statesSeries, caseSeries);
    const state = model.indexStateName(stateName);
    for (let i = 1; i <= 4; i++) {
      const step = j * 3 + i * 7;
      const day = model.dates[i];
      const min_val = model.stateStatLimit(category, state, day, "min");
      const max_val = model.stateStatLimit(category, state, day, "max");
      chartText += step + "," + min_val + "," + max_val + "</br>";
    }
  }
  let model = new Covid19ModelIndia(new Date(), statesSeries, caseSeries);
  for (let i = -10; i < 100; i++) {
    let day = new Date(startDate);
    day.setDate(day.getDate() + i);
    var stateParams = binStateCountsTill(day, statesSeries);
    var state = model.indexStateName(stateName);
    var actual_val = 0;
    if (category == "reported") {
      actual_val += stateParams[state].confirmed;
    } else if (category == "deceased") {
      actual_val += stateParams[state].deceased;
    } else {
      break;
    }
    if (day > new Date())
      break;
    chartText += i + "," + actual_val + "</br>";
  }
  return chartText;
}

function listStatLimitsForDistrict(districtNameKey, startDate, category, statesSeries, caseSeries)
{
  let chartText = "";
  for (let j = 0; j < 10; j++) {
    let t0 = new Date(startDate);
    t0.setDate(t0.getDate() + j * 3);
    if (t0 > new Date())
      break;
    let model = new Covid19ModelIndia(t0, statesSeries, caseSeries);
    const district = model.indexDistrictNameKey(districtNameKey);
    for (let i = 1; i <= 4; i++) {
      const step = j * 3 + i * 7;
      const day = model.dates[i];
      const category = "reported";
      const min_val = model.districtStatLimit(category, district, day, "min");
      const max_val = model.districtStatLimit(category, district, day, "max");
      chartText += step + "," + min_val + "," + max_val + "</br>";
    }
  }
  let model = new Covid19ModelIndia(new Date(), statesSeries, caseSeries);
  const district = model.indexDistrictNameKey(districtNameKey);
  for (let i = -10; i < 100; i++) {
    let day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const actualDistrictCounts = model.binCountsByDistrict(caseSeries, day);
    const actual_reported = actualDistrictCounts[district];
    if (day > new Date())
      break;
    chartText += i + "," + actual_reported + "</br>";
  }
  return chartText;
}

class AppConfig
{
  constructor()
  {
    this.category = "carriers";
  }
};

$(function()
{
  let urls = [];
  urls.push("https://api.covid19india.org/states_daily.json");
  urls.push("https://api.covid19india.org/raw_data.json");

  let promises = [];
  urls.forEach(function(url) {
    promises.push(fetch(url).then(data => data.json()));
  });

  Promise.all(promises).then(function(data) {
    init(data);
  });
});

function init(data)
{
  let t0 = new Date();
  t0.setDate(t0.getDate() - 3);

  let statesSeries = data[0].states_daily;
  let caseSeries   = data[1].raw_data;
  let model        = new Covid19ModelIndia(t0, statesSeries, caseSeries);
  let appConfig    = new AppConfig();

  setCategory(appConfig, "reported");
  setAllStats(model, appConfig);

  // category buttons
  $('#btn-reported').click(function(e) {
    setCategory(appConfig, "reported");
    setAllStats(model, appConfig);
  });

  $('#btn-carriers').click(function(e) {
    setCategory(appConfig, "carriers");
    setAllStats(model, appConfig);
  });

  $('#btn-critical').click(function(e) {
    setCategory(appConfig, "critical");
    setAllStats(model, appConfig);
  });

  $('#btn-ventilators').click(function(e) {
    setCategory(appConfig, "ventilators");
    setAllStats(model, appConfig);
  });

  $('#btn-pumps').click(function(e) {
    setCategory(appConfig, "pumps");
    setAllStats(model, appConfig);
  }); 
}

function collapseRows(idValue)
{
  $("#".concat(idValue)).each(function() {
    $(".".concat(idValue)).each(function() {
      $(this).addClass("collapse");
    });
    $(this).html("+");
  });
}

function expandRows(idValue)
{
  $("#".concat(idValue)).each(function() {
    $(".".concat(idValue)).each(function() {
      $(this).removeClass("collapse");
    });
    $(this).html("-");
  });
}

function toggleRows(idValue)
{
  $("#".concat(idValue)).each(function() {
    $(this).click(function(e) {
      $(".".concat(idValue)).each(function() {
        if ($(this).hasClass("collapse")) {
          $(this).removeClass("collapse");
        } else {
          $(this).addClass("collapse");
        }
      });
      if ($(this).html() === "+") {
        $(this).html("-");
      } else {
        $(this).html("+");
      }
    });
  });
}

function setAllStats(model, config)
{
  $("#all-stats").html("");
  createHeader(model);

  let row = new Array(10).fill("");

  row.fill("");
  createRow(row);

  if (true) {
    row.fill("")
    row[1] = "India"; 
    for (let i = 2; i < row.length; i+=2) {
      row[i]   = model.countryStat(config.category, model.lowParams,  model.dates[i/2]);
      row[i+1] = model.countryStat(config.category, model.highParams, model.dates[i/2]);
    }
    createRow(row, true);

    $(".t0-text").each(function() {
      $(this).html(model.dates[0].toLocaleDateString("en-IN"));
    });

    $("#t0-confirmed").html(model.countryStat("reported", model.lowParams, model.t0));
    $("#t0-estimated").html(model.countryStat("carriers", model.lowParams, model.t0));
  }

  row.fill("");
  createRow(row);

  row.fill("");
  row[1] = "Top 5 Affected States";
  createRow(row, true, "top-states-stats");

  let topStates = model.listTopAffectedStates(config.category, model.lowParams, model.dates[1]);
  for (let j = 0; j < 5; j++) {
    const state = topStates[j].index; 
    row.fill("");
    row[1] = model.stateParams[state].name; 
    for (let i = 2; i < row.length; i+=2) {
      row[i]   = model.stateStat(config.category, state, model.lowParams,  model.dates[i/2]);
      row[i+1] = model.stateStat(config.category, state, model.highParams, model.dates[i/2]);
    }
    createRow(row, false, "", "top-states-stats");
  }

  row.fill("");
  createRow(row);

  row.fill("");
  row[1] = "Top 10 Affected Districts";
  createRow(row, true, "top-districts-stats");

  let topDistricts = model.listTopAffectedDistricts(config.category, model.lowParams, model.dates[1]);
  let topDistrictsCount = 0;
  for (let j = 0; j < topDistricts.length; j++) {
    const district = topDistricts[j].index; 
    const districtName = model.districtParams[district].name;
    const stateName = model.districtParams[district].state;
    if (districtName === "Unclassified")
      continue;
    row.fill("");
    row[1] = districtName + ", " + stateName; 
    for (let i = 2; i < row.length; i+=2) {
      row[i]   = model.districtStat(config.category, district, model.lowParams,  model.dates[i/2]);
      row[i+1] = model.districtStat(config.category, district, model.highParams, model.dates[i/2]);
    }
    createRow(row, false, "", "top-districts-stats");
    topDistrictsCount++;
    if (topDistrictsCount == 10) {
      break;
    }
  }

  row.fill("");
  createRow(row);

  row.fill("");
  createRow(row);

  row.fill("");
  row[1] = "District-Wise Projections";
  createRow(row, true);

  for (let state = 0; state < model.numStates; state++) {
    row.fill("");
    let stateName = model.stateParams[state].name; 
    row[1] = stateName; 
    for (let i = 2; i < row.length; i+=2) {
      row[i]   = model.stateStat(config.category, state, model.lowParams,  model.dates[i/2]);
      row[i+1] = model.stateStat(config.category, state, model.highParams, model.dates[i/2]);
    }
    const stateIDValue = stateName.replace(/\s/g, "").concat("-stats");
    createRow(row, true, stateIDValue);
    const districts = model.districtsOfStates[state];
    for (let j = 0; j < districts.length; j++) {
      const district = districts[j]; 
      row.fill("")
      row[1] = model.districtParams[district].name; 
      for (let i = 2; i < row.length; i+=2) {
        row[i]   = model.districtStat(config.category, district, model.lowParams,  model.dates[i/2]);
        row[i+1] = model.districtStat(config.category, district, model.highParams, model.dates[i/2]);
      }
      createRow(row, false, "", stateIDValue);
    }
    row.fill("");
    createRow(row, false, "", stateIDValue);
  }

  // collapse events
  expandRows("top-states-stats");
  toggleRows("top-states-stats");

  expandRows("top-districts-stats");
  toggleRows("top-districts-stats");

  for (let state = 0; state < model.numStates; state++) {
    let stateName = model.stateParams[state].name;
    const stateIDValue = stateName.replace(/\s/g, "").concat("-stats");
    collapseRows(stateIDValue);
    toggleRows(stateIDValue);
  }
}

function createHeader(model) {
  let newRow = document.getElementById("all-stats").insertRow();
  for (let i = 0; i < 4; i++) {
    let newCell = newRow.insertCell(i);
    let newText = document.createTextNode(model.dates[i+1].toLocaleDateString("en-IN"));
    newCell.appendChild(newText);
    let att = document.createAttribute("colspan");
    att.value = "2";
    newCell.setAttributeNode(att);
  }
  for (let i = 0; i < 2; i++) {
    let newCell = newRow.insertCell(i);
    let newText = document.createTextNode("");
    newCell.appendChild(newText);
    let att = document.createAttribute("colspan");
    att.value = "1";
    newCell.setAttributeNode(att);
  }
  newRow.classList.add("font-weight-bold");
}

function createRow(rowValues, makeBold = false, idValue = "", classValues = "") {
  let nonZeroValue = false;
  for (i = 2; i < rowValues.length; i++) {
    if (rowValues[i] != 0 || rowValues[i] === "") {
      nonZeroValue = true;
    }
  }
  if (nonZeroValue == false) {
    return;
  }
  let newRow = document.getElementById("all-stats").insertRow();
  let startCell = 0;
  if (!(idValue === "")) {
    let newCell = newRow.insertCell(0);
    let newText = document.createTextNode("+");
    newCell.appendChild(newText);
    newCell.setAttribute("id", idValue);
    startCell = 1;
  }
  for (let i = startCell; i < rowValues.length; i++) {
    let newCell = newRow.insertCell(i);
    let newText = document.createTextNode(rowValues[i].toString());
    newCell.appendChild(newText);
    if (i == 1) {
      newCell.classList.add("text-left");
    }
    if (i > 1 && !(rowValues[2] === "")) {
      if (0 == (i % 2)) {
        newCell.style.backgroundColor = "honeydew";
      } else {
        newCell.style.backgroundColor = "mistyrose";
      }
    }
  }
  if (makeBold) {
    newRow.classList.add("font-weight-bold");
  }
  if (classValues != "") {
    newRow.classList.add(classValues);
  }
}

function setCategory(config, value) {
  $("#btn-".concat(config.category)).removeClass("btn-dark");
  config.category = value;
  $("#btn-".concat(config.category)).addClass("btn-dark");
  switch (value) {
    case "reported"    : $("#category-text").html("estimated case reports"); break;
    case "carriers"    : $("#category-text").html("estimated carriers"); break;
    case "critical"    : $("#category-text").html("critically ill patients"); break;
    case "ventilators" : $("#category-text").html("ventilators required"); break;
    case "pumps"       : $("#category-text").html("infusion pumps required"); break;
  }
}

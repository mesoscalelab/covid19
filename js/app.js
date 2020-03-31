class AppConfig
{
  constructor()
  {
    this.category = "carriers";
  }
};

let model = new Covid19Model();
let appConfig = new AppConfig();

$(function()
{
  setCategory(appConfig, "carriers");
  setAllStats(appConfig);

  // category buttons
  $('#btn-carriers').click(function(e) {
    setCategory(appConfig, "carriers");
    setAllStats(appConfig);
  });

  $('#btn-critical').click(function(e) {
    setCategory(appConfig, "critical");
    setAllStats(appConfig);
  });

  $('#btn-ventilators').click(function(e) {
    setCategory(appConfig, "ventilators");
    setAllStats(appConfig);
  });

  $('#btn-pumps').click(function(e) {
    setCategory(appConfig, "pumps");
    setAllStats(appConfig);
  }); 
});

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
        console.log("AAAAAAAAAAAAAAAAA", idValue);
        $(this).html("-");
      } else {
        $(this).html("+");
      }
    });
  });
}

function setAllStats(config)
{
  $("#all-stats").html("");
  createHeader();

  let row = new Array(10).fill("");

  row.fill("");
  createRow(row);

  if (true) {
    const moderateStats = model.countryStats(model.moderateParams);
    const worstStats = model.countryStats(model.worstParams);
    row.fill("")
    row[1] = "India"; 
    fillRowValuesWithStats(appConfig, moderateStats, worstStats, row);
    createRow(row, true);
  }

  row.fill("");
  createRow(row);

  row.fill("");
  row[1] = "Top 5 Affected States";
  createRow(row, true, "top-states-stats");

  let topStates = model.calcTopAffectedStates(5);
  for (let i = 0; i < topStates.length; i++) {
    const state = topStates[i]; 
    const moderateStats = model.stateStats(state, model.moderateParams);
    const worstStats = model.stateStats(state, model.worstParams);
    row.fill("");
    row[1] = state; 
    fillRowValuesWithStats(appConfig, moderateStats, worstStats, row);
    createRow(row, false, "", "top-states-stats");
  }

  row.fill("");
  createRow(row);

  row.fill("");
  row[1] = "Top 10 Affected Districts";
  createRow(row, true, "top-districts-stats");

  let topDistrictIDs = model.calcTopAffectedDistrictIDs(10);
  for (let i = 0; i < topDistrictIDs.length; i++) {
    const districtID = topDistrictIDs[i]; 
    const moderateStats = model.districtIDStats(districtID, model.moderateParams);
    const worstStats = model.districtIDStats(districtID, model.worstParams);
    const dinfo = model.districtIDInfo(districtID);
    row.fill("")
    row[1] = dinfo.district.concat(", ").concat(dinfo.state); 
    fillRowValuesWithStats(appConfig, moderateStats, worstStats, row);
    createRow(row, false, "", "top-districts-stats");
  }

  row.fill("");
  createRow(row);

  row.fill("");
  createRow(row);

  row.fill("");
  row[1] = "District-Wise Projections";
  createRow(row, true);

  for (let [state, sinfo] of model.statesInfo) {
    const moderateStatsState = model.stateStats(state, model.moderateParams);
    const worstStatsState = model.stateStats(state, model.worstParams);
    row.fill("");
    row[1] = state; 
    fillRowValuesWithStats(appConfig, moderateStatsState, worstStatsState, row);
    const stateIDValue = state.replace(/\s/g, "").concat("-stats");
    createRow(row, true, stateIDValue);
    for (let i = 0; i < sinfo.districtIDs.length; i++) {
      const districtID = sinfo.districtIDs[i]; 
      const moderateStats = model.districtIDStats(districtID, model.moderateParams);
      const worstStats = model.districtIDStats(districtID, model.worstParams);
      const dinfo = model.districtIDInfo(districtID);
      row.fill("")
      row[1] = dinfo.district; 
      fillRowValuesWithStats(appConfig, moderateStats, worstStats, row);
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

  for (let state of model.allStates) {
    const stateIDValue = state.replace(/\s/g, "").concat("-stats");
    collapseRows(stateIDValue);
    toggleRows(stateIDValue);
  }
}

function fillRowValuesWithStats(config, moderateStats, worstStats, row)
{
  switch (config.category) {
    case "carriers":
      row[2] = moderateStats.carriers.t1;
      row[4] = moderateStats.carriers.t2;
      row[6] = moderateStats.carriers.t3;
      row[8] = moderateStats.carriers.t4;
      row[3] = worstStats.carriers.t1;
      row[5] = worstStats.carriers.t2;
      row[7] = worstStats.carriers.t3;
      row[9] = worstStats.carriers.t4;
    break;
    case "critical":
      row[2] = moderateStats.critical.t1;
      row[4] = moderateStats.critical.t2;
      row[6] = moderateStats.critical.t3;
      row[8] = moderateStats.critical.t4;
      row[3] = worstStats.critical.t1;
      row[5] = worstStats.critical.t2;
      row[7] = worstStats.critical.t3;
      row[9] = worstStats.critical.t4;
    break;
    default:
      const moderateItemStats = model.itemStats(config.category, moderateStats.critical);
      const worstItemStats = model.itemStats(config.category, worstStats.critical);
      row[2] = moderateItemStats.t1;
      row[4] = moderateItemStats.t2;
      row[6] = moderateItemStats.t3;
      row[8] = moderateItemStats.t4;
      row[3] = worstItemStats.t1;
      row[5] = worstItemStats.t2;
      row[7] = worstItemStats.t3;
      row[9] = worstItemStats.t4;
    break;
  }
}

function createHeader() {
  let newRow = document.getElementById("all-stats").insertRow();
  for (let i = 0; i < 4; i++) {
    let newCell = newRow.insertCell(i);
    let date = "";
    switch (i) {
      case 0 : date = model.dates.t1; break;
      case 1 : date = model.dates.t2; break;
      case 2 : date = model.dates.t3; break;
      case 3 : date = model.dates.t4; break;
    }
    let newText = document.createTextNode(date);
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
        newCell.classList.add("table-success");
      } else {
        newCell.classList.add("table-danger");
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
    case "carriers"    : $("#category-text").html("estimated carriers"); break;
    case "critical"    : $("#category-text").html("critically ill patients"); break;
    case "ventilators" : $("#category-text").html("ventilators required"); break;
    case "pumps"       : $("#category-text").html("infusion pumps required"); break;
  }
}

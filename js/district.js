// slider with stops for moderate and worst case values
class AppSlider extends Slider {
  constructor(min, mod, wst, max, step, id, dataid) {
    // extent of stop markers
    const modStart = mod - 0.5 * step;
    const modEnd   = mod + 0.5 * step; 
    const wstStart = wst - 0.5 * step; 
    const wstEnd   = wst + 0.5 * step;

    super(id, {
      id   : dataid,
      min  : min,
      max  : max,
      step : step,
      value: wst,
      rangeHighlights: [{ "start": modStart, "end": modEnd, "class": "moderate" },
                        { "start": wstStart, "end": wstEnd, "class": "worst"    }]
    });

    this.mod = mod; // moderate case
    this.wst = wst; // worst case
  }
}

$(function()
{
  const dataUrl = "https://raw.githubusercontent.com/mesoscalelab/covid19/master/data/districtwise.csv";
  let data      = [];
  let fetched   = false;
  let complete  = results => { data = results.data; fetched = true; }
  Papa.parse(dataUrl, { delimiter : ",", skipEmptyLines : true, complete  : complete, download  : true});
  (function fetching() {
    if (fetched) {
      addColumns(data);
      start(data);
    } else {
      setTimeout(fetching, 50);
    }
  })();
});

// data has 4 columns: district, state, infected, n
function addColumns(data)
{
}

function start(data)
{
  // create default app state
  let appState = {
    region   : "None",
    T0Date   : "28/03/2020",
    T1Date   : "04/04/2020",
    T2Date   : "11/04/2020",
    T3Date   : "18/04/2020",
    T4Date   : "25/04/2020",
    nSlider  : new AppSlider(  1,  -5,  -5,  10,  1,  "#nSlider",  "n-slider"),
    xSlider  : new AppSlider(  0,  10,  15,  20,  1,  "#xSlider",  "x-slider"),
    T1Slider : new AppSlider(  2,   5,  10,  15,  1, "#T1Slider", "T1-slider"),
    T2Slider : new AppSlider( 20,  40,  50,  60,  2, "#T2Slider", "T2-slider"),
    T3Slider : new AppSlider( 60,  80, 120, 150,  5, "#T3Slider", "T3-slider"),
    T4Slider : new AppSlider(155, 200, 500, 590, 15, "#T4Slider", "T4-slider"),
    scenario : "none",
    category : "none"
  };

  setScenario(appState, "worst");
  setCategory(appState, "critical");
  resetForRegion(data, appState, data[0][0]);
  setRegionStats(data, appState);
  setAllStats(data, appState);

  run(data, appState);
}

function run(t_db, t_state)
{
  // fill region list from data
  for (let i = 0; i < t_db.length; i++) {
    let entry = document.createElement('li');
    entry.appendChild(document.createTextNode(t_db[i][0]));
    entry.classList.add("region-name");
    entry.classList.add("list-group-item");
    $('#region-list').append(entry);
  }

  // reset app state when region is changed 
  let regionObjects = $('.region-name');
  for (let i = 0; i < regionObjects.length; i++) {
    regionObjects[i].addEventListener("click", function(e) {
      const regionName = e.target.textContent;
      resetForRegion(t_db, t_state, regionName);
      setRegionStats(t_db, t_state);
    });
  }

  // when a string in typed in region search box,
  // show list of region names containing the string
  $('#region-search').keyup(function(e) {
    let value = $(this).val().toLowerCase();
    if (value == "") {
      $('#region-list').css('display', "none");
    } else {
      $('#region-list').css('display', "block");
    }
    $("#region-list li").filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
    });
  });

  // slider button movement
  t_state.nSlider.on('change', function() { setRegionStats(t_db, t_state); });
  t_state.xSlider.on('change', function() { setRegionStats(t_db, t_state); });
  t_state.T1Slider.on('change', function() { setRegionStats(t_db, t_state); });
  t_state.T2Slider.on('change', function() { setRegionStats(t_db, t_state); });
  t_state.T3Slider.on('change', function() { setRegionStats(t_db, t_state); });
  t_state.T4Slider.on('change', function() { setRegionStats(t_db, t_state); });

  // scenario buttons
  $('#btn-moderate').click(function(e) {
    setScenario(t_state, "moderate");
    setAllStats(t_db, t_state);
  });

  $('#btn-worst').click(function(e) {
    setScenario(t_state, "worst");
    setAllStats(t_db, t_state);
  });

  // category buttons
  $('#btn-infected').click(function(e) {
    setCategory(t_state, "infected");
    setAllStats(t_db, t_state);
  });

  $('#btn-critical').click(function(e) {
    setCategory(t_state, "critical");
    setAllStats(t_db, t_state);
  });

  $('#btn-ventilators').click(function(e) {
    setCategory(t_state, "ventilators");
    setAllStats(t_db, t_state);
  });

  $('#btn-pumps').click(function(e) {
    setCategory(t_state, "pumps");
    setAllStats(t_db, t_state);
  });
}

function setScenario(t_state, t_val) {
  t_state.scenario = t_val;
  if (t_val == "moderate") {
    $("#btn-moderate").removeClass("btn-outline-success");
    $("#btn-moderate").addClass("btn-success");
    $("#btn-worst").removeClass("btn-danger");
    $("#btn-worst").addClass("btn-outline-danger");
  } else {
    $("#btn-moderate").addClass("btn-outline-success");
    $("#btn-moderate").removeClass("btn-success");
    $("#btn-worst").addClass("btn-danger");
    $("#btn-worst").removeClass("btn-outline-danger");
  }
}

function setCategory(t_state, t_val) {
  $("#btn".concat(t_state.category)).removeClass("checked");
  t_state.category = t_val;
  $("#btn".concat(t_state.category)).addClass("checked");
}

// set region statistics for parameters
function setRegionStats(t_db, t_state) {
  const params = getParams(t_state);
  const stats = getStats(t_db, params);

  $('#n-text').html(params.n);
  $('#x-text').html(Math.floor(params.x));
  $('#T0-date').html(t_state.T0Date);
  $('#T0-registered').html(stats.registered);
  $('#T0-date2').html(t_state.T0Date);
  $('#T0-estimated').html(stats.estimated);
  $('#T0-date3').html(t_state.T0Date);

  $('#T1-date').html(t_state.T1Date);
  $('#T1-growth').html(Math.floor(params.T1Growth).toString().concat("x"));
  $('#T1-infected').html(stats.infected.T1);
  $('#T1-critical').html(stats.critical.T1);
  $('#T1-ventilators').html(stats.ventilators.T1);
  $('#T1-pumps').html(stats.pumps.T1);

  $('#T2-date').html(t_state.T2Date);
  $('#T2-growth').html(Math.floor(params.T2Growth).toString().concat("x"));
  $('#T2-infected').html(stats.infected.T2);
  $('#T2-critical').html(stats.critical.T2);
  $('#T2-ventilators').html(stats.ventilators.T2);
  $('#T2-pumps').html(stats.pumps.T2);

  $('#T3-date').html(t_state.T3Date);
  $('#T3-growth').html(Math.floor(params.T3Growth).toString().concat("x"));
  $('#T3-infected').html(stats.infected.T3);
  $('#T3-critical').html(stats.critical.T3);
  $('#T3-ventilators').html(stats.ventilators.T3);
  $('#T3-pumps').html(stats.pumps.T3);

  $('#T4-date').html(t_state.T4Date);
  $('#T4-growth').html(Math.floor(params.T4Growth).toString().concat("x"));
  $('#T4-infected').html(stats.infected.T4);
  $('#T4-critical').html(stats.critical.T4);
  $('#T4-ventilators').html(stats.ventilators.T4);
  $('#T4-pumps').html(stats.pumps.T4);
}

// extract data for a region from database
function getData(t_db, t_region) {
  let data = t_db[0];
  for (let i = 0; i < t_db.length; i++) {
    if (t_db[i][0] == t_region) {
      data = t_db[i];
    }
  }
  return data;
}

// extract model parameters from app state
function getParams(t_state) {
  const params = {
    region   : t_state.region,
    n        : t_state.nSlider.getValue(),
    x        : t_state.xSlider.getValue(),
    T1Growth : t_state.T1Slider.getValue(),
    T2Growth : t_state.T2Slider.getValue(),
    T3Growth : t_state.T3Slider.getValue(),
    T4Growth : t_state.T4Slider.getValue()
  };
  return params;
}

function resetForRegion(t_db, t_state, t_region) {
  t_state.region = t_region;
  t_state.nSlider.setValue(getData(t_db, t_region)[3]);
  $("#region-search").val(t_region);
  $("#region-list").css("display", "none");
}

// calculate statistics for given set of model parameters
function getStats(t_db, t_params)
{
  const data          = getData(t_db, t_params.region);
  const pop           = Math.floor(1000000 * 10);
  const T0InfectedReg = data[2];
  const T0InfectedEst = Math.min(Math.floor(Math.max(T0InfectedReg, 1) * t_params.n), pop);

  const tmpInfected = {
    T1 : Math.min(Math.floor(T0InfectedEst * t_params.T1Growth), pop),
    T2 : Math.min(Math.floor(T0InfectedEst * t_params.T2Growth), pop),
    T3 : Math.min(Math.floor(T0InfectedEst * t_params.T3Growth), pop),
    T4 : Math.min(Math.floor(T0InfectedEst * t_params.T4Growth), pop),
  };
  const tmpCritical = {
    T1 : Math.min(Math.floor(tmpInfected.T1 * t_params.x * 0.01), pop),
    T2 : Math.min(Math.floor(tmpInfected.T2 * t_params.x * 0.01), pop),
    T3 : Math.min(Math.floor(tmpInfected.T3 * t_params.x * 0.01), pop),
    T4 : Math.min(Math.floor(tmpInfected.T4 * t_params.x * 0.01), pop),
  };
  const tmpVentilators = {
    T1 : tmpCritical.T1,
    T2 : tmpCritical.T2,
    T3 : tmpCritical.T3,
    T4 : tmpCritical.T4,
  };
  const tmpPumps = {
    T1 : 3 * tmpCritical.T1,
    T2 : 3 * tmpCritical.T2,
    T3 : 3 * tmpCritical.T3,
    T4 : 3 * tmpCritical.T4,
  };
  const stats = {
    registered : T0InfectedReg,
    estimated  : T0InfectedEst,
    infected   : tmpInfected,
    critical   : tmpCritical,
    ventilators: tmpVentilators,
    pumps      : tmpPumps
  };
  return stats;
}

function setAllStatsRow(t_vals, t_bold) {
  let new_row = document.getElementById("all-stats").insertRow();
  for (let i = 0; i < t_vals.length; i++) {
    let new_cell = new_row.insertCell(i);
    let new_text = document.createTextNode(t_vals[i].toString());
    new_cell.appendChild(new_text);
  }
  if (t_bold) {
    new_row.classList.add("font-weight-bold");
  }
}

// set all statistics for parameters
function setAllStats(t_db, t_state) {
  $("#T1-date2").html(t_state.T1Date);
  $("#T2-date2").html(t_state.T2Date);
  $("#T3-date2").html(t_state.T3Date);
  $("#T4-date2").html(t_state.T4Date);
  $("#all-stats").html("");

  let totals = ["Pan-India Total", 0, 0, 0, 0];
  let subtotals = ["Total", 0, 0, 0, 0];
  let dstate = t_db[0][1];
  let params = getParams(t_state);
  $("#all-stats").append($("<tr>")
    .append($("<td>")
      .addClass("text-left")
        .addClass("font-weight-bold")
          .attr("scope", "row")
            .text(dstate)));
  for (let i = 0; i < t_db.length; i++) {
    if (t_db[i][1] != dstate) {
      setAllStatsRow(subtotals, true);
      for (let i = 0; i < totals.length; i++) {
        subtotals[i] = 0;
      }
      $("#all-stats").append($("<tr>")
        .append($("<td>")
          .addClass("text-left")
            .addClass("font-weight-bold")
              .attr("scope", "row")
                .text(t_db[i][1])));
    }
    if (t_state.scenario == "moderate") {
      params.region   = t_db[i][0];
      params.n        = t_db[i][3];
      params.x        = t_state.xSlider.mod;
      params.T1Growth = t_state.T1Slider.mod;
      params.T2Growth = t_state.T2Slider.mod;
      params.T3Growth = t_state.T3Slider.mod;
      params.T4Growth = t_state.T4Slider.mod;
    } else {
      params.region   = t_db[i][0];
      params.n        = t_db[i][3];
      params.x        = t_state.xSlider.wst;
      params.T1Growth = t_state.T1Slider.wst;
      params.T2Growth = t_state.T2Slider.wst;
      params.T3Growth = t_state.T3Slider.wst;
      params.T4Growth = t_state.T4Slider.wst;
    }
    const stats = getStats(t_db, params);
    if (t_state.category == "infected") {
      let vals = [];
      vals.push(t_db[i][0]);
      vals.push(stats.infected.T1);
      vals.push(stats.infected.T2);
      vals.push(stats.infected.T3);
      vals.push(stats.infected.T4);
      setAllStatsRow(vals, false);
      subtotals[1] += stats.infected.T1;
      subtotals[2] += stats.infected.T2;
      subtotals[3] += stats.infected.T3;
      subtotals[4] += stats.infected.T4;
      totals[1] += stats.infected.T1;
      totals[2] += stats.infected.T2;
      totals[3] += stats.infected.T3;
      totals[4] += stats.infected.T4;
    } else if (t_state.category == "critical") {
      let vals = [];
      vals.push(t_db[i][0]);
      vals.push(stats.critical.T1);
      vals.push(stats.critical.T2);
      vals.push(stats.critical.T3);
      vals.push(stats.critical.T4);
      setAllStatsRow(vals, false);
      subtotals[1] += stats.critical.T1;
      subtotals[2] += stats.critical.T2;
      subtotals[3] += stats.critical.T3;
      subtotals[4] += stats.critical.T4;
      totals[1] += stats.critical.T1;
      totals[2] += stats.critical.T2;
      totals[3] += stats.critical.T3;
      totals[4] += stats.critical.T4;
    } else if (t_state.category == "ventilators") {
      let vals = [];
      vals.push(t_db[i][0]);
      vals.push(stats.ventilators.T1);
      vals.push(stats.ventilators.T2);
      vals.push(stats.ventilators.T3);
      vals.push(stats.ventilators.T4);
      setAllStatsRow(vals, false);
      subtotals[1] += stats.ventilators.T1;
      subtotals[2] += stats.ventilators.T2;
      subtotals[3] += stats.ventilators.T3;
      subtotals[4] += stats.ventilators.T4;
      totals[1] += stats.ventilators.T1;
      totals[2] += stats.ventilators.T2;
      totals[3] += stats.ventilators.T3;
      totals[4] += stats.ventilators.T4;
    } else if (t_state.category == "pumps") {
      let vals = [];
      vals.push(t_db[i][0]);
      vals.push(stats.pumps.T1);
      vals.push(stats.pumps.T2);
      vals.push(stats.pumps.T3);
      vals.push(stats.pumps.T4);
      setAllStatsRow(vals, false);
      subtotals[1] += stats.pumps.T1;
      subtotals[2] += stats.pumps.T2;
      subtotals[3] += stats.pumps.T3;
      subtotals[4] += stats.pumps.T4;
      totals[1] += stats.pumps.T1;
      totals[2] += stats.pumps.T2;
      totals[3] += stats.pumps.T3;
      totals[4] += stats.pumps.T4;
    }
    dstate = t_db[i][1];
  }
  setAllStatsRow(subtotals, true);
  setAllStatsRow(totals, true);
}

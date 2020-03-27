// MOHFW data as of 24/03/2020
// region, population (millions), infected
let db = [];
db.push(["Uttar Pradesh",               199.81,  33]);
db.push(["Maharashtra",                 112.37,  87]);
db.push(["Bihar",                       104.01,   2]);
db.push(["West Bengal",                  91.27,   7]);
db.push(["Madhya Pradesh",               72.63,   7]);
db.push(["Tamil Nadu",                   72.15,  10]);
db.push(["Rajasthan",                    68.55,  33]);
db.push(["Karnataka",                    61.09,  37]);
db.push(["Gujarat",                      60.43,  29]);
db.push(["Andhra Pradesh",               49.70,   7]);
db.push(["Orissa",                       41.97,   2]);
db.push(["Telangana",                    35.20,  22]);
db.push(["Kerala",                       33.40,  95]);
db.push(["Jharkhand",                    32.98,   0]);
db.push(["Assam",                        31.20,   0]);
db.push(["Punjab",                       27.75,  21]);
db.push(["Chhattisgarh",                 25.54,   6]);
db.push(["Haryana",                      25.35,  26]);
db.push(["Delhi",                        16.78,  31]);
db.push(["Jammu and Kashmir",            12.54,   4]);
db.push(["Uttarakhand",                  10.08,   3]);
db.push(["Himachal Pradesh",              6.86,   3]);
db.push(["Tripura",                       3.67,   0]);
db.push(["Meghalaya",                     2.96,   0]);
db.push(["Manipur",                       2.85,   0]);
db.push(["Nagaland",                      1.98,   0]);
db.push(["Goa",                           1.46,   0]);
db.push(["Arunachal Pradesh",             1.38,   0]);
db.push(["Puducherry",                    1.24,   1]);
db.push(["Mizoram",                       1.09,   0]);
db.push(["Chandigarh",                    1.05,   5]);
db.push(["Sikkim",                        0.61,   0]);
db.push(["Andaman and Nicobar Islands",   0.38,   0]);
db.push(["Dadra and Nagar Haveli",        0.34,   0]);
db.push(["Daman and Diu",                 0.25,   0]);
db.push(["Lakshadweep",                   0.06,   0]);
db.push(["Ladakh",                        0.27,  13]);

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

// get default value of n for a region
function nDefault(t_db, t_region) {
  const popMillions = getData(t_db, t_region)[1];
  if (popMillions > 10) {
    return 3;
  } else {
    return 2;
  }
}

// slider with stops for moderate and worst case values
class AppSlider extends Slider {
  constructor(t_min, t_mod, t_wst, t_max, t_step, t_id, t_data_id) {
    // extent of stop markers
    const mod_start = t_mod - 0.5 * t_step;
    const mod_end   = t_mod + 0.5 * t_step; 
    const wst_start = t_wst - 0.5 * t_step; 
    const wst_end   = t_wst + 0.5 * t_step;

    super(t_id, {
      id   : t_data_id,
      min  : t_min,
      max  : t_max,
      step : t_step,
      value: t_wst,
      rangeHighlights: [{ "start": mod_start, "end": mod_end, "class": "moderate" },
                        { "start": wst_start, "end": wst_end, "class": "worst"    }]});

    this.mod = t_mod; // moderate case
    this.wst = t_wst; // worst case
  }
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
  t_state.nSlider.setValue(nDefault(t_db, t_region));
  document.getElementById("region-search").value = t_region;
  document.getElementById("region-list").style.display = "none";
}

// calculate statistics for given set of model parameters
function getStats(t_db, t_params)
{
  const data          = getData(t_db, t_params.region);
  const pop           = Math.floor(1000000 * data[1]);
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
  const stats = {
    registered : T0InfectedReg,
    estimated  : T0InfectedEst,
    infected   : tmpInfected,
    critical   : tmpCritical
  };
  return stats;
}

// set region statistics for parameters
function setRegionStats(t_db, t_state) {
  const params = getParams(t_state);
  const stats = getStats(t_db, params);

  document.getElementById("n-text").innerHTML        = params.n;
  document.getElementById("x-text").innerHTML        = Math.floor(params.x);
  document.getElementById("T0-date").innerHTML       = t_state.T0Date;
  document.getElementById("T0-registered").innerHTML = stats.registered;
  document.getElementById("T0-date2").innerHTML      = t_state.T0Date;
  document.getElementById("T0-estimated").innerHTML  = stats.estimated;
  document.getElementById("T0-date3").innerHTML      = t_state.T0Date;
 
  document.getElementById("T1-date").innerHTML       = t_state.T1Date;
  document.getElementById("T1-growth").innerHTML     = Math.floor(params.T1Growth).toString().concat("x");
  document.getElementById("T1-infected").innerHTML   = stats.infected.T1;
  document.getElementById("T1-critical").innerHTML   = stats.critical.T1;
 
  document.getElementById("T2-date").innerHTML       = t_state.T2Date;
  document.getElementById("T2-growth").innerHTML     = Math.floor(params.T2Growth).toString().concat("x");
  document.getElementById("T2-infected").innerHTML   = stats.infected.T2;
  document.getElementById("T2-critical").innerHTML   = stats.critical.T2;
 
  document.getElementById("T3-date").innerHTML       = t_state.T3Date;
  document.getElementById("T3-growth").innerHTML     = Math.floor(params.T3Growth).toString().concat("x");
  document.getElementById("T3-infected").innerHTML   = stats.infected.T3;
  document.getElementById("T3-critical").innerHTML   = stats.critical.T3;
 
  document.getElementById("T4-date").innerHTML       = t_state.T4Date;
  document.getElementById("T4-growth").innerHTML     = Math.floor(params.T4Growth).toString().concat("x");
  document.getElementById("T4-infected").innerHTML   = stats.infected.T4;
  document.getElementById("T4-critical").innerHTML   = stats.critical.T4;
}

// initialize
let appState = {
  region   : "None",
  T0Date   : "24/03/2020",
  T1Date   : "31/03/2020",
  T2Date   : "07/04/2020",
  T3Date   : "14/04/2020",
  T4Date   : "21/04/2020",
  nSlider  : new AppSlider(  1,  -5,  -5,  10,  1,  "#nSlider",  "n-slider"),
  xSlider  : new AppSlider(  0,  10,  15,  20,  1,  "#xSlider",  "x-slider"),
  T1Slider : new AppSlider(  2,   5,  10,  15,  1, "#T1Slider", "T1-slider"),
  T2Slider : new AppSlider( 20,  40,  50,  60,  2, "#T2Slider", "T2-slider"),
  T3Slider : new AppSlider( 60,  80, 120, 150,  5, "#T3Slider", "T3-slider"),
  T4Slider : new AppSlider(155, 200, 500, 590, 15, "#T4Slider", "T4-slider")
};

resetForRegion(db, appState, "Karnataka");
setRegionStats(db, appState);

appState.nSlider.on('slide', function() { setRegionStats(db, appState); });
appState.xSlider.on('slide', function() { setRegionStats(db, appState); });
appState.T1Slider.on('slide', function() { setRegionStats(db, appState); });
appState.T2Slider.on('slide', function() { setRegionStats(db, appState); });
appState.T3Slider.on('slide', function() { setRegionStats(db, appState); });
appState.T4Slider.on('slide', function() { setRegionStats(db, appState); });

// fill region list from database
let regionList = document.getElementById("region-list");
for (let i = 0; i < db.length; i++) {
  let entry = document.createElement('li');
  entry.appendChild(document.createTextNode(db[i][0]));
  entry.classList.add("region-name");
  entry.classList.add("list-group-item");
  regionList.appendChild(entry);
}

// dropdown list of region names containing string subset
// matching that typed in region search box
let regionSearch = document.getElementById("region-search");
regionSearch.addEventListener("keyup", function(e) {
  let value = $(this).val().toLowerCase();
  if (value == "") {
    regionList.style.display = "none";
  } else {
    regionList.style.display = "block";
  }
  $("#region-list li").filter(function() {
    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
  });
});

// reset app state for chosen region 
let regionObjects = document.getElementsByClassName("region-name");
for (let i = 0; i < regionObjects.length; i++) {
  regionObjects[i].addEventListener("click", function(e) {
    const regionName = e.target.textContent;
    resetForRegion(db, appState, regionName);
    setRegionStats(db, appState);
  });
}

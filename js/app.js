var db = [];

// region, population (millions), infected
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

// weeks starting dates
var T0_date = "24/03/2020";
var T1_date = "31/03/2020";
var T2_date = "07/04/2020";
var T3_date = "14/04/2020";
var T4_date = "21/04/2020";

var default_region = "Karnataka";

// min, max and default of user parameters
var reg_every_n_min = 1;
var reg_every_n_max = 10;

const reg_every_n_pop_threshold = 10000000; // 10M
const reg_every_n_large_pop     = 3;
const reg_every_n_small_pop     = 2;

var cric_inf_pct_min = 0;
var cric_inf_pct_mod = 10;
var cric_inf_pct_wst = 15;
var cric_inf_pct_max = 20;
var cric_inf_pct_def = cric_inf_pct_wst;

var T1_igrowth_min =   2;
var T1_igrowth_mod =   5;
var T1_igrowth_wst =  10;
var T1_igrowth_max =  15;
var T1_igrowth_inc =   1;
var T1_igrowth_def = T1_igrowth_wst;

var T2_igrowth_min =  20;
var T2_igrowth_mod =  40;
var T2_igrowth_wst =  50;
var T2_igrowth_max =  60;
var T2_igrowth_inc =   2;
var T2_igrowth_def =  T2_igrowth_wst;

var T3_igrowth_min =  60;
var T3_igrowth_mod =  80;
var T3_igrowth_wst = 120;
var T3_igrowth_max = 150;
var T3_igrowth_inc =   5;
var T3_igrowth_def = T3_igrowth_wst;

var T4_igrowth_min = 155;
var T4_igrowth_mod = 200;
var T4_igrowth_wst = 500;
var T4_igrowth_max = 590;
var T4_igrowth_inc =  15;
var T4_igrowth_def = T4_igrowth_wst;

// create sliders
var reg_every_n_slider = new Slider("#reg-every-n-slider", {
  id   : 'n-slider',
  min  : reg_every_n_min,
  max  : reg_every_n_max,
  step : 1,
  value: reg_every_n_min});

var cric_inf_pct_slider = new Slider("#cric-inf-pct-slider", {
  id   : 'x-slider',
  min  : cric_inf_pct_min,
  max  : cric_inf_pct_max,
  step : 1,
  value: cric_inf_pct_def,
  rangeHighlights: [{ "start": cric_inf_pct_mod - 0.5, "end": cric_inf_pct_mod + 0.5, "class": "moderate" },
                    { "start": cric_inf_pct_wst - 0.5, "end": cric_inf_pct_wst + 0.5, "class": "worst" }]});

var T1_igrowth_slider = new Slider("#T1-igrowth-slider", {
  id   : 'T1-slider',
  min  : T1_igrowth_min,
  max  : T1_igrowth_max,
  step : T1_igrowth_inc,
  value: T1_igrowth_def,
  rangeHighlights: [{ "start": T1_igrowth_mod - 0.5 * T1_igrowth_inc, "end": T1_igrowth_mod + 0.5 * T1_igrowth_inc, "class": "moderate" },
                    { "start": T1_igrowth_wst - 0.5 * T1_igrowth_inc, "end": T1_igrowth_wst + 0.5 * T1_igrowth_inc, "class": "worst" }]});

var T2_igrowth_slider = new Slider("#T2-igrowth-slider", {
  id   : 'T2-slider',
  min  : T2_igrowth_min,
  max  : T2_igrowth_max,
  step : T2_igrowth_inc,
  value: T2_igrowth_def,
  rangeHighlights: [{ "start": T2_igrowth_mod - 0.5 * T2_igrowth_inc, "end": T2_igrowth_mod + 0.5 * T2_igrowth_inc, "class": "moderate" },
                    { "start": T2_igrowth_wst - 0.5 * T2_igrowth_inc, "end": T2_igrowth_wst + 0.5 * T2_igrowth_inc, "class": "worst" }]});

var T3_igrowth_slider = new Slider("#T3-igrowth-slider", {
  id   : 'T3-slider',
  min  : T3_igrowth_min,
  max  : T3_igrowth_max,
  step : T3_igrowth_inc,
  value: T3_igrowth_def,
  rangeHighlights: [{ "start": T3_igrowth_mod - 0.5 * T3_igrowth_inc, "end": T3_igrowth_mod + 0.5 * T3_igrowth_inc, "class": "moderate" },
                    { "start": T3_igrowth_wst - 0.5 * T3_igrowth_inc, "end": T3_igrowth_wst + 0.5 * T3_igrowth_inc, "class": "worst" }]});

var T4_igrowth_slider = new Slider("#T4-igrowth-slider", {
  id   : 'T4-slider',
  min  : T4_igrowth_min,
  max  : T4_igrowth_max,
  step : T4_igrowth_inc,
  value: T4_igrowth_def,
  rangeHighlights: [{ "start": T4_igrowth_mod - 0.5 * T4_igrowth_inc, "end": T4_igrowth_mod + 0.5 * T4_igrowth_inc, "class": "moderate" },
                    { "start": T4_igrowth_wst - 0.5 * T4_igrowth_inc, "end": T4_igrowth_wst + 0.5 * T4_igrowth_inc, "class": "worst" }]});

// initialization
var params = {
  region       : default_region,
  reg_every_n  : reg_every_n_slider.getValue(),
  cric_inf_pct : cric_inf_pct_slider.getValue(),
  T1_igrowth   : T1_igrowth_slider.getValue(),
  T2_igrowth   : T2_igrowth_slider.getValue(),
  T3_igrowth   : T3_igrowth_slider.getValue(),
  T4_igrowth   : T4_igrowth_slider.getValue()
};

function get_data(t_region) {
  for (let i = 0; i < db.length; i++) {
    if (db[i][0] == t_region) {
      return db[i];
    }
  }
}

function get_default_reg_every_n(t_region) {
  let data = get_data(t_region);
  let pop = Math.floor(1000000 * data[1]);
  if (pop > reg_every_n_pop_threshold) {
    return reg_every_n_large_pop;
  } else {
    return reg_every_n_small_pop;
  }
}

function get_stats(t_params)
{
  let data        = get_data(t_params.region);
  let pop         = Math.floor(1000000 * data[1]);
  let T0_reg_inf  = data[2];
  let T0_infected = Math.min(Math.floor(Math.max(T0_reg_inf, 1) * t_params.reg_every_n), pop);

  let tmp_infected = {
    T1 : Math.min(Math.floor(T0_infected * t_params.T1_igrowth), pop),
    T2 : Math.min(Math.floor(T0_infected * t_params.T2_igrowth), pop),
    T3 : Math.min(Math.floor(T0_infected * t_params.T3_igrowth), pop),
    T4 : Math.min(Math.floor(T0_infected * t_params.T4_igrowth), pop),
  };

  let tmp_critical = {
    T1 : Math.min(Math.floor(tmp_infected.T1 * t_params.cric_inf_pct * 0.01), pop),
    T2 : Math.min(Math.floor(tmp_infected.T2 * t_params.cric_inf_pct * 0.01), pop),
    T3 : Math.min(Math.floor(tmp_infected.T3 * t_params.cric_inf_pct * 0.01), pop),
    T4 : Math.min(Math.floor(tmp_infected.T4 * t_params.cric_inf_pct * 0.01), pop),
  };

  let stats = {
    registered : T0_reg_inf,
    estimated  : T0_infected,
    infected   : tmp_infected,
    critical   : tmp_critical
  };

  return stats;
}


// fill prediction statistics table
function set_stats(t_reset_for_region) {

  if (t_reset_for_region) {
    document.getElementById("region-search").value = params.region;
    reg_every_n_slider.setValue(get_default_reg_every_n(params.region));
    params.reg_every_n = reg_every_n_slider.getValue();
  }

  let stats = get_stats(params);

  document.getElementById("reg-every-n-text").innerHTML  = params.reg_every_n;
  document.getElementById("cric-inf-pct-text").innerHTML = Math.floor(params.cric_inf_pct);
  document.getElementById("T0-date").innerHTML           = T0_date;
  document.getElementById("T0-reg-inf").innerHTML        = stats.registered;
  document.getElementById("T0-date1").innerHTML          = T0_date;
  document.getElementById("T0-infected").innerHTML       = stats.estimated;
  document.getElementById("T0-date2").innerHTML          = T0_date;
 
  document.getElementById("T1-date").innerHTML           = T1_date;
  document.getElementById("T1-igrowth").innerHTML        = Math.floor(params.T1_igrowth).toString().concat("x");
  document.getElementById("T1-infected").innerHTML       = stats.infected.T1;
  document.getElementById("T1-critical").innerHTML       = stats.critical.T1;
 
  document.getElementById("T2-date").innerHTML           = T2_date;
  document.getElementById("T2-igrowth").innerHTML        = Math.floor(params.T2_igrowth).toString().concat("x");
  document.getElementById("T2-infected").innerHTML       = stats.infected.T2;
  document.getElementById("T2-critical").innerHTML       = stats.critical.T2;
 
  document.getElementById("T3-date").innerHTML           = T3_date;
  document.getElementById("T3-igrowth").innerHTML        = Math.floor(params.T3_igrowth).toString().concat("x");
  document.getElementById("T3-infected").innerHTML       = stats.infected.T3;
  document.getElementById("T3-critical").innerHTML       = stats.critical.T3;
 
  document.getElementById("T4-date").innerHTML           = T4_date;
  document.getElementById("T4-igrowth").innerHTML        = Math.floor(params.T4_igrowth).toString().concat("x");
  document.getElementById("T4-infected").innerHTML       = stats.infected.T4;
  document.getElementById("T4-critical").innerHTML       = stats.critical.T4;
}

// initialize
set_stats(true);

// fill region list from database
// TODO change var to let in for loop
var region_list = document.getElementById("region-list");
for (let i = 0; i < db.length; i++) {
  let entry = document.createElement('li');
  entry.appendChild(document.createTextNode(db[i][0]));
  entry.classList.add("region-name");
  entry.classList.add("list-group-item");
  region_list.appendChild(entry);
}

// select region
var region_search = document.getElementById("region-search");
region_search.addEventListener("keyup", function(e) {
  let value = $(this).val().toLowerCase();
  if (value == "") {
    region_list.style.display = "none";
  } else {
    region_list.style.display = "block";
  }
  $("#region-list li").filter(function() {
    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
  });
});
var region_objects = document.getElementsByClassName("region-name");
for (let i = 0; i < region_objects.length; i++) {
  region_objects[i].addEventListener("click", function(e) {
    let region_name = e.target.textContent;
    document.getElementById("region-list").style.display = "none";
    params.region = region_name;
    set_stats(true);
  });
}

// select value of reg-every-n
reg_every_n_slider.on('slide', function() {
  params.reg_every_n = reg_every_n_slider.getValue();
  set_stats(false);
});

// select value of cric-inf-pct
cric_inf_pct_slider.on('slide', function() {
  params.cric_inf_pct = cric_inf_pct_slider.getValue();
  set_stats(false);
});

// select value of T1-igrowth
T1_igrowth_slider.on('slide', function() {
  params.T1_igrowth = T1_igrowth_slider.getValue();
  set_stats(false);
});

// select value of T2-igrowth
T2_igrowth_slider.on('slide', function() {
  params.T2_igrowth = T2_igrowth_slider.getValue();
  set_stats(false);
});

// select value of T13-igrowth
T3_igrowth_slider.on('slide', function() {
  params.T3_igrowth = T3_igrowth_slider.getValue();
  set_stats(false);
});

// select value of T4-igrowth
T4_igrowth_slider.on('slide', function() {
  params.T4_igrowth = T4_igrowth_slider.getValue();
  set_stats(false);
});

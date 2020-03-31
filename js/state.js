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

let model = new Covid19Model();

$(function()
{
  let appConfig = {
    region   : "None",
    nSlider  : new AppSlider(  1,  -5,  -5,  10,0.1,  "#nSlider",  "n-slider"),
    xSlider  : new AppSlider(  0,   8,  12,  20,  1,  "#xSlider",  "x-slider"),
    T1Slider : new AppSlider(  2,   4,  10,  15,  1, "#T1Slider", "T1-slider"),
    T2Slider : new AppSlider( 15,  20,  50,  60,  2, "#T2Slider", "T2-slider"),
    T3Slider : new AppSlider( 60,  70, 100, 120,  5, "#T3Slider", "T3-slider"),
    T4Slider : new AppSlider(120, 150, 250, 300, 10, "#T4Slider", "T4-slider"),
  };

  resetForRegion(appConfig, "Karnataka");
  setRegionStats(appConfig);
  run(appConfig);
});

function run(config)
{
  // fill region list from data
  for (let state of model.allStates) {
    let entry = document.createElement('li');
    entry.appendChild(document.createTextNode(state));
    entry.classList.add("region-name");
    entry.classList.add("list-group-item");
    $('#region-list').append(entry);
  }

  // reset app state when region is changed 
  let regionObjects = $('.region-name');
  for (let i = 0; i < regionObjects.length; i++) {
    regionObjects[i].addEventListener("click", function(e) {
      const regionName = e.target.textContent;
      resetForRegion(config, regionName);
      setRegionStats(config);
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
  config.nSlider.on('change', function() { setRegionStats(config); });
  config.xSlider.on('change', function() { setRegionStats(config); });
  config.T1Slider.on('change', function() { setRegionStats(config); });
  config.T2Slider.on('change', function() { setRegionStats(config); });
  config.T3Slider.on('change', function() { setRegionStats(config); });
  config.T4Slider.on('change', function() { setRegionStats(config); });
}

// set region statistics for parameters
function setRegionStats(config) {
  const params = getParams(config);
  const stats = model.stateStats(params.region, params);
  const ventilators = model.itemStats("ventilators", stats.critical);
  const pumps = model.itemStats("pumps", stats.critical);

  $('#n-text').html(params.n);
  $('#x-text').html(Math.floor(params.x));
  $('#T0-date').html(model.dates.t0);
  $('#T0-registered').html(stats.t0Confirmed);
  $('#T0-date2').html(model.dates.t0);
  $('#T0-estimated').html(stats.t0Estimated);
  $('#T0-date3').html(model.dates.t0);

  $('#T1-date').html(model.dates.t1);
  $('#T1-growth').html(Math.floor(params.t1Growth).toString().concat("x"));
  $('#T1-infected').html(stats.carriers.t1);
  $('#T1-critical').html(stats.critical.t1);
  $('#T1-ventilators').html(ventilators.t1);
  $('#T1-pumps').html(pumps.t1);

  $('#T2-date').html(model.dates.t2);
  $('#T2-growth').html(Math.floor(params.t2Growth).toString().concat("x"));
  $('#T2-infected').html(stats.carriers.t2);
  $('#T2-critical').html(stats.critical.t2);
  $('#T2-ventilators').html(ventilators.t2);
  $('#T2-pumps').html(pumps.t2);

  $('#T3-date').html(model.dates.t3);
  $('#T3-growth').html(Math.floor(params.t3Growth).toString().concat("x"));
  $('#T3-infected').html(stats.carriers.t3);
  $('#T3-critical').html(stats.critical.t3);
  $('#T3-ventilators').html(ventilators.t3);
  $('#T3-pumps').html(pumps.t3);

  $('#T4-date').html(model.dates.t4);
  $('#T4-growth').html(Math.floor(params.t4Growth).toString().concat("x"));
  $('#T4-infected').html(stats.carriers.t4);
  $('#T4-critical').html(stats.critical.t4);
  $('#T4-ventilators').html(ventilators.t4);
  $('#T4-pumps').html(pumps.t4);
}

// extract model parameters from app state
function getParams(config) {
  const params = {
    region   : config.region,
    n        : config.nSlider.getValue(),
    x        : config.xSlider.getValue(),
    t1Growth : config.T1Slider.getValue(),
    t2Growth : config.T2Slider.getValue(),
    t3Growth : config.T3Slider.getValue(),
    t4Growth : config.T4Slider.getValue()
  };
  return params;
}

function resetForRegion(config, state) {
  config.region = state;
  const sinfo = model.stateInfo(state);
  config.nSlider.setValue(sinfo.n);
  $("#region-search").val(state);
  $("#region-list").css("display", "none");
}

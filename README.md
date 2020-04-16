# covid19
COVID-19 Model Projections for India

## Include
Download the JS script `covid19-model-india.js` and include it locally.
```html
<script src="js/covid19-model-india.js"></script>
```

## API
Before the `Covid19ModelIndia` class can be instantiated, we need to fetch some
JSON data as follows:
```js
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
```
Due to the asynchronous nature of the fetch calls, the model should be created
only after ensuring that all data has been fetched completely. For this reason,
the model is instantiated inside the init function which is called only after
all the data has been fetched as shown above.

In order to create an instance of the model, we need to supply:
+ `t0` : baseline date, usually taken as three to seven days before the current date
+ `stateSeries` : an array containing daily state-wise statistics as obtained from `states_daily.json`
+ `caseSeries` : an array containing time-series of reported cases as obtained from `raw_data.json`

```js
function init(data)
{
  let t0 = new Date();
  t0.setDate(t0.getDate() - 3);

  let statesSeries = data[0].states_daily;
  let caseSeries   = data[1].raw_data;
  let model        = new Covid19ModelIndia(t0, statesSeries, caseSeries);
  
  // all functions using model data are nested inside this
  display(model, app);
}
```

### Minimum, Mid-range and Maximum Projections
Projected statistics for a specific district can be obtained from the model
using
```js
const districtIndex = model.indexDistrictNameKey("Bengaluru.Karnataka");
const stat = model.districtStatLimit("reported", districtIndex, new Date("10 April 2020"));
```
The above `districtStatLimit` function returns an object containing three
values `{ min : ..., mid : ..., max : ...}`.

Similar functions are available for country and state level
```js
// state level
const stateIndex = model.indexStateName("Karnataka");
var stat = model.stateStatLimit("reported", stateIndex, new Date("10 April 2020"));

// country level
var stat = model.countryStatLimit("reported", new Date("10 April 2020"));
```

### Projection Method Types
The model has two sets of parameters predefined for use:
+ `model.lowParams` : these parameters result low to moderate infection projections
+ `model.highParams`: these parameters result in high infection projections
These parameters can be passed to generate the default low and high statistics.
In addition, the model provides a time-series extrapolation method to generate
projections. The functions for obtaining these low, high and extrapolation case
projections are:
```js
const districtIndex = model.indexDistrictNameKey("Bengaluru.Karnataka");
const lowStat = model.districtStat("reported", districtIndex, model.lowParams, new Date("10 April 2020"));
const highStat = model.districtStat("reported", districtIndex, model.highParams, new Date("10 April 2020"));
const extrapolStat = model.districtStat("reported", districtIndex, model.lowParams, new Date("10 April 2020"), true);
```
Similar functions are available for state and country level.

### Projection Time Windows
The model is tuned to predict patient statistics every week, on the week from
a baseline starting date. The array of dates corresponding to each week
can be obtained using `model.dates`. `model.dates[0]` represents the baseline
date (`t=0`), `model.dates[1]` represents a week after `t=0` and so on. 

For example, to obtain the projected number of critically ill patients
for the second week in a district, the following query needs to be made:
```js
var districtIndex = model.indexDistrictNameKey("Bengaluru.Karnataka");
var numCritical = model.districtStat("critical", districtIndex, model.lowParams, model.dates[2]);
```

### Projection Categories
Projected cumulative counts upto a given date can be provided
by the model for the following categories:
+ `"reported"` : Number of infections reported
+ `"carriers"` : Number of carriers (symtomatic patients + asymptomatic)
+ `"critical"` : Number of critically ill patients
+ `"deceased"` : Number of deceased
+ `"ventilators"` : Number of ventilators required
+ `"pumps"` : Number of infusion pumps required

In addition to the calculating the index of the item or category by name, the
index can be calculated from an ID as well. See the JSON objects defined in
the scripts for information about the IDs.

## Band Plots
Band plots for projections can be generated using Gnuplot via a sequence of
shell scripts. The relevant scripts are given in the `data/band-plot` folder.
Projection output data from `stats-band.js` can be piped to a csv file by
launching the script JS script using node as follows:
1. Uncomment the last line of `js/covid19-model-india.js`, i.e. the line
with `module.exports...`
2. Enter the `data/band-plot` folder.
3. `npm install node-fetch`
4. `./selected-plots.sh` for generating plots for a selected few states and districts
5. `./plot.sh <arg1> <arg2> ...` for generating plots for a specific region
  + `./plot.sh "country" "reported"` for India plots
  + `./plot.sh "state" "Karnataka" "reported"` for states
  + `./plot.sh "district" "Bengaluru" "Karnataka" "reported"` for districts

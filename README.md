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

The model has two sets of parameters predefined for use:
+ `model.lowParams` : these parameters result low to moderate infection projections
+ `model.highParams`: these parameters result in high infection projections
These parameters can be passed to generate the default low and high statistics.

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

Statistics for the following categories can be output by the model:
+ `"reported"` : Total number of infections reported as of `t=0`
+ `"carriers"` : Estimated number of carriers for the given date
+ `"critical"` : Estimated number of critically ill patients for the given date

In addition, the number of items required for critically ill patients can be obtained
using:
```js
var itemIndex = model.indexItemName("pumps");
var numPumps = model.itemStat(itemIndex, numCritical);
```
The following types of items are currently supported:
+ `"ventilators"`
+ `"pumps"`

In addition to the calculating the index of the item or category by name, the
index can be calculated from an ID as well. See the JSON objects defined in
the scripts for information about the IDs.

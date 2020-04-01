# covid19
COVID-19 Model Projections for India

## Include
Both scripts `covid19-patients-india.js` and `covid19-model-india.js` have to be included.
```html
<script src="https://raw.githubusercontent.com/mesoscalelab/covid19/master/js/covid19-patients-india.js"></script>
<script src="https://raw.githubusercontent.com/mesoscalelab/covid19/master/js/covid19-model-india.js"></script>
```

## API
The `Covid19ModelIndia` class can be instantiated and queried as follows:
```js
var model = new Covid19ModelIndia();
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
var itemIndex = model.indexItemName("infusion-pumps");
var numPumps = model.itemStat(itemIndex, numCritical);
```
The following types of items are currently supported:
+ `"ventilators"`
+ `"infusion-pumps"`

In addition to the calculating the index of the item or category by name, the
index can be calculated from an ID as well. See the JSON objects defined in
the scripts for information about the IDs.

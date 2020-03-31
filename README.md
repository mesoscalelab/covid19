# covid19

COVID-19 Model Projections for India

## Model API

The Covid19 Projection Model JS is available
[here](https://raw.githubusercontent.com/mesoscalelab/covid19/master/js/covid19-model.js)

The `Covid19Model` class can be instantiated and queried as follows:
```javascript
var model = new Covid19Model();

// moderate case patient statistics for district
var districtID = "Bengaluru, Karnataka"
var moderateStats = model.districtIDStats(districtID, model.moderateParams);

// worst case patient statistics for district
var worstStats = model.districtIDStats(districtID, model.worstParams);

// the stats return an object with the following fields:
{
  t0Confirmed : // number of infections confirmed as of baseline date t0
  t0Estimated : // number of estimated carriers as of baseline date t0
  carriers    : { t1 : , t2 : , t3 : , t4 : } // projected number of carriers by future nth week
  critical    : { t1 : , t2 : , t3 : , t4 : } // projected number of critically ill by future nth week
}

// for example, print worst case number of critical patients
// projected for two weeks from baseline date
console.log(worstStats.critical.t1);

// item statistics are proportional to the number of critical patients
// they can be obtained by passing the critical field of the stats object
var worstPumpStats = model.itemStats("pumps", worstStats.critical)

// worst case number of pumps required for week 2
console.log(worstPumpStats.t1)

// similar statistics are available for states and country
var KAStats = model.stateStats("Karnataka", model.worstParams);
console.log(KAStats.carriers.t3);

var KAPumpStats = model.itemStats("pumps", KAStats.critical);
console.log(KAPumpStats.t3);

var KAStats = model.countryStats(model.worstParams);

// print projection dates, including baseline date t0
console.log(model.dates.t0);
console.log(model.dates.t1);
console.log(model.dates.t2);
console.log(model.dates.t3);
console.log(model.dates.t4);

class Covid19Model
{
  constructor(patients, patientDateFormat, t0, stateParams, districtParams, itemParams)
  {
    this.patientDateFormat       = patientDateFormat;
    this.t0                      = t0;
    this.stateParams             = stateParams;
    this.districtParams          = districtParamsForIndia;
    this.itemParams              = itemParamsForCriticalUse;
    this.numStates               = this.stateParams.length;
    this.numDistricts            = this.districtParams.length;
    this.numItems                = this.itemParams.length;
    this.stateNameIndexMap       = this.mapStateNameIndex();
    this.stateIDIndexMap         = this.mapStateIDIndex();
    this.districtNameKeyIndexMap = this.mapDistrictNameKeyIndex();
    this.districtIDIndexMap      = this.mapDistrictIDIndex();
    this.itemNameIndexMap        = this.mapItemNameIndex();
    this.itemIDIndexMap          = this.mapItemIDIndex();
    this.districtsOfStates       = this.listDistrictsOfStates();

    // set district-wise and state-wise counts reported as of t0 date
    this.districtNewsCount = this.binCountsByDistrict(patients, this.t0);

    // if a state has zero reported count, the model estimates that one
    // carrier is present in that state and assigns it to unclassified district
    this.districtAdjustedCount = this.districtNewsCount.slice();
    for (let i = 0; i < this.numStates; i++) {
      let stateNewsCount = 0;
      const districts = this.districtsOfStates[i];
      for (let j = 0; j < districts.length; j++) {
        stateNewsCount += this.districtNewsCount[districts[j]];
      }
      if (stateNewsCount != 0)
        continue;
      const stateName = this.stateParams[i].name;
      const key = this.districtNameKey("Unclassified", stateName);
      const district = this.districtNameKeyIndexMap.get(key);
      this.districtAdjustedCount[district] = 1;
    }
  }

  listTopAffectedStates(category, params, date)
  {
    let stats = new Array(this.numStates);
    for (let state = 0; state < stats.length; state++) {
      const stat = this.stateStat(category, state, params, date);
      stats[state] = { index : state, stat : stat };
    }
    stats.sort((a,b) => (b.stat - a.stat));
    return stats;
  }

  listTopAffectedDistricts(category, params, date)
  {
    let stats = new Array(this.numDistricts);
    for (let district = 0; district < stats.length; district++) {
      const stat = this.districtStat(category, district, params, date);
      stats[district] = { index : district, stat : stat };
    }
    stats.sort((a,b) => (b.stat - a.stat));
    return stats;
  }

  itemStat(itemIndex, numCritical)
  {
    return Math.floor(this.itemParams[itemIndex].use * numCritical);
  }

  countryStat(category, params, dateString)
  {
    let sum = 0;
    for (let i = 0; i < this.numStates; i++) {
      sum += this.stateStat(category, i, params, dateString);
    }
    return sum;
  }

  countryTotal(allDistrictCounts)
  {
    let sum = 0;
    for (let i = 0; i < this.numStates; i++) {
      sum += this.stateTotal(i, allDistrictCounts);
    }
    return sum;
  }

  stateStat(category, stateIndex, params, dateString)
  {
    const districts = this.districtsOfStates[stateIndex];
    let sum = 0;
    for (let i = 0; i < districts.length; i++) {
      sum += this.districtStat(category, districts[i], params, dateString);
    }
    return sum;
  }

  stateTotal(stateIndex, allDistrictCounts)
  {
    const districts = this.districtsOfStates[stateIndex];
    let sum = 0;
    for (let i = 0; i < districts.length; i++) {
      sum += allDistrictCounts[districts[i]];
    }
    return sum;
  }
  
  districtStatMax(category, params, date)
  {
    let maxValue = 0;
    for (let i = 0; i < this.numDistricts; i++) {
      maxValue = Math.max(maxValue, this.districtStat(category, i, params, date));
    }
    return maxValue;
  }

  interpolateAt(date, deceased0, g, t)
  {
    for (let i = 0; i < t.length; i++) {
      if (date <= t[i]) {
        return g(deceased0)[i];
      }
    }
    return g(deceased0)[t.length - 1];
  }

  districtStat(category, districtIndex, params, date)
  {
    const stateName     = this.districtParams[districtIndex].state;
    const stateIndex    = this.stateNameIndexMap.get(stateName);
    const adjustedCount = this.districtAdjustedCount[districtIndex];
    const reported0     = Math.floor(this.districtNewsCount[districtIndex]);
    const deceased0     = Math.floor(this.stateParams[stateIndex].deceased);
    const n             = (params.n > 0 ? params.n : this.stateParams[stateIndex].n);
    const growth        = this.interpolateAt(date, deceased0, params.g, params.t);
    const carriers      = Math.floor(growth * n * adjustedCount);
    const critical      = Math.floor(0.01 * params.x * carriers);
    const reported      = Math.floor(carriers / n);
    switch (category) {
      case "reported" : return (date === this.t0 ? reported0 : reported); break;
      case "carriers" : return carriers; break;
      case "critical" : return critical; break;
      default         : return this.itemStat(this.indexItemName(category), critical); break;
    }
  }

  indexStateName(stateName)
  {
    if (!this.stateNameIndexMap.has(stateName)) {
      throw new SyntaxError("State Name: \"".concat(stateName.concat("\" is not valid.")));
    }
    return this.stateNameIndexMap.get(stateName);
  }

  indexStateID(stateID)
  {
    return this.stateIDIndexMap.get(stateID);
  }

  indexDistrictNameKey(districtNameKey)
  {
    if (!this.districtNameKeyIndexMap.has(districtNameKey)) {
      throw new SyntaxError("District Name Key: \"".concat(districtNameKey.concat("\" is not valid.")));
    }
    return this.districtNameKeyIndexMap.get(districtNameKey);
  }

  indexDistrictID(districtID)
  {
    return this.districtIDIndexMap.get(districtID);
  }

  indexItemName(itemName)
  {
    if (!this.itemNameIndexMap.has(itemName)) {
      throw new SyntaxError("Item Name: \"".concat(itemName.concat("\" is not valid.")));
    }
    return this.itemNameIndexMap.get(itemName);
  }

  indexItemID(itemID)
  {
    return this.itemIDIndexMap.get(itemID);
  }

  mapStateNameIndex()
  {
    let stateNameIndexMap = new Map();
    for (let i = 0; i < this.numStates; i++) {
      stateNameIndexMap.set(this.stateParams[i].name, i);
    }
    return stateNameIndexMap;
  }

  mapStateIDIndex()
  {
    let stateIDIndexMap = new Map();
    for (let i = 0; i < this.numStates; i++) {
      stateIDIndexMap.set(this.stateParams[i].id, i);
    }
    return stateIDIndexMap;
  }

  // key for districtNameIndexMap
  districtNameKey(districtName, stateName)
  {
    return districtName.concat(".").concat(stateName);
  }

  mapDistrictNameKeyIndex()
  {
    let districtNameKeyIndexMap = new Map();
    for (let i = 0; i < this.numDistricts; i++) {
      const districtName = this.districtParams[i].name;
      const stateName    = this.districtParams[i].state;
      const key          = this.districtNameKey(districtName, stateName);
      districtNameKeyIndexMap.set(key, i);
    }
    return districtNameKeyIndexMap;
  }

  mapDistrictIDIndex()
  {
    let districtIDIndexMap = new Map();
    for (let i = 0; i < this.numDistricts; i++) {
      districtIDIndexMap.set(this.districtParams[i].id, i);
    }
    return districtIDIndexMap;
  }

  mapItemNameIndex()
  {
    let itemNameIndexMap = new Map();
    for (let i = 0; i < this.itemParams.length; i++) {
      itemNameIndexMap.set(this.itemParams[i].name, i);
    }
    return itemNameIndexMap;
  }

  mapItemIDIndex()
  {
    let itemIDIndexMap = new Map();
    for (let i = 0; i < this.itemParams.length; i++) {
      itemIDIndexMap.set(this.itemParams[i].id, i);
    }
    return itemIDIndexMap;
  }

  listDistrictsOfStates()
  {
    let districtsOfStates = new Array(this.numStates);
    for (let i = 0; i < this.numStates; i++) {
      districtsOfStates[i] = this.listDistrictsOfState(i);
    }
    return districtsOfStates;
  }

  listDistrictsOfState(stateIndex)
  {
    let districtsOfState = [];
    for (let i = 0; i < this.numDistricts; i++) {
      const stateName = this.districtParams[i].state;
      if (this.stateNameIndexMap.get(stateName) == stateIndex) {
        districtsOfState.push(i);
      }
    }
    return districtsOfState;
  }

  binCountsByDistrict(patients, tillDate)
  {
    let districtCount = new Array(this.numDistricts).fill(0);
    for (let i = 0; i < patients.length; i++) {
      const date = this.dateParser(patients[i].dateannounced, this.patientDateFormat);
      if (date > tillDate)
        continue;
      const stateName = patients[i].detectedstate;
      if (stateName === "")
        continue;
      let districtName = patients[i].detecteddistrict;
      if (districtName === "")
        districtName = "Unclassified";
      const key = this.districtNameKey(districtName, stateName);
      districtCount[this.districtNameKeyIndexMap.get(key)]++;
    }
    return districtCount;
  }

  dateParser(dateString, format)
  {
    switch (format) {
      case "DD/MM/YYYY":
      {
        let p = dateString.split("/");
        return new Date(p[2], p[1] - 1, p[0]);
      }
      break;
    }
  }

}

class Covid19ModelIndia extends Covid19Model
{
  constructor(baseDate, stateTimeSeries, caseTimeSeries) {

    // set base date and next four weeks
    let dates = new Array(4);
    for (let i = 0; i <= 4; i++) {
      dates[i] = new Date(baseDate);
      dates[i].setDate(baseDate.getDate() + i * 7);
    }

    // carrier growth functions
    function lowGrowth(deceased) {
      if (deceased < 10) {
        return [1,3,20,70,150];
      } else {
        return [1,4.5,18,62,140];
      }
    }

    function highGrowth(deceased) {
      if (deceased < 10) {
        return [1,7,50,120,400];
      } else {
        return [1,8,40,118,320];
      }
    }

    let stateParams = binStateCountsTill(dates[0], stateTimeSeries);
    super(caseTimeSeries,
          "DD/MM/YYYY",
          dates[0],
          stateParams,
          districtParamsForIndia,
          itemParamsForCriticalUse);

    this.dates      = dates;
    this.lowParams  = { n : -1, x : 10, g : lowGrowth,  t : dates };
    this.highParams = { n : -1, x : 10, g : highGrowth, t : dates };
  }
}

function inflationFactor(confirmed, deceased)
{
  const n = (118 + 97 * deceased) / confirmed;
  if (deceased < 5) {
    return 2;
  } else if (n > 5) {
    return 5;
  } else if (n < 1) {
    return 1;
  } else {
    return n;
  }
}

function binStateCountsTill(date, data)
{
  let stateAbbrvs = Object.keys(data[0]);
  stateAbbrvs.splice(stateAbbrvs.indexOf("date"), 1);
  stateAbbrvs.splice(stateAbbrvs.indexOf("status"), 1);
  stateAbbrvs.splice(stateAbbrvs.indexOf("tt"), 1);

  let confirmed = new Array(stateAbbrvs.length).fill(0);
  let recovered = new Array(stateAbbrvs.length).fill(0);
  let deceased  = new Array(stateAbbrvs.length).fill(0);
  for (let i = 0; i < data.length; i++) {
    const info = data[i];
    if (new Date(info.date) > date)
      continue;
    for (let j = 0; j < stateAbbrvs.length; j++) {
      if (info.status === "Confirmed")
        confirmed[j] += +info[stateAbbrvs[j]];
      if (info.status === "Recovered")
        recovered[j] += +info[stateAbbrvs[j]];
      if (info.status === "Deceased")
        deceased[j]  += +info[stateAbbrvs[j]];
    }
  }

  var count = (abbrv, stat) => stat[stateAbbrvs.indexOf(abbrv)];

  function pack(abbrv, state)
  { return {
      id       : abbrv,
      name     : state,
      deceased : count(abbrv, deceased),
      n        : inflationFactor(count(abbrv, confirmed), count(abbrv, deceased))
    };
  };

  let chart = [];
  chart.push(pack("an", "Andaman and Nicobar Islands"));
  chart.push(pack("ap", "Andhra Pradesh"));
  chart.push(pack("ar", "Arunachal Pradesh"));
  chart.push(pack("as", "Assam"));
  chart.push(pack("br", "Bihar"));
  chart.push(pack("ch", "Chandigarh"));
  chart.push(pack("ct", "Chhattisgarh"));
  chart.push(pack("dn", "Dadra and Nagar Haveli"));
  chart.push(pack("dd", "Daman And Diu"));
  chart.push(pack("dl", "Delhi"));
  chart.push(pack("ga", "Goa"));
  chart.push(pack("gj", "Gujarat"));
  chart.push(pack("hr", "Haryana"));
  chart.push(pack("hp", "Himachal Pradesh"));
  chart.push(pack("jk", "Jammu and Kashmir"));
  chart.push(pack("jh", "Jharkhand"));
  chart.push(pack("ka", "Karnataka"));
  chart.push(pack("kl", "Kerala"));
  chart.push(pack("ld", "Ladakh"));
  chart.push(pack("la", "Lakshadweep"));
  chart.push(pack("mp", "Madhya Pradesh"));
  chart.push(pack("mh", "Maharashtra"));
  chart.push(pack("mn", "Manipur"));
  chart.push(pack("ml", "Meghalaya"));
  chart.push(pack("mz", "Mizoram"));
  chart.push(pack("nl", "Nagaland"));
  chart.push(pack("or", "Odisha"));
  chart.push(pack("py", "Puducherry"));
  chart.push(pack("pb", "Punjab"));
  chart.push(pack("rj", "Rajasthan"));
  chart.push(pack("sk", "Sikkim"));
  chart.push(pack("tn", "Tamil Nadu"));
  chart.push(pack("tg", "Telangana"));
  chart.push(pack("tr", "Tripura"));
  chart.push(pack("up", "Uttar Pradesh"));
  chart.push(pack("ut", "Uttarakhand"));
  chart.push(pack("wb", "West Bengal"));
  return chart;
}

const itemParamsForCriticalUse = [
{ "id" : 1, "name" : "ventilators",    "use" : 1   },
{ "id" : 2, "name" : "pumps",          "use" : 3.5 }
];

// After .odf to .csv export:
// replace ,, with ,Unclassified,
// add Unclassified district for states missing them
// awk -F "," '{print "{ \"id\" : "$1", \"name\" : \""$2"\", \"state\" : \""$3"\"},"}' districtIDs.csv > test.json
const districtParamsForIndia = [
{ "id" : 1, "name" : "Nicobars", "state" : "Andaman and Nicobar Islands"},
{ "id" : 2, "name" : "North and Middle Andaman", "state" : "Andaman and Nicobar Islands"},
{ "id" : 3, "name" : "South Andaman", "state" : "Andaman and Nicobar Islands"},
{ "id" : 4, "name" : "Anantapur", "state" : "Andhra Pradesh"},
{ "id" : 5, "name" : "Chittoor", "state" : "Andhra Pradesh"},
{ "id" : 6, "name" : "East Godavari", "state" : "Andhra Pradesh"},
{ "id" : 7, "name" : "Guntur", "state" : "Andhra Pradesh"},
{ "id" : 8, "name" : "Krishna", "state" : "Andhra Pradesh"},
{ "id" : 9, "name" : "Kurnool", "state" : "Andhra Pradesh"},
{ "id" : 10, "name" : "Prakasam", "state" : "Andhra Pradesh"},
{ "id" : 11, "name" : "S.P.S. Nellore", "state" : "Andhra Pradesh"},
{ "id" : 12, "name" : "Srikakulam", "state" : "Andhra Pradesh"},
{ "id" : 13, "name" : "Visakhapatnam", "state" : "Andhra Pradesh"},
{ "id" : 14, "name" : "Vizianagaram", "state" : "Andhra Pradesh"},
{ "id" : 15, "name" : "West Godavari", "state" : "Andhra Pradesh"},
{ "id" : 16, "name" : "Y.S.R.", "state" : "Andhra Pradesh"},
{ "id" : 17, "name" : "Anjaw", "state" : "Arunachal Pradesh"},
{ "id" : 18, "name" : "Changlang", "state" : "Arunachal Pradesh"},
{ "id" : 19, "name" : "East Kameng", "state" : "Arunachal Pradesh"},
{ "id" : 20, "name" : "East Siang", "state" : "Arunachal Pradesh"},
{ "id" : 21, "name" : "Kamle", "state" : "Arunachal Pradesh"},
{ "id" : 22, "name" : "Kra Daadi", "state" : "Arunachal Pradesh"},
{ "id" : 23, "name" : "Kurung Kumey", "state" : "Arunachal Pradesh"},
{ "id" : 24, "name" : "Lepa Rada", "state" : "Arunachal Pradesh"},
{ "id" : 25, "name" : "Lohit", "state" : "Arunachal Pradesh"},
{ "id" : 26, "name" : "Longding", "state" : "Arunachal Pradesh"},
{ "id" : 27, "name" : "Lower Dibang Valley", "state" : "Arunachal Pradesh"},
{ "id" : 28, "name" : "Lower Siang", "state" : "Arunachal Pradesh"},
{ "id" : 29, "name" : "Lower Subansiri", "state" : "Arunachal Pradesh"},
{ "id" : 30, "name" : "Namsai", "state" : "Arunachal Pradesh"},
{ "id" : 31, "name" : "Pakke Kessang", "state" : "Arunachal Pradesh"},
{ "id" : 32, "name" : "Papum Pare", "state" : "Arunachal Pradesh"},
{ "id" : 33, "name" : "Shi Yomi", "state" : "Arunachal Pradesh"},
{ "id" : 34, "name" : "Siang", "state" : "Arunachal Pradesh"},
{ "id" : 35, "name" : "Tawang", "state" : "Arunachal Pradesh"},
{ "id" : 36, "name" : "Tirap", "state" : "Arunachal Pradesh"},
{ "id" : 37, "name" : "Upper Dibang Valley", "state" : "Arunachal Pradesh"},
{ "id" : 38, "name" : "Upper Siang", "state" : "Arunachal Pradesh"},
{ "id" : 39, "name" : "Upper Subansiri", "state" : "Arunachal Pradesh"},
{ "id" : 40, "name" : "West Kameng", "state" : "Arunachal Pradesh"},
{ "id" : 41, "name" : "West Siang", "state" : "Arunachal Pradesh"},
{ "id" : 42, "name" : "Baksa", "state" : "Assam"},
{ "id" : 43, "name" : "Barpeta", "state" : "Assam"},
{ "id" : 44, "name" : "Biswanath", "state" : "Assam"},
{ "id" : 45, "name" : "Bongaigaon", "state" : "Assam"},
{ "id" : 46, "name" : "Cachar", "state" : "Assam"},
{ "id" : 47, "name" : "Charaideo", "state" : "Assam"},
{ "id" : 48, "name" : "Chirang", "state" : "Assam"},
{ "id" : 49, "name" : "Darrang", "state" : "Assam"},
{ "id" : 50, "name" : "Dhemaji", "state" : "Assam"},
{ "id" : 51, "name" : "Dhubri", "state" : "Assam"},
{ "id" : 52, "name" : "Dibrugarh", "state" : "Assam"},
{ "id" : 53, "name" : "Dima Hasao", "state" : "Assam"},
{ "id" : 54, "name" : "Goalpara", "state" : "Assam"},
{ "id" : 55, "name" : "Golaghat", "state" : "Assam"},
{ "id" : 56, "name" : "Hailakandi", "state" : "Assam"},
{ "id" : 57, "name" : "Hojai", "state" : "Assam"},
{ "id" : 58, "name" : "Jorhat", "state" : "Assam"},
{ "id" : 59, "name" : "Kamrup", "state" : "Assam"},
{ "id" : 60, "name" : "Kamrup Metropolitan", "state" : "Assam"},
{ "id" : 61, "name" : "Karbi Anglong", "state" : "Assam"},
{ "id" : 62, "name" : "Karimganj", "state" : "Assam"},
{ "id" : 63, "name" : "Kokrajhar", "state" : "Assam"},
{ "id" : 64, "name" : "Lakhimpur", "state" : "Assam"},
{ "id" : 65, "name" : "Majuli", "state" : "Assam"},
{ "id" : 66, "name" : "Morigaon", "state" : "Assam"},
{ "id" : 67, "name" : "Nagaon", "state" : "Assam"},
{ "id" : 68, "name" : "Nalbari", "state" : "Assam"},
{ "id" : 69, "name" : "Sivasagar", "state" : "Assam"},
{ "id" : 70, "name" : "Sonitpur", "state" : "Assam"},
{ "id" : 71, "name" : "South Salmara Mancachar", "state" : "Assam"},
{ "id" : 72, "name" : "Tinsukia", "state" : "Assam"},
{ "id" : 73, "name" : "Udalguri", "state" : "Assam"},
{ "id" : 74, "name" : "West Karbi Anglong", "state" : "Assam"},
{ "id" : 75, "name" : "Araria", "state" : "Bihar"},
{ "id" : 76, "name" : "Arwal", "state" : "Bihar"},
{ "id" : 77, "name" : "Aurangabad", "state" : "Bihar"},
{ "id" : 78, "name" : "Banka", "state" : "Bihar"},
{ "id" : 79, "name" : "Begusarai", "state" : "Bihar"},
{ "id" : 80, "name" : "Bhagalpur", "state" : "Bihar"},
{ "id" : 81, "name" : "Bhojpur", "state" : "Bihar"},
{ "id" : 82, "name" : "Buxar", "state" : "Bihar"},
{ "id" : 83, "name" : "Darbhanga", "state" : "Bihar"},
{ "id" : 84, "name" : "Gaya", "state" : "Bihar"},
{ "id" : 85, "name" : "Gopalganj", "state" : "Bihar"},
{ "id" : 86, "name" : "Jamui", "state" : "Bihar"},
{ "id" : 87, "name" : "Jehanabad", "state" : "Bihar"},
{ "id" : 88, "name" : "Kaimur Bhabua", "state" : "Bihar"},
{ "id" : 89, "name" : "Katihar", "state" : "Bihar"},
{ "id" : 90, "name" : "Khagaria", "state" : "Bihar"},
{ "id" : 91, "name" : "Kishanganj", "state" : "Bihar"},
{ "id" : 92, "name" : "Lakhisarai", "state" : "Bihar"},
{ "id" : 93, "name" : "Madhepura", "state" : "Bihar"},
{ "id" : 94, "name" : "Madhubani", "state" : "Bihar"},
{ "id" : 95, "name" : "Munger", "state" : "Bihar"},
{ "id" : 96, "name" : "Muzaffarpur", "state" : "Bihar"},
{ "id" : 97, "name" : "Nalanda", "state" : "Bihar"},
{ "id" : 98, "name" : "Nawada", "state" : "Bihar"},
{ "id" : 99, "name" : "West Champaran", "state" : "Bihar"},
{ "id" : 100, "name" : "Patna", "state" : "Bihar"},
{ "id" : 101, "name" : "East Champaran", "state" : "Bihar"},
{ "id" : 102, "name" : "Purnia", "state" : "Bihar"},
{ "id" : 103, "name" : "Rohtas", "state" : "Bihar"},
{ "id" : 104, "name" : "Saharsa", "state" : "Bihar"},
{ "id" : 105, "name" : "Samastipur", "state" : "Bihar"},
{ "id" : 106, "name" : "Saran", "state" : "Bihar"},
{ "id" : 107, "name" : "Sheikhpura", "state" : "Bihar"},
{ "id" : 108, "name" : "Sheohar", "state" : "Bihar"},
{ "id" : 109, "name" : "Sitamarhi", "state" : "Bihar"},
{ "id" : 110, "name" : "Siwan", "state" : "Bihar"},
{ "id" : 111, "name" : "Supaul", "state" : "Bihar"},
{ "id" : 112, "name" : "Vaishali", "state" : "Bihar"},
{ "id" : 113, "name" : "Chandigarh", "state" : "Chandigarh"},
{ "id" : 114, "name" : "Balod", "state" : "Chhattisgarh"},
{ "id" : 115, "name" : "Baloda Bazar", "state" : "Chhattisgarh"},
{ "id" : 116, "name" : "Balrampur", "state" : "Chhattisgarh"},
{ "id" : 117, "name" : "Bametara", "state" : "Chhattisgarh"},
{ "id" : 118, "name" : "Bastar", "state" : "Chhattisgarh"},
{ "id" : 119, "name" : "Bijapur", "state" : "Chhattisgarh"},
{ "id" : 120, "name" : "Bilaspur", "state" : "Chhattisgarh"},
{ "id" : 121, "name" : "Dakshin Bastar Dantewada", "state" : "Chhattisgarh"},
{ "id" : 122, "name" : "Dhamtari", "state" : "Chhattisgarh"},
{ "id" : 123, "name" : "Durg", "state" : "Chhattisgarh"},
{ "id" : 124, "name" : "Gariaband", "state" : "Chhattisgarh"},
{ "id" : 125, "name" : "Janjgir Champa", "state" : "Chhattisgarh"},
{ "id" : 126, "name" : "Jashpur", "state" : "Chhattisgarh"},
{ "id" : 127, "name" : "Kabeerdham", "state" : "Chhattisgarh"},
{ "id" : 128, "name" : "Kondagaon", "state" : "Chhattisgarh"},
{ "id" : 129, "name" : "Korba", "state" : "Chhattisgarh"},
{ "id" : 130, "name" : "Koriya", "state" : "Chhattisgarh"},
{ "id" : 131, "name" : "Mahasamund", "state" : "Chhattisgarh"},
{ "id" : 132, "name" : "Mungeli", "state" : "Chhattisgarh"},
{ "id" : 133, "name" : "Narayanpur", "state" : "Chhattisgarh"},
{ "id" : 134, "name" : "Raigarh", "state" : "Chhattisgarh"},
{ "id" : 135, "name" : "Raipur", "state" : "Chhattisgarh"},
{ "id" : 136, "name" : "Rajnandgaon", "state" : "Chhattisgarh"},
{ "id" : 137, "name" : "Sukma", "state" : "Chhattisgarh"},
{ "id" : 138, "name" : "Surajpur", "state" : "Chhattisgarh"},
{ "id" : 139, "name" : "Surguja", "state" : "Chhattisgarh"},
{ "id" : 140, "name" : "Uttar Bastar Kanker", "state" : "Chhattisgarh"},
{ "id" : 141, "name" : "Dadra and Nagar Haveli", "state" : "Dadra and Nagar Haveli"},
{ "id" : 142, "name" : "Daman", "state" : "Daman And Diu"},
{ "id" : 143, "name" : "Diu", "state" : "Daman And Diu"},
{ "id" : 144, "name" : "Central Delhi", "state" : "Delhi"},
{ "id" : 145, "name" : "East Delhi", "state" : "Delhi"},
{ "id" : 146, "name" : "New Delhi", "state" : "Delhi"},
{ "id" : 147, "name" : "North Delhi", "state" : "Delhi"},
{ "id" : 148, "name" : "North East Delhi", "state" : "Delhi"},
{ "id" : 149, "name" : "North West Delhi", "state" : "Delhi"},
{ "id" : 150, "name" : "Shahdara", "state" : "Delhi"},
{ "id" : 151, "name" : "South Delhi", "state" : "Delhi"},
{ "id" : 152, "name" : "South East Delhi", "state" : "Delhi"},
{ "id" : 153, "name" : "South West Delhi", "state" : "Delhi"},
{ "id" : 154, "name" : "West Delhi", "state" : "Delhi"},
{ "id" : 155, "name" : "North Goa", "state" : "Goa"},
{ "id" : 156, "name" : "South Goa", "state" : "Goa"},
{ "id" : 157, "name" : "Ahmadabad", "state" : "Gujarat"},
{ "id" : 158, "name" : "Amreli", "state" : "Gujarat"},
{ "id" : 159, "name" : "Anand", "state" : "Gujarat"},
{ "id" : 160, "name" : "Aravalli", "state" : "Gujarat"},
{ "id" : 161, "name" : "Banas Kantha", "state" : "Gujarat"},
{ "id" : 162, "name" : "Bharuch", "state" : "Gujarat"},
{ "id" : 163, "name" : "Bhavnagar", "state" : "Gujarat"},
{ "id" : 164, "name" : "Botad", "state" : "Gujarat"},
{ "id" : 165, "name" : "Chota Udaipur", "state" : "Gujarat"},
{ "id" : 166, "name" : "Devbhumi Dwarka", "state" : "Gujarat"},
{ "id" : 167, "name" : "Dohad", "state" : "Gujarat"},
{ "id" : 168, "name" : "Gandhinagar", "state" : "Gujarat"},
{ "id" : 169, "name" : "Gir Somnath", "state" : "Gujarat"},
{ "id" : 170, "name" : "Jamnagar", "state" : "Gujarat"},
{ "id" : 171, "name" : "Junagadh", "state" : "Gujarat"},
{ "id" : 172, "name" : "Kachchh", "state" : "Gujarat"},
{ "id" : 173, "name" : "Kheda", "state" : "Gujarat"},
{ "id" : 174, "name" : "Mahesana", "state" : "Gujarat"},
{ "id" : 175, "name" : "Mahisagar", "state" : "Gujarat"},
{ "id" : 176, "name" : "Morbi", "state" : "Gujarat"},
{ "id" : 177, "name" : "Narmada", "state" : "Gujarat"},
{ "id" : 178, "name" : "Navsari", "state" : "Gujarat"},
{ "id" : 179, "name" : "Panch Mahals", "state" : "Gujarat"},
{ "id" : 180, "name" : "Patan", "state" : "Gujarat"},
{ "id" : 181, "name" : "Porbandar", "state" : "Gujarat"},
{ "id" : 182, "name" : "Rajkot", "state" : "Gujarat"},
{ "id" : 183, "name" : "Sabar Kantha", "state" : "Gujarat"},
{ "id" : 184, "name" : "Surat", "state" : "Gujarat"},
{ "id" : 185, "name" : "Surendranagar", "state" : "Gujarat"},
{ "id" : 186, "name" : "Tapi", "state" : "Gujarat"},
{ "id" : 187, "name" : "The Dangs", "state" : "Gujarat"},
{ "id" : 188, "name" : "Vadodara", "state" : "Gujarat"},
{ "id" : 189, "name" : "Valsad", "state" : "Gujarat"},
{ "id" : 190, "name" : "Ambala", "state" : "Haryana"},
{ "id" : 191, "name" : "Bhiwani", "state" : "Haryana"},
{ "id" : 192, "name" : "Charki Dadri", "state" : "Haryana"},
{ "id" : 193, "name" : "Faridabad", "state" : "Haryana"},
{ "id" : 194, "name" : "Fatehabad", "state" : "Haryana"},
{ "id" : 195, "name" : "Gurugram", "state" : "Haryana"},
{ "id" : 196, "name" : "Hisar", "state" : "Haryana"},
{ "id" : 197, "name" : "Jhajjar", "state" : "Haryana"},
{ "id" : 198, "name" : "Jind", "state" : "Haryana"},
{ "id" : 199, "name" : "Kaithal", "state" : "Haryana"},
{ "id" : 200, "name" : "Karnal", "state" : "Haryana"},
{ "id" : 201, "name" : "Kurukshetra", "state" : "Haryana"},
{ "id" : 202, "name" : "Mahendragarh", "state" : "Haryana"},
{ "id" : 203, "name" : "Nuh", "state" : "Haryana"},
{ "id" : 204, "name" : "Palwal", "state" : "Haryana"},
{ "id" : 205, "name" : "Panchkula", "state" : "Haryana"},
{ "id" : 206, "name" : "Panipat", "state" : "Haryana"},
{ "id" : 207, "name" : "Rewari", "state" : "Haryana"},
{ "id" : 208, "name" : "Rohtak", "state" : "Haryana"},
{ "id" : 209, "name" : "Sirsa", "state" : "Haryana"},
{ "id" : 210, "name" : "Sonipat", "state" : "Haryana"},
{ "id" : 211, "name" : "Yamunanagar", "state" : "Haryana"},
{ "id" : 212, "name" : "Bilaspur", "state" : "Himachal Pradesh"},
{ "id" : 213, "name" : "Chamba", "state" : "Himachal Pradesh"},
{ "id" : 214, "name" : "Hamirpur", "state" : "Himachal Pradesh"},
{ "id" : 215, "name" : "Kangra", "state" : "Himachal Pradesh"},
{ "id" : 216, "name" : "Kinnaur", "state" : "Himachal Pradesh"},
{ "id" : 217, "name" : "Kullu", "state" : "Himachal Pradesh"},
{ "id" : 218, "name" : "Lahul and Spiti", "state" : "Himachal Pradesh"},
{ "id" : 219, "name" : "Mandi", "state" : "Himachal Pradesh"},
{ "id" : 220, "name" : "Shimla", "state" : "Himachal Pradesh"},
{ "id" : 221, "name" : "Sirmaur", "state" : "Himachal Pradesh"},
{ "id" : 222, "name" : "Solan", "state" : "Himachal Pradesh"},
{ "id" : 223, "name" : "Una", "state" : "Himachal Pradesh"},
{ "id" : 224, "name" : "Anantnag", "state" : "Jammu and Kashmir"},
{ "id" : 225, "name" : "Badgam", "state" : "Jammu and Kashmir"},
{ "id" : 226, "name" : "Bandipore", "state" : "Jammu and Kashmir"},
{ "id" : 227, "name" : "Baramula", "state" : "Jammu and Kashmir"},
{ "id" : 228, "name" : "Doda", "state" : "Jammu and Kashmir"},
{ "id" : 229, "name" : "Ganderbal", "state" : "Jammu and Kashmir"},
{ "id" : 230, "name" : "Jammu", "state" : "Jammu and Kashmir"},
{ "id" : 231, "name" : "Kathua", "state" : "Jammu and Kashmir"},
{ "id" : 232, "name" : "Kishtwar", "state" : "Jammu and Kashmir"},
{ "id" : 233, "name" : "Kulgam", "state" : "Jammu and Kashmir"},
{ "id" : 234, "name" : "Kupwara", "state" : "Jammu and Kashmir"},
{ "id" : 235, "name" : "Mirpur", "state" : "Jammu and Kashmir"},
{ "id" : 236, "name" : "Muzaffarabad", "state" : "Jammu and Kashmir"},
{ "id" : 237, "name" : "Pulwama", "state" : "Jammu and Kashmir"},
{ "id" : 238, "name" : "Punch", "state" : "Jammu and Kashmir"},
{ "id" : 239, "name" : "Rajouri", "state" : "Jammu and Kashmir"},
{ "id" : 240, "name" : "Ramban", "state" : "Jammu and Kashmir"},
{ "id" : 241, "name" : "Reasi", "state" : "Jammu and Kashmir"},
{ "id" : 242, "name" : "Samba", "state" : "Jammu and Kashmir"},
{ "id" : 243, "name" : "Shupiyan", "state" : "Jammu and Kashmir"},
{ "id" : 244, "name" : "Srinagar", "state" : "Jammu and Kashmir"},
{ "id" : 245, "name" : "Udhampur", "state" : "Jammu and Kashmir"},
{ "id" : 246, "name" : "Bokaro", "state" : "Jharkhand"},
{ "id" : 247, "name" : "Chatra", "state" : "Jharkhand"},
{ "id" : 248, "name" : "Deoghar", "state" : "Jharkhand"},
{ "id" : 249, "name" : "Dhanbad", "state" : "Jharkhand"},
{ "id" : 250, "name" : "Dumka", "state" : "Jharkhand"},
{ "id" : 251, "name" : "Garhwa", "state" : "Jharkhand"},
{ "id" : 252, "name" : "Giridih", "state" : "Jharkhand"},
{ "id" : 253, "name" : "Godda", "state" : "Jharkhand"},
{ "id" : 254, "name" : "Gumla", "state" : "Jharkhand"},
{ "id" : 255, "name" : "Hazaribagh", "state" : "Jharkhand"},
{ "id" : 256, "name" : "Jamtara", "state" : "Jharkhand"},
{ "id" : 257, "name" : "Khunti", "state" : "Jharkhand"},
{ "id" : 258, "name" : "Kodarma", "state" : "Jharkhand"},
{ "id" : 259, "name" : "Latehar", "state" : "Jharkhand"},
{ "id" : 260, "name" : "Lohardaga", "state" : "Jharkhand"},
{ "id" : 261, "name" : "Pakur", "state" : "Jharkhand"},
{ "id" : 262, "name" : "Palamu", "state" : "Jharkhand"},
{ "id" : 263, "name" : "Pashchimi Singhbhum", "state" : "Jharkhand"},
{ "id" : 264, "name" : "Purbi Singhbhum", "state" : "Jharkhand"},
{ "id" : 265, "name" : "Ramgarh", "state" : "Jharkhand"},
{ "id" : 266, "name" : "Ranchi", "state" : "Jharkhand"},
{ "id" : 267, "name" : "Sahibganj", "state" : "Jharkhand"},
{ "id" : 268, "name" : "Saraikela-Kharsawan", "state" : "Jharkhand"},
{ "id" : 269, "name" : "Simdega", "state" : "Jharkhand"},
{ "id" : 270, "name" : "Bagalkote", "state" : "Karnataka"},
{ "id" : 271, "name" : "Ballari", "state" : "Karnataka"},
{ "id" : 272, "name" : "Belagavi", "state" : "Karnataka"},
{ "id" : 273, "name" : "Bengaluru", "state" : "Karnataka"},
{ "id" : 274, "name" : "Bengaluru Rural", "state" : "Karnataka"},
{ "id" : 275, "name" : "Bidar", "state" : "Karnataka"},
{ "id" : 276, "name" : "Chamarajanagara", "state" : "Karnataka"},
{ "id" : 277, "name" : "Chikkaballapura", "state" : "Karnataka"},
{ "id" : 278, "name" : "Chikkamagaluru", "state" : "Karnataka"},
{ "id" : 279, "name" : "Chitradurga", "state" : "Karnataka"},
{ "id" : 280, "name" : "Dakshina Kannada", "state" : "Karnataka"},
{ "id" : 281, "name" : "Davanagere", "state" : "Karnataka"},
{ "id" : 282, "name" : "Dharwad", "state" : "Karnataka"},
{ "id" : 283, "name" : "Gadag", "state" : "Karnataka"},
{ "id" : 284, "name" : "Hassan", "state" : "Karnataka"},
{ "id" : 285, "name" : "Haveri", "state" : "Karnataka"},
{ "id" : 286, "name" : "Kalaburagi", "state" : "Karnataka"},
{ "id" : 287, "name" : "Kodagu", "state" : "Karnataka"},
{ "id" : 288, "name" : "Kolar", "state" : "Karnataka"},
{ "id" : 289, "name" : "Koppal", "state" : "Karnataka"},
{ "id" : 290, "name" : "Mandya", "state" : "Karnataka"},
{ "id" : 291, "name" : "Mysuru", "state" : "Karnataka"},
{ "id" : 292, "name" : "Raichur", "state" : "Karnataka"},
{ "id" : 293, "name" : "Ramanagara", "state" : "Karnataka"},
{ "id" : 294, "name" : "Shivamogga", "state" : "Karnataka"},
{ "id" : 295, "name" : "Tumakuru", "state" : "Karnataka"},
{ "id" : 296, "name" : "Udupi", "state" : "Karnataka"},
{ "id" : 297, "name" : "Uttara Kannada", "state" : "Karnataka"},
{ "id" : 298, "name" : "Vijayapura", "state" : "Karnataka"},
{ "id" : 299, "name" : "Yadgir", "state" : "Karnataka"},
{ "id" : 300, "name" : "Alappuzha", "state" : "Kerala"},
{ "id" : 301, "name" : "Ernakulam", "state" : "Kerala"},
{ "id" : 302, "name" : "Idukki", "state" : "Kerala"},
{ "id" : 303, "name" : "Kannur", "state" : "Kerala"},
{ "id" : 304, "name" : "Kasaragod", "state" : "Kerala"},
{ "id" : 305, "name" : "Kollam", "state" : "Kerala"},
{ "id" : 306, "name" : "Kottayam", "state" : "Kerala"},
{ "id" : 307, "name" : "Kozhikode", "state" : "Kerala"},
{ "id" : 308, "name" : "Malappuram", "state" : "Kerala"},
{ "id" : 309, "name" : "Palakkad", "state" : "Kerala"},
{ "id" : 310, "name" : "Pathanamthitta", "state" : "Kerala"},
{ "id" : 311, "name" : "Thiruvananthapuram", "state" : "Kerala"},
{ "id" : 312, "name" : "Thrissur", "state" : "Kerala"},
{ "id" : 313, "name" : "Wayanad", "state" : "Kerala"},
{ "id" : 314, "name" : "Kargil", "state" : "Ladakh"},
{ "id" : 315, "name" : "Leh", "state" : "Ladakh"},
{ "id" : 316, "name" : "Lakshadweep", "state" : "Lakshadweep"},
{ "id" : 317, "name" : "Agar Malwa", "state" : "Madhya Pradesh"},
{ "id" : 318, "name" : "Alirajpur", "state" : "Madhya Pradesh"},
{ "id" : 319, "name" : "Anuppur", "state" : "Madhya Pradesh"},
{ "id" : 320, "name" : "Ashoknagar", "state" : "Madhya Pradesh"},
{ "id" : 321, "name" : "Balaghat", "state" : "Madhya Pradesh"},
{ "id" : 322, "name" : "Barwani", "state" : "Madhya Pradesh"},
{ "id" : 323, "name" : "Betul", "state" : "Madhya Pradesh"},
{ "id" : 324, "name" : "Bhind", "state" : "Madhya Pradesh"},
{ "id" : 325, "name" : "Bhopal", "state" : "Madhya Pradesh"},
{ "id" : 326, "name" : "Burhanpur", "state" : "Madhya Pradesh"},
{ "id" : 327, "name" : "Chhatarpur", "state" : "Madhya Pradesh"},
{ "id" : 328, "name" : "Chhindwara", "state" : "Madhya Pradesh"},
{ "id" : 329, "name" : "Damoh", "state" : "Madhya Pradesh"},
{ "id" : 330, "name" : "Datia", "state" : "Madhya Pradesh"},
{ "id" : 331, "name" : "Dewas", "state" : "Madhya Pradesh"},
{ "id" : 332, "name" : "Dhar", "state" : "Madhya Pradesh"},
{ "id" : 333, "name" : "Dindori", "state" : "Madhya Pradesh"},
{ "id" : 334, "name" : "East Nimar", "state" : "Madhya Pradesh"},
{ "id" : 335, "name" : "Guna", "state" : "Madhya Pradesh"},
{ "id" : 336, "name" : "Gwalior", "state" : "Madhya Pradesh"},
{ "id" : 337, "name" : "Harda", "state" : "Madhya Pradesh"},
{ "id" : 338, "name" : "Hoshangabad", "state" : "Madhya Pradesh"},
{ "id" : 339, "name" : "Indore", "state" : "Madhya Pradesh"},
{ "id" : 340, "name" : "Jabalpur", "state" : "Madhya Pradesh"},
{ "id" : 341, "name" : "Jhabua", "state" : "Madhya Pradesh"},
{ "id" : 342, "name" : "Katni", "state" : "Madhya Pradesh"},
{ "id" : 343, "name" : "Mandla", "state" : "Madhya Pradesh"},
{ "id" : 344, "name" : "Mandsaur", "state" : "Madhya Pradesh"},
{ "id" : 345, "name" : "Morena", "state" : "Madhya Pradesh"},
{ "id" : 346, "name" : "Narsimhapur", "state" : "Madhya Pradesh"},
{ "id" : 347, "name" : "Neemuch", "state" : "Madhya Pradesh"},
{ "id" : 348, "name" : "Niwari", "state" : "Madhya Pradesh"},
{ "id" : 349, "name" : "Panna", "state" : "Madhya Pradesh"},
{ "id" : 350, "name" : "Raisen", "state" : "Madhya Pradesh"},
{ "id" : 351, "name" : "Rajgarh", "state" : "Madhya Pradesh"},
{ "id" : 352, "name" : "Ratlam", "state" : "Madhya Pradesh"},
{ "id" : 353, "name" : "Rewa", "state" : "Madhya Pradesh"},
{ "id" : 354, "name" : "Sagar", "state" : "Madhya Pradesh"},
{ "id" : 355, "name" : "Satna", "state" : "Madhya Pradesh"},
{ "id" : 356, "name" : "Sehore", "state" : "Madhya Pradesh"},
{ "id" : 357, "name" : "Seoni", "state" : "Madhya Pradesh"},
{ "id" : 358, "name" : "Shahdol", "state" : "Madhya Pradesh"},
{ "id" : 359, "name" : "Shajapur", "state" : "Madhya Pradesh"},
{ "id" : 360, "name" : "Sheopur", "state" : "Madhya Pradesh"},
{ "id" : 361, "name" : "Shivpuri", "state" : "Madhya Pradesh"},
{ "id" : 362, "name" : "Sidhi", "state" : "Madhya Pradesh"},
{ "id" : 363, "name" : "Singrauli", "state" : "Madhya Pradesh"},
{ "id" : 364, "name" : "Tikamgarh", "state" : "Madhya Pradesh"},
{ "id" : 365, "name" : "Ujjain", "state" : "Madhya Pradesh"},
{ "id" : 366, "name" : "Umaria", "state" : "Madhya Pradesh"},
{ "id" : 367, "name" : "Vidisha", "state" : "Madhya Pradesh"},
{ "id" : 368, "name" : "West Nimar", "state" : "Madhya Pradesh"},
{ "id" : 369, "name" : "Ahmadnagar", "state" : "Maharashtra"},
{ "id" : 370, "name" : "Akola", "state" : "Maharashtra"},
{ "id" : 371, "name" : "Amravati", "state" : "Maharashtra"},
{ "id" : 372, "name" : "Aurangabad", "state" : "Maharashtra"},
{ "id" : 373, "name" : "Bhandara", "state" : "Maharashtra"},
{ "id" : 374, "name" : "Bid", "state" : "Maharashtra"},
{ "id" : 375, "name" : "Buldana", "state" : "Maharashtra"},
{ "id" : 376, "name" : "Chandrapur", "state" : "Maharashtra"},
{ "id" : 377, "name" : "Dhule", "state" : "Maharashtra"},
{ "id" : 378, "name" : "Gadchiroli", "state" : "Maharashtra"},
{ "id" : 379, "name" : "Gondiya", "state" : "Maharashtra"},
{ "id" : 380, "name" : "Hingoli", "state" : "Maharashtra"},
{ "id" : 381, "name" : "Jalgaon", "state" : "Maharashtra"},
{ "id" : 382, "name" : "Jalna", "state" : "Maharashtra"},
{ "id" : 383, "name" : "Kolhapur", "state" : "Maharashtra"},
{ "id" : 384, "name" : "Latur", "state" : "Maharashtra"},
{ "id" : 385, "name" : "Mumbai", "state" : "Maharashtra"},
{ "id" : 386, "name" : "Mumbai Suburban", "state" : "Maharashtra"},
{ "id" : 387, "name" : "Nagpur", "state" : "Maharashtra"},
{ "id" : 388, "name" : "Nanded", "state" : "Maharashtra"},
{ "id" : 389, "name" : "Nandurbar", "state" : "Maharashtra"},
{ "id" : 390, "name" : "Nashik", "state" : "Maharashtra"},
{ "id" : 391, "name" : "Osmanabad", "state" : "Maharashtra"},
{ "id" : 392, "name" : "Palghar", "state" : "Maharashtra"},
{ "id" : 393, "name" : "Parbhani", "state" : "Maharashtra"},
{ "id" : 394, "name" : "Pune", "state" : "Maharashtra"},
{ "id" : 395, "name" : "Raigarh", "state" : "Maharashtra"},
{ "id" : 396, "name" : "Ratnagiri", "state" : "Maharashtra"},
{ "id" : 397, "name" : "Sangli", "state" : "Maharashtra"},
{ "id" : 398, "name" : "Satara", "state" : "Maharashtra"},
{ "id" : 399, "name" : "Sindhudurg", "state" : "Maharashtra"},
{ "id" : 400, "name" : "Solapur", "state" : "Maharashtra"},
{ "id" : 401, "name" : "Thane", "state" : "Maharashtra"},
{ "id" : 402, "name" : "Wardha", "state" : "Maharashtra"},
{ "id" : 403, "name" : "Washim", "state" : "Maharashtra"},
{ "id" : 404, "name" : "Yavatmal", "state" : "Maharashtra"},
{ "id" : 405, "name" : "Bishnupur", "state" : "Manipur"},
{ "id" : 406, "name" : "Chandel", "state" : "Manipur"},
{ "id" : 407, "name" : "Churachandpur", "state" : "Manipur"},
{ "id" : 408, "name" : "Imphal East", "state" : "Manipur"},
{ "id" : 409, "name" : "Imphal West", "state" : "Manipur"},
{ "id" : 410, "name" : "Jiribam", "state" : "Manipur"},
{ "id" : 411, "name" : "Kakching", "state" : "Manipur"},
{ "id" : 412, "name" : "Kamjong", "state" : "Manipur"},
{ "id" : 413, "name" : "Kangpokpi", "state" : "Manipur"},
{ "id" : 414, "name" : "Noney", "state" : "Manipur"},
{ "id" : 415, "name" : "Pherzawl", "state" : "Manipur"},
{ "id" : 416, "name" : "Senapati", "state" : "Manipur"},
{ "id" : 417, "name" : "Tamenglong", "state" : "Manipur"},
{ "id" : 418, "name" : "Tengnoupal", "state" : "Manipur"},
{ "id" : 419, "name" : "Thoubal", "state" : "Manipur"},
{ "id" : 420, "name" : "Ukhrul", "state" : "Manipur"},
{ "id" : 421, "name" : "East Garo Hills", "state" : "Meghalaya"},
{ "id" : 422, "name" : "East Jaintia Hills", "state" : "Meghalaya"},
{ "id" : 423, "name" : "East Khasi Hills", "state" : "Meghalaya"},
{ "id" : 424, "name" : "North Garo Hills", "state" : "Meghalaya"},
{ "id" : 425, "name" : "Ribhoi", "state" : "Meghalaya"},
{ "id" : 426, "name" : "South Garo Hills", "state" : "Meghalaya"},
{ "id" : 427, "name" : "South West Garo Hills", "state" : "Meghalaya"},
{ "id" : 428, "name" : "South West Khasi Hills", "state" : "Meghalaya"},
{ "id" : 429, "name" : "West Garo Hills", "state" : "Meghalaya"},
{ "id" : 430, "name" : "West Jaintia Hills", "state" : "Meghalaya"},
{ "id" : 431, "name" : "West Khasi Hills", "state" : "Meghalaya"},
{ "id" : 432, "name" : "Aizawl", "state" : "Mizoram"},
{ "id" : 433, "name" : "Champhai", "state" : "Mizoram"},
{ "id" : 434, "name" : "Kolasib", "state" : "Mizoram"},
{ "id" : 435, "name" : "Lawngtlai", "state" : "Mizoram"},
{ "id" : 436, "name" : "Lunglei", "state" : "Mizoram"},
{ "id" : 437, "name" : "Mamit", "state" : "Mizoram"},
{ "id" : 438, "name" : "Saiha", "state" : "Mizoram"},
{ "id" : 439, "name" : "Serchhip", "state" : "Mizoram"},
{ "id" : 440, "name" : "Dimapur", "state" : "Nagaland"},
{ "id" : 441, "name" : "Kiphire", "state" : "Nagaland"},
{ "id" : 442, "name" : "Kohima", "state" : "Nagaland"},
{ "id" : 443, "name" : "Longleng", "state" : "Nagaland"},
{ "id" : 444, "name" : "Mokokchung", "state" : "Nagaland"},
{ "id" : 445, "name" : "Mon", "state" : "Nagaland"},
{ "id" : 446, "name" : "Peren", "state" : "Nagaland"},
{ "id" : 447, "name" : "Phek", "state" : "Nagaland"},
{ "id" : 448, "name" : "Tuensang", "state" : "Nagaland"},
{ "id" : 449, "name" : "Wokha", "state" : "Nagaland"},
{ "id" : 450, "name" : "Zunheboto", "state" : "Nagaland"},
{ "id" : 451, "name" : "Anugul", "state" : "Odisha"},
{ "id" : 452, "name" : "Balangir", "state" : "Odisha"},
{ "id" : 453, "name" : "Baleshwar", "state" : "Odisha"},
{ "id" : 454, "name" : "Bargarh", "state" : "Odisha"},
{ "id" : 455, "name" : "Baudh", "state" : "Odisha"},
{ "id" : 456, "name" : "Bhadrak", "state" : "Odisha"},
{ "id" : 457, "name" : "Cuttack", "state" : "Odisha"},
{ "id" : 458, "name" : "Debagarh", "state" : "Odisha"},
{ "id" : 459, "name" : "Dhenkanal", "state" : "Odisha"},
{ "id" : 460, "name" : "Gajapati", "state" : "Odisha"},
{ "id" : 461, "name" : "Ganjam", "state" : "Odisha"},
{ "id" : 462, "name" : "Jagatsinghapur", "state" : "Odisha"},
{ "id" : 463, "name" : "Jajapur", "state" : "Odisha"},
{ "id" : 464, "name" : "Jharsuguda", "state" : "Odisha"},
{ "id" : 465, "name" : "Kalahandi", "state" : "Odisha"},
{ "id" : 466, "name" : "Kandhamal", "state" : "Odisha"},
{ "id" : 467, "name" : "Kendrapara", "state" : "Odisha"},
{ "id" : 468, "name" : "Kendujhar", "state" : "Odisha"},
{ "id" : 469, "name" : "Khordha", "state" : "Odisha"},
{ "id" : 470, "name" : "Koraput", "state" : "Odisha"},
{ "id" : 471, "name" : "Malkangiri", "state" : "Odisha"},
{ "id" : 472, "name" : "Mayurbhanj", "state" : "Odisha"},
{ "id" : 473, "name" : "Nabarangapur", "state" : "Odisha"},
{ "id" : 474, "name" : "Nayagarh", "state" : "Odisha"},
{ "id" : 475, "name" : "Nuapada", "state" : "Odisha"},
{ "id" : 476, "name" : "Puri", "state" : "Odisha"},
{ "id" : 477, "name" : "Rayagada", "state" : "Odisha"},
{ "id" : 478, "name" : "Sambalpur", "state" : "Odisha"},
{ "id" : 479, "name" : "Subarnapur", "state" : "Odisha"},
{ "id" : 480, "name" : "Sundargarh", "state" : "Odisha"},
{ "id" : 481, "name" : "Karaikal", "state" : "Puducherry"},
{ "id" : 482, "name" : "Mahe", "state" : "Puducherry"},
{ "id" : 483, "name" : "Puducherry", "state" : "Puducherry"},
{ "id" : 484, "name" : "Yanam", "state" : "Puducherry"},
{ "id" : 485, "name" : "Amritsar", "state" : "Punjab"},
{ "id" : 486, "name" : "Barnala", "state" : "Punjab"},
{ "id" : 487, "name" : "Bathinda", "state" : "Punjab"},
{ "id" : 488, "name" : "Faridkot", "state" : "Punjab"},
{ "id" : 489, "name" : "Fatehgarh Sahib", "state" : "Punjab"},
{ "id" : 490, "name" : "Fazilka", "state" : "Punjab"},
{ "id" : 491, "name" : "Firozpur", "state" : "Punjab"},
{ "id" : 492, "name" : "Gurdaspur", "state" : "Punjab"},
{ "id" : 493, "name" : "Hoshiarpur", "state" : "Punjab"},
{ "id" : 494, "name" : "Jalandhar", "state" : "Punjab"},
{ "id" : 495, "name" : "Kapurthala", "state" : "Punjab"},
{ "id" : 496, "name" : "Ludhiana", "state" : "Punjab"},
{ "id" : 497, "name" : "Mansa", "state" : "Punjab"},
{ "id" : 498, "name" : "Moga", "state" : "Punjab"},
{ "id" : 499, "name" : "Pathankot", "state" : "Punjab"},
{ "id" : 500, "name" : "Patiala", "state" : "Punjab"},
{ "id" : 501, "name" : "Rupnagar", "state" : "Punjab"},
{ "id" : 502, "name" : "S.A.S. Nagar", "state" : "Punjab"},
{ "id" : 503, "name" : "Sangrur", "state" : "Punjab"},
{ "id" : 504, "name" : "Shahid Bhagat Singh Nagar", "state" : "Punjab"},
{ "id" : 505, "name" : "Sri Muktsar Sahib", "state" : "Punjab"},
{ "id" : 506, "name" : "Tarn Taran", "state" : "Punjab"},
{ "id" : 507, "name" : "Ajmer", "state" : "Rajasthan"},
{ "id" : 508, "name" : "Alwar", "state" : "Rajasthan"},
{ "id" : 509, "name" : "Banswara", "state" : "Rajasthan"},
{ "id" : 510, "name" : "Baran", "state" : "Rajasthan"},
{ "id" : 511, "name" : "Barmer", "state" : "Rajasthan"},
{ "id" : 512, "name" : "Bharatpur", "state" : "Rajasthan"},
{ "id" : 513, "name" : "Bhilwara", "state" : "Rajasthan"},
{ "id" : 514, "name" : "Bikaner", "state" : "Rajasthan"},
{ "id" : 515, "name" : "Bundi", "state" : "Rajasthan"},
{ "id" : 516, "name" : "Chittaurgarh", "state" : "Rajasthan"},
{ "id" : 517, "name" : "Churu", "state" : "Rajasthan"},
{ "id" : 518, "name" : "Dausa", "state" : "Rajasthan"},
{ "id" : 519, "name" : "Dhaulpur", "state" : "Rajasthan"},
{ "id" : 520, "name" : "Dungarpur", "state" : "Rajasthan"},
{ "id" : 521, "name" : "Ganganagar", "state" : "Rajasthan"},
{ "id" : 522, "name" : "Hanumangarh", "state" : "Rajasthan"},
{ "id" : 523, "name" : "Jaipur", "state" : "Rajasthan"},
{ "id" : 524, "name" : "Jaisalmer", "state" : "Rajasthan"},
{ "id" : 525, "name" : "Jalore", "state" : "Rajasthan"},
{ "id" : 526, "name" : "Jhalawar", "state" : "Rajasthan"},
{ "id" : 527, "name" : "Jhunjhunu", "state" : "Rajasthan"},
{ "id" : 528, "name" : "Jodhpur", "state" : "Rajasthan"},
{ "id" : 529, "name" : "Karauli", "state" : "Rajasthan"},
{ "id" : 530, "name" : "Kota", "state" : "Rajasthan"},
{ "id" : 531, "name" : "Nagaur", "state" : "Rajasthan"},
{ "id" : 532, "name" : "Pali", "state" : "Rajasthan"},
{ "id" : 533, "name" : "Pratapgarh", "state" : "Rajasthan"},
{ "id" : 534, "name" : "Rajsamand", "state" : "Rajasthan"},
{ "id" : 535, "name" : "Sawai Madhopur", "state" : "Rajasthan"},
{ "id" : 536, "name" : "Sikar", "state" : "Rajasthan"},
{ "id" : 537, "name" : "Sirohi", "state" : "Rajasthan"},
{ "id" : 538, "name" : "Tonk", "state" : "Rajasthan"},
{ "id" : 539, "name" : "Udaipur", "state" : "Rajasthan"},
{ "id" : 540, "name" : "East District", "state" : "Sikkim"},
{ "id" : 541, "name" : "North District", "state" : "Sikkim"},
{ "id" : 542, "name" : "South District", "state" : "Sikkim"},
{ "id" : 543, "name" : "West District", "state" : "Sikkim"},
{ "id" : 544, "name" : "Ariyalur", "state" : "Tamil Nadu"},
{ "id" : 545, "name" : "Chennai", "state" : "Tamil Nadu"},
{ "id" : 546, "name" : "Coimbatore", "state" : "Tamil Nadu"},
{ "id" : 547, "name" : "Cuddalore", "state" : "Tamil Nadu"},
{ "id" : 548, "name" : "Dharmapuri", "state" : "Tamil Nadu"},
{ "id" : 549, "name" : "Dindigul", "state" : "Tamil Nadu"},
{ "id" : 550, "name" : "Erode", "state" : "Tamil Nadu"},
{ "id" : 551, "name" : "Kancheepuram", "state" : "Tamil Nadu"},
{ "id" : 552, "name" : "Kanniyakumari", "state" : "Tamil Nadu"},
{ "id" : 553, "name" : "Karur", "state" : "Tamil Nadu"},
{ "id" : 554, "name" : "Krishnagiri", "state" : "Tamil Nadu"},
{ "id" : 555, "name" : "Madurai", "state" : "Tamil Nadu"},
{ "id" : 556, "name" : "Nagapattinam", "state" : "Tamil Nadu"},
{ "id" : 557, "name" : "Namakkal", "state" : "Tamil Nadu"},
{ "id" : 558, "name" : "Perambalur", "state" : "Tamil Nadu"},
{ "id" : 559, "name" : "Pudukkottai", "state" : "Tamil Nadu"},
{ "id" : 560, "name" : "Ramanathapuram", "state" : "Tamil Nadu"},
{ "id" : 561, "name" : "Salem", "state" : "Tamil Nadu"},
{ "id" : 562, "name" : "Sivaganga", "state" : "Tamil Nadu"},
{ "id" : 563, "name" : "Thanjavur", "state" : "Tamil Nadu"},
{ "id" : 564, "name" : "The Nilgiris", "state" : "Tamil Nadu"},
{ "id" : 565, "name" : "Theni", "state" : "Tamil Nadu"},
{ "id" : 566, "name" : "Thiruvallur", "state" : "Tamil Nadu"},
{ "id" : 567, "name" : "Thiruvarur", "state" : "Tamil Nadu"},
{ "id" : 568, "name" : "Thoothukkudi", "state" : "Tamil Nadu"},
{ "id" : 569, "name" : "Tiruchirappalli", "state" : "Tamil Nadu"},
{ "id" : 570, "name" : "Tirunelveli", "state" : "Tamil Nadu"},
{ "id" : 571, "name" : "Tiruppur", "state" : "Tamil Nadu"},
{ "id" : 572, "name" : "Tiruvannamalai", "state" : "Tamil Nadu"},
{ "id" : 573, "name" : "Vellore", "state" : "Tamil Nadu"},
{ "id" : 574, "name" : "Viluppuram", "state" : "Tamil Nadu"},
{ "id" : 575, "name" : "Virudhunagar", "state" : "Tamil Nadu"},
{ "id" : 576, "name" : "Adilabad", "state" : "Telangana"},
{ "id" : 577, "name" : "Bhadradri Kothagudem", "state" : "Telangana"},
{ "id" : 578, "name" : "Hyderabad", "state" : "Telangana"},
{ "id" : 579, "name" : "Jagitial", "state" : "Telangana"},
{ "id" : 580, "name" : "Jangoan", "state" : "Telangana"},
{ "id" : 581, "name" : "Jayashankar", "state" : "Telangana"},
{ "id" : 582, "name" : "Jogulamba Gadwal", "state" : "Telangana"},
{ "id" : 583, "name" : "Kamareddy", "state" : "Telangana"},
{ "id" : 584, "name" : "Karimnagar", "state" : "Telangana"},
{ "id" : 585, "name" : "Khammam", "state" : "Telangana"},
{ "id" : 586, "name" : "Kumuram Bheem Asifabad", "state" : "Telangana"},
{ "id" : 587, "name" : "Mahabubabad", "state" : "Telangana"},
{ "id" : 588, "name" : "Mahabubnagar", "state" : "Telangana"},
{ "id" : 589, "name" : "Mancherial", "state" : "Telangana"},
{ "id" : 590, "name" : "Medak", "state" : "Telangana"},
{ "id" : 591, "name" : "Medchal Malkajgiri", "state" : "Telangana"},
{ "id" : 592, "name" : "Mulugu", "state" : "Telangana"},
{ "id" : 593, "name" : "Nagarkurnool", "state" : "Telangana"},
{ "id" : 594, "name" : "Nalgonda", "state" : "Telangana"},
{ "id" : 595, "name" : "Narayanpet", "state" : "Telangana"},
{ "id" : 596, "name" : "Nirmal", "state" : "Telangana"},
{ "id" : 597, "name" : "Nizamabad", "state" : "Telangana"},
{ "id" : 598, "name" : "Peddapalli", "state" : "Telangana"},
{ "id" : 599, "name" : "Rajanna Sircilla", "state" : "Telangana"},
{ "id" : 600, "name" : "Ranga Reddy", "state" : "Telangana"},
{ "id" : 601, "name" : "Sangareddy", "state" : "Telangana"},
{ "id" : 602, "name" : "Siddipet", "state" : "Telangana"},
{ "id" : 603, "name" : "Suryapet", "state" : "Telangana"},
{ "id" : 604, "name" : "Vikarabad", "state" : "Telangana"},
{ "id" : 605, "name" : "Wanaparthy", "state" : "Telangana"},
{ "id" : 606, "name" : "Warangal Rural", "state" : "Telangana"},
{ "id" : 607, "name" : "Warangal Urban", "state" : "Telangana"},
{ "id" : 608, "name" : "Yadadri Bhuvanagiri", "state" : "Telangana"},
{ "id" : 609, "name" : "Dhalai", "state" : "Tripura"},
{ "id" : 610, "name" : "Gomati", "state" : "Tripura"},
{ "id" : 611, "name" : "Khowai", "state" : "Tripura"},
{ "id" : 612, "name" : "North Tripura", "state" : "Tripura"},
{ "id" : 613, "name" : "Sipahijala", "state" : "Tripura"},
{ "id" : 614, "name" : "South Tripura", "state" : "Tripura"},
{ "id" : 615, "name" : "Unokoti", "state" : "Tripura"},
{ "id" : 616, "name" : "West Tripura", "state" : "Tripura"},
{ "id" : 617, "name" : "Agra", "state" : "Uttar Pradesh"},
{ "id" : 618, "name" : "Aligarh", "state" : "Uttar Pradesh"},
{ "id" : 619, "name" : "Ambedkar Nagar", "state" : "Uttar Pradesh"},
{ "id" : 620, "name" : "Amethi", "state" : "Uttar Pradesh"},
{ "id" : 621, "name" : "Amroha", "state" : "Uttar Pradesh"},
{ "id" : 622, "name" : "Auraiya", "state" : "Uttar Pradesh"},
{ "id" : 623, "name" : "Azamgarh", "state" : "Uttar Pradesh"},
{ "id" : 624, "name" : "Baghpat", "state" : "Uttar Pradesh"},
{ "id" : 625, "name" : "Bahraich", "state" : "Uttar Pradesh"},
{ "id" : 626, "name" : "Ballia", "state" : "Uttar Pradesh"},
{ "id" : 627, "name" : "Balrampur", "state" : "Uttar Pradesh"},
{ "id" : 628, "name" : "Banda", "state" : "Uttar Pradesh"},
{ "id" : 629, "name" : "Bara Banki", "state" : "Uttar Pradesh"},
{ "id" : 630, "name" : "Bareilly", "state" : "Uttar Pradesh"},
{ "id" : 631, "name" : "Basti", "state" : "Uttar Pradesh"},
{ "id" : 632, "name" : "Bhadohi", "state" : "Uttar Pradesh"},
{ "id" : 633, "name" : "Bijnor", "state" : "Uttar Pradesh"},
{ "id" : 634, "name" : "Budaun", "state" : "Uttar Pradesh"},
{ "id" : 635, "name" : "Bulandshahr", "state" : "Uttar Pradesh"},
{ "id" : 636, "name" : "Chandauli", "state" : "Uttar Pradesh"},
{ "id" : 637, "name" : "Chitrakoot", "state" : "Uttar Pradesh"},
{ "id" : 638, "name" : "Deoria", "state" : "Uttar Pradesh"},
{ "id" : 639, "name" : "Etah", "state" : "Uttar Pradesh"},
{ "id" : 640, "name" : "Etawah", "state" : "Uttar Pradesh"},
{ "id" : 641, "name" : "Faizabad", "state" : "Uttar Pradesh"},
{ "id" : 642, "name" : "Farrukhabad", "state" : "Uttar Pradesh"},
{ "id" : 643, "name" : "Fatehpur", "state" : "Uttar Pradesh"},
{ "id" : 644, "name" : "Firozabad", "state" : "Uttar Pradesh"},
{ "id" : 645, "name" : "Gautam Buddha Nagar", "state" : "Uttar Pradesh"},
{ "id" : 646, "name" : "Ghaziabad", "state" : "Uttar Pradesh"},
{ "id" : 647, "name" : "Ghazipur", "state" : "Uttar Pradesh"},
{ "id" : 648, "name" : "Gonda", "state" : "Uttar Pradesh"},
{ "id" : 649, "name" : "Gorakhpur", "state" : "Uttar Pradesh"},
{ "id" : 650, "name" : "Hamirpur", "state" : "Uttar Pradesh"},
{ "id" : 651, "name" : "Hapur", "state" : "Uttar Pradesh"},
{ "id" : 652, "name" : "Hardoi", "state" : "Uttar Pradesh"},
{ "id" : 653, "name" : "Hathras", "state" : "Uttar Pradesh"},
{ "id" : 654, "name" : "Jalaun", "state" : "Uttar Pradesh"},
{ "id" : 655, "name" : "Jaunpur", "state" : "Uttar Pradesh"},
{ "id" : 656, "name" : "Jhansi", "state" : "Uttar Pradesh"},
{ "id" : 657, "name" : "Kannauj", "state" : "Uttar Pradesh"},
{ "id" : 658, "name" : "Kanpur Dehat", "state" : "Uttar Pradesh"},
{ "id" : 659, "name" : "Kanpur Nagar", "state" : "Uttar Pradesh"},
{ "id" : 660, "name" : "Kasganj", "state" : "Uttar Pradesh"},
{ "id" : 661, "name" : "Kaushambi", "state" : "Uttar Pradesh"},
{ "id" : 662, "name" : "Kheri", "state" : "Uttar Pradesh"},
{ "id" : 663, "name" : "Kushinagar", "state" : "Uttar Pradesh"},
{ "id" : 664, "name" : "Lalitpur", "state" : "Uttar Pradesh"},
{ "id" : 665, "name" : "Lucknow", "state" : "Uttar Pradesh"},
{ "id" : 666, "name" : "Mahoba", "state" : "Uttar Pradesh"},
{ "id" : 667, "name" : "Mahrajganj", "state" : "Uttar Pradesh"},
{ "id" : 668, "name" : "Mainpuri", "state" : "Uttar Pradesh"},
{ "id" : 669, "name" : "Mathura", "state" : "Uttar Pradesh"},
{ "id" : 670, "name" : "Mau", "state" : "Uttar Pradesh"},
{ "id" : 671, "name" : "Meerut", "state" : "Uttar Pradesh"},
{ "id" : 672, "name" : "Mirzapur", "state" : "Uttar Pradesh"},
{ "id" : 673, "name" : "Moradabad", "state" : "Uttar Pradesh"},
{ "id" : 674, "name" : "Muzaffarnagar", "state" : "Uttar Pradesh"},
{ "id" : 675, "name" : "Pilibhit", "state" : "Uttar Pradesh"},
{ "id" : 676, "name" : "Pratapgarh", "state" : "Uttar Pradesh"},
{ "id" : 677, "name" : "Prayagraj", "state" : "Uttar Pradesh"},
{ "id" : 678, "name" : "Rae Bareli", "state" : "Uttar Pradesh"},
{ "id" : 679, "name" : "Rampur", "state" : "Uttar Pradesh"},
{ "id" : 680, "name" : "Saharanpur", "state" : "Uttar Pradesh"},
{ "id" : 681, "name" : "Sambhal", "state" : "Uttar Pradesh"},
{ "id" : 682, "name" : "Sant Kabir Nagar", "state" : "Uttar Pradesh"},
{ "id" : 683, "name" : "Shahjahanpur", "state" : "Uttar Pradesh"},
{ "id" : 684, "name" : "Shamli", "state" : "Uttar Pradesh"},
{ "id" : 685, "name" : "Shrawasti", "state" : "Uttar Pradesh"},
{ "id" : 686, "name" : "Siddharthnagar", "state" : "Uttar Pradesh"},
{ "id" : 687, "name" : "Sitapur", "state" : "Uttar Pradesh"},
{ "id" : 688, "name" : "Sonbhadra", "state" : "Uttar Pradesh"},
{ "id" : 689, "name" : "Sultanpur", "state" : "Uttar Pradesh"},
{ "id" : 690, "name" : "Unnao", "state" : "Uttar Pradesh"},
{ "id" : 691, "name" : "Varanasi", "state" : "Uttar Pradesh"},
{ "id" : 692, "name" : "Almora", "state" : "Uttarakhand"},
{ "id" : 693, "name" : "Bageshwar", "state" : "Uttarakhand"},
{ "id" : 694, "name" : "Chamoli", "state" : "Uttarakhand"},
{ "id" : 695, "name" : "Champawat", "state" : "Uttarakhand"},
{ "id" : 696, "name" : "Dehradun", "state" : "Uttarakhand"},
{ "id" : 697, "name" : "Hardwar", "state" : "Uttarakhand"},
{ "id" : 698, "name" : "Nainital", "state" : "Uttarakhand"},
{ "id" : 699, "name" : "Pauri Garhwal", "state" : "Uttarakhand"},
{ "id" : 700, "name" : "Pithoragarh", "state" : "Uttarakhand"},
{ "id" : 701, "name" : "Rudraprayag", "state" : "Uttarakhand"},
{ "id" : 702, "name" : "Tehri Garhwal", "state" : "Uttarakhand"},
{ "id" : 703, "name" : "Udham Singh Nagar", "state" : "Uttarakhand"},
{ "id" : 704, "name" : "Uttarkashi", "state" : "Uttarakhand"},
{ "id" : 705, "name" : "Alipurduar", "state" : "West Bengal"},
{ "id" : 706, "name" : "Bankura", "state" : "West Bengal"},
{ "id" : 707, "name" : "Birbhum", "state" : "West Bengal"},
{ "id" : 708, "name" : "Cooch Behar", "state" : "West Bengal"},
{ "id" : 709, "name" : "Dakshin Dinajpur", "state" : "West Bengal"},
{ "id" : 710, "name" : "Darjeeling", "state" : "West Bengal"},
{ "id" : 711, "name" : "Hooghly", "state" : "West Bengal"},
{ "id" : 712, "name" : "Howrah", "state" : "West Bengal"},
{ "id" : 713, "name" : "Jalpaiguri", "state" : "West Bengal"},
{ "id" : 714, "name" : "Jhargram", "state" : "West Bengal"},
{ "id" : 715, "name" : "Kalimpong", "state" : "West Bengal"},
{ "id" : 716, "name" : "Kolkata", "state" : "West Bengal"},
{ "id" : 717, "name" : "Maldah", "state" : "West Bengal"},
{ "id" : 718, "name" : "Medinipur West", "state" : "West Bengal"},
{ "id" : 719, "name" : "Murshidabad", "state" : "West Bengal"},
{ "id" : 720, "name" : "Nadia", "state" : "West Bengal"},
{ "id" : 721, "name" : "North 24 Parganas", "state" : "West Bengal"},
{ "id" : 722, "name" : "Paschim Bardhaman", "state" : "West Bengal"},
{ "id" : 723, "name" : "Purba Bardhaman", "state" : "West Bengal"},
{ "id" : 724, "name" : "Medinipur East", "state" : "West Bengal"},
{ "id" : 725, "name" : "Purulia", "state" : "West Bengal"},
{ "id" : 726, "name" : "South 24 Parganas", "state" : "West Bengal"},
{ "id" : 727, "name" : "Uttar Dinajpur", "state" : "West Bengal"},
{ "id" : 728, "name" : "Unclassified", "state" : "Andaman and Nicobar Islands"},
{ "id" : 729, "name" : "Unclassified", "state" : "Andhra Pradesh"},
{ "id" : 730, "name" : "Unclassified", "state" : "Arunachal Pradesh"},
{ "id" : 731, "name" : "Unclassified", "state" : "Assam"},
{ "id" : 732, "name" : "Unclassified", "state" : "Bihar"},
{ "id" : 733, "name" : "Unclassified", "state" : "Chandigarh"},
{ "id" : 734, "name" : "Unclassified", "state" : "Chhattisgarh"},
{ "id" : 735, "name" : "Unclassified", "state" : "Dadra and Nagar Haveli"},
{ "id" : 736, "name" : "Unclassified", "state" : "Daman And Diu"},
{ "id" : 737, "name" : "Unclassified", "state" : "Delhi"},
{ "id" : 738, "name" : "Unclassified", "state" : "Goa"},
{ "id" : 739, "name" : "Unclassified", "state" : "Gujarat"},
{ "id" : 740, "name" : "Unclassified", "state" : "Haryana"},
{ "id" : 741, "name" : "Unclassified", "state" : "Himachal Pradesh"},
{ "id" : 742, "name" : "Unclassified", "state" : "Jammu and Kashmir"},
{ "id" : 743, "name" : "Unclassified", "state" : "Jharkhand"},
{ "id" : 744, "name" : "Unclassified", "state" : "Karnataka"},
{ "id" : 745, "name" : "Unclassified", "state" : "Kerala"},
{ "id" : 746, "name" : "Unclassified", "state" : "Ladakh"},
{ "id" : 747, "name" : "Unclassified", "state" : "Lakshadweep"},
{ "id" : 748, "name" : "Unclassified", "state" : "Madhya Pradesh"},
{ "id" : 749, "name" : "Unclassified", "state" : "Maharashtra"},
{ "id" : 750, "name" : "Unclassified", "state" : "Manipur"},
{ "id" : 751, "name" : "Unclassified", "state" : "Meghalaya"},
{ "id" : 752, "name" : "Unclassified", "state" : "Mizoram"},
{ "id" : 753, "name" : "Unclassified", "state" : "Nagaland"},
{ "id" : 754, "name" : "Unclassified", "state" : "Odisha"},
{ "id" : 755, "name" : "Unclassified", "state" : "Puducherry"},
{ "id" : 756, "name" : "Unclassified", "state" : "Punjab"},
{ "id" : 757, "name" : "Unclassified", "state" : "Rajasthan"},
{ "id" : 758, "name" : "Unclassified", "state" : "Sikkim"},
{ "id" : 759, "name" : "Unclassified", "state" : "Tamil Nadu"},
{ "id" : 760, "name" : "Unclassified", "state" : "Telangana"},
{ "id" : 761, "name" : "Unclassified", "state" : "Tripura"},
{ "id" : 762, "name" : "Unclassified", "state" : "Uttar Pradesh"},
{ "id" : 763, "name" : "Unclassified", "state" : "Uttarakhand"},
{ "id" : 764, "name" : "Unclassified", "state" : "West Bengal"}
];

class Covid19Model
{
  constructor()
  {
    this.statesInfo = new Map();
    this.populateStatesInfo();

    this.districtsInfo = new Map();
    this.populateDistrictsInfo();

    this.setUnknownCounts();
  }

  populateStatesInfo()
  {
    const rawStatesData = Papa.parse(covid19ModelStatesRawDataString,
                            { delimiter : ",", skipEmptyLines : true}).data;
    for (let i = 0; i < rawStatesData.length; i++) {
      const data  = rawStatesData[i];
      const state = data[0].trim();
      const popM  = parseFloat(data[1]);
      const n     = parseFloat(data[2]);
      this.statesInfo.set(state, { popM : popM, n : n, districtIDs : [] });
    }
  }

  populateDistrictsInfo()
  {
    const rawDistrictsData = Papa.parse(covid19ModelDistrictsRawDataString,
                               { delimiter : ",", skipEmptyLines : true}).data;
    for (let i = 0; i < rawDistrictsData.length; i++) {
      const data     = rawDistrictsData[i];
      const district = data[0].trim();
      const state    = data[1].trim();
      const rawCount = parseInt(data[2]);
      const idString = this.calcDistrictID(district, state);
      this.districtsInfo.set(idString, { district : district,
                                         state    : state,
                                         rawCount : rawCount,
                                         count    : rawCount });
      this.statesInfo.get(state).districtIDs.push(idString);
    }
  }

  setUnknownCounts()
  {
    // if a state has zero confirmed infections, assume actual infections
    // for that state to be one and assign that one count to Unclassified district
    for (let [state, sinfo] of this.statesInfo) {
      let total = 0;
      for (let i = 0; i < sinfo.districtIDs.length; i++) {
        total += this.districtIDInfo(sinfo.districtIDs[i]).rawCount;
      }
      if (0 == total) {
        this.districtIDInfo(this.calcDistrictID("Unclassified", state)).count = 1;
      }
    }
  }

  addToItemStats(stats, incStats)
  {
    stats.t1 += incStats.t1;
    stats.t2 += incStats.t2;
    stats.t3 += incStats.t3;
    stats.t4 += incStats.t4;
    return stats;
  }

  addToStats(stats, incStats)
  {
    stats.t0Confirmed += incStats.t0Confirmed;
    stats.t0Estimated += incStats.t0Estimated;
    this.addToItemStats(stats.carriers, incStats.carriers);
    this.addToItemStats(stats.critical, incStats.critical);
    return stats;
  }

  countryStats(params)
  {
    let stats = {
      t0Confirmed : 0,
      t0Estimated : 0,
      carriers    : {t1 : 0, t2 : 0, t3 : 0, t4 : 0},
      critical    : {t1 : 0, t2 : 0, t3 : 0, t4 : 0}
    };
    for (let state of this.allStates) {
      const sstats = this.stateStats(state, params);
      this.addToStats(stats, sstats);
    }
    return stats;
  }

  stateStats(state, params)
  {
    const sinfo = this.stateInfo(state);
    let stats = this.districtIDStats(sinfo.districtIDs[0], params);
    for (let i = 1; i < sinfo.districtIDs.length; i++) {
      const dstats = this.districtIDStats(sinfo.districtIDs[i], params);
      this.addToStats(stats, dstats);
    }
    return stats;
  }

  calcTopAffectedStates(k)
  {
    let t0Estimates = [];
    for (let state of this.allStates) {
      const stats = this.stateStats(state, this.moderateParams);
      t0Estimates.push({ state : state, t0Estimated : stats.t0Estimated });
    }
    t0Estimates.sort(function(a,b) { return b.t0Estimated - a.t0Estimated; });

    let sorted = [];
    for (let i = 0; i < k; i++) {
      sorted.push(t0Estimates[i].state);
    }
    return sorted;
  }

  calcTopAffectedDistrictIDs(k)
  {
    let t0Estimates = [];
    for (let districtID of this.allDistrictIDs) {
      const stats = this.districtIDStats(districtID, this.moderateParams);
      t0Estimates.push({ districtID : districtID, t0Estimated : stats.t0Estimated });
    }
    t0Estimates.sort(function(a,b) { return b.t0Estimated - a.t0Estimated; });

    let sorted = [];
    let count = 0;
    for (let i = 0; i < t0Estimates.length; i++) {
      const districtID = t0Estimates[i].districtID;
      const dinfo = this.districtIDInfo(districtID);
      if (dinfo.district == "Unclassified") {
        continue;
      }
      sorted.push(t0Estimates[i].districtID);
      count++;
      if (count == k) {
        break;
      }
    }
    return sorted;
  }

  get dates()
  {
    return { t0 : "28-03-2020",
             t1 : "05-04-2020",
             t2 : "12-04-2020",
             t3 : "19-04-2020", 
             t4 : "26-04-2020"};
  }

  get numStates()
  {
    return this.statesInfo.size;
  }

  get allStates()
  {
    return this.statesInfo.keys();
  }

  stateInfo(state)
  {
    return this.statesInfo.get(state);
  }

  calcDistrictID(district, state)
  {
    return district.concat(", ").concat(state);
  }

  get allDistrictIDs()
  {
    return this.districtsInfo.keys();
  }


  districtIDInfo(districtID)
  {
    return this.districtsInfo.get(districtID);
  }

  get moderateParams()
  {
    const params = {
      n        : -1,
      x        : 8,
      t1Growth : 4,
      t2Growth : 20,
      t3Growth : 70,
      t4Growth : 150
    };
    return params;
  }

  get worstParams()
  {
    const params = {
      n        : -1,
      x        : 12,
      t1Growth : 10,
      t2Growth : 50,
      t3Growth : 100,
      t4Growth : 250
    };
    return params;
  }
 
  districtIDStats(districtID, params)
  {
    const dinfo = this.districtIDInfo(districtID);
    const n = (params.n < 0 ? this.stateInfo(dinfo.state).n : params.n);
    const t0Confirmed = dinfo.rawCount;
    const t0Estimated = Math.floor(dinfo.count * n);

    const carriers = {
      t1 : Math.floor(t0Estimated * params.t1Growth),
      t2 : Math.floor(t0Estimated * params.t2Growth),
      t3 : Math.floor(t0Estimated * params.t3Growth),
      t4 : Math.floor(t0Estimated * params.t4Growth)
    };

    const critical = {
      t1 : Math.floor(carriers.t1 * params.x * 0.01),
      t2 : Math.floor(carriers.t2 * params.x * 0.01),
      t3 : Math.floor(carriers.t3 * params.x * 0.01),
      t4 : Math.floor(carriers.t4 * params.x * 0.01)
    };

    const stats = {
      t0Confirmed: t0Confirmed,
      t0Estimated: t0Estimated,
      carriers   : carriers,
      critical   : critical,
    };

    return stats;
  }

  itemStats(itemID, criticalStats)
  {
    let itemsPerCritical = 0;
    switch (itemID) {
      case "ventilators": itemsPerCritical =   1; break;
      case "pumps"      : itemsPerCritical = 3.5; break; 
      default           : itemsPerCritical =   1; break;
    }
    const stats = {
      t1 : Math.floor(criticalStats.t1 * itemsPerCritical),
      t2 : Math.floor(criticalStats.t2 * itemsPerCritical),
      t3 : Math.floor(criticalStats.t3 * itemsPerCritical),
      t4 : Math.floor(criticalStats.t4 * itemsPerCritical),
    };
    return stats;
  }
}

// table columns are:
// state name, population (millions), inflation factor (n)
const covid19ModelStatesRawDataString = `
Andaman And Nicobar Islands,   0.38,   2
Andhra Pradesh,               49.70,   2
Arunachal Pradesh,             1.38,   2
Assam,                        31.20,   2
Bihar,                       104.01,   4
Chandigarh,                    1.05,   2
Chhattisgarh,                 25.54,   2
Dadra and Nagar Haveli,        0.34,   2
Daman and Diu,                 0.25,   2
Delhi,                        16.78,   2.5
Goa,                           1.46,   2
Gujarat,                      60.43,   3
Haryana,                      25.35,   2
Himachal Pradesh,              6.86,   2
Jammu and Kashmir,            12.54,   2
Jharkhand,                    32.98,   2
Karnataka,                    61.09,   2.5
Kerala,                       33.40,   1.4
Ladakh,                        0.27,   2
Lakshadweep,                   0.06,   2
Madhya Pradesh,               72.63,   2.5
Maharashtra,                 112.37,   2.5
Manipur,                       2.85,   2
Meghalaya,                     2.96,   2
Mizoram,                       1.09,   2
Nagaland,                      1.98,   2
Odisha,                       41.97,   2
Puducherry,                    1.24,   2
Punjab,                       27.75,   2
Rajasthan,                    68.55,   2
Sikkim,                        0.61,   2
Tamil Nadu,                   72.15,   1.5
Telangana,                    35.20,   1.5
Tripura,                       3.67,   2
Uttar Pradesh,               199.81,   2
Uttarakhand,                  10.08,   2
West Bengal,                  91.27,   3
`;

// table columns are:
// district, state, confirmed infections
const covid19ModelDistrictsRawDataString = `
Nicobar,Andaman And Nicobar Islands   ,0
N&M,Andaman And Nicobar Islands   ,1
South,Andaman And Nicobar Islands   ,1
Unclassified,Andaman And Nicobar Islands,4
Anantapur,Andhra Pradesh ,0
Kurnool,Andhra Pradesh ,0
Srikakulam,Andhra Pradesh ,0
Vizianagaram,Andhra Pradesh ,0
West Godavari,Andhra Pradesh ,0
Y.S.R,Andhra Pradesh ,0
Unclassified,Andhra Pradesh,0
Chitoor,Andhra Pradesh ,1
East,Andhra Pradesh ,1
Prakasam,Andhra Pradesh ,1
S.P.S. Nellore,Andhra Pradesh ,1
Guntur,Andhra Pradesh ,2
Krishna,Andhra Pradesh ,3
Visakhapatnam,Andhra Pradesh ,4
Unclassified,Arunachal Pradesh,0
Unclassified,Assam,0
Araria,Bihar,0
Arwal,Bihar,0
Aurangabad,Bihar,0
Banka,Bihar,0
Begusarai,Bihar,0
Bhagalpur,Bihar,0
Bhojpur,Bihar,0
Buxar,Bihar,0
Darbhanga,Bihar,0
East Champaran,Bihar,0
Gaya,Bihar,0
Gopalganj,Bihar,0
Jamui,Bihar,0
Jehanabad,Bihar,0
Kaimur,Bihar,0
Katihar,Bihar,0
Khagaria,Bihar,0
Kishanganj,Bihar,0
Lakhisarai,Bihar,0
Madhepura,Bihar,0
Madhubani,Bihar,0
Muzffarpur,Bihar,0
Nawada,Bihar,0
Purnia,Bihar,0
Rohtas,Bihar,0
Saharsa,Bihar,0
Samastipur,Bihar,0
Saran,Bihar,0
Sheikhpura,Bihar,0
Sheohar,Bihar,0
Sitamarhi,Bihar,0
Supaul,Bihar,0
Unclassified,Bihar,0
Vaishali,Bihar,0
West Champaran,Bihar,0
Nalanda,Bihar,1
Siwan,Bihar,1
Munger,Bihar,3
Patna,Bihar,4
Unclassified,Chandigarh,0
Chandigarh,Chandigarh,8
Baloda Bazar ,Chhattisgarh,0
Balod,Chhattisgarh,0
Balrampur,Chhattisgarh,0
Bastar,Chhattisgarh,0
Bemetara,Chhattisgarh,0
Bijapur,Chhattisgarh,0
Dantewada,Chhattisgarh,0
Dhamtari,Chhattisgarh,0
Gariaband,Chhattisgarh,0
Gaurela-Pendra-Marwahi,Chhattisgarh,0
Janjgir-Champa,Chhattisgarh,0
Jashpur,Chhattisgarh,0
Kabirdham,Chhattisgarh,0
Kanker,Chhattisgarh,0
Kondagaon,Chhattisgarh,0
Korba,Chhattisgarh,0
Koriya,Chhattisgarh,0
Mahasamund,Chhattisgarh,0
Mungeli,Chhattisgarh,0
Narayanpur,Chhattisgarh,0
Raigarh,Chhattisgarh,0
Sukma,Chhattisgarh,0
Surajpur,Chhattisgarh,0
Surguja,Chhattisgarh,0
Unclassified,Chhattisgarh,0
Bilaspur,Chhattisgarh,1
Durg,Chhattisgarh,1
Rajnandgaon,Chhattisgarh,1
Raipur,Chhattisgarh,3
Unclassified,Dadra and Nagar Haveli,0
Unclassified,Daman and Diu,0
Central,Delhi,0
Shahdara,Delhi,0
South East,Delhi,0
East Delhi ,Delhi,1
North East,Delhi,1
South West,Delhi,1
West Delhi,Delhi,1
Delhi,Delhi,11
Unclassified,Delhi,17
North Delhi,Delhi,2
North West,Delhi,3
South West,Delhi,3
South Goa,Goa,0
Unclassified,Goa,0
North Goa,Goa,3
Amreli,Gujarat,0
Anand,Gujarat,0
Aravalli,Gujarat,0
Banaskantha,Gujarat,0
Bharuch,Gujarat,0
Bhavnagar,Gujarat,0
Botad,Gujarat,0
Chhota Udepur,Gujarat,0
Dahod,Gujarat,0
Dang,Gujarat,0
Devbhoomi Dwarka,Gujarat,0
Gir Somnath,Gujarat,0
Jamnagar,Gujarat,0
Junagadh,Gujarat,0
Kheda,Gujarat,0
Mahisagar,Gujarat,0
Morbi,Gujarat,0
Narmada,Gujarat,0
Navsari,Gujarat,0
Panchmahal,Gujarat,0
Patan,Gujarat,0
Porbandar,Gujarat,0
Sabarkantha,Gujarat,0
Surendranagar,Gujarat,0
Tapi,Gujarat,0
Valsad,Gujarat,0
Kutch,Gujarat,1
Mehsana,Gujarat,1
Ahmedabad,Gujarat,17
Surat,Gujarat,5
Gandhinagar,Gujarat,7
Rajkot,Gujarat,7
Unclassified,Gujarat,7
Vadodara,Gujarat,9
Ambala,Haryana,0
Bhiwani,Haryana,0
Charkhi Dadri,Haryana,0
Fatehabad,Haryana,0
Hisar,Haryana,0
Jhajjar,Haryana,0
Jind,Haryana,0
Kaithal,Haryana,0
Karnal,Haryana,0
Kurukshetra,Haryana,0
Mahendragarh,Haryana,0
Nuh,Haryana,0
Rewari,Haryana,0
Rohtak,Haryana,0
Sirsa,Haryana,0
Yamunanagar,Haryana,0
Palwal,Haryana,1
Panchkula,Haryana,1
Sonepat,Haryana,1
Unclassified,Haryana,1
Faridabad,Haryana,2
Gurugram,Haryana,24
Panipat,Haryana,3
Bilaspur,Himachal Pradesh ,0
Chamba,Himachal Pradesh ,0
Hamirpur,Himachal Pradesh ,0
Kinnaur,Himachal Pradesh ,0
Kullu,Himachal Pradesh ,0
Lahaul and Spiti,Himachal Pradesh ,0
Mandi,Himachal Pradesh ,0
Shimla,Himachal Pradesh ,0
Sirmaur,Himachal Pradesh ,0
Solan,Himachal Pradesh ,0
Una,Himachal Pradesh ,0
Unclassified,Himachal Pradesh,0
Kangra,Himachal Pradesh ,3
Anantnag,Jammu and Kashmir,0
Baramulla,Jammu and Kashmir,0
Budgam,Jammu and Kashmir,0
Doda,Jammu and Kashmir,0
Ganderbal,Jammu and Kashmir,0
Kathua,Jammu and Kashmir,0
Kishtwar,Jammu and Kashmir,0
Kulgam,Jammu and Kashmir,0
Kupwara,Jammu and Kashmir,0
Poonch,Jammu and Kashmir,0
Pulwama,Jammu and Kashmir,0
Ramban,Jammu and Kashmir,0
Reasi,Jammu and Kashmir,0
Samba,Jammu and Kashmir,0
Shopian,Jammu and Kashmir,0
Udhampur,Jammu and Kashmir,0
Jammu,Jammu and Kashmir,1
Rajouri,Jammu and Kashmir,3
Unclassified,Jammu and Kashmir,3
Bandipore,Jammu and Kashmir,4
Srinagar,Jammu and Kashmir,9
Unclassified,Jharkhand,0
Bagalkot,Karnataka,0
Ballari,Karnataka,0
Belgaum,Karnataka,0
Bidar,Karnataka,0
Chamarajnagar,Karnataka,0
Gadag,Karnataka,0
Hassan,Karnataka,0
Haveri,Karnataka,0
Kolar,Karnataka,0
Koppal,Karnataka,0
Mandya,Karnataka,0
Raichur,Karnataka,0
Ramanagara,Karnataka,0
Shimoga,Karnataka,0
Tumakuru,Karnataka,0
Unclassified,Karnataka,0
Vijayapura,Karnataka,0
Yadgir,Karnataka,0
Chitradurga,Karnataka,1
Davanagere,Karnataka,1
Dharwad,Karnataka,1
Kodagu,Karnataka,1
Tumkur,Karnataka,1
Udupi,Karnataka,1
Kalaburagi,Karnataka,3
Mysuru,Karnataka,3
Bengaluru,Karnataka,38
Chikkaballapura,Karnataka,4
Uttara Kannada,Karnataka,4
Dakshina Kannada,Karnataka,6
Unclassified,Kerala,0
Kollam,Kerala,1
Wayanad,Kerala,1
Pathanamthitta,Kerala,12
Ernakulam,Kerala,19
Alappuzha,Kerala,2
Kannur,Kerala,25
Idukki,Kerala,3
Kottayam,Kerala,3
Palakkad,Kerala,3
Thiruvananthapuram,Kerala,5
Kozhikode,Kerala,6
Thrissur,Kerala,6
Malappuram,Kerala,8
Kasaragod,Kerala,82
Unclassified,Ladakh,0
Leh,Ladakh,11
Kargil,Ladakh,2
Unclassified,Lakshadweep,0
Agar Malwa,Madhya Pradesh,0
Alirajpur,Madhya Pradesh,0
Anuppur,Madhya Pradesh,0
Ashoknagar,Madhya Pradesh,0
Balaghat,Madhya Pradesh,0
Barwani,Madhya Pradesh,0
Betul,Madhya Pradesh,0
Bhind,Madhya Pradesh,0
Burhanpur,Madhya Pradesh,0
Chachaura-Binaganj,Madhya Pradesh,0
Chhatarpur,Madhya Pradesh,0
Chhindwara,Madhya Pradesh,0
Damoh,Madhya Pradesh,0
Datia,Madhya Pradesh,0
Dewas,Madhya Pradesh,0
Dhar,Madhya Pradesh,0
Dindori,Madhya Pradesh,0
Guna,Madhya Pradesh,0
Harda,Madhya Pradesh,0
Hoshangabad,Madhya Pradesh,0
Jhabua,Madhya Pradesh,0
Katni,Madhya Pradesh,0
Khandwa,Madhya Pradesh,0
Khargone,Madhya Pradesh,0
Maihar,Madhya Pradesh,0
Mandla,Madhya Pradesh,0
Mandsaur,Madhya Pradesh,0
Morena,Madhya Pradesh,0
Nagda,Madhya Pradesh,0
Narsinghpur,Madhya Pradesh,0
Neemuch,Madhya Pradesh,0
Niwari,Madhya Pradesh,0
Panna,Madhya Pradesh,0
Raisen,Madhya Pradesh,0
Rajgarh,Madhya Pradesh,0
Ratlam,Madhya Pradesh,0
Rewa,Madhya Pradesh,0
Sagar,Madhya Pradesh,0
Satna,Madhya Pradesh,0
Sehore,Madhya Pradesh,0
Seoni,Madhya Pradesh,0
Shahdol,Madhya Pradesh,0
Shajapur,Madhya Pradesh,0
Sheopur,Madhya Pradesh,0
Sidhi,Madhya Pradesh,0
Singrauli,Madhya Pradesh,0
Tikamgarh,Madhya Pradesh,0
Umaria,Madhya Pradesh,0
Unclassified,Madhya Pradesh,0
Vidisha,Madhya Pradesh,0
Gwalior,Madhya Pradesh,1
Indore,Madhya Pradesh,16
Shivpuri,Madhya Pradesh,2
Bhopal,Madhya Pradesh,3
Ujjain,Madhya Pradesh,3
Jabalpur,Madhya Pradesh,8
Akola,Maharashtra,0
Amravati,Maharashtra,0
Beed,Maharashtra,0
Bhandara,Maharashtra,0
Buldhana,Maharashtra,0
Chandrapur,Maharashtra,0
Dhule,Maharashtra,0
Gadchiroli,Maharashtra,0
Hingoli,Maharashtra,0
Jalgaon,Maharashtra,0
Jalna,Maharashtra,0
Latur,Maharashtra,0
Nanded,Maharashtra,0
Nandurbar,Maharashtra,0
Nashik,Maharashtra,0
Osmanabad,Maharashtra,0
Palghar,Maharashtra,0
Parbhani,Maharashtra,0
Raigad,Maharashtra,0
Sindhudurg,Maharashtra,0
Solapur,Maharashtra,0
Wardha,Maharashtra,0
Washim,Maharashtra,0
Yavatmal,Maharashtra,0
Aurangabad,Maharashtra,1
Gondiya,Maharashtra,1
Kolhapur,Maharashtra,1
Ratnagiri,Maharashtra,1
Ahmednagar,Maharashtra,2
Satara,Maharashtra,2
Sangli,Maharashtra,24
Pune,Maharashtra,26
Yavatmal,Maharashtra,3
Unclassified,Maharashtra,32
Thane,Maharashtra,4
Mumbai,Maharashtra,67
Nagpur,Maharashtra,9
Bishnupur,Manipur,0
Chandel,Manipur,0
Churachandpur,Manipur,0
Imphal East,Manipur,0
Jiribam,Manipur,0
Kakching,Manipur,0
Kamjong,Manipur,0
Kangpokpi,Manipur,0
Noney,Manipur,0
Pherzawl,Manipur,0
Senapati,Manipur,0
Tamenglong,Manipur,0
Tengnoupal,Manipur,0
Thoubal,Manipur,0
Ukhrul,Manipur,0
Unclassified,Manipur,0
Imphal West,Manipur,1
Unclassified,Meghalaya,0
Champhai,Mizoram,0
Kolasib,Mizoram,0
Lawngtlai,Mizoram,0
Lunglei,Mizoram,0
Mamit,Mizoram,0
Saiha,Mizoram,0
Serchhip,Mizoram,0
Unclassified,Mizoram,0
Aizawl,Mizoram,1
Unclassified,Nagaland,0
Angul,Odisha,0
Balangir,Odisha,0
Balasore,Odisha,0
Bargarh,Odisha,0
Bhadrak,Odisha,0
Boudh,Odisha,0
Cuttack,Odisha,0
Debagarh,Odisha,0
Dhenkanal,Odisha,0
Gajapati,Odisha,0
Ganjam,Odisha,0
Jagatsinghpur,Odisha,0
Jajpur,Odisha,0
Jharsuguda,Odisha,0
Kalahandi,Odisha,0
Kandhamal,Odisha,0
Kendrapara,Odisha,0
Kendujhar,Odisha,0
Koraput,Odisha,0
Malkangiri,Odisha,0
Mayurbhanj,Odisha,0
Nabarangpur,Odisha,0
Nayagarh,Odisha,0
Nuapada,Odisha,0
Puri,Odisha,0
Rayagada,Odisha,0
Sambalpur,Odisha,0
Subarnapur,Odisha,0
Sundargarh,Odisha,0
Unclassified,Odisha,0
Khordha,Odisha,3
Karaikal,Puducherry,0
Pondicherry,Puducherry,0
Unclassified,Puducherry,0
Yanam,Puducherry,0
Mahe,Puducherry,1
Barnala,Punjab,0
Bathinda,Punjab,0
Faridkot,Punjab,0
Fatehgarh Sahib,Punjab,0
Fazilka,Punjab,0
Firozpur,Punjab,0
Gurdaspur,Punjab,0
Hoshiarpur,Punjab,0
Jalandhar,Punjab,0
Kapurthala,Punjab,0
Mansa,Punjab,0
Moga,Punjab,0
Pathankot,Punjab,0
Patiala,Punjab,0
Rupnagar,Punjab,0
Sangrur,Punjab,0
Sri Muktsar Sahib,Punjab,0
Tarn Taran,Punjab,0
Ludhiana,Punjab,1
Shaheed Bhagat Singh Nagar,Punjab,19
Amritsar,Punjab,2
Hoshiarpur,Punjab,2
Unclassified,Punjab,3
Jalandhar,Punjab,5
Sahibzada Ajit Singh Nagar,Punjab,6
Ajmer,Rajasthan,0
Alwar,Rajasthan,0
Banswara,Rajasthan,0
Baran,Rajasthan,0
Barmer,Rajasthan,0
Bharatpur,Rajasthan,0
Bikaner,Rajasthan,0
Bundi,Rajasthan,0
Chittorgarh,Rajasthan,0
Churu,Rajasthan,0
Dausa,Rajasthan,0
Dholpur,Rajasthan,0
Durgarpur,Rajasthan,0
Ganganagar,Rajasthan,0
Hanumangarh,Rajasthan,0
Jaisalmer,Rajasthan,0
Jalore,Rajasthan,0
Jhalawar,Rajasthan,0
Karauli,Rajasthan,0
Kota,Rajasthan,0
Nagaur,Rajasthan,0
Pali,Rajasthan,0
Rajsamand,Rajasthan,0
Sawai Madhopur ,Rajasthan,0
Sikar,Rajasthan,0
Sirohi,Rajasthan,0
Tonk,Rajasthan,0
Udaipur,Rajasthan,0
Unclassified,Rajasthan,10
Jaipur,Rajasthan,11
Bhilwara,Rajasthan,17
Pratapgarh,Rajasthan,2
Jodhpur,Rajasthan,4
Jhunjhunu,Rajasthan,6
Unclassified,Sikkim,0
Ariyalur,Tamil Nadu ,0
Chengalpattu,Tamil Nadu ,0
Cuddalore,Tamil Nadu ,0
Dharmapuri,Tamil Nadu ,0
Dindigul,Tamil Nadu ,0
Kallakurichi,Tamil Nadu ,0
Kanchipuram,Tamil Nadu ,0
Kanyakumari,Tamil Nadu ,0
Karuru,Tamil Nadu ,0
Krishnagiri,Tamil Nadu ,0
Mayiladuthurai,Tamil Nadu ,0
Nagapattinam,Tamil Nadu ,0
Namakkal,Tamil Nadu ,0
Niligiris,Tamil Nadu ,0
Perambalur,Tamil Nadu ,0
Pudukottai,Tamil Nadu ,0
Ramanathapuram,Tamil Nadu ,0
Ranipet,Tamil Nadu ,0
Sivaganga,Tamil Nadu ,0
Tenkasi,Tamil Nadu ,0
Thanjavur,Tamil Nadu ,0
Theni,Tamil Nadu ,0
Thoothukudi,Tamil Nadu ,0
Tirunelveli,Tamil Nadu ,0
Tirupattur,Tamil Nadu ,0
Tiruvallur,Tamil Nadu ,0
Tiruvannamalai,Tamil Nadu ,0
Tiruvarur,Tamil Nadu ,0
Viluppuram,Tamil Nadu ,0
Virudhunagar,Tamil Nadu ,0
Unclassified,Tamil Nadu,0
Coimbatore,Tamil Nadu ,1
Kumbakonam,Tamil Nadu ,1
Tiruchirappalli,Tamil Nadu ,1
Tiruneveli,Tamil Nadu ,1
Tiruppur,Tamil Nadu ,1
Chennai,Tamil Nadu ,19
Vellore,Tamil Nadu ,2
Madurai,Tamil Nadu ,3
Erode,Tamil Nadu ,5
Salem,Tamil Nadu ,6
Adilabad,Telangana,0
Jagtial,Telangana,0
Jangaon,Telangana,0
Jayashankar Bhupalpally,Telangana,0
Jogulama Gadwal,Telangana,0
Kamareddy,Telangana,0
Khammam,Telangana,0
Komaram Bheem,Telangana,0
Mahabubabad,Telangana,0
Mahbubnagar,Telangana,0
Mancherial,Telangana,0
Medak,Telangana,0
Mulugu,Telangana,0
Nagarkurnool,Telangana,0
Nalgonda,Telangana,0
Narayanpet,Telangana,0
Nirmal,Telangana,0
Nizamabad,Telangana,0
Peddapalli,Telangana,0
Rajanna Sircilla,Telangana,0
Sangareddy,Telangana,0
Siddipet,Telangana,0
Suryapet,Telangana,0
Vikarabad,Telangana,0
Wanaparthy,Telangana,0
Warangal Rural,Telangana,0
Warangal Urban,Telangana,0
Yadadri Bhuvanagiri,Telangana,0
Medchal Malkajgiri,Telangana,1
Unclassified,Telangana,14
Ranga Reddy,Telangana,2
Bhadradri Kothagudem,Telangana,3
Karimnagar,Telangana,3
Hyderabad,Telangana,36
Unclassified,Tripura,0
Almora,Uttarakhand,0
Bageshwar,Uttarakhand,0
Chamoli,Uttarakhand,0
Champawat,Uttarakhand,0
Haridwar,Uttarakhand,0
Nainital,Uttarakhand,0
Pithoragarh,Uttarakhand,0
Rudraprayag,Uttarakhand,0
Tehri Garhwal ,Uttarakhand,0
Udham Singh  Nagar ,Uttarakhand,0
Uttarkashi,Uttarakhand,0
Pauri,Uttarakhand,1
Unclassified,Uttarakhand,1
Dehradun,Uttarakhand,3
Aligarh,Uttar Pradesh ,0
Allahabad,Uttar Pradesh ,0
Ambedkar Nagar ,Uttar Pradesh ,0
Amethi,Uttar Pradesh ,0
Amroha,Uttar Pradesh ,0
Auraiya,Uttar Pradesh ,0
Azamgarh,Uttar Pradesh ,0
Bahraich,Uttar Pradesh ,0
Ballia,Uttar Pradesh ,0
Balrampur,Uttar Pradesh ,0
Banda,Uttar Pradesh ,0
Barabanki,Uttar Pradesh ,0
Bareilly,Uttar Pradesh ,0
Basti,Uttar Pradesh ,0
Bhadohi,Uttar Pradesh ,0
Bijnor,Uttar Pradesh ,0
Budaun,Uttar Pradesh ,0
Bulandshahr,Uttar Pradesh ,0
Chandauli,Uttar Pradesh ,0
Chitrakoot,Uttar Pradesh ,0
Deoria,Uttar Pradesh ,0
Etah,Uttar Pradesh ,0
Etawah,Uttar Pradesh ,0
Faizabad,Uttar Pradesh ,0
Farrukhabad,Uttar Pradesh ,0
Fatehpur,Uttar Pradesh ,0
Firozabad,Uttar Pradesh ,0
Ghazipur,Uttar Pradesh ,0
Gonda,Uttar Pradesh ,0
Gorakhpur,Uttar Pradesh ,0
Hamirpur,Uttar Pradesh ,0
Hapur,Uttar Pradesh ,0
Hardoi,Uttar Pradesh ,0
Hathras,Uttar Pradesh ,0
Jalaun,Uttar Pradesh ,0
Jhansi,Uttar Pradesh ,0
Kannauj,Uttar Pradesh ,0
Kasganj,Uttar Pradesh ,0
Kaushambi,Uttar Pradesh ,0
Kushinagar,Uttar Pradesh ,0
Lakhimpur Kheri ,Uttar Pradesh ,0
Lalitpur,Uttar Pradesh ,0
Maharajganj,Uttar Pradesh ,0
Mahoba,Uttar Pradesh ,0
Mainpuri,Uttar Pradesh ,0
Mathura,Uttar Pradesh ,0
Mau,Uttar Pradesh ,0
Meerut,Uttar Pradesh ,0
Mirzapur,Uttar Pradesh ,0
Muzaffarnagar,Uttar Pradesh ,0
Pratapgarh,Uttar Pradesh ,0
Raebareli,Uttar Pradesh ,0
Rampur,Uttar Pradesh ,0
Saharanpur,Uttar Pradesh ,0
Sambhal,Uttar Pradesh ,0
Sant Kabir Nagar,Uttar Pradesh ,0
Shahjahanpur,Uttar Pradesh ,0
Shamli,Uttar Pradesh ,0
Shravasti,Uttar Pradesh ,0
Siddharthnagar,Uttar Pradesh ,0
Sitapur,Uttar Pradesh ,0
Sultanpur,Uttar Pradesh ,0
Unnao,Uttar Pradesh ,0
Baghpat,Uttar Pradesh ,1
Jaunpur,Uttar Pradesh ,1
Kanpur,Uttar Pradesh ,1
Moradabad,Uttar Pradesh ,1
Varanasi,Uttar Pradesh ,1
Gautam Buddha ,Uttar Pradesh ,16
Pilibhit,Uttar Pradesh ,2
Ghaziabad,Uttar Pradesh ,3
Unclassified,Uttar Pradesh,7
Lucknow,Uttar Pradesh ,8
Agra,Uttar Pradesh ,9
Alipurduar,West Bengal,0
Bankura,West Bengal,0
Birbhum,West Bengal,0
Cooch Behar,West Bengal,0
Dakshin Dinajpur,West Bengal,0
Darjeeling,West Bengal,0
Hooghly,West Bengal,0
Howrah,West Bengal,0
Jalpaiguri,West Bengal,0
Jhargram,West Bengal,0
Kalimpong,West Bengal,0
Malda,West Bengal,0
Murshidabad,West Bengal,0
Nadia,West Bengal,0
Paschim Bardhaman,West Bengal,0
Paschim Medinipur,West Bengal,0
Purba Bardhaman,West Bengal,0
Purba Bardhaman,West Bengal,0
Purulia,West Bengal,0
South 24 Parganas  ,West Bengal,0
Uttar Dinajpur,West Bengal,0
North 24 Parganas  ,West Bengal,1
Kolkata,West Bengal,5
Unclassified,West Bengal,9
`;

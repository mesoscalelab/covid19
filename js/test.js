let statesData = [];

function createStatesData()
{
  statesData = Papa.parse(statesDataString, { delimiter : ",", skipEmptyLines : true}).data;
}

export function getName()
{
  if (statesData.length == 0) {
    createStatesData();
  }
  return statesData[0][0];
}

// table columns are:
// state name, population (millions), inflation factor (n)
const statesRawDataString = `
Andaman and Nicobar Islands,   0.38,   2
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
Meghalaya,                     2.96,   2
Mizoram,                       1.09,   2
Manipur,                       2.85,   2
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

#include "CSVparser.hpp"
#include <unordered_set>
#include <unordered_map>
#include <cmath>
#include <string>
#include <iostream>

int
days_since_31dec(const int day, const int month, const int year)
{
  if (day == 31 and month == 12 and year == 2019)
    return 0;
  switch (month) {
    case  1 : return day; 
    case  2 : return day + 31;
    case  3 : return day + 31 + 29;
    case  4 : return day + 31 + 29 + 31;
    case  5 : return day + 31 + 29 + 31 + 30;
    default : return -9999999;
  }
}

int
main()
{
  const int k = 7; // for new cases over next k days
  csv::Parser file = csv::Parser("../global.csv");

  // find max number of days in data since 31 Dec 2019
  int t_max = 0;
  for (std::size_t i = 0; i < file.rowCount(); i++) {
    const auto day   = std::stod(file[i][1]);
    const auto month = std::stod(file[i][2]);
    const auto year  = std::stod(file[i][3]);
    const auto t     = days_since_31dec(day, month, year);
    t_max = std::max(t_max, t);
  }
  const int t_min = 0;
  const int num_days = (t_max - t_min) + 1;

  // list all geo IDs in data
  std::unordered_set<std::string> geo_ids;
  for (std::size_t i = 0; i < file.rowCount(); i++) {
    const auto geo_id = std::string(file[i][7]);
    geo_ids.insert(geo_id);
  }

  // create cumulative-daily pair series by geo ID for statistics
  using series_type = std::vector<std::pair<int,int>>;
  using map_type = std::unordered_map<std::string, series_type>;
  map_type geo_id_case_stats;
  map_type geo_id_death_stats;
  for (auto& geo_id : geo_ids) {
    geo_id_case_stats[geo_id].resize(num_days);
    geo_id_death_stats[geo_id].resize(num_days);
    for (int t = 0; t < num_days; t++) {
      geo_id_case_stats.at(geo_id).at(t) = std::make_pair(0, 0);
      geo_id_death_stats.at(geo_id).at(t) = std::make_pair(0, 0);
    }
  }

  // set daily component of pairs for case and death statistics
  for (std::size_t i = 0; i < file.rowCount(); i++) {
    const auto day        = std::stod(file[i][1]);
    const auto month      = std::stod(file[i][2]);
    const auto year       = std::stod(file[i][3]);
    const auto new_cases  = std::stod(file[i][4]);
    const auto new_deaths = std::stod(file[i][5]);
    const auto geo_id     = std::string(file[i][7]);
    const auto t          = days_since_31dec(day, month, year);
    geo_id_case_stats.at(geo_id).at(t) = std::make_pair(0, new_cases);
    geo_id_death_stats.at(geo_id).at(t) = std::make_pair(0, new_deaths);
  }
  
  // set cumulative component of pairs for case statistics
  for (auto& geo_id_series : geo_id_case_stats) {
    auto& series = geo_id_series.second;
    int cumul_cases = 0;
    for (int t = 1; t < num_days; t++) {
      cumul_cases += series[t-1].second;
      series[t].first = cumul_cases;
    }
  }

  // set cumulative component of pairs for death statistics
  for (auto& geo_id_series : geo_id_death_stats) {
    auto& series = geo_id_series.second;
    int cumul_cases = 0;
    for (int t = 1; t < num_days; t++) {
      cumul_cases += series[t-1].second;
      series[t].first = cumul_cases;
    }
  }

  // create new series with cumulative cases for each day
  // and total new cases over the next k days
  // create cumulative-daily pair series by geo ID for statistics
  map_type geo_id_case_nextk;
  map_type geo_id_death_nextk;
  for (auto& geo_id : geo_ids) {
    geo_id_case_nextk[geo_id].resize(num_days-k);
    geo_id_death_nextk[geo_id].resize(num_days-k);
    for (int t = 0; t < num_days-k; t++) {
      geo_id_case_nextk.at(geo_id).at(t) = std::make_pair(0, 0);
      geo_id_death_nextk.at(geo_id).at(t) = std::make_pair(0, 0);
    }
  }
  
  // set cumulative cases and new cases over next k days
  for (auto& stats : geo_id_case_stats) {
    const auto geo_id = stats.first;
    auto& series = stats.second;
    for (int t = k; t < num_days; t++) {
      int count = 0;
      for (int i = 1; i <= k; i++) {
        count += series.at(t-i).second;
      }
      geo_id_case_nextk.at(geo_id).at(t-k).first = series.at(t).first;
      geo_id_case_nextk.at(geo_id).at(t-k).second = count;
    }
  }
  
  // set cumulative deaths and new deaths over next k days
  for (auto& stats : geo_id_death_stats) {
    const auto geo_id = stats.first;
    auto& series = stats.second;
    for (int t = k; t < num_days; t++) {
      int count = 0;
      for (int i = 1; i <= k; i++) {
        count += series.at(t-i).second;
      }
      geo_id_death_nextk.at(geo_id).at(t-k).first = series.at(t).first;
      geo_id_death_nextk.at(geo_id).at(t-k).second = count;
    }
  }
  /*for (auto& stats : geo_id_death_stats) {
    const auto geo_id = stats.first;
    auto& series = stats.second;
    for (int t = 0; t < num_days-k; t++) {
      int count = 0;
      for (int i = 0; i < k; i++) {
        count += series.at(t+i).second;
      }
      geo_id_death_nextk.at(geo_id).at(t).first = series.at(t).first;
      geo_id_death_nextk.at(geo_id).at(t).second = count;
    }
  }*/

/*nd(t,t+k) = A * d(t+k)**(0.96)
d(t+k) = d(t) + nd(t,t+k)
so
nd(t,t+k) = A * (d(t) + nd(t+k))**(0.96)
y : nd(t,t+k)
x : d(t)
y = A * (x + y)
y = A x / (1 - A)
*/

  // list some a few selected geo IDs
  std::unordered_set<std::string> selected_geo_ids =
    {"IN", "US", "FR", "ES", "DE", "IT", "UK", "TR", "IR"};
//{"US"};
  // print case cumulative-nextk pair statistics for selected geo IDs
  for (auto& geo_id_series : geo_id_death_stats) {
    const auto geo_id = geo_id_series.first;
    auto search = selected_geo_ids.find(geo_id);
    if (search == selected_geo_ids.end())
      continue;
    auto& series = geo_id_series.second;
    for (auto pair : series) {
      std::cout << pair.first << "," << pair.second << std::endl;
    }
  }

  return 0;
}

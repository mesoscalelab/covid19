#!/bin/bash

sinceDate="1 April 2020"
level=$1
stateName="none"
districtName="none"
category="none"
region="none"

if [ "$level" == "country" ]
then
  category=$2
fi

if [ "$level" == "state" ]
then
  stateName=$2
  category=$3
fi

if [ "$level" == "district" ]
then
  districtName=$2
  stateName=$3
  category=$4
fi

if [ "$category" == "r" ]
then
  category="reported"
elif [ "$category" == "reported" ]
then
  category="reported"
elif [ "$category" == "d" ]
then
  category="deceased"
elif [ "$category" == "deceased" ]
then
  category="deceased"
else
  echo "Please provide a valid category ..."
  exit 1
fi

if [ "$category" == "deceased" ]
then
  if [ "$level" == "district" ]
  then
    echo "Cannot show actual deceased trend for districts..."
    exit 1
  fi
fi

if [ "$level" == "country" ]
then
  stateName="none"
  districtName="none"
  region="India"
fi

if [ "$level" == "state" ]
then
  if [ -z "$stateName" ]
  then
    echo "Please provide a state name ..."
    exit 1
  fi
  districtName="none"
  region="$stateName"
fi

if [ "$level" == "district" ]
then
  if [ -z "$stateName" ] || [ -z "$districtName" ]
  then
    echo "Please provide a state name and a district name ..."
    exit 1
  fi
  region="$districtName, $stateName"
fi

region=$(echo $region|sed 's/ //g' |sed 's/,/-/g')


echo "Plotting $category statistics for $region since $sinceDate ..."

node stat-bands.js "$sinceDate" "$category" "$level" "$stateName" "$districtName" > temp-all-data.csv
awk '{print $0 > "temp-file" NR ".csv"}' RS='===' temp-all-data.csv # partition rows separated by === in to diff files
awk 'NF' temp-file2.csv > temp-actual-data.csv # remove blank lines
awk '{print $0 > "temp-band-data" NR ".csv"}' RS='###' temp-file1.csv # partition rows separated by ### in diff files

gnuplot -c band-plot.gnu "$sinceDate" "$category" "$region" > /dev/null


#regdatafile=$(echo $region-$category.csv |sed 's/ //g' | sed 's/,/-/g')
regdatafile=$region-$category.csv

echo "# " $region, $category > "$regdatafile"
#cat temp-all-data.csv >> "$regdatafile"
awk '{print}' RS='###' temp-all-data.csv  >> "$regdatafile"
rm temp*.csv

# get daily stats
#echo node stat-daily.js "$sinceDate" "$category" "$level" "$stateName" "$districtName" > $level-$category-daily.csv


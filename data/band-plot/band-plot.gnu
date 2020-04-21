#!/usr/bin/gnuplot
# gnuplot -c band-plot.gnu reported India > /dev/null
sincedate = ARG1
category  = ARG2
region    = ARG3
set terminal pngcairo size 640,640 enhanced font 'Verdana,10'
set title "Adaptive Projections of ".category." count for ".region."\n made at the dates shown"
set xlabel "Days since ".sincedate
set ylabel "Projection for ".category." count"
set xrange[0:50]
set yrange[1:1e6]
set key top left
set key reverse
set style fill noborder
set log y
set format y "10^{%T}"
set datafile separator ","


numbk = 5
array dlabels[numbk]

do for [t=1:5] {
  datafile = sprintf('temp-band-data%d.csv',t)
  dlabels[t] =  system("head -2 " . datafile . " | tail -1 | cut -d, -f5")
##  print dlabels[t]
}

array translist[numbk]
 translist[1] = 1.00 
 translist[2] = 0.60
 translist[3] = 0.60
 translist[4] = 0.50
 translist[5] = 0.50

array lclist[numbk]
 lclist[1] = "dark-green"
 lclist[2] = "blue"      
 lclist[3] = "slateblue1"
 lclist[4] = "purple"    
 lclist[5] = "coral"     


# assuming t0 gap of 6 days
array gaps[numbk]
  gaps[1] = 1
  gaps[2] = 7
  gaps[3] = 13
  gaps[4] = 18
  gaps[5] = 25



plot for [t=1:numbk]  "temp-band-data".t.".csv"  u 1:2:4 w filledcu fs transparent solid translist[t] lc rgb lclist[t] ti dlabels[t]
replot "temp-actual-data.csv" u 1:2 w lp lc rgb "black" lt 1 lw 2 pt 7 ti "Actual Data"
replot for [t=1:5] "<(sed -n  '".gaps[t]."p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 3 lc rgb lclist[t]  notitle


set output region."-".category.".png"
replot

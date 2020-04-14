#!/usr/bin/gnuplot
# gnuplot -c band-plot.gnu reported India > /dev/null
sincedate = ARG1
category  = ARG2
region    = ARG3
set terminal pngcairo size 640,640 enhanced font 'Verdana,10'
set title "Adaptive Projections of ".category." count for ".region."\n made at t_0 for t_0+1, t_0+2, t_0+3 and t_0+4 weeks"
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
plot   "temp-band-data1.csv"  u 1:2:4 w filledcu fs transparent solid 1.00 lc rgb "dark-green" ti "t_0 = 13 Apr"
replot "temp-band-data2.csv"  u 1:2:4 w filledcu fs transparent solid 0.60 lc rgb "blue"       ti "t_0 =  7 Apr"
replot "temp-band-data3.csv"  u 1:2:4 w filledcu fs transparent solid 0.60 lc rgb "slateblue1" ti "t_0 =  1 Apr"
replot "temp-band-data4.csv"  u 1:2:4 w filledcu fs transparent solid 0.50 lc rgb "purple"     ti "t_0 = 26 Mar"
replot "temp-band-data5.csv"  u 1:2:4 w filledcu fs transparent solid 0.50 lc rgb "coral"      ti "t_0 = 20 Mar"
replot "temp-actual-data.csv" u 1:2 w lp lc rgb "black" lt 1 lw 2 pt 7 ti "Actual Data"
# assuming t0 gap of 6 days
replot "<(sed -n  '1p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "dark-green"    notitle
replot "<(sed -n  '7p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "blue"  notitle
replot "<(sed -n '13p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "slateblue1" notitle
replot "<(sed -n '19p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "purple" notitle
replot "<(sed -n '25p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "coral"   notitle
set output region."-".category.".png"
replot

#!/usr/bin/gnuplot
# gnuplot -c band-plot.gnu reported India > /dev/null
sincedate = ARG1
category  = ARG2
region    = ARG3
set terminal pngcairo size 640,640 enhanced font 'Verdana,10'
set title "Adaptive Projections for ".region." made at t_0 (colored dot) \n for t_0+1, t_0+2, t_0+3 and t_0+4 weeks (colored band) is shown with actual data (black)"
set xlabel "Days since ".sincedate
set ylabel "Projection for ".category." count"
set xrange[0:50]
set yrange[1:1e6]
set key bottom right
set style fill noborder
set log y
set format y "10^{%T}"
set datafile separator ","
plot   "temp-band-data1.csv"  u 1:2:4 w filledcu fs transparent solid 1.00 lc rgb "dark-green"    notitle
replot "temp-band-data2.csv"  u 1:2:4 w filledcu fs transparent solid 0.60 lc rgb "blue"  notitle
replot "temp-band-data3.csv"  u 1:2:4 w filledcu fs transparent solid 0.60 lc rgb "slateblue1" notitle
replot "temp-band-data4.csv"  u 1:2:4 w filledcu fs transparent solid 0.50 lc rgb "purple" notitle
replot "temp-band-data5.csv"  u 1:2:4 w filledcu fs transparent solid 0.50 lc rgb "coral"   notitle
replot "temp-actual-data.csv" u 1:2 w lp lc rgb "black" lt 1 lw 2 pt 7 notitle
# assuming t0 gap of 6 days
replot "<(sed -n  '1p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "dark-green"    notitle
replot "<(sed -n  '7p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "blue"  notitle
replot "<(sed -n '13p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "slateblue1" notitle
replot "<(sed -n '19p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "purple" notitle
replot "<(sed -n '25p' temp-actual-data.csv)" u 1:2 w point lt 1 lw 2 pt 7 ps 1.5 lc rgb "coral"   notitle
set output region."-".category.".png"
replot

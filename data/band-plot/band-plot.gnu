#!/usr/bin/gnuplot
# gnuplot -c band-plot.gnu India reported > /dev/null
region = ARG1
category = ARG2
set terminal pngcairo size 640,640 enhanced font 'Verdana,10'
set title "Adaptive Projections for ".region."\n made on t_0 for t_0+1, t_0+2, t_0+3 and t_0+4 weeks"
set xlabel "Days since 20^{th} March 2020"
set ylabel "Projection for ".category." count"
set xrange[0:45]
set yrange[1:1e6]
set key bottom right
set style fill noborder
set log y
set format y "10^{%T}"
set datafile separator ","
plot   "<(sed -n '29,32p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 1.00 lc rgb "dark-green"  ti 't_0 = 10 Apr'
replot "<(sed -n '25,28p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.90 lc rgb "web-blue"    ti 't_0 =  7 Apr'
replot "<(sed -n '21,24p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.80 lc rgb "yellow"      ti 't_0 =  4 Apr'
replot "<(sed -n '17,20p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.70 lc rgb "purple"      ti 't_0 =  1 Apr'
replot "<(sed -n '13,16p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.60 lc rgb "orange"      ti 't_0 = 29 Mar'
replot "<(sed -n ' 9,12p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.50 lc rgb "green"       ti 't_0 = 26 Mar'
replot "<(sed -n ' 5, 8p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.40 lc rgb "red"         ti 't_0 = 23 Mar'
replot "<(sed -n ' 1, 4p' all-data.csv)" u 1:2:3 w filledcu fs transparent solid 0.30 lc rgb "blue"        ti 't_0 = 20 Mar'
replot "<(sed -e '48,$!{h;d;}' -e x all-data.csv)" u 1:2 w lp lc rgb "black" lt 1 lw 2 pt 7 ti 'Actual'
set output region."-".category.".png"
replot

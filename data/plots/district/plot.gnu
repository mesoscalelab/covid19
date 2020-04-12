#!/usr/bin/gnuplot

set title "Adaptive Projections for Mumbai, Maharashtra\n made on t_0 for t_0+1, t_0+2, t_0+3 and t_0+4 weeks"
set xlabel "Days since 20^{th} March 2020"
set ylabel "Projection of Cases Reported"
set xrange[0:45]
set yrange[10:1e5]
set key bottom right
set style fill noborder
set log y
plot   'data15.dat' u 1:2:3 w filledcu fs transparent solid 1.00 lc rgb "yellow"  ti 't_0 = 4 Apr'
replot 'data12.dat' u 1:2:3 w filledcu fs transparent solid 0.80 lc rgb "purple"  ti 't_0 = 1 Apr'
replot 'data9.dat'  u 1:2:3 w filledcu fs transparent solid 0.60 lc rgb "orange"  ti 't_0 = 29 Mar'
replot 'data6.dat'  u 1:2:3 w filledcu fs transparent solid 0.50 lc rgb "green"   ti 't_0 = 26 Mar'
replot 'data3.dat'  u 1:2:3 w filledcu fs transparent solid 0.40 lc rgb "red"     ti 't_0 = 23 Mar'
replot 'data0.dat'  u 1:2:3 w filledcu fs transparent solid 0.30 lc rgb "blue"    ti 't_0 = 20 Mar'
replot 'actual.dat' u 1:2 w lp lc rgb "black" lt 1 lw 2 pt 7 ps 1.5 ti 'Actual Reported'

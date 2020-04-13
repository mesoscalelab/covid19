#!/usr/bin/gnuplot

n=50 #number of intervals
max=+0.6 #max value
min=-0.6 #min value
width=(max-min)/n #interval width
#function used to map a value to the intervals
hist(x,width)=width*floor(x/width)+width/2.0
set boxwidth width*0.9
set style fill solid 0.5 # fill style

#count and plot
plot "displ-confirmed-districts-320.dat" u (hist($1,width)):(1.0) smooth freq w boxes lc rgb "red" notitle
replot "displ-confirmed-districts-325.dat" u (hist($1,width)):(1.0) smooth freq w boxes lc rgb "orange" notitle
replot "displ-confirmed-districts-330.dat" u (hist($1,width)):(1.0) smooth freq w boxes lc rgb "blue" notitle
replot "displ-confirmed-districts-405.dat" u (hist($1,width)):(1.0) smooth freq w boxes lc rgb "green" notitle

/*
SEIR Model#
===========
birth rate A  = 0
death rate mu = 0
dS/dt = - beta I S / N
dE/dt = + beta I S / N - a E
dI/dt = a E - gamma I
dR/dt = gamma I

ds/dt = - beta * i * s
de/dt = + beta * i * s - a * e
di/dt = + a * e - gamma * i;
dr/dt = + gamma * i

assume that the unit of time is days
beta   : average number of contacts per person per day
ta     : 5.1 days$, incubation period for exposed to become infectious
tgamma : 7.0 days$, infectious period for infectious to become recovered
a      : rate of exposed becoming infectious = 1 / ta
gamma  : rate of infectious becoming recovered = 1 / tgamma

References
==========
# https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology#The_SEIR_model
$ AFMC paper

*/

#include <iostream>
#include <cmath>

int
main()
{
  // initial condition
  double pop = 10e6;
  double e   =  1000 / pop;
  double i   =  10 / pop;

  double dt = 0.1;
  for (double t = 0; t < 100; t += dt) {
    // parameters
    double ta     = 100;
    double tgamma = 1e8;
    double a      = 1. / ta;
    double gamma  = 1. / tgamma;

    // evolution
    double dedt   = - a * e;
    double didt   = + a * e - gamma * i;

    e += dt * dedt;
    i += dt * didt;

    // print statistics
    std::cout << t << ","; //1
    std::cout << e * pop << ","; //2
    std::cout << i * pop << ","; //3
    std::cout << dedt * pop << ","; //4
    std::cout << didt * pop << ","; //5
    std::cout << std::endl;
  }
  return 0;
}

/*
dedt = - a * e;
didt = + h * e - g * i;

e(t) = C1 * exp(-a * t)
A = h * C1

di/dt = A * exp(-a * t) - g * x
i(t) = C2 * exp(-g * t) - C1 * exp(-a * t) * h / (a - g)

~ C2 * (1 - gt) - C1 * (1 - at) * h / (a - g)
[k = C1 * h / (a - g)]
= C2 * (1 - gt) - k (1 - at)
= C2 - k - C2 g t + k a t
= t (k a - g C2) + (C2 - k)
*/


int
main1()
{
  // initial condition
  double pop = 10e6;
  double e   = 20 / pop;
  double i   =  0 / pop;
  double r   =  0 / pop;
  double s   = (pop - e - i - r) / pop;

  double dt = 0.1;
  for (double t = 0; t < 100; t += dt) {
    // parameters
    double beta   = (t < 15 ? 2.3 : 0);
    double ta     = 50;
    double tgamma = 1e8;
    double a      = 1. / ta;
    double gamma  = 1. / tgamma;

    // evolution
    double dsdt   = - beta * i * s;
    double dedt   = + beta * i * s - a * e ;
    double didt   = + a * e - gamma * i;
    double drdt   = + gamma * i;

    s += dt * dsdt;
    e += dt * dedt;
    i += dt * didt;
    r += dt * drdt;

    // print statistics
    std::cout << t << ","; //1
    std::cout << s * pop << ","; //2
    std::cout << e * pop << ","; //3
    std::cout << i * pop << ","; //4
    std::cout << r * pop << ","; //5
    std::cout << dsdt * pop << ","; //6
    std::cout << dedt * pop << ","; //7
    std::cout << didt * pop << ","; //8
    std::cout << drdt * pop << ","; //9
    std::cout << std::endl;
  }
  return 0;
}

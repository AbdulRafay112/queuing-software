#include <iostream>
#include <cmath>
using namespace std;

void calculateMG2(double lambda, double mu, double variance) {
    int c = 2; // number of servers

    double rho = lambda / (c * mu);

    if (rho >= 1) {
        cerr << "Error: System unstable (rho >= 1)";
        return;
    }
    
    double Lq_MG1 = (pow(lambda, 2) * variance + pow(lambda / mu, 2))
                    / (2 * (1 - lambda / mu));

    double adjustment = (1.0 / c) * (1.0 / (1.0 - rho));
    double Lq = Lq_MG1 * adjustment;
    double L = lambda / mu + Lq;
    double W = L / lambda;
    double Wq = Lq / lambda;

    double P0 = 1 - rho; // rough approximation

    cout << rho << "," << L << "," << Lq << "," << W << "," << Wq << "," << P0;

}
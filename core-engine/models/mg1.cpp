#include <iostream>
#include <cmath>
using namespace std;

void calculateMG1(double lambda, double mu, double variance) {
    double rho = lambda / mu;

    if (rho >= 1) {
        cerr << "Error: System unstable";
        return;
    }

    // Lq using Pollaczek–Khinchine formula
    double Lq = (pow(lambda, 2) * variance + pow(rho, 2)) / (2 * (1 - rho));

    double L = rho + Lq;
    double W = L / lambda;
    double Wq = Lq / lambda;
    double P0 = 1 - rho;

    cout << rho << "," << L << "," << Lq << "," << W << "," << Wq << "," << P0;
}
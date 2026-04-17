#include <iostream>
#include <cmath>
using namespace std;

void calculateMG1(double L, double M, double var) {
    double rho = L / M;
    if (rho >= 1) {
        cerr << "Error: System unstable";
        return;
    }

    double lq = (pow(L, 2) * var + pow(rho, 2)) / (2.0 * (1.0 - rho));
    double L_val = rho + lq;
    double W = L_val / L;
    double Wq = lq / L;
    double p0 = 1.0 - rho;

    cout << rho << "," << L_val << "," << lq << "," << W << "," << Wq << "," << p0;
}
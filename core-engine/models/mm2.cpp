#include <iostream>
#include <cmath>
using namespace std;

void calculateMM2(double L, double M) {
    int s = 2; 
    double rho = L / (s * M);
    
    if (rho >= 1) {
        cerr << "Error: System unstable (lambda >= s*mu)";
        return;
    }

    double sum = 1.0 + (L/M); 
    double p0 = 1.0 / (sum + (pow(L/M, 2) / (2.0 * (1.0 - rho))));
    double lq = (p0 * pow(L/M, s) * rho) / (2.0 * pow(1.0 - rho, 2));
    
    double L_val = lq + (L / M);
    double W = L_val / L;
    double Wq = lq / L;

    cout << rho << "," << L_val << "," << lq << "," << W << "," << Wq << "," << p0;
}
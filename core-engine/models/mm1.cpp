#include <iostream>
using namespace std;

void calculateMM1(double lambda, double mu) {
    if (lambda >= mu) {
        cerr << "Error: Lambda must be less than Mu";
        return;
    }

    double rho = lambda / mu;
    double L = lambda / (mu - lambda);
    double Lq = (lambda * lambda) / (mu * (mu - lambda));
    double W = 1 / (mu - lambda);
    double Wq = lambda / (mu * (mu - lambda));
    double P0 = 1 - rho;

    // Output format: rho,L,Lq,W,Wq,P0
    cout << rho << "," << L << "," << Lq << "," << W << "," << Wq << "," << P0;
}
#include <iostream>
#include <string>
#include "models/mm1.cpp"
#include "models/mm2.cpp"
#include "models/mg1.cpp"
#include "models/mg2.cpp"

#include <iomanip>

using namespace std;

int main(int argc, char* argv[]) {
    if (argc < 4) return 1;

    string model = argv[1];
    double lambda = stod(argv[2]);
    double mu = stod(argv[3]);
    cout << fixed << setprecision(4);

    if (model == "mm1") {
        calculateMM1(lambda, mu);
    } else if (model == "mm2") {
        calculateMM2(lambda, mu);
    } else if (model == "mg1") {
        if (argc < 5) return 1;
        double var = stod(argv[4]);
        calculateMG1(lambda, mu, var);
    } else if (model == "mg2") {
        if (argc < 5) return 1;
        double var = stod(argv[4]);
        calculateMG2(lambda, mu, var);
    } else {
        cerr << "Unknown model: " << model;
        return 1;
    }
    return 0;
}
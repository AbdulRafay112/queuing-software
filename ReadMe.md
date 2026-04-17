# Frontend Team Setup Instructions

Please follow the steps below to set up the project properly.

---

## 1- Clone the Repository

## 2- Run The Following Commands:

```bash
git clone <repo-url>
cd backend
npm install
cd ../core-engine
g++ main.cpp -o engine.exe
After running this command, an engine.exe file will be created in the same folder.
Copy the generated engine.exe file and paste it inside the backend folder.
cd ../backend
node server.js
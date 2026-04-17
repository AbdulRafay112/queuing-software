
git clone <repo-url>
cd backend
npm install

cd ../core-engine
g++ main.cpp -o engine.exe

# Copy engine.exe to backend folder

cd ../backend
node server.js
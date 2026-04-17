const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); 

app.get('/api/calculate', (req, res) => {
    const { model, lambda, mu, variance } = req.query;

    const enginePath = path.join(__dirname, 'engine.exe');
    
    // Command builder: Model, L, M, aur agar MG1 hai to Variance
    let cmd = `${enginePath} ${model} ${lambda} ${mu}`;
    if (model === 'mg1') cmd += ` ${variance || 0}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error || stderr) {
            return res.status(400).json({ error: stderr || "Calculation error" });
        }

        const resArray = stdout.split(',');
        res.json({
            trafficIntensity: resArray[0],
            avgCustomersSystem: resArray[1],
            avgCustomersQueue: resArray[2],
            waitTimeSystem: resArray[3],
            waitTimeQueue: resArray[4],
            probZeroCustomers: resArray[5]
        });
    });
});

app.listen(5000, () => console.log("Backend Lead! Server is live on http://localhost:5000"));
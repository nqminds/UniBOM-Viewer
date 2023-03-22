const express = require('express')
const app = express()
const port = 3000
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const userID = "me";
const key = "my-ssh-key";
const IP = "192.168.0.1";
const scriptPort = "4001";

// we'll either want 4 api routes, one for each permutation
// or 2 parameters (purecap/hybrid and good/malicious cert) and run the appropriate script for each
app.get('/run-script', async (req, res) => {
    let [stdout, stderr, error] = ["", "", ""];
    try {
        ({ stdout, stderr } = await exec(`./test.sh ${IP} ${scriptPort} ${userID} ${key}`));
    } catch (err) {
        error = err;
    }
    res.send({stdout, stderr, error});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
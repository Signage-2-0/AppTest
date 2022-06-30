const https = require('https');

const options = {
    hostname: 'purge.jsdelivr.net',
    port: 443,
    path: '/gh/Signage-2-0/AppTest@latest/test.js',
    method: 'GET',
};

const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
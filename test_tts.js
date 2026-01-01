const http = require('http');

const data = JSON.stringify({
    text: "Hello from test script",
    voice: "en-US-ChristopherNeural"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/tts_sync',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Sending request to http://localhost:5000/api/tts_sync...");

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => {
        // Capture first bit of data to verify it's not JSON error
        if (rawData.length < 100) rawData += chunk;
    });
    res.on('end', () => {
        console.log(`Response received. Content-Type: ${res.headers['content-type']}`);
        if (res.statusCode === 200 && res.headers['content-type'] === 'audio/mpeg') {
            console.log("SUCCESS: Audio data received.");
        } else {
            console.log("FAILURE: Unexpected response.", rawData);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();

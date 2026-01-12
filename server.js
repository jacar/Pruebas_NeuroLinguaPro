const express = require('express');
const cors = require('cors');
const { WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Groq/Cerebras Chat Proxy
// To avoid exposing keys in frontend, ideally use this.
// For now, we keep the frontend logic for chat but we could move it here.

// TTS ENDPOINT (Child Process Worker)
const { spawn } = require('child_process');

app.post('/api/tts_sync', async (req, res) => {
    const { text, voice } = req.body;
    console.log(`[TTS Request] Text: "${text.substring(0, 20)}...", Voice: ${voice}`);

    if (!text) return res.status(400).json({ error: 'No text provided' });

    const targetVoice = voice || 'en-US-ChristopherNeural';
    const tempFile = path.join(__dirname, `tts_${uuidv4()}.mp3`);
    const workerScript = path.join(__dirname, 'tts_worker.js');

    try {
        console.log(`[TTS] Spawning worker: ${process.execPath} ${workerScript}`);

        // Use current node executable
        const child = spawn(process.execPath, [workerScript, text, targetVoice, tempFile]);

        child.on('error', (err) => {
            console.error(`[TTS] Request failed to spawn: ${err.message}`);
            res.status(500).json({ error: "TTS Process Spawn Failed" });
        });

        child.on('close', (code) => {
            if (code === 0 && fs.existsSync(tempFile)) {
                const audioBuffer = fs.readFileSync(tempFile);
                console.log(`[TTS] Worker success. Size: ${audioBuffer.length} bytes`);
                res.set('Content-Type', 'audio/mpeg');
                // res.set('Content-Length', audioBuffer.length); // Optional, but good practice
                res.send(audioBuffer);
                try { fs.unlinkSync(tempFile); } catch (e) { }
            } else {
                console.error(`[TTS] Worker failing. Code: ${code}`);
                if (fs.existsSync(tempFile)) try { fs.unlinkSync(tempFile); } catch (e) { }
                res.status(500).json({ error: "TTS Generation Failed" });
            }
        });

        child.stderr.on('data', (data) => console.error(`[Worker Error]: ${data}`));

    } catch (error) {
        console.error("[TTS Error] Generation Failed:", error);
        res.status(500).json({ error: "TTS Generation Failed", details: error.message });
    }
});

// Removed custom generateEdgeAudio function



const PORT = process.env.PORT || 5000;

// Export the app for Vercel Serverless
module.exports = app;

// Only listen if run directly (local dev)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`NeuroLingua Elite Node Server running on http://localhost:${PORT}`);
    });
}

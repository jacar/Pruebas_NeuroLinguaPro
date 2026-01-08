import os
import random
import json
from flask import Flask, request, jsonify, send_from_directory, Response
from groq import Groq
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app) # Enable CORS for all routes

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    client_keys = data.get('keys', {})
    
    # Retrieve keys: prioritize client-provided keys
    groq_key = client_keys.get("groq") or os.environ.get("GROQ_API_KEY")
    cerebras_key = client_keys.get("cerebras") or os.environ.get("CEREBRAS_API_KEY")
    
    # Model specified by user
    model_name = "moonshotai/kimi-k2-instruct-0905"
    
    # Rotation logic: 50/50 chance
    use_groq = random.random() < 0.5
    api_key = groq_key if use_groq else cerebras_key
    provider = "Groq" if use_groq else "Cerebras"
    
    # If a key is missing, fallback to the other
    if not api_key:
        api_key = cerebras_key if use_groq else groq_key
        provider = "Cerebras" if use_groq else "Groq"

    if not api_key:
        return jsonify({'error': 'No API keys provided. Please configure them in the UI.'}), 400

    try:
        messages = data.get('messages', [])
        temperature = data.get('temperature', 0.6)
        
        client = Groq(api_key=api_key)
        
        completion = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=4096,
            top_p=1,
            stream=False,
            stop=None
        )
        
        response_content = completion.choices[0].message.content
        
        print(f"Used Provider: {provider}")
        
        return jsonify({
            'content': response_content,
            'provider': provider
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
@app.route('/api/tts', methods=['POST'])
async def tts():
    # Needs async handling. Flask usually synchronous.
    # We will use edge_tts.Communicate(...).save(file) then serve bytes
    import edge_tts
    import uuid
    
    data = request.json
    text = data.get('text')
    voice = data.get('voice', 'en-US-ChristopherNeural')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        temp_filename = f"tts_{uuid.uuid4()}.mp3"
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(temp_filename)
        
        # Read and delete
        with open(temp_filename, "rb") as f:
            audio_data = f.read()
        os.remove(temp_filename)
        
        from flask import Response
        return Response(audio_data, mimetype="audio/mpeg")
        
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({'error': str(e)}), 500
        
# Fix for Async in Flask: Flask async support is limited in older versions. 
# We'll use a helper or run synchronous if possible. edge-tts is async.
# We will use 'asyncio.run' if needed or upgrade logic slightly.
# actually Flask[async] extras might be needed. 
# Let's use a synchronous wrapper for simplicity if available, or straight asyncio run.

@app.route('/api/tts_sync', methods=['POST'])
def tts_sync():
    import edge_tts
    import asyncio
    import uuid
    
    data = request.json
    text = data.get('text')
    voice = data.get('voice', 'en-US-ChristopherNeural')
    
    async def _gen():
        communicate = edge_tts.Communicate(text, voice)
        temp_filename = f"tts_{uuid.uuid4()}.mp3"
        await communicate.save(temp_filename)
        return temp_filename

    try:
        filename = asyncio.run(_gen())
        with open(filename, "rb") as f:
            audio_data = f.read()
        os.remove(filename)
        
        from flask import Response
        return Response(audio_data, mimetype="audio/mpeg")
    except Exception as e:
         return jsonify({'error': str(e)}), 500

# from TTS.api import TTS # New import for Coqui TTS - Temporarily commented out due to Python version incompatibility

# @app.route('/api/coqui_tts', methods=['POST'])
# def coqui_tts():
#     # This endpoint will handle Coqui AI TTS requests.
#     # The actual implementation will be added once the Python environment is set up
#     # and the 'TTS' library is successfully installed.

#     data = request.json
#     text = data.get('text')
#     lang = data.get('lang', 'en') # Default to English, can be passed from frontend

#     if not text:
#         return jsonify({'error': 'No text provided'}), 400

#     # Placeholder for Coqui TTS generation logic
#     # Example (will require TTS model loading and audio conversion):
#     # try:
#     #     # Load model (consider global loading for efficiency)
#     #     # tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)
#     #     # audio_wav = tts.tts(text=text, speaker=tts.speakers[0], language=lang)
#     #     # Convert audio_wav (numpy array) to bytes (e.g., using io.BytesIO and soundfile)
#     #     # return Response(audio_bytes, mimetype="audio/wav")
#     #     pass
#     # except Exception as e:
#     #     print(f"Coqui TTS Error: {e}")
#     #     return jsonify({'error': str(e)}), 500

#     return jsonify({'message': 'Coqui TTS endpoint is a placeholder. Implementation pending Python environment setup.'}), 200
# # Removed print statements and app.run for `flask run` compatibility

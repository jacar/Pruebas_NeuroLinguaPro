import os
import random
import json
import time
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def handler(request):
    # Retrieve keys
    groq_key = os.environ.get("GROQ_API_KEY")
    cerebras_key = os.environ.get("CEREBRAS_API_KEY")
    
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

    try:
        # Get request body
        try:
            request_json = request.get_json()
        except:
            body = request.body.read().decode('utf-8')
            request_json = json.loads(body)
            
        messages = request_json.get('messages', [])
        temperature = request_json.get('temperature', 0.6)
        
        client = Groq(api_key=api_key)
        
        # Note: Cerebras is OpenAI compatible, often used with groq-like SDKs or OpenAI SDK
        # The user specifically provided 'from groq import Groq' for both.
        completion = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_completion_tokens=4096,
            top_p=1,
            stream=False, # Changed to False for easier Vercel response handling unless streaming is critical
            stop=None
        )
        
        response_content = completion.choices[0].message.content
        
        return {
            'statusCode': 200,
            'headers': { 'Content-Type': 'application/json' },
            'body': json.dumps({
                'content': response_content,
                'provider': provider
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

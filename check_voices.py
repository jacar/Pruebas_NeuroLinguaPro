import asyncio
import edge_tts

async def main():
    voices = await edge_tts.list_voices()
    with open("english_voices.txt", "w", encoding="utf-8") as f:
        f.write("Available English Voices (Edge TTS):\n")
        f.write("------------------------------------\n")
        for v in voices:
            if v['Locale'].startswith('en-'): # Filter for all English locales
                f.write(f"ShortName: {v['ShortName']}, Gender: {v['Gender']}, Locale: {v['Locale']}\n")

if __name__ == "__main__":
    asyncio.run(main())

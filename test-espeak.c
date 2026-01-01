#include <espeak-ng/speak_lib.h>
#include <stdio.h>
#include <string.h>

/* 
 * NOTE: To compile this on Windows, you need the eSpeak NG development libraries.
 * You might need to adjust include paths and link against libespeak-ng.dll.a or similar.
 * 
 * TROUBLESHOOTING:
 * If you get "espeak-ng/speak_lib.h: No such file or directory", verify your include compiler flags (-I).
 * Alternatively, you can change the include directly to the absolute path:
 * #include "/path/to/speak_lib.h"
 */

espeak_AUDIO_OUTPUT output = AUDIO_OUTPUT_SYNCH_PLAYBACK;
char *path = NULL;
void* user_data = NULL;
unsigned int *identifier = NULL;

int main(int argc, char* argv[]) {
  char voicename[] = "English"; // Set voice by its name
  char text[] = "Hello world!";
  int buflength = 500, options = 0;
  unsigned int position = 0, position_type = 0, end_position = 0, flags = espeakCHARS_AUTO;
  
  // Initialize
  // output: the audio data can be retrieved by a callback check or played locally.
  // AUDIO_OUTPUT_SYNCH_PLAYBACK: play audio synchronously.
  int sample_rate = espeak_Initialize(output, buflength, path, options);
  if (sample_rate < 0) {
      printf("Error initializing eSpeak NG\n");
      return 1;
  }
  printf("Initialized eSpeak NG. Sample rate: %d\n", sample_rate);

  // Set Voice
  if (espeak_SetVoiceByName(voicename) != EE_OK) {
      printf("Error setting voice: %s\n", voicename);
      return 1;
  }

  printf("Saying  '%s'...\n", text);
  
  // Speak
  // espeak_Synth sends the text to the synthesizer. 
  // Because we use SYNCH_PLAYBACK, it might block or we might need to synchronize.
  espeak_ERROR err = espeak_Synth(text, buflength, position, position_type, end_position, flags, identifier, user_data);
  if (err != EE_OK) {
      printf("Error waiting for synth: %d\n", err);
      return 1;
  }
  
  // Synchronize to ensure audio is finished before exiting
  espeak_Synchronize();

  printf("Done\n");
  return 0;
}

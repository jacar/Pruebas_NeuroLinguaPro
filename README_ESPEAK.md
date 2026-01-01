# Instrucciones para usar eSpeak NG (C/C++) en Windows

El código C que has proporcionado requiere la instalación de las bibliotecas de desarrollo de **eSpeak NG**. Como Windows no tiene un gestor de paquetes nativo como `apt` (Linux), necesitas seguir estos pasos para compilarlo:

## 1. Instalar eSpeak NG
1. Descarga el instalador de **eSpeak NG** para Windows: [eSpeak NG Releases](https://github.com/espeak-ng/espeak-ng/releases) (busca el archivo `.msi`).
2. Instálalo y asegúrate de recordar la ruta de instalación (por ejemplo, `C:\Program Files\eSpeak NG`).

## 2. Configurar el Entorno de Compilación (MinGW/GCC)
Necesitas un compilador C como GCC (MinGW).
1. Instala MinGW-w64 si no lo tienes.
2. Añade `bin` de MinGW a tu PATH.

## 3. Compilación
Para compilar `test-espeak.c`, necesitas indicar dónde están los archivos de cabecera (`.h`) y las bibliotecas (`.dll` o `.lib`) de eSpeak NG.

El comando sería similar a este (ajusta las rutas según tu instalación):

```bash
gcc test-espeak.c -o test-espeak.exe \
  -I "C:\Program Files\eSpeak NG\include" \
  -L "C:\Program Files\eSpeak NG\lib" \
  -lespeak-ng
```

*Nota: Es posible que necesites copiar `libespeak-ng.dll` al mismo directorio que `test-espeak.exe` para ejecutarlo.*

## Alternativa en Node.js / Python
Si lo que deseas es integrar eSpeak en tu servidor (`server.js` o `server.py`) sin escribir C, es más fácil usar el ejecutable o una librería wrapper.

### Python
Instala el wrapper o llama al subproceso:
```python
import subprocess
subprocess.run(["espeak-ng", "Hello World"])
```

### Node.js
```javascript
const { exec } = require('child_process');
exec('espeak-ng "Hello World"', (err, stdout, stderr) => {
  if (err) console.error(err);
});
```

## Solución de Problemas Comunes

### Error: `espeak-ng/speak_lib.h: No such file or directory`
Si recibes este error al compilar, significa que GCC no encuentra los archivos de cabecera.

**Solución 1 (Recomendada):**
Asegúrate de pasar la ruta correcta con `-I`.
Ejemplo: `gcc ... -I "C:\Program Files\eSpeak NG\include" ...`

**Solución 2 (Hardcoded):**
Edita el archivo `.c` y cambia:
```c
#include <espeak-ng/speak_lib.h>
```
por la ruta absoluta (ojo con las comillas y barras):
```c
#include "C:/Program Files/eSpeak NG/include/espeak-ng/speak_lib.h"
```


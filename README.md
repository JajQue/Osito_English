# Osito English

App para aprender inglés desde el español, estilo juego, con Osito como mascota. Uso privado: máximo 5 personas invitadas.

## Qué hay aquí

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app: curso, ejercicios, pantallas y conexión con el servidor. No necesita compilarse. |
| `oso.jpg`, `cara.jpg`, `icono-*.png` | Imágenes de Osito y el ícono de la app. |
| `manifest.webmanifest` | Permite fijar la app en la pantalla de inicio del teléfono. |
| `words.js` | Sección Words: repaso espaciado de vocabulario con audio. |
| `words.json` | 4054 palabras del mazo de vocabulario: palabra, traducción, frase de ejemplo, traducción de la frase y grupo. |
| `audio/` | Un audio por palabra; el nombre es la posición de la palabra en `words.json`. |
| `vendor/supabase.js` | Librería de Supabase (versión 2.119.2), incluida para no depender de otro sitio. |
| `supabase/migrations/` | Tablas y reglas de seguridad de la base de datos. |
| `supabase/functions/osito/` | Función del servidor que conversa con Gemini. |

## Cómo funciona

- **Entrada:** con Google. Solo entran los correos de la tabla `permitidos` (tope de 5).
- **Prueba de nivel:** la primera vez, la persona elige entre empezar de cero o hacer la prueba. La prueba hace dos preguntas por unidad (una de gramática y una de armar la frase), se detiene al fallar las dos de una unidad o al sumar tres fallos, y ubica a la persona en la primera unidad donde falló. Las unidades anteriores quedan abiertas para repasar. Se puede repetir desde el inicio con "Level test".
- **Words:** repaso diario de vocabulario. Cada tarjeta suena, muestra la palabra y una frase de ejemplo, y la persona marca Again, Good o Easy; lo que falla vuelve pronto y lo que sabe se espacia cada vez más. Las palabras nuevas por día (5 a 30), el punto de partida (básicas, intermedias o avanzadas) y los paquetes por tema se eligen en "Words settings". El contador del inicio suma curso y mazo sin contar dos veces las palabras que están en ambos (4451 en total).
- **Progreso:** se guarda en el teléfono y en la nube (tabla `progreso`); cada persona ve solo lo suyo.
- **Conversación:** la app llama a la función `osito`, y esta habla con Gemini. La clave de Gemini vive solo en los secretos de Supabase (`GEMINI_API_KEY`), nunca en este repositorio.
- **Voz:** la app graba la voz de la persona y se la envía a Gemini, que escucha el audio real, corrige palabras y pronunciación, y responde con su propia voz. Si la voz de Gemini no está disponible, se usa la del teléfono.
- **Gramática por nivel:** Osito conversa solo con la gramática de las unidades que la persona ya abrió y la hace practicar la de su unidad actual. La lista está en la función `osito` (`GRAMATICA`) y sigue la ruta del curso, de A1 a C1.
- **Límite:** 60 mensajes de conversación por persona al día.

## Contenido del curso

Curso completo de A1 a C1: 29 unidades, 144 lecciones, 1031 palabras y expresiones. La gramática llega hasta C1; el vocabulario propio del curso cubre lo básico, y se amplía con el repaso de vocabulario. Las unidades y niveles se descubren al terminar los anteriores. Todo el contenido (frases, ejercicios, explicaciones) es original.

## Tareas comunes

- **Invitar a alguien:** agregar su correo de Gmail, en minúsculas, en la tabla `permitidos` desde el panel de Supabase.
- **Cambiar el modelo de Gemini:** crear el secreto `GEMINI_MODEL` en Supabase con el nombre del modelo. Si no existe, se usa `gemini-3.8-flash`.
- **Cambiar la voz de Osito:** secretos `GEMINI_TTS_MODEL` (por defecto `gemini-3.8-flash-tts`) y `GEMINI_VOZ` (por defecto `Kore`).
- **Publicar cambios:** la página se sirve con GitHub Pages desde la rama `main`; al subir cambios se actualiza sola.

## Seguridad

No subir nunca claves secretas a este repositorio. La clave pública de Supabase que aparece en `index.html` es pública por diseño: los datos los protegen las reglas del servidor.

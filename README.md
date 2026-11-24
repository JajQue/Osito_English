# Osito English

App para aprender inglés desde el español, estilo juego, con Osito como mascota. Uso privado: máximo 5 personas invitadas.

## Qué hay aquí

| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app: curso, ejercicios, pantallas y conexión con el servidor. No necesita compilarse. |
| `oso.jpg`, `cara.jpg`, `icono-*.png` | Imágenes de Osito y el ícono de la app. |
| `manifest.webmanifest` | Permite fijar la app en la pantalla de inicio del teléfono. |
| `vendor/supabase.js` | Librería de Supabase (versión 2.119.2), incluida para no depender de otro sitio. |
| `supabase/migrations/` | Tablas y reglas de seguridad de la base de datos. |
| `supabase/functions/osito/` | Función del servidor que conversa con Gemini. |

## Cómo funciona

- **Entrada:** con Google. Solo entran los correos de la tabla `permitidos` (tope de 5).
- **Progreso:** se guarda en el teléfono y en la nube (tabla `progreso`); cada persona ve solo lo suyo.
- **Conversación:** la app llama a la función `osito`, y esta habla con Gemini. La clave de Gemini vive solo en los secretos de Supabase (`GEMINI_API_KEY`), nunca en este repositorio.
- **Límite:** 60 mensajes de conversación por persona al día.

## Contenido del curso

Niveles A1 y A2 completos: 13 unidades, 64 lecciones, 455 palabras. Las unidades y niveles se descubren al terminar los anteriores. Todo el contenido (frases, ejercicios, explicaciones) es original.

## Tareas comunes

- **Invitar a alguien:** agregar su correo de Gmail, en minúsculas, en la tabla `permitidos` desde el panel de Supabase.
- **Cambiar el modelo de Gemini:** crear el secreto `GEMINI_MODEL` en Supabase con el nombre del modelo. Si no existe, se usa `gemini-3.8-flash`.
- **Publicar cambios:** la página se sirve con GitHub Pages desde la rama `main`; al subir cambios se actualiza sola.

## Seguridad

No subir nunca claves secretas a este repositorio. La clave pública de Supabase que aparece en `index.html` es pública por diseño: los datos los protegen las reglas del servidor.

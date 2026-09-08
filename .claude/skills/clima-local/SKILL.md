---
name: clima-local
description: Obtiene el clima actual (por defecto de Santiago, Chile, o de una ciudad específica si se indica) usando el servicio gratuito wttr.in vía curl, sin necesidad de API key. Úsala cuando el usuario pregunte por el clima, temperatura, pronóstico o condiciones meteorológicas.
---

# Clima local

Esta skill consulta el clima usando [wttr.in](https://wttr.in), un servicio público que no requiere API key y funciona con una simple petición HTTP.

## Cómo usarla

1. Si el usuario menciona una ciudad o ubicación específica, úsala en la consulta. Si no menciona ninguna, usa **Santiago, Chile** por defecto (no autodetectar por IP).

2. Ejecuta uno de estos comandos con Bash (o PowerShell si Bash no está disponible):

   Clima actual, resumen corto (una línea), por defecto Santiago:
   ```bash
   curl -s "wttr.in/Santiago?format=3"
   ```

   Clima actual, resumen corto, para una ciudad específica (reemplaza `Santiago` por la ciudad pedida, usando `+` para espacios):
   ```bash
   curl -s "wttr.in/Santiago?format=3"
   ```

   Reporte más completo (varias líneas, incluye pronóstico de hoy/mañana), en español:
   ```bash
   curl -s "wttr.in/Santiago?lang=es&format=v2"
   ```
   Si `format=v2` no está disponible, usa el reporte por defecto sin `format`:
   ```bash
   curl -s "wttr.in/Santiago?lang=es"
   ```

   Salida en JSON (útil si necesitas datos estructurados: temperatura exacta, humedad, viento, etc.):
   ```bash
   curl -s "wttr.in/Santiago?format=j1"
   ```

3. Si `curl` no está disponible o falla (por ejemplo, sin conexión a internet o el servicio está caído), informa al usuario claramente que no se pudo obtener el clima y por qué, en lugar de inventar datos.

4. Presenta la respuesta al usuario de forma clara y concisa en español: ciudad, condición, temperatura (y sensación térmica si está disponible).

## Notas

- No requiere autenticación ni API key.
- Para nombres de ciudad con espacios, reemplázalos por `+` (ej: `Nueva+York`) o usa `%20`.
- Se puede pedir el pronóstico limitando a los días necesarios: agregar `1` al final de la URL limita el reporte a hoy (`wttr.in/Santiago1`), o `2` para hoy y mañana.
- Esta skill solo obtiene y muestra datos; no los usa para ninguna otra automatización a menos que el usuario lo pida explícitamente.

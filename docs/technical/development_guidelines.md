# Lineamientos de Desarrollo y Buenas Prácticas - PharmaVox 🛠️🛡️

Este documento establece las **reglas estrictas y estándares de desarrollo** del backend de PharmaVox. Su objetivo es mantener la consistencia del código, evitar silos de conocimiento entre **Sergio** y **Alejandro**, y prevenir malas prácticas técnicas de configuración o arquitectura que degraden el rendimiento o la seguridad del sistema.

---

## 🛑 Lo que NO debes hacer en el Desarrollo (Anti-patrones Prohibidos)

Para garantizar un código limpio, seguro y escalable, está terminantemente prohibido incurrir en las siguientes prácticas durante la implementación de las tareas del proyecto:

### 1. 🚫 Duplicar o Hardcodear Valores de Configuración en el Código
> [!CAUTION]
> **NUNCA** debes asignar valores predeterminados (defaults), strings de conexión o credenciales fijas directamente dentro de las clases de Python (`config.py`), módulos de base de datos o controladores.
* **El Problema:** Genera fugas de seguridad, contradicciones en tiempo de ejecución y rompe el principio de *Único Origen de Verdad*.
* **La Regla:** Todas las configuraciones (API keys, puertos, urls de base de datos, nombres de proyecto, etc.) deben ser rescatadas dinámicamente desde el archivo `.env`. El archivo `app/core/config.py` debe limitarse a tipar y estructurar estas propiedades a través de Pydantic Settings, forzando la carga de variables al inicio mediante `load_dotenv()`.

### 2. 🚫 Configurar la Base de Datos con referencias rígidas a SQLite
> [!WARNING]
> La base de datos oficial y de producción de PharmaVox es **PostgreSQL**. No debes forzar o asumir que el sistema funciona únicamente sobre SQLite.
* **El Problema:** La mezcla descontrolada de configuraciones o la instanciación fija de SQLite en el código causa errores de tipo en las consultas complejas y rompe el entorno de producción en Docker.
* **La Regla:** SQLite solo se admite de forma dinámica como un fallback ágil para agilizar el desarrollo local si la variable `DATABASE_URL` en el `.env` así lo define. Cualquier lógica de base de datos debe ser neutral al motor y ser gestionada dinámicamente mediante SQLAlchemy en `app/db/session.py`.

### 3. 🚫 Crear Archivos y Módulos de la API sin Documentarlos ni Asociarlos a Tareas
> [!IMPORTANT]
> No crees archivos, rutas, modelos o servicios "huérfanos" en el código sin explicarle a tu compañero de equipo a qué tarea corresponden y qué hacen.
* **El Problema:** Alejandro o Sergio pueden desconocer la existencia de nuevas funciones, provocando duplicación de código y dificultando la integración de la IA con la persistencia.
* **La Regla:** Cada vez que crees o modifiques archivos, debes documentar detalladamente estos cambios bajo la sección correspondiente de **`team_tasks.md`** con la anotación `📝 Comentarios del Desarrollo`. Indica la carpeta, el nombre del archivo y una explicación concisa y legible de su funcionalidad.

### 4. 🚫 Bloquear el Event Loop con Operaciones Síncronas Lentas
> [!WARNING]
> No ejecutes operaciones pesadas de lectura de disco (I/O) o peticiones HTTP síncronas directas (por ejemplo usando la librería `requests` clásica) dentro de las rutas `async def` de FastAPI.
* **El Problema:** Bloquear el event loop principal degrada la concurrencia del servidor a un solo cliente a la vez, arruinando la latencia del agente conversacional de voz.
* **La Regla:**
  * Si utilizas funciones asíncronas (`async def`), usa exclusivamente clientes y librerías que soporten `await` nativo (como `httpx` para peticiones o las funciones asíncronas del SDK de Gemini).
  * Si es obligatorio utilizar una librería síncrona pesada, ejecútala en un hilo separado o define la ruta como un método síncrono estándar (`def` en lugar de `async def`) para que FastAPI lo delegue automáticamente a su pool de hilos internos.

### 5. 🚫 Ignorar los Modelos ORM Registrados en el Punto Único de Entrada
> [!IMPORTANT]
> Nunca importes modelos ORM de forma dispersa o fragmentada para la generación automática de base de datos.
* **El Problema:** Si un modelo SQLAlchemy nuevo no es importado en el inicializador maestro, la base de datos no creará la tabla al iniciar la aplicación, arrojando excepciones difíciles de rastrear al hacer consultas.
* **La Regla:** Todo modelo nuevo de base de datos debe registrarse explícitamente en el archivo de inicialización unificado **[app/models/\_\_init\_\_.py](file:///d:/Proyectos/Personales/Hackaton/Build-With_AI/PharmaVox/app/models/__init__.py)**.

---

## 🟢 Buenas Prácticas y Patrones Recomendados (Qué SÍ hacer)

Para lograr un desarrollo armonioso y un producto premium:

| Práctica | ¿Cómo implementarla? | ¿Qué beneficio tiene? |
| :--- | :--- | :--- |
| **Variables del Entorno** | Usa `load_dotenv()` antes de inicializar la clase de configuración `Settings` en `app/core/config.py`. | Evita errores de variables nulas al ejecutar la app desde directorios anidados. |
| **Definición de Rutas** | Agrega y registra siempre las nuevas rutas bajo el enrutador maestro `api_router` en `app/api/api.py`. | Mantiene la API limpia, jerarquizada y autogenera la documentación de Swagger correctamente. |
| **Soporte Multimodal** | En la Tarea A-1, envía los archivos PDF directamente como bytes a Gemini usando el mime-type `application/pdf`. | Evita instalar motores de OCR pesados o transcribir a texto plano manualmente. |
| **Voz sin Ruido** | Limpia las respuestas de voz (`voice_response`) de caracteres especiales, emojis y markdown. | Garantiza que las voces sintetizadas (TTS) suenen naturales y fluidas para el usuario final. |

---

## 🛠️ Procedimiento de Control de Cambios del Equipo

Cuando realices un cambio en el backend, sigue este checklist:

1. `[ ]` **Sincronización:** Asegúrate de que las variables de entorno necesarias estén reflejadas tanto en `.env` como en `.env.example`.
2. `[ ]` **Compilación Local:** Ejecuta el comando de verificación rápida antes de subir código para asegurar que no hay errores de sintaxis o importaciones:
   ```bash
   python -c "import app.main; print('Compilación Exitosa')"
   ```
3. `[ ]` **Actualización en Tareas:** Escribe tu sección de `📝 Comentarios del Desarrollo` en [docs/planning/team_tasks.md](file:///d:/Proyectos/Personales/Hackaton/Build-With_AI/PharmaVox/docs/planning/team_tasks.md) describiendo qué archivos modificaste/creaste y dónde se ubican.

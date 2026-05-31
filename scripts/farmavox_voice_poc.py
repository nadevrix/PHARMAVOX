"""
FarmaVox Voice PoC — Prueba de Concepto de Voz
================================================
⚠️  ESTO ES UNA PRUEBA DE CONCEPTO (PoC), NO PARTE DEL SERVIDOR.

Desarrollado por Alejandro como demo standalone para validar que
el flujo completo STT → Gemini → TTS funciona correctamente antes
de integrarlo al backend FastAPI.

NO se inicia con el servidor (uvicorn). Para ejecutarlo:
    python scripts/farmavox_voice_poc.py

Para el futuro:
    La voz en producción debería manejarse como un endpoint
    POST /api/v1/stt en el backend (ver team_tasks.md, Tarea A-3)
    que reciba el audio como UploadFile y retorne la transcripción.
    El TTS lo hace el frontend directamente (Web Speech API o similar).

Reutiliza los servicios del codebase principal:
    app/services/gemini_service  →  chat con Gemini
    app/services/pdf_service     →  análisis de PDFs

Audio de prueba:
    data/tests_audio/input.wav  —  grabación de muestra de Alejandro

Carpetas de trabajo:
    data/pdfs_pendientes/     — coloca aquí los PDFs a analizar
    data/resultados_analisis/ — los JSONs extraídos se guardan aquí

Dependencias adicionales (no incluidas en requirements.txt del backend):
    pip install SpeechRecognition pyaudio edge-tts pygame

Voces disponibles (edge-tts --list-voices | grep es-):
    es-MX-DaliaNeural    — mujer, Mexico (recomendada)
    es-ES-ElviraNeural   — mujer, España
    es-MX-JorgeNeural    — hombre, Mexico
    es-ES-AlvaroNeural   — hombre, España
"""

import os
import json
import time
import asyncio
import tempfile
from pathlib import Path
from datetime import datetime

import speech_recognition as sr
import edge_tts
import pygame

# Importa los servicios del codebase principal en lugar de duplicar la lógica
# Asegúrate de ejecutar desde la raíz del proyecto para que el path funcione
from app.services import gemini_service, pdf_service

# ── CONFIGURACIÓN ──────────────────────────────────────────────────────────────

# Carpetas de trabajo relativas a la raíz del proyecto
CARPETA_PDFS    = Path("data/pdfs_pendientes")
CARPETA_RESULTS = Path("data/resultados_analisis")

# Voz neural TTS — cambia según preferencia
VOZ_NEURAL    = "es-MX-DaliaNeural"
VOZ_VELOCIDAD = "+5%"     # rango: -50% (lento) a +50% (rápido)
VOZ_TONO      = "+0Hz"    # rango: -50Hz (grave) a +50Hz (agudo)

# Idioma para reconocimiento de voz (STT)
IDIOMA_STT    = "es-ES"

# Segundos de silencio antes de procesar la frase
SILENCIO      = 1.5

# Palabra que activa el análisis de PDF
PALABRA_ANALIZA = "analiza"

# ── ESTADO DE SESIÓN (en memoria, solo para CLI) ───────────────────────────────

class SesionCLI:
    """
    Mantiene el estado de la sesión del asistente CLI.

    En el script CLI el estado vive en RAM durante toda la ejecución.
    En la API REST, este estado lo gestiona el cliente enviando
    conversation_history en cada request (ver app/schemas/assistant.py).
    """
    def __init__(self):
        self.historial: list[dict] = []          # Historial serializado para gemini_service
        self.medicamentos: list[str] = []         # Nombres de medicamentos mencionados
        self.pdfs_analizados: list[dict] = []     # Resultados JSON de cada PDF
        self.inicio = datetime.now()

    def resumen(self) -> str:
        duracion = int((datetime.now() - self.inicio).total_seconds() / 60)
        turnos   = len([m for m in self.historial if m["role"] == "user"])
        meds     = ", ".join(self.medicamentos) if self.medicamentos else "ninguno"
        return (
            f"Sesión de {duracion} min | "
            f"{turnos} preguntas | "
            f"{len(self.pdfs_analizados)} PDFs | "
            f"Medicamentos: {meds}"
        )


# ── UTILIDADES ─────────────────────────────────────────────────────────────────

def _ts() -> str:
    """Timestamp formateado para los logs del CLI."""
    return datetime.now().strftime("%H:%M:%S")


def inicializar() -> tuple[SesionCLI, sr.Recognizer]:
    """Crea las carpetas de trabajo, inicializa pygame y el reconocedor de voz."""
    CARPETA_PDFS.mkdir(parents=True, exist_ok=True)
    CARPETA_RESULTS.mkdir(parents=True, exist_ok=True)
    pygame.mixer.init()

    recognizer = sr.Recognizer()
    recognizer.pause_threshold          = SILENCIO
    recognizer.energy_threshold         = 300
    recognizer.dynamic_energy_threshold = True

    return SesionCLI(), recognizer


# ── TTS (solo CLI — en la API web el frontend maneja el audio) ─────────────────

def reproducir_audio(texto: str):
    """
    Convierte texto a audio con Edge TTS (voz neural de Microsoft) y lo reproduce.

    Esta función es exclusiva del CLI. En la API REST el campo `voice_response`
    del AskResponse es retornado al frontend, que se encarga del TTS.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            ruta_mp3 = tmp.name

        async def _generar():
            communicate = edge_tts.Communicate(
                text=texto,
                voice=VOZ_NEURAL,
                rate=VOZ_VELOCIDAD,
                pitch=VOZ_TONO
            )
            await communicate.save(ruta_mp3)

        asyncio.run(_generar())

        pygame.mixer.music.load(ruta_mp3)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.unload()
        os.remove(ruta_mp3)

    except Exception as e:
        print(f"  [ERROR TTS] {e}")


# ── STT (solo CLI — en la API web el frontend envía el texto transcrito) ───────

def escuchar(recognizer: sr.Recognizer) -> str | None:
    """
    Captura audio del micrófono y lo transcribe con Google STT.

    Esta función es exclusiva del CLI. En la API REST el campo `question`
    del AskRequest ya llega como texto (el frontend hizo el STT).
    """
    print(f"  [{_ts()}] Escuchando...                    ", end="\r")
    mic = sr.Microphone()

    try:
        mic.__enter__()
    except Exception as e:
        print(f"\n  [ERROR Micrófono] No se pudo abrir: {e}")
        time.sleep(1)
        return None

    try:
        recognizer.adjust_for_ambient_noise(mic, duration=0.4)
        audio = recognizer.listen(mic, timeout=10, phrase_time_limit=30)
        print(f"  [{_ts()}] Procesando...                    ", end="\r")
        return recognizer.recognize_google(audio, language=IDIOMA_STT).strip()
    except sr.WaitTimeoutError:
        return None
    except sr.UnknownValueError:
        print(f"  [{_ts()}] No se entendió, intenta de nuevo.")
        return None
    except sr.RequestError as e:
        print(f"\n  [ERROR STT] {e}")
        return None
    except Exception as e:
        print(f"\n  [ERROR] {e}")
        return None
    finally:
        try:
            mic.__exit__(None, None, None)
        except Exception:
            pass


# ── MÓDULO CHAT (usa gemini_service del codebase) ─────────────────────────────

def responder_pregunta(sesion: SesionCLI, pregunta: str) -> str:
    """
    Envía la pregunta a Gemini usando gemini_service y actualiza el historial de sesión.

    Usa gemini_service.ask_assistant() del codebase principal en lugar de
    duplicar la lógica de Alejandro. El historial de sesión se mantiene en
    el objeto SesionCLI durante toda la ejecución del CLI.
    """
    try:
        respuesta, historial_actualizado = gemini_service.ask_assistant(
            question=pregunta,
            conversation_history=sesion.historial,
        )
        sesion.historial = historial_actualizado

        # Extrae medicamentos mencionados para el resumen de sesión
        palabras_clave = [
            "ibuprofeno", "amoxicilina", "paracetamol", "aspirina",
            "metformina", "atorvastatina", "omeprazol", "losartan"
        ]
        for palabra in palabras_clave:
            if palabra in pregunta.lower() and palabra not in sesion.medicamentos:
                sesion.medicamentos.append(palabra)

        return respuesta

    except Exception as e:
        print(f"\n  [ERROR Gemini] {e}")
        return "Hubo un problema al consultar la inteligencia artificial. Por favor intenta de nuevo."


# ── MÓDULO ANÁLISIS DE PDF (usa pdf_service del codebase) ────────────────────

def obtener_pdf_reciente() -> Path | None:
    """Retorna el PDF más reciente de la carpeta de trabajo."""
    pdfs = list(CARPETA_PDFS.glob("*.pdf"))
    return max(pdfs, key=lambda p: p.stat().st_mtime) if pdfs else None


def procesar_analisis(sesion: SesionCLI):
    """
    Orquesta el flujo completo de análisis de PDF:
    1. Busca el PDF más reciente en data/pdfs_pendientes/
    2. Lo envía a pdf_service.analyze_pdf() (lógica de Alejandro, en el codebase)
    3. Inyecta el resultado en el historial para que el chat lo recuerde
    4. Guarda el JSON en data/resultados_analisis/
    5. Lee el resumen en voz alta
    """
    pdf = obtener_pdf_reciente()
    if not pdf:
        msg = "No encontré ningún PDF en la carpeta. Por favor coloca el archivo e intenta de nuevo."
        print(f"  [{_ts()}] {msg}")
        reproducir_audio(msg)
        return

    print(f"  [{_ts()}] PDF detectado: {pdf.name}")
    reproducir_audio(f"Analizando el archivo {pdf.stem}, un momento por favor.")

    try:
        # Usa pdf_service del codebase en lugar de duplicar la lógica
        resultado = pdf_service.analyze_pdf(pdf_bytes=pdf_bytes, filename=pdf.name)

        # Guarda el JSON
        ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
        ruta_json = CARPETA_RESULTS / f"{pdf.stem}_{ts}.json"
        with open(ruta_json, "w", encoding="utf-8") as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)

        # Inyecta el contexto del PDF en el historial del chat
        history_gemini = gemini_service.build_history(sesion.historial)
        history_gemini = gemini_service.inject_pdf_context(history_gemini, resultado)
        # Re-serializa el historial actualizado
        sesion.historial = [
            {"role": msg.role, "text": msg.parts[0].text}
            for msg in history_gemini
        ]

        # Registra el medicamento
        nombre = (
            resultado.get("nombre_comercial")
            or resultado.get("principio_activo")
            or "desconocido"
        )
        if nombre not in sesion.medicamentos:
            sesion.medicamentos.append(nombre)
        sesion.pdfs_analizados.append(resultado)

        # Imprime el resultado
        _imprimir_resultado(resultado)
        print(f"\n  [{_ts()}] Guardado en: {ruta_json}")

        # Lee el resumen en voz alta
        resumen = resultado.get("resumen_audio") or "Análisis completado y registrado en memoria."
        reproducir_audio(resumen)

    except json.JSONDecodeError:
        msg = "No pude interpretar la respuesta del modelo. Intenta con otro PDF."
        print(f"  [ERROR JSON] {msg}")
        reproducir_audio(msg)
    except Exception as e:
        msg = "Ocurrió un error al analizar el documento."
        print(f"  [ERROR] {e}")
        reproducir_audio(msg)


def _imprimir_resultado(resultado: dict):
    """Imprime el resultado del análisis PDF de forma tabular en la consola."""
    print("\n" + "=" * 58)
    print("   RESULTADO DEL ANÁLISIS PDF")
    print("=" * 58)
    for label, key in [
        ("Tipo",             "tipo_documento"),
        ("Nombre comercial", "nombre_comercial"),
        ("Principio activo", "principio_activo"),
        ("Laboratorio",      "laboratorio"),
        ("Concentración",    "concentracion"),
        ("Forma",            "forma_farmaceutica"),
        ("Vía",              "via_administracion"),
        ("Dosis",            "dosis_recomendada"),
        ("Vencimiento",      "fecha_vencimiento"),
        ("Req. receta",      "requiere_receta"),
    ]:
        val = resultado.get(key)
        if val is not None:
            print(f"  {label:<18}: {val}")
    for label, key in [
        ("Indicaciones",       "indicaciones"),
        ("Contraindicaciones", "contraindicaciones"),
        ("Interacciones",      "interacciones"),
    ]:
        items = resultado.get(key, [])
        if items:
            print(f"\n  {label}:")
            for item in items:
                print(f"    - {item}")
    print("=" * 58)


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 58)
    print("   FARMAVOX CLI - Asistente Farmacéutico con Memoria")
    print("=" * 58)
    print(f"  Modelo        : gemini-2.5-flash")
    print(f"  Idioma STT    : {IDIOMA_STT}")
    print(f"  PDFs          : {CARPETA_PDFS}")
    print(f"  Resultados    : {CARPETA_RESULTS}")
    print(f"  Palabra clave : '{PALABRA_ANALIZA}' para analizar PDF")
    print("=" * 58)
    print("  Habla libremente — recuerdo todo lo de la sesión.")
    print(f"  Di '{PALABRA_ANALIZA}' para procesar el PDF más reciente.")
    print("  Ctrl+C para salir.\n")

    sesion, recognizer = inicializar()

    print("  [Listo — habla cuando quieras]\n")
    print("-" * 58)

    while True:
        try:
            texto = escuchar(recognizer)
            if not texto:
                continue

            print(f"\n  [{_ts()}] BIOQ : {texto}")

            if PALABRA_ANALIZA in texto.lower():
                procesar_analisis(sesion)
            else:
                print(f"  [{_ts()}] Consultando...", end="\r")
                respuesta = responder_pregunta(sesion, texto)
                print(f"  [{_ts()}] ASIST: {respuesta}\n")
                reproducir_audio(respuesta)

            print(f"  Memoria: {sesion.resumen()}")
            print("-" * 58)

        except KeyboardInterrupt:
            print("\n\n" + "=" * 58)
            print("   SESIÓN FINALIZADA")
            print(f"   {sesion.resumen()}")
            print("=" * 58)

            # Guarda el log completo de la sesión
            archivo = f"data/sesion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            Path("data").mkdir(exist_ok=True)
            with open(archivo, "w", encoding="utf-8") as f:
                f.write(f"FarmaVox CLI — Sesión {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(sesion.resumen() + "\n")
                f.write("=" * 50 + "\n\n")
                for msg in sesion.historial:
                    if msg["text"].startswith("[SISTEMA"):
                        continue
                    rol = "BIOQUÍMICO" if msg["role"] == "user" else "FARMAVOX"
                    f.write(f"[{rol}]\n{msg['text']}\n\n")
            print(f"  Sesión guardada en: {archivo}\n")
            break


if __name__ == "__main__":
    main()

"""
Pharma Voice Assistant — Con Memoria de Sesion
Combina asistente de voz + analisis multimodal de PDFs con memoria compartida.

El asistente recuerda:
  - Medicamentos sobre los que se pregunto
  - PDFs que se analizaron y su contenido
  - El hilo de la conversacion completa

Instalar:
Instalar:
    pip install SpeechRecognition pyaudio google-genai edge-tts pygame

Voces disponibles (edge-tts --list-voices | grep es-):
  es-MX-DaliaNeural    — mujer, Mexico, muy natural   (recomendada)
  es-ES-ElviraNeural   — mujer, Espana, clara
  es-MX-JorgeNeural    — hombre, Mexico
  es-ES-AlvaroNeural   — hombre, Espana
"""

import os
import json
import time
import asyncio
import tempfile
from pathlib import Path
from datetime import datetime

import speech_recognition as sr
from google import genai
from google.genai import types
import edge_tts
import pygame

# ── CONFIGURACION ─────────────────────────────────────────────────────────────
#import os
from dotenv import load_dotenv
load_dotenv() # Carga el archivo .env oculto
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CARPETA_PDFS    = "./pdfs_pendientes"
CARPETA_RESULTS = "./resultados_analisis"
# Voz neural - cambia segun preferencia:
# es-MX-DaliaNeural | es-ES-ElviraNeural | es-MX-JorgeNeural | es-ES-AlvaroNeural
VOZ_NEURAL      = "es-MX-DaliaNeural"
VOZ_VELOCIDAD   = "+5%"    # rango: -50% (lento) a +50% (rapido)
VOZ_TONO        = "+0Hz"   # rango: -50Hz (grave) a +50Hz (agudo)
IDIOMA_STT      = "es-ES"
SILENCIO        = 1.5
PALABRA_ANALIZA = "analiza"
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
Eres FarmaVox, un asistente de voz farmaceutico con memoria de sesion.
Apoyas a bioquimicos y farmaceuticos en su trabajo diario.

Capacidades:
- Respondes preguntas de farmacologia, bioquimica clinica, interacciones,
  dosis, farmacocinetica, farmacodinamica y laboratorio farmaceutico.
- Recuerdas todo lo hablado en la sesion: medicamentos preguntados,
  PDFs analizados, y el contexto acumulado.
- Puedes relacionar informacion: si analizaste una caja y luego te preguntan
  por interacciones, usas lo que ya sabes del medicamento analizado.

Personalidad:
- Habla como un colega farmaceutico experimentado, no como un manual.
- Usa frases naturales como "como vimos antes", "el medicamento que analizamos",
  "recordando lo que me preguntaste", cuando sea relevante.
- Tono profesional pero cercano, directo y seguro.

Normas de respuesta:
- Maximo 4 oraciones (es audio, debe ser conciso).
- Solo texto plano, sin asteriscos, guiones, markdown ni simbolos.
- Si algo requiere supervision medica o farmaceutica, mencionalo.
- Si la pregunta no es de tu area, indicalo brevemente y ofrece ayuda farmaceutica.
"""

PROMPT_ANALISIS_PDF = """
Analiza el contenido de este PDF. Puede ser una caja de medicamento,
receta medica o prospecto farmaceutico.

Devuelve UNICAMENTE un JSON valido con esta estructura exacta,
sin texto adicional, sin markdown, sin bloques de codigo:

{
  "tipo_documento": "caja_medicamento | receta | prospecto | desconocido",
  "nombre_comercial": "nombre del medicamento o null",
  "principio_activo": "sustancia activa o null",
  "laboratorio": "laboratorio fabricante o null",
  "concentracion": "dosis por unidad (ej: 500mg) o null",
  "forma_farmaceutica": "comprimido, jarabe, inyectable, etc. o null",
  "via_administracion": "oral, intravenosa, topica, etc. o null",
  "indicaciones": ["lista de indicaciones terapeuticas"],
  "contraindicaciones": ["lista de contraindicaciones"],
  "interacciones": ["medicamentos con los que interactua"],
  "efectos_adversos": ["efectos secundarios principales"],
  "dosis_recomendada": "descripcion de la posologia o null",
  "condiciones_almacenamiento": "temperatura y condiciones o null",
  "numero_lote": "numero de lote si visible o null",
  "fecha_vencimiento": "fecha de vencimiento si visible o null",
  "requiere_receta": true,
  "resumen_audio": "resumen de 3 oraciones para leer en voz alta, en espanol, sin simbolos"
}

Si no puedes leer algun campo usa null. Si es lista vacia usa [].
"""


# ── MEMORIA DE SESION ─────────────────────────────────────────────────────────

class MemoriaSesion:
    """
    Mantiene todo el contexto de la sesion en un solo lugar.
    El historial_chat se pasa directamente a Gemini en cada llamada,
    por lo que el modelo siempre ve la conversacion completa incluyendo
    los resumenes de PDFs que se inyectaron como mensajes del sistema.
    """

    def __init__(self):
        self.historial_chat   = []   # Mensajes para Gemini (user/model)
        self.medicamentos     = []   # Nombres de medicamentos mencionados
        self.pdfs_analizados  = []   # Resultados JSON de cada PDF analizado
        self.inicio           = datetime.now()

    def agregar_pregunta(self, texto: str):
        self.historial_chat.append(
            types.Content(role="user", parts=[types.Part(text=texto)])
        )

    def agregar_respuesta(self, texto: str):
        self.historial_chat.append(
            types.Content(role="model", parts=[types.Part(text=texto)])
        )

    def registrar_pdf(self, resultado: dict):
        """
        Cuando se analiza un PDF, inyecta un mensaje en el historial
        para que Gemini sepa que ese medicamento fue analizado.
        """
        self.pdfs_analizados.append(resultado)

        nombre = resultado.get("nombre_comercial") or resultado.get("principio_activo") or "desconocido"
        if nombre and nombre not in self.medicamentos:
            self.medicamentos.append(nombre)

        # Construye un resumen textual del PDF para inyectar al historial
        resumen_contexto = self._construir_contexto_pdf(resultado)

        # Se inyecta como un turno del "usuario" describiendo el PDF analizado
        # y una respuesta del modelo confirmando que lo proceso
        self.historial_chat.append(
            types.Content(
                role="user",
                parts=[types.Part(text=f"[SISTEMA: Se acaba de analizar un PDF con la siguiente informacion]\n{resumen_contexto}")]
            )
        )
        self.historial_chat.append(
            types.Content(
                role="model",
                parts=[types.Part(text=f"Entendido. He registrado la informacion del medicamento {nombre} en mi memoria de sesion y puedo responder preguntas sobre el.")]
            )
        )

    def _construir_contexto_pdf(self, r: dict) -> str:
        """Convierte el JSON del PDF en texto legible para el historial."""
        lineas = []
        if r.get("nombre_comercial"):  lineas.append(f"Nombre comercial: {r['nombre_comercial']}")
        if r.get("principio_activo"):  lineas.append(f"Principio activo: {r['principio_activo']}")
        if r.get("laboratorio"):       lineas.append(f"Laboratorio: {r['laboratorio']}")
        if r.get("concentracion"):     lineas.append(f"Concentracion: {r['concentracion']}")
        if r.get("forma_farmaceutica"):lineas.append(f"Forma: {r['forma_farmaceutica']}")
        if r.get("via_administracion"):lineas.append(f"Via: {r['via_administracion']}")
        if r.get("dosis_recomendada"): lineas.append(f"Dosis: {r['dosis_recomendada']}")
        if r.get("fecha_vencimiento"): lineas.append(f"Vencimiento: {r['fecha_vencimiento']}")
        if r.get("requiere_receta") is not None:
            lineas.append(f"Requiere receta: {'si' if r['requiere_receta'] else 'no'}")
        if r.get("indicaciones"):
            lineas.append(f"Indicaciones: {', '.join(r['indicaciones'])}")
        if r.get("contraindicaciones"):
            lineas.append(f"Contraindicaciones: {', '.join(r['contraindicaciones'])}")
        if r.get("interacciones"):
            lineas.append(f"Interacciones: {', '.join(r['interacciones'])}")
        if r.get("efectos_adversos"):
            lineas.append(f"Efectos adversos: {', '.join(r['efectos_adversos'])}")
        return "\n".join(lineas)

    def resumen_sesion(self) -> str:
        duracion = int((datetime.now() - self.inicio).total_seconds() / 60)
        turnos   = len([m for m in self.historial_chat if m.role == "user" and not str(m.parts[0].text).startswith("[SISTEMA")])
        meds     = ", ".join(self.medicamentos) if self.medicamentos else "ninguno"
        pdfs     = len(self.pdfs_analizados)
        return f"Sesion de {duracion} min | {turnos} preguntas | {pdfs} PDFs analizados | Medicamentos: {meds}"


# ── UTILIDADES ────────────────────────────────────────────────────────────────

def _ts():
    return datetime.now().strftime("%H:%M:%S")


def inicializar():
    Path(CARPETA_PDFS).mkdir(exist_ok=True)
    Path(CARPETA_RESULTS).mkdir(exist_ok=True)
    pygame.mixer.init()
    client  = genai.Client(api_key=GEMINI_API_KEY)
    memoria = MemoriaSesion()
    return client, memoria


def reproducir_audio(texto: str):
    """
    Convierte texto a audio usando Edge TTS (voz neural de Microsoft).
    Mucho mas natural que gTTS. Requiere internet.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            ruta_mp3 = tmp.name

        # Edge TTS es asincrono, lo ejecutamos con asyncio
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


def escuchar(recognizer) -> str | None:
    print(f"  [{_ts()}] Escuchando...                    ", end="\r")

    mic = sr.Microphone()

    try:
        mic.__enter__()
    except Exception as e:
        print(f"\n  [ERROR Microfono] No se pudo abrir: {e}")
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
        print(f"  [{_ts()}] No se entendio, intenta de nuevo.")
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


# ── MODULO CHAT ───────────────────────────────────────────────────────────────

def responder_pregunta(client, memoria: MemoriaSesion, pregunta: str) -> str:
    try:
        memoria.agregar_pregunta(pregunta)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=memoria.historial_chat,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=350,
            )
        )
        respuesta = response.text.strip()
        memoria.agregar_respuesta(respuesta)

        # Extrae nombres de medicamentos mencionados de forma simple
        palabras_clave = ["ibuprofeno", "amoxicilina", "paracetamol", "aspirina",
                          "metformina", "atorvastatina", "omeprazol", "losartan"]
        for palabra in palabras_clave:
            if palabra in pregunta.lower() and palabra not in memoria.medicamentos:
                memoria.medicamentos.append(palabra)

        return respuesta
    except Exception as e:
        print(f"\n  [ERROR Gemini] {e}")
        return "Hubo un problema al consultar la inteligencia artificial. Por favor intenta de nuevo."


# ── MODULO MULTIMODAL PDF ─────────────────────────────────────────────────────

def obtener_pdf_reciente() -> Path | None:
    pdfs = list(Path(CARPETA_PDFS).glob("*.pdf"))
    return max(pdfs, key=lambda p: p.stat().st_mtime) if pdfs else None


def analizar_pdf(client, ruta_pdf: Path) -> dict:
    print(f"  [{_ts()}] Leyendo: {ruta_pdf.name}")
    with open(ruta_pdf, "rb") as f:
        pdf_bytes = f.read()
    print(f"  [{_ts()}] Enviando a Gemini ({len(pdf_bytes) // 1024} KB)...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part(inline_data=types.Blob(mime_type="application/pdf", data=pdf_bytes)),
                    types.Part(text=PROMPT_ANALISIS_PDF)
                ]
            )
        ],
        config=types.GenerateContentConfig(max_output_tokens=1500, temperature=0.1)
    )
    texto = response.text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(texto)


def guardar_resultado(resultado: dict, nombre_pdf: str) -> str:
    ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
    ruta_json = Path(CARPETA_RESULTS) / f"{Path(nombre_pdf).stem}_{ts}.json"
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    return str(ruta_json)


def imprimir_resultado(resultado: dict):
    print("\n" + "=" * 58)
    print("   RESULTADO DEL ANALISIS PDF")
    print("=" * 58)
    for label, key in [
        ("Tipo",             "tipo_documento"),
        ("Nombre comercial", "nombre_comercial"),
        ("Principio activo", "principio_activo"),
        ("Laboratorio",      "laboratorio"),
        ("Concentracion",    "concentracion"),
        ("Forma",            "forma_farmaceutica"),
        ("Via",              "via_administracion"),
        ("Dosis",            "dosis_recomendada"),
        ("Vencimiento",      "fecha_vencimiento"),
        ("Req. receta",      "requiere_receta"),
    ]:
        val = resultado.get(key)
        if val is not None:
            print(f"  {label:<18}: {val}")
    for label, key in [("Indicaciones", "indicaciones"), ("Contraindicaciones", "contraindicaciones"), ("Interacciones", "interacciones")]:
        items = resultado.get(key, [])
        if items:
            print(f"\n  {label}:")
            for item in items:
                print(f"    - {item}")
    print("=" * 58)


def procesar_analisis(client, memoria: MemoriaSesion):
    pdf = obtener_pdf_reciente()
    if not pdf:
        msg = "No encontre ningun PDF en la carpeta. Por favor coloca el archivo e intenta de nuevo."
        print(f"  [{_ts()}] {msg}")
        reproducir_audio(msg)
        return

    print(f"  [{_ts()}] PDF detectado: {pdf.name}")
    reproducir_audio(f"Analizando el archivo {pdf.stem}, un momento por favor.")

    try:
        resultado = analizar_pdf(client, pdf)
        ruta_json = guardar_resultado(resultado, pdf.name)

        # Registra en la memoria para que el chat pueda referenciarlo
        memoria.registrar_pdf(resultado)

        imprimir_resultado(resultado)
        print(f"\n  [{_ts()}] Guardado en: {ruta_json}")

        # Lee el resumen en voz alta
        resumen = resultado.get("resumen_audio") or "Analisis completado y registrado en memoria."
        reproducir_audio(resumen)

    except json.JSONDecodeError:
        msg = "No pude interpretar la respuesta del modelo. Intenta con otro PDF."
        print(f"  [ERROR JSON] {msg}")
        reproducir_audio(msg)
    except Exception as e:
        msg = "Ocurrio un error al analizar el documento."
        print(f"  [ERROR] {e}")
        reproducir_audio(msg)


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 58)
    print("   FARMAVOX - Asistente Farmaceutico con Memoria")
    print("=" * 58)
    print(f"  Modelo        : gemini-2.5-flash")
    print(f"  Idioma        : {IDIOMA_STT}")
    print(f"  PDFs          : {CARPETA_PDFS}")
    print(f"  Palabra clave : '{PALABRA_ANALIZA}' para analizar PDF")
    print("=" * 58)
    print("  Habla libremente — recuerdo todo lo de la sesion.")
    print(f"  Di '{PALABRA_ANALIZA}' para procesar un PDF.")
    print("  Ctrl+C para salir.\n")

    client, memoria = inicializar()

    recognizer = sr.Recognizer()
    recognizer.pause_threshold          = SILENCIO
    recognizer.energy_threshold         = 300
    recognizer.dynamic_energy_threshold = True

    print("  [Listo - habla cuando quieras]\n")
    print("-" * 58)

    while True:
        try:
            texto = escuchar(recognizer)
            if not texto:
                continue

            print(f"\n  [{_ts()}] BIOQ : {texto}")

            if PALABRA_ANALIZA in texto.lower():
                procesar_analisis(client, memoria)
            else:
                print(f"  [{_ts()}] Consultando...", end="\r")
                respuesta = responder_pregunta(client, memoria, texto)
                print(f"  [{_ts()}] ASIST: {respuesta}\n")
                reproducir_audio(respuesta)

            # Muestra el estado de la memoria en cada turno
            print(f"  Memoria: {memoria.resumen_sesion()}")
            print("-" * 58)

        except KeyboardInterrupt:
            print("\n\n" + "=" * 58)
            print("   SESION FINALIZADA")
            print(f"   {memoria.resumen_sesion()}")
            print("=" * 58)

            # Guarda la sesion completa
            archivo = f"sesion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(archivo, "w", encoding="utf-8") as f:
                f.write(f"FarmaVox - Sesion {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(memoria.resumen_sesion() + "\n")
                f.write("=" * 50 + "\n\n")
                for msg in memoria.historial_chat:
                    if msg.parts[0].text.startswith("[SISTEMA"):
                        continue   # Omite los mensajes internos de contexto PDF
                    rol = "BIOQUIMICO" if msg.role == "user" else "FARMAVOX"
                    f.write(f"[{rol}]\n{msg.parts[0].text}\n\n")
            print(f"  Sesion guardada en: {archivo}\n")
            break


if __name__ == "__main__":
    main()

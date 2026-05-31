"""
Módulo de Servicios de PharmaVox
=================================
Contiene la lógica de negocio y conexión con servicios externos.

Servicios disponibles:
  - gemini_service:     Chat con IA (Gemini 2.5 Flash) + memoria de sesión.
                        Endpoint: POST /api/v1/ask
                        Tarea: A-3 (Alejandro) ✅

  - pdf_service:        Análisis multimodal de PDFs e imágenes con Gemini.
                        Endpoint: POST /api/v1/scan
                        Tarea: A-1 (Alejandro) ✅

  - simplifier_service: Simplificación de prospectos médicos a lenguaje accesible.
                        Endpoint: POST /api/v1/simplify
                        Tarea: A-2 (Alejandro) ✅

  - scheduler_service:  Generación de planes de dosificación y recordatorios de voz.
                        Endpoint: POST /api/v1/schedule
                        Tarea: A-2 (Alejandro) ✅
"""

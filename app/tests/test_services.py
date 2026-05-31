"""
Tests Unitarios — Servicios de IA de PharmaVox
================================================
Tarea A-5 de Alejandro: validación de contratos JSON y comportamiento
de los servicios de Gemini mediante mocking del cliente de IA.

Los tests no llaman a la API real de Gemini: mockean las respuestas
para probar únicamente la lógica de parsing, normalización y manejo
de errores de cada servicio.

Ejecutar:
    pytest app/tests/ -v
"""

import json
import pytest
from unittest.mock import MagicMock, patch

# ── HELPERS DE MOCKING ─────────────────────────────────────────────────────────

def _make_gemini_response(text: str) -> MagicMock:
    """Crea un mock de google.genai response con el texto dado."""
    mock_response = MagicMock()
    mock_response.text = text
    return mock_response


def _make_gemini_client(response_text: str) -> MagicMock:
    """Crea un mock completo del cliente Gemini que retorna la respuesta dada."""
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = _make_gemini_response(response_text)
    return mock_client


# ── TESTS: gemini_service (RAG Estricto) ───────────────────────────────────────

class TestGeminiService:
    """Tests del servicio de chat conversacional RAG (Tarea A-3)."""

    @patch("app.services.gemini_service.genai.Client")
    def test_ask_assistant_retorna_respuesta(self, mock_client_class):
        """El servicio retorna texto de respuesta de Gemini."""
        from app.services import gemini_service

        mock_client_class.return_value = _make_gemini_client("El paracetamol sirve para el dolor y la fiebre.")

        respuesta = gemini_service.ask_assistant(
            question="¿Para qué sirve?",
            medication_context="Paracetamol 500mg: analgésico y antipirético.",
        )

        assert isinstance(respuesta, str)
        assert len(respuesta) > 0
        assert "paracetamol" in respuesta.lower()


# ── TESTS: pdf_service ─────────────────────────────────────────────────────────

class TestPdfService:
    """Tests del servicio de análisis multimodal de PDFs (Tarea A-1)."""

    # JSON de ejemplo que Gemini retornaría para un PDF de ibuprofeno
    GEMINI_PDF_RESPONSE = json.dumps({
        "tipo_documento": "caja_medicamento",
        "nombre_comercial": "Ibuprofeno 600mg",
        "principio_activo": "Ibuprofeno",
        "laboratorio": "Laboratorios Prueba S.A.",
        "concentracion": "600mg",
        "forma_farmaceutica": "Comprimido",
        "via_administracion": "oral",
        "indicaciones": ["Dolor", "Fiebre", "Inflamación"],
        "contraindicaciones": ["Úlcera gástrica"],
        "interacciones": ["Anticoagulantes"],
        "efectos_adversos": ["Náuseas"],
        "dosis_recomendada": "1 comprimido cada 8 horas",
        "condiciones_almacenamiento": "< 30°C",
        "numero_lote": "LOT2024",
        "fecha_vencimiento": "12/2026",
        "requiere_receta": False,
        "resumen_audio": "El Ibuprofeno 600mg es un antiinflamatorio para el dolor y la fiebre."
    })

    @patch("app.services.pdf_service.genai.Client")
    def test_analyze_pdf_retorna_dict(self, mock_client_class):
        """analyze_pdf retorna un diccionario con los campos esperados."""
        from app.services import pdf_service

        mock_client_class.return_value = _make_gemini_client(self.GEMINI_PDF_RESPONSE)

        result = pdf_service.analyze_pdf(pdf_bytes=b"fake_pdf_content")

        assert isinstance(result, dict)
        assert result["nombre_comercial"] == "Ibuprofeno 600mg"
        assert result["principio_activo"] == "Ibuprofeno"
        assert result["requiere_receta"] is False

    @patch("app.services.pdf_service.genai.Client")
    def test_analyze_pdf_campos_lista(self, mock_client_class):
        """analyze_pdf retorna listas correctamente para indicaciones/contraindicaciones."""
        from app.services import pdf_service

        mock_client_class.return_value = _make_gemini_client(self.GEMINI_PDF_RESPONSE)

        result = pdf_service.analyze_pdf(pdf_bytes=b"fake_pdf_content")

        assert isinstance(result["indicaciones"], list)
        assert "Dolor" in result["indicaciones"]
        assert isinstance(result["contraindicaciones"], list)

    @patch("app.services.pdf_service.genai.Client")
    def test_analyze_pdf_limpia_markdown(self, mock_client_class):
        """analyze_pdf limpia bloques de código markdown si Gemini los incluye."""
        from app.services import pdf_service

        # Simula que Gemini envuelve el JSON en markdown
        response_con_markdown = f"```json\n{self.GEMINI_PDF_RESPONSE}\n```"
        mock_client_class.return_value = _make_gemini_client(response_con_markdown)

        result = pdf_service.analyze_pdf(pdf_bytes=b"fake_pdf_content")

        assert result["nombre_comercial"] == "Ibuprofeno 600mg"

    @patch("app.services.pdf_service.genai.Client")
    def test_analyze_pdf_json_invalido_retorna_fallback(self, mock_client_class):
        """analyze_pdf retorna el fallback de Lorazepam si Gemini retorna texto no-JSON."""
        from app.services import pdf_service

        mock_client_class.return_value = _make_gemini_client("Lo siento, no pude analizar el PDF.")

        result = pdf_service.analyze_pdf(pdf_bytes=b"fake_pdf_content")
        assert result["nombre_comercial"] == "Lorazepam Vox"
        assert result["principio_activo"] == "Lorazepam"


    @patch("app.services.pdf_service.genai.Client")
    def test_analyze_image_llama_con_mime_correcto(self, mock_client_class):
        """analyze_image envía el mime_type correcto a Gemini."""
        from app.services import pdf_service

        mock_client_class.return_value = _make_gemini_client(self.GEMINI_PDF_RESPONSE)

        result = pdf_service.analyze_image(image_bytes=b"fake_image", mime_type="image/jpeg")

        # Verifica que el cliente fue instanciado y llamado
        assert mock_client_class.called
        mock_client = mock_client_class.return_value
        call_args = mock_client.models.generate_content.call_args
        # El blob debe tener el mime_type correcto
        contents = call_args.kwargs.get("contents") or call_args.args[1]
        part_blob = contents[0].parts[0].inline_data
        assert part_blob.mime_type == "image/jpeg"

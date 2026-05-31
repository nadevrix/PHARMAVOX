import os
import json
import base64
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import get_db
from app.models import Base, User, LeafletPDF, Medication, ScanHistory, DoseReminder

# ── CONFIGURACIÓN DE BASE DE DATOS DE PRUEBA EN MEMORIA ────────────────────────
from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Inyectar la base de datos de prueba en la app de FastAPI
app.dependency_overrides[get_db] = override_get_db

# Cliente de pruebas in-memory
client = TestClient(app)

# Helper para LOGGEAR peticiones y respuestas HTTP de forma sumamente estética
def request(method: str, url: str, **kwargs):
    headers = kwargs.get("headers", {})
    json_data = kwargs.get("json")
    files = kwargs.get("files")
    
    # Ejecutar petición
    response = getattr(client, method.lower())(url, **kwargs)
    
    # Imprimir log sumamente estético en consola
    print(f"\n================================================================================")
    print(f"▶️  [PETICIÓN HTTP] {method.upper()} {url}")
    if headers:
        print(f"   Cabeceras: {json.dumps(headers)}")
    if json_data:
        print(f"   Request Body (JSON):\n{json.dumps(json_data, indent=2, ensure_ascii=False)}")
    if files:
        print(f"   Request Files: {list(files.keys())}")
    
    print(f"◀️  [RESPUESTA HTTP] {response.status_code}")
    try:
        print(f"   Response Body (JSON):\n{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception:
        if "content-length" in response.headers:
            print(f"   Response Body: [Stream Binario de PDF/Audio - {response.headers['content-length']} bytes]")
        else:
            print(f"   Response Body (Texto): {response.text[:300]}")
    print(f"================================================================================\n")
    return response


# ── MOCKS PARA SERVICIOS EXTERNOS (GEMINI & TTS) ──────────────────────────────

MOCK_EXTRACTED_PDF_DATA = {
    "tipo_documento": "prospecto_oficial",
    "nombre_comercial": "Tempra Forte 500mg",
    "principio_activo": "Paracetamol",
    "laboratorio": "Sanofi S.A.",
    "concentracion": "500mg",
    "forma_farmaceutica": "Tableta",
    "via_administracion": "oral",
    "indicaciones": ["Dolor leve a moderado", "Fiebre"],
    "contraindicaciones": ["Hipersensibilidad al paracetamol", "Insuficiencia hepática"],
    "interacciones": ["Alcohol", "Anticoagulantes"],
    "efectos_adversos": ["Erupciones cutáneas", "Daño hepático por sobredosis"],
    "dosis_recomendada": "1 tableta cada 6 horas",
    "condiciones_almacenamiento": "Consérvese a no más de 30°C",
    "numero_lote": "LOTE12345",
    "fecha_vencimiento": "12/2027",
    "requiere_receta": False,
    "resumen_audio": "Tempra Forte de paracetamol alivia dolor y fiebre. Toma una tableta cada seis horas."
}

MOCK_ASSISTANT_ANSWER = (
    "El paracetamol sirve para aliviar el dolor leve y la fiebre. "
    "Se aconseja tomar una tableta de Tempra Forte cada seis horas sin exceder la dosis recomendada."
)

async def mock_generate_voice_response(text: str) -> str:
    """Mock de TTS que escribe un archivo MP3 falso en disco y retorna base64."""
    audio_path = Path("data/voice_response.mp3")
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    fake_audio_bytes = b"ID3\x03\x00\x00\x00\x00\x00\x00dummy_mp3_data_stream_for_testing"
    with open(audio_path, "wb") as f:
        f.write(fake_audio_bytes)
    return base64.b64encode(fake_audio_bytes).decode("utf-8")


@pytest.fixture(autouse=True)
def setup_db():
    """Crea las tablas limpias antes de cada test y las elimina después."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Limpia archivo de audio temporal del test
    audio_path = Path("data/voice_response.mp3")
    if audio_path.exists():
        try:
            os.remove(audio_path)
        except Exception:
            pass


# ── PRUEBA 1: HEALTH CHECK ───────────────────────────────────────────────────

def test_health_check():
    response = request("GET", "/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# ── PRUEBA 2: CRUD DE USUARIOS (CON CONTRASEÑAS Y RBAC) ────────────────────────

def test_user_crud_flow():
    # 1. Intentar crear usuario sin cabecera X-Role (debe fallar 403)
    user_payload = {
        "email": "juan.perez@vox.com",
        "full_name": "Juan Perez",
        "role": "pharmacist",
        "timezone": "America/Mexico_City",
        "password": "supersecretpassword123"
    }
    response = request("POST", "/api/v1/admin/users", json=user_payload)
    assert response.status_code == 403

    # 2. Intentar crear usuario con rol no autorizado (invalid_role)
    headers_invalid = {"X-Role": "invalid_role"}
    response = request("POST", "/api/v1/admin/users", json=user_payload, headers=headers_invalid)
    assert response.status_code == 403

    # 3. Crear usuario exitosamente como admin
    headers_admin = {"X-Role": "admin"}
    response = request("POST", "/api/v1/admin/users", json=user_payload, headers=headers_admin)
    assert response.status_code == 201
    created_user = response.json()
    assert created_user["email"] == "juan.perez@vox.com"
    assert created_user["full_name"] == "Juan Perez"
    assert created_user["role"] == "pharmacist"
    # IMPORTANTE: Asegurar que NO se exponga la contraseña ni el hash
    assert "password" not in created_user
    assert "hashed_password" not in created_user
    assert "id" in created_user
    user_id = created_user["id"]

    # 4. Listar usuarios como admin
    response = request("GET", "/api/v1/admin/users", headers=headers_admin)
    assert response.status_code == 200
    users_list = response.json()
    assert len(users_list) >= 1
    assert any(u["email"] == "juan.perez@vox.com" for u in users_list)

    # 5. Modificar usuario como admin (actualizar nombre y contraseña)
    update_payload = {
        "full_name": "Juan Perez Modificado",
        "password": "newsecurepassword456"
    }
    response = request("PUT", f"/api/v1/admin/users/{user_id}", json=update_payload, headers=headers_admin)
    assert response.status_code == 200
    updated_user = response.json()
    assert updated_user["full_name"] == "Juan Perez Modificado"
    assert "password" not in updated_user

    # 6. Eliminar usuario como admin
    response = request("DELETE", f"/api/v1/admin/users/{user_id}", headers=headers_admin)
    assert response.status_code == 204

    # 7. Verificar que ya no exista
    response = request("GET", "/api/v1/admin/users", headers=headers_admin)
    assert not any(u["id"] == user_id for u in response.json())


# ── PRUEBA 3: CRUD DE PDFS (PERSISTENCIA Y RBAC) ──────────────────────────────

@patch("app.services.pdf_service.analyze_pdf")
def test_pdf_crud_flow(mock_analyze):
    mock_analyze.return_value = MOCK_EXTRACTED_PDF_DATA

    # 1. Intentar subir sin rol o rol no autorizado (falla 403)
    pdf_file_content = b"%PDF-1.4 dummy pdf content for testing"
    files = {"file": ("prospecto_test.pdf", pdf_file_content, "application/pdf")}
    response = request("POST", "/api/v1/admin/pdfs", files=files, headers={"X-Role": "invalid_role"})
    assert response.status_code == 403

    # 2. Subir PDF exitosamente como admin
    files = {"file": ("prospecto_test.pdf", pdf_file_content, "application/pdf")}
    response = request("POST", "/api/v1/admin/pdfs", files=files, headers={"X-Role": "admin"})
    assert response.status_code == 201
    created_pdf = response.json()
    assert created_pdf["filename"] == "prospecto_test.pdf"
    assert created_pdf["is_processed"] is True
    pdf_id = created_pdf["id"]

    # 3. Listar PDFs como pharmacist (permitido)
    response = request("GET", "/api/v1/pdfs", headers={"X-Role": "pharmacist"})
    assert response.status_code == 200
    pdfs = response.json()
    assert len(pdfs) == 1
    assert pdfs[0]["filename"] == "prospecto_test.pdf"

    # 4. Modificar metadata del PDF como admin
    update_meta = {"filename": "prospecto_renombrado.pdf"}
    response = request("PUT", f"/api/v1/admin/pdfs/{pdf_id}", json=update_meta, headers={"X-Role": "admin"})
    assert response.status_code == 200
    assert response.json()["filename"] == "prospecto_renombrado.pdf"

    # 5. Descargar PDF como pharmacist
    response = request("GET", f"/api/v1/pdfs/{pdf_id}/download", headers={"X-Role": "pharmacist"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content == pdf_file_content

    # 6. Eliminar PDF como admin
    response = request("DELETE", f"/api/v1/admin/pdfs/{pdf_id}", headers={"X-Role": "admin"})
    assert response.status_code == 204

    # 7. Verificar que fue eliminado (tanto el registro como el archivo físico de pruebas)
    response = request("GET", "/api/v1/pdfs", headers={"X-Role": "admin"})
    assert len(response.json()) == 0


# ── PRUEBA 4: ASISTENTE VOX (RAG CON BD, AUDIO TTS EN BASE64) ──────────────────

@patch("app.api.endpoints.assistant.generate_voice_response", new=mock_generate_voice_response)
@patch("app.services.gemini_service.ask_assistant")
@patch("app.services.pdf_service.analyze_pdf")
def test_vox_assistant_flow(mock_analyze_pdf, mock_ask):
    mock_analyze_pdf.return_value = MOCK_EXTRACTED_PDF_DATA
    mock_ask.return_value = MOCK_ASSISTANT_ANSWER

    # 1. Caso de BD vacía (sin prospectos subidos)
    # Debe avisar que no hay prospectos y retornar layout de warning
    response = request("POST", "/api/v1/ask", json={"question": "¿Para qué sirve el paracetamol?"})
    assert response.status_code == 200
    res_data = response.json()
    assert "no hay prospectos de medicamentos cargados" in res_data["text_response"].lower()
    assert res_data["visual_layout"]["card_type"] == "warning"
    assert len(res_data["audio_base64"]) > 0

    # 2. Subir un PDF de prospecto de paracetamol para poblar la base de conocimiento
    pdf_file_content = b"%PDF-1.4 dummy pdf content for testing paracetamol"
    files = {"file": ("paracetamol.pdf", pdf_file_content, "application/pdf")}
    upload_res = request("POST", "/api/v1/admin/pdfs", files=files, headers={"X-Role": "admin"})
    assert upload_res.status_code == 201

    # 3. Preguntar al asistente ahora que el medicamento existe en la BD
    response = request("POST", "/api/v1/ask", json={"question": "¿Para qué sirve el paracetamol?"})
    assert response.status_code == 200
    res_data = response.json()
    
    # Validaciones del contrato de respuesta JSON
    assert res_data["text_response"] == MOCK_ASSISTANT_ANSWER
    assert res_data["voice_response"] == MOCK_ASSISTANT_ANSWER
    assert len(res_data["audio_base64"]) > 0
    assert "Tempra Forte" in res_data["visual_layout"]["content_bullets"][0] or "paracetamol" in res_data["visual_layout"]["content_bullets"][0].lower()
    assert res_data["audio_chunks"] == ["/api/v1/assistant/audio"]

    # 4. Probar descarga de audio físico MP3 del backend
    audio_res = request("GET", "/api/v1/assistant/audio")
    assert audio_res.status_code == 200
    assert audio_res.headers["content-type"] == "audio/mpeg"
    assert len(audio_res.content) > 0

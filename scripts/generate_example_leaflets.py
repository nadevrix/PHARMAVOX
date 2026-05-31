import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Directorio de salida
OUTPUT_DIR = "data/pdfs_pendientes"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_pdf(filename, title, data):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Estilos Personalizados
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=15,
        alignment=0 # Izquierda
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0ea5e9'),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B')
    )

    story = []
    
    # Título Principal
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 10))
    
    # Tabla de Información Básica (Ficha Técnica Rápida)
    table_data = [
        [
            Paragraph("<b>Principio Activo:</b>", body_style), 
            Paragraph(data["principio_activo"], body_style),
            Paragraph("<b>Laboratorio:</b>", body_style), 
            Paragraph(data["laboratorio"], body_style)
        ],
        [
            Paragraph("<b>Concentración:</b>", body_style), 
            Paragraph(data["concentracion"], body_style),
            Paragraph("<b>Forma Farmacéutica:</b>", body_style), 
            Paragraph(data["forma_farmaceutica"], body_style)
        ],
        [
            Paragraph("<b>Vía Administración:</b>", body_style), 
            Paragraph(data["via_administracion"], body_style),
            Paragraph("<b>Requiere Receta:</b>", body_style), 
            Paragraph("SÍ" if data["requiere_receta"] else "NO", body_style)
        ]
    ]
    
    info_table = Table(table_data, colWidths=[120, 140, 100, 140])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))
    
    # 1. Indicaciones
    story.append(Paragraph("1. INDICACIONES TERAPÉUTICAS", subtitle_style))
    for ind in data["indicaciones"]:
        story.append(Paragraph(f"• {ind}", bullet_style))
    story.append(Spacer(1, 10))
    
    # 2. Posología y Dosis
    story.append(Paragraph("2. POSOLOGÍA Y DOSIS RECOMENDADA", subtitle_style))
    story.append(Paragraph(data["dosis_recomendada"], body_style))
    story.append(Spacer(1, 10))
    
    # 3. Contraindicaciones
    story.append(Paragraph("3. CONTRAINDICACIONES", subtitle_style))
    for contra in data["contraindicaciones"]:
        story.append(Paragraph(f"• {contra}", bullet_style))
    story.append(Spacer(1, 10))
    
    # 4. Interacciones
    story.append(Paragraph("4. INTERACCIONES MEDICAMENTOSAS", subtitle_style))
    for inter in data["interacciones"]:
        story.append(Paragraph(f"• {inter}", bullet_style))
    story.append(Spacer(1, 10))
    
    # 5. Efectos Adversos
    story.append(Paragraph("5. EFECTOS ADVERSOS PRINCIPALES", subtitle_style))
    for efecto in data["efectos_adversos"]:
        story.append(Paragraph(f"• {efecto}", bullet_style))
    story.append(Spacer(1, 10))
    
    # 6. Almacenamiento e Información de Lote
    story.append(Paragraph("6. CONSERVACIÓN Y CONTROL DE LOTE", subtitle_style))
    story.append(Paragraph(f"<b>Condiciones de Almacenamiento:</b> {data['condiciones_almacenamiento']}", body_style))
    story.append(Paragraph(f"<b>Número de Lote:</b> {data['numero_lote']}  |  <b>Fecha Vencimiento:</b> {data['fecha_vencimiento']}", body_style))
    story.append(Spacer(1, 15))
    
    # Pie de página / Metadatos de control
    story.append(Spacer(1, 10))
    story.append(Paragraph("Documento Técnico de Referencia Farmacéutica — PharmaVox System v1.0.0", meta_style))
    
    doc.build(story)
    print(f"[OK] PDF Generado: {filepath}")

# ── MEDICAMENTOS DE EJEMPLO ──

medications = {
    "Paracetamol_Cinfa_1g.pdf": {
        "title": "Prospecto Oficial de PARACETAMOL CINFA 1g",
        "data": {
            "principio_activo": "Paracetamol",
            "laboratorio": "Laboratorios Cinfa, S.A.",
            "concentracion": "1g (1000 mg)",
            "forma_farmaceutica": "Comprimidos",
            "via_administracion": "Oral",
            "requiere_receta": False,
            "indicaciones": [
                "Tratamiento sintomático del dolor de intensidad leve a moderada.",
                "Estados febriles y reducción de la temperatura corporal."
            ],
            "dosis_recomendada": "Adultos: Un comprimido de 1g cada 6 u 8 horas, según la intensidad de los síntomas. No superar en ningún caso la dosis máxima de 3 gramos (3 comprimidos) en 24 horas para evitar daño hepático grave. Pacientes con insuficiencia renal o hepática deben consultar la dosis adecuada.",
            "contraindicaciones": [
                "Hipersensibilidad conocida al principio activo o a los excipientes.",
                "Insuficiencia hepatocelular grave o hepatitis activa.",
                "Consumo crónico de alcohol."
            ],
            "interacciones": [
                "Anticoagulantes orales (como la warfarina o acenocumarol): el uso continuado puede potenciar su efecto.",
                "Metoclopramida y domperidona: aumentan la velocidad de absorción del paracetamol."
            ],
            "efectos_adversos": [
                "Hepatotoxicidad (generalmente relacionada con sobredosis o uso crónico prolongado).",
                "Reacciones cutáneas raras (erupción, prurito, shock anafiláctico)."
            ],
            "condiciones_almacenamiento": "No requiere condiciones especiales de conservación. Mantener fuera de la vista y del alcance de los niños.",
            "numero_lote": "LOTE-PC-4520A",
            "fecha_vencimiento": "08/2029"
        }
    },
    "Ibuprofeno_Kern_Pharma_600mg.pdf": {
        "title": "Prospecto Oficial de IBUPROFENO KERN PHARMA 600mg",
        "data": {
            "principio_activo": "Ibuprofeno",
            "laboratorio": "Kern Pharma, S.L.",
            "concentracion": "600mg",
            "forma_farmaceutica": "Comprimidos recubiertos con película",
            "via_administracion": "Oral",
            "requiere_receta": True,
            "indicaciones": [
                "Alivio del dolor moderado, incluyendo dolor dental, postoperatorio o muscular.",
                "Tratamiento de la artritis reumatoide, artrosis y espondilitis anquilosante.",
                "Tratamiento sintomático de la dismenorrea primaria (dolor menstrual)."
            ],
            "dosis_recomendada": "Adultos y adolescentes mayores de 12 años: Un comprimido de 600mg cada 8 horas (dosis máxima diaria 1800mg). Se recomienda tomarlo junto con alimentos o leche para minimizar posibles molestias gastrointestinales.",
            "contraindicaciones": [
                "Hipersensibilidad al principio activo o a otros AINEs (incluyendo antecedentes de asma o broncoespasmo).",
                "Úlcera péptica activa o antecedentes de hemorragia gastrointestinal.",
                "Insuficiencia cardíaca, renal o hepática grave.",
                "Tercer trimestre de embarazo."
            ],
            "interacciones": [
                "Otros AINEs y corticoides: aumentan el riesgo de úlceras y hemorragias estomacales.",
                "Antihipertensivos y diuréticos: el ibuprofeno puede disminuir sus efectos terapéuticos."
            ],
            "efectos_adversos": [
                "Dispepsia, pirosis, diarrea, náuseas o estreñimiento.",
                "Riesgo aumentado de eventos cardiovasculares arteriales en tratamientos prolongados a dosis altas."
            ],
            "condiciones_almacenamiento": "Conservar por debajo de 25 grados centígrados en su envase original para protegerlo de la luz.",
            "numero_lote": "LOTE-IB-7812B",
            "fecha_vencimiento": "11/2028"
        }
    },
    "Amoxicilina_Normon_500mg.pdf": {
        "title": "Prospecto Oficial de AMOXICILINA NORMON 500mg",
        "data": {
            "principio_activo": "Amoxicilina",
            "laboratorio": "Laboratorios Normon, S.A.",
            "concentracion": "500mg",
            "forma_farmaceutica": "Cápsulas duras",
            "via_administracion": "Oral",
            "requiere_receta": True,
            "indicaciones": [
                "Tratamiento de infecciones agudas del oído medio, senos paranasales o garganta (amigdalitis).",
                "Infecciones del tracto respiratorio inferior (bronquitis aguda y neumonía).",
                "Infecciones del tracto urinario (cistitis y uretritis)."
            ],
            "dosis_recomendada": "Adultos: Una cápsula de 500mg cada 8 horas, pudiendo incrementarse a 750mg o 1g cada 8 horas en infecciones graves. Completar el tratamiento estipulado de 7 a 10 días aun si los síntomas desaparecen antes.",
            "contraindicaciones": [
                "Alergia o hipersensibilidad demostrada a las penicilinas o cefalosporinas.",
                "Antecedentes de ictericia o insuficiencia hepática asociada a amoxicilina."
            ],
            "interacciones": [
                "Alopurinol: aumenta el riesgo de erupciones cutáneas alérgicas.",
                "Metotrexato: las penicilinas pueden reducir su excreción, incrementando su toxicidad."
            ],
            "efectos_adversos": [
                "Diarrea aguda, náuseas, vómitos y erupciones cutáneas transitorias.",
                "Candidiasis mucocutánea si se usa de forma muy prolongada."
            ],
            "condiciones_almacenamiento": "No almacenar por encima de 30 grados centígrados. Mantener el blíster protegido de la humedad.",
            "numero_lote": "LOTE-AM-9051C",
            "fecha_vencimiento": "05/2027"
        }
    },
    "Omeprazol_Sandoz_20mg.pdf": {
        "title": "Prospecto Oficial de OMEPRAZOL SANDOZ 20mg",
        "data": {
            "principio_activo": "Omeprazol",
            "laboratorio": "Sandoz Farmacéutica, S.A.",
            "concentracion": "20mg",
            "forma_farmaceutica": "Cápsulas duras gastrorresistentes",
            "via_administracion": "Oral",
            "requiere_receta": False,
            "indicaciones": [
                "Tratamiento del reflujo gastroesofágico y prevención de esofagitis por reflujo.",
                "Tratamiento de úlceras duodenales y gástricas benignas.",
                "Erradicación de Helicobacter pylori en combinación con terapia antibiótica adecuada."
            ],
            "dosis_recomendada": "Adultos: Una cápsula de 20mg al día por la mañana en ayunas. Tragar la cápsula entera con un vaso de agua; no debe masticarse ni triturarse para mantener intacta la cubierta protectora del principio activo.",
            "contraindicaciones": [
                "Hipersensibilidad al omeprazol, benzimidazoles sustituidos o excipientes.",
                "Administración conjunta con nelfinavir (medicamento antirretroviral)."
            ],
            "interacciones": [
                "Clopidogrel: el omeprazol puede reducir su efecto antiplaquetario.",
                "Ketoconazol e itraconazol: se reduce su absorción gastrointestinal."
            ],
            "efectos_adversos": [
                "Cefalea, mareos, dolor abdominal, flatulencia, estreñimiento o diarrea leve.",
                "En tratamientos muy prolongados, se asocia a disminución de absorción de vitamina B12."
            ],
            "condiciones_almacenamiento": "Conservar por debajo de 30 grados centígrados en su envase original cerrado herméticamente para proteger de la humedad.",
            "numero_lote": "LOTE-OM-1290D",
            "fecha_vencimiento": "10/2028"
        }
    }
}

if __name__ == "__main__":
    print("Iniciando generación de prospectos PDF de referencia...")
    for filename, item in medications.items():
        generate_pdf(filename, item["title"], item["data"])
    print("\n¡Generación completada exitosamente!")

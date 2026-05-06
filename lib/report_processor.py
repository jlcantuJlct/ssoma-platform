import sys
import json
import os
from docx import Document
from docx.shared import Inches
import requests
from io import BytesIO

def process_report(template_path, output_path, data_json):
    data = json.loads(data_json)
    doc = Document(template_path)
    
    # 1. Reemplazo de Fechas y Títulos
    for p in doc.paragraphs:
        if "MARZO 2026" in p.text.upper():
            p.text = p.text.replace("MARZO 2026", "ABRIL 2026").replace("Marzo 2026", "Abril 2026")
        if "MARZO" in p.text.upper():
            p.text = p.text.replace("MARZO", "ABRIL").replace("Marzo", "Abril")

    # 2. Inyección de Imágenes por Contexto
    # 'data' contiene { "photos": [ { "url": "...", "description": "Lavamanos", "zona": "PAD San Clemente" } ] }
    photos = data.get("evidence", [])
    
    for p in doc.paragraphs:
        p_text = p.text.strip()
        if "Fotografía" in p_text or "Foto" in p_text:
            # Buscar si alguna foto de la plataforma coincide con el texto del párrafo
            for photo in photos:
                category = photo.get("category", "").lower()
                location = photo.get("location", "").lower()
                
                # Si la categoría (ej: 'lavamanos') está en el pie de foto del Word
                if category and category in p_text.lower():
                    # Opcional: Validar ubicación si está en el texto
                    # if location and location in p_text.lower():
                    
                    print(f"Match encontrado: '{category}' en '{p_text}'")
                    
                    try:
                        # Descargar imagen
                        img_url = photo["file_url"]
                        if "drive.google.com" in img_url:
                            # Convertir a link directo si es necesario
                            file_id = img_url.split('id=')[-1].split('&')[0] if 'id=' in img_url else img_url.split('/')[-2]
                            img_url = f"https://docs.google.com/uc?export=download&id={file_id}"
                        
                        response = requests.get(img_url)
                        if response.status_code == 200:
                            img_stream = BytesIO(response.content)
                            # Insertar imagen ANTES del párrafo del pie de foto (o después, según la guía)
                            # Normalmente la foto va ARRIBA del texto en estos informes
                            new_p = p.insert_paragraph_before('')
                            run = new_p.add_run()
                            run.add_picture(img_stream, width=Inches(5.5))
                            print(f"Imagen insertada para: {category}")
                            # Romper el ciclo de fotos para este párrafo para no duplicar
                            break 
                    except Exception as e:
                        print(f"Error insertando imagen: {e}")

    doc.save(output_path)
    print(f"Informe generado exitosamente en: {output_path}")

if __name__ == "__main__":
    # template, output, data_json
    process_report(sys.argv[1], sys.argv[2], sys.argv[3])

const records = [
  {
    "id": 2,
    "date": "2026-02-24",
    "manifestNumber": "033280-2026",
    "transportCompany": "TOWER AND TOWER S.A.",
    "wasteType": "ACEITE LUBRICANTE USADO",
    "quantity": "1.880",
    "unit": "kg",
    "location": "ZI Pisco Lado B Campamento",
    "files": [
      "https://drive.google.com/file/d/1YkdCZf7DSdTpSV6CoVul51u3zFQ9LdM6/view?usp=drivesdk"
    ],
    "items": [
      {
        "unit": "ton",
        "quantity": "1.880",
        "wasteType": "ACEITE LUBRICANTE USADO"
      },
      {
        "unit": "ton",
        "quantity": "0.940",
        "wasteType": "TIERRA CONTAMINADA CON HIDROCARBUROS"
      },
      {
        "unit": "ton",
        "quantity": "2.270",
        "wasteType": "DESECHOS DE ASFALTO"
      },
      {
        "unit": "ton",
        "quantity": "0.200",
        "wasteType": "BALDES CONTAMINADOS CON PINTURA"
      },
      {
        "unit": "ton",
        "quantity": "0.090",
        "wasteType": "TEROKAL VENCIDO"
      },
      {
        "unit": "ton",
        "quantity": "1.600",
        "wasteType": "RESIDUOS CONTAMINADOS CON HIDROCARBURO (TRAPOS INDUSTRIALES Y FILTROS)"
      },
      {
        "unit": "ton",
        "quantity": "0.120",
        "wasteType": "CILINDROS VACIOS CONTAMINADOS CON HIDROCARBUROS"
      }
    ],
    "documentType": "Certificado de Disposición Final"
  },
  {
    "id": 1,
    "date": "2026-02-24",
    "manifestNumber": "35-2026/GSA",
    "transportCompany": "GESTIÓN DE SERVICIOS AMBIENTALES S.A.C.,",
    "wasteType": "ACEITE LUBRICANTE USADO",
    "quantity": "1880",
    "unit": "kg",
    "location": "ZI Pisco Lado B Campamento",
    "files": [
      "https://drive.google.com/file/d/15pdGvDri-hMoAzvno0OiYCTcBZbp8sxB/view?usp=drivesdk"
    ],
    "items": [
      {
        "unit": "kg",
        "quantity": "1880",
        "wasteType": "ACEITE LUBRICANTE USADO"
      },
      {
        "unit": "kg",
        "quantity": "940",
        "wasteType": "TIERRA CONTAMINADA CON HIDROCARBUROS"
      },
      {
        "unit": "kg",
        "quantity": "200",
        "wasteType": "BALDES CONTAMINADOS CON PINTURA"
      },
      {
        "unit": "kg",
        "quantity": "1600",
        "wasteType": "RESIDUOS CONTAMINADOS CON HIDROCARBURO (TRAPOS INDUSTRIALES Y FILTROS)"
      },
      {
        "unit": "kg",
        "quantity": "120",
        "wasteType": "CILINDROS VACIOS CONTAMINADOS CON HIDROCARBUROS"
      },
      {
        "unit": "kg",
        "quantity": "2270",
        "wasteType": "DESECHOS DE ASFALTO"
      },
      {
        "unit": "kg",
        "quantity": "90",
        "wasteType": "TEROKAL VENCIDO"
      }
    ],
    "documentType": "Certificado de Disposición Final"
  }
];

fetch('https://ssoma-platform.vercel.app/api/manifiesto-records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ records })
}).then(r=>r.json()).then(console.log).catch(console.error);

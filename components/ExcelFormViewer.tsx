"use client";

import React, { useEffect, useState } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

const LuckyExcel = require('luckyexcel');

export default function ExcelFormViewer({ fileUrl }: { fileUrl: string }) {
  const [sheetData, setSheetData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(fileUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "formato.xlsx");
        LuckyExcel.transformExcelToLucky(file, function(exportJson: any, luckysheetfile: any){
            if(exportJson.sheets == null || exportJson.sheets.length == 0){
                setError("No se pudo leer el Excel.");
                return;
            }
            
            // Sanitizar y ajustar la data de Excel para Web
            const cleanSheets = exportJson.sheets.map((sheet: any) => {
                const cleanSheet = { ...sheet };
                
                // 1. Ajustar el ancho de las columnas (Excel usa otra escala, la multiplicamos para que encaje)
                if (cleanSheet.config && cleanSheet.config.columnlen) {
                    for (const colKey in cleanSheet.config.columnlen) {
                        cleanSheet.config.columnlen[colKey] = Math.round(cleanSheet.config.columnlen[colKey] * 1.35); // Factor de escala
                    }
                }

                // 2. Arreglar las imágenes (logo): FortuneSheet exige un Array, el convertidor a veces da un Objeto
                if (cleanSheet.images) {
                    if (!Array.isArray(cleanSheet.images) && typeof cleanSheet.images === 'object') {
                        cleanSheet.images = Object.values(cleanSheet.images);
                    }
                } else {
                    cleanSheet.images = [];
                }

                return cleanSheet;
            });

            setSheetData(cleanSheets);
        });
      })
      .catch(err => {
          console.error(err);
          setError("Error cargando Excel.");
      });
  }, [fileUrl]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!sheetData) return <div className="p-8 text-center text-gray-500">Cargando formato...</div>;

  return (
    <div style={{ width: '100%', height: '85vh', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      <Workbook data={sheetData} />
    </div>
  );
}

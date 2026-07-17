import sqlite3
import json
import os

db_path = r"C:\Users\jlcan\Desktop\Seguimiento de plataforma de seguridad Antigravity\ssoma.db"

if not os.path.exists(db_path):
    print(f"Error: No DB found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Let's list tables first to be sure
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    print("Tables in SQLite DB:", tables)
    
    if "desvio_evidence_records" in tables:
        cursor.execute("SELECT * FROM desvio_evidence_records")
        # Get column names
        cols = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        
        # Convert to list of dicts
        records = [dict(zip(cols, row)) for row in rows]
        print(f"\nFound {len(records)} records in desvio_evidence_records.")
        
        # Show first 5 records
        for r in records[:5]:
            print(r)
            
        # Count by month
        months = {}
        for r in records:
            date_val = r.get('date') or ''
            month = date_val[:7] if len(date_val) >= 7 else 'Unknown'
            months[month] = months.get(month, 0) + 1
            
        print("\nRecords by month:", months)
    else:
        print("\nTable 'desvio_evidence_records' not found in SQLite DB.")
        
except Exception as e:
    print("Error:", e)
finally:
    if 'conn' in locals():
        conn.close()

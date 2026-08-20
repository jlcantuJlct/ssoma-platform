import sqlite3
import json

try:
    conn = sqlite3.connect('./database.sqlite')
    c = conn.cursor()
    c.execute("SELECT data_json FROM annual_program WHERE objective_id='obj10'")
    row = c.fetchone()
    if row:
        data = json.loads(row[0])
        print("OBJ10 ACTIVITIES:")
        for item in data:
            print(f"- {item.get('description')}")
    else:
        print("No obj10 data")
except Exception as e:
    print(e)


-- Copia y pega esto en la consola SQL de Vercel Storage (Data Browser)

CREATE TABLE IF NOT EXISTS objectives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    year INTEGER NOT NULL,
    category TEXT
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    objective_id TEXT NOT NULL,
    item_number TEXT,
    name TEXT NOT NULL,
    responsible TEXT,
    public_target TEXT,
    frequency TEXT,
    area TEXT
);

CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    month INTEGER NOT NULL,
    plan_value REAL,
    executed_value REAL
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    month INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_program (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL,
    responsible TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    area TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_records (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    responsible TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    area TEXT NOT NULL,
    zone TEXT NOT NULL,
    status TEXT NOT NULL,
    observations TEXT,
    evidence_pdf TEXT,
    evidence_imgs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

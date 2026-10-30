-- SSOMA Platform - Esquema PostgreSQL Multi-Proyecto
-- Todos los registros de inspecciones, programas, temarios y evidencias
-- son estrictamente independientes por proyecto (workspace).

CREATE TABLE IF NOT EXISTS objectives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    year INTEGER NOT NULL,
    category TEXT,
    workspace VARCHAR(100) DEFAULT 'Red Vial 6'
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    objective_id TEXT NOT NULL,
    item_number TEXT,
    name TEXT NOT NULL,
    responsible TEXT,
    public_target TEXT,
    frequency TEXT,
    area TEXT,
    workspace VARCHAR(100) DEFAULT 'Red Vial 6'
);

CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    month INTEGER NOT NULL,
    plan_value REAL,
    executed_value REAL,
    workspace VARCHAR(100) DEFAULT 'Red Vial 6'
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    month INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    workspace VARCHAR(100) DEFAULT 'Red Vial 6'
);

CREATE TABLE IF NOT EXISTS monthly_program (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL,
    responsible TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    area TEXT NOT NULL,
    workspace VARCHAR(100) DEFAULT 'Red Vial 6',
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
    workspace VARCHAR(100) DEFAULT 'Red Vial 6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_temarios (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    url TEXT NOT NULL,
    workspace VARCHAR(100) DEFAULT 'Red Vial 6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT monthly_temarios_month_year_workspace_key UNIQUE (month, year, workspace)
);

CREATE TABLE IF NOT EXISTS export_requests (
    id SERIAL PRIMARY KEY,
    month INTEGER,
    year INTEGER,
    status TEXT DEFAULT 'pending',
    type TEXT DEFAULT 'SHAREPOINT',
    workspace VARCHAR(100) DEFAULT 'Red Vial 6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

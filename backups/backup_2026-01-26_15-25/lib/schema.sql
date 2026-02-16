
CREATE TABLE IF NOT EXISTS objectives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    year INTEGER NOT NULL,
    category TEXT -- 'General', 'Especifico', etc.
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    objective_id TEXT NOT NULL,
    item_number TEXT,
    name TEXT NOT NULL,
    responsible TEXT,
    public_target TEXT, -- 'Todo el personal', etc.
    frequency TEXT, -- 'Mensual', 'Trimestral', 'Anual'
    area TEXT, -- 'safety', 'health', 'environment'
    FOREIGN KEY(objective_id) REFERENCES objectives(id)
);

CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    plan_value REAL,
    executed_value REAL,
    FOREIGN KEY(activity_id) REFERENCES activities(id)
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    month INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT, -- 'pdf', 'image'
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(activity_id) REFERENCES activities(id)
);

CREATE TABLE IF NOT EXISTS monthly_program (
    id TEXT PRIMARY KEY,
    month INTEGER NOT NULL,
    responsible TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    area TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_records (
    id INTEGER PRIMARY KEY, -- Using numeric ID to match existing frontend type 'number'
    date TEXT NOT NULL,
    responsible TEXT NOT NULL,
    inspection_type TEXT NOT NULL,
    area TEXT NOT NULL,
    zone TEXT NOT NULL,
    status TEXT NOT NULL,
    observations TEXT,
    evidence_pdf TEXT,
    evidence_imgs TEXT, -- JSON string array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

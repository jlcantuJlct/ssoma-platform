export type UserRole = 'manager' | 'developer' | 'user';

export interface User {
    username: string;
    name: string;
    role: UserRole;
    email?: string;
    workspace?: string;
    deactivated?: boolean;
}

export interface FullUser {
    name: string;
    role: UserRole;
    email: string;
    phone?: string;
    workspace: string;
    password?: string;
    deactivated?: boolean;
}

export const INITIAL_USERS: Record<string, { password: string, name: string, role: UserRole, email: string, phone?: string, workspace: string, deactivated?: boolean }> = {
    "jose.cancino": {
        "password": "161976Jlct",
        "name": "Jose Luis Cancino",
        "role": "developer",
        "email": "jlcancino@example.com",
        "phone": "+51949260281",
        "workspace": "Red Vial 6"
    },
    "gerencia": {
        "password": "GerenciaSSO2026",
        "name": "Gerencia General",
        "role": "manager",
        "email": "gerencia@antigravity.com",
        "phone": "+51900000000",
        "workspace": "Red Vial 6"
    },
    "jose.galliquio": {
        "password": "JGalliq@2026",
        "name": "Jose Galliquio Montesinos",
        "role": "user",
        "email": "josegamontesinos@gmail.com",
        "phone": "+51986103867",
        "workspace": "Red Vial 6",
        "deactivated": true
    },
    "albert.chuquispuma": {
        "password": "AChuqui@2026",
        "name": "Albert Chuquispuma Santos",
        "role": "user",
        "email": "albertscorpio99@gmail.com",
        "phone": "+51929906173",
        "workspace": "Red Vial 6",
        "deactivated": true
    },
    "jesus.villalovos": {
        "password": "JVillal@2026",
        "name": "Jesus Villalobos Levano",
        "role": "user",
        "email": "jesusvillaloboslevano4@gmail.com",
        "phone": "+51928893280",
        "workspace": "Red Vial 6",
        "deactivated": true
    },
    "adrian.suarez": {
        "password": "ASuarez@2026",
        "name": "Adrian Suarez Soto",
        "role": "user",
        "email": "adrian142005@hotmail.com",
        "phone": "+51943697255",
        "workspace": "Red Vial 6"
    },
    "fabricio.galvez": {
        "password": "FGalvez@2026",
        "name": "Fabricio Galvez",
        "role": "user",
        "email": "fgalvez@casacontratistas.com",
        "phone": "+51900000000",
        "workspace": "Red Vial 6",
        "deactivated": true
    },
    "benjy.vega": {
        "password": "BVega@2026",
        "name": "Benjy Vega",
        "role": "user",
        "email": "bvega@casacontratistas.com",
        "phone": "+51900000000",
        "workspace": "Red Vial 6",
        "deactivated": true
    },
    "gladis.aroste": {
        "password": "GAroste@2026",
        "name": "Gladis Aroste Huertas",
        "role": "user",
        "email": "gladys.aroste123@gmail.com",
        "phone": "+51969683799",
        "workspace": "Red Vial 6"
    },
    "brayan.pena": {
        "password": "BPeña@2026",
        "name": "Brayan Jeanpool Peña Villafuerte",
        "role": "user",
        "email": "20173143@unica.edu.pe",
        "phone": "+51971087023",
        "deactivated": true,
        "workspace": "Red Vial 6"
    },
    "tramo4.admin": {
        "password": "Tramo4@2026",
        "name": "Admin Tramo 4",
        "role": "manager",
        "email": "tramo4@example.com",
        "phone": "+51900000000",
        "workspace": "Longitudinal tramo 4"
    },
    "Luis.cancino": {
        "name": "Jose Luis Cancino Tueros",
        "role": "developer",
        "workspace": "Longitudinal tramo 4",
        "email": "Luis.cancino@example.com",
        "phone": "+51900000000",
        "password": "161976",
        "deactivated": false
    },
    "A.suarez": {
        "name": "Adrián Suárez Soto",
        "role": "user",
        "workspace": "Longitudinal tramo 4",
        "email": "A.suarez@example.com",
        "phone": "+51900000000",
        "password": "ASuarez2026",
        "deactivated": false
    }
};

const { execSync } = require('child_process');

const envs = {
    DATABASE_URL: "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    DATABASE_URL_UNPOOLED: "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    PGDATABASE: "postgres",
    PGHOST: "aws-1-sa-east-1.pooler.supabase.com",
    PGHOST_UNPOOLED: "aws-1-sa-east-1.pooler.supabase.com",
    PGPASSWORD: "161976Jlct@cantu",
    PGUSER: "postgres.izxufmamzeomzyjqjlnc",
    POSTGRES_DATABASE: "postgres",
    POSTGRES_HOST: "aws-1-sa-east-1.pooler.supabase.com",
    POSTGRES_PASSWORD: "161976Jlct@cantu",
    POSTGRES_PRISMA_URL: "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?connect_timeout=15",
    POSTGRES_URL: "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    POSTGRES_URL_NON_POOLING: "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    POSTGRES_URL_NO_SSL: "postgresql://postgres.izxufmamzeomzyjqjlnc:161976Jlct%40cantu@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
    POSTGRES_USER: "postgres.izxufmamzeomzyjqjlnc"
};

async function updateVercelEnvs() {
    console.log("Starting update of Vercel environment variables...");
    for (const [key, value] of Object.entries(envs)) {
        try {
            console.log(`Updating ${key}...`);
            const cmd = `npx.cmd vercel env update ${key} --value "${value}" -y`;
            const out = execSync(cmd, { encoding: 'utf-8' });
            console.log(`Success: ${key} updated.`);
        } catch (e) {
            console.error(`Error updating ${key}:`, e.message);
        }
    }
    console.log("Finished updating environment variables.");
}

updateVercelEnvs();

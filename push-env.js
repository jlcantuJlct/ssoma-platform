const fs = require('fs');
const { execSync } = require('child_process');

try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const match = env.match(/POSTGRES_URL="?([^"\n]+)"?/);
    if (!match) {
        console.error("POSTGRES_URL not found in .env.local");
        process.exit(1);
    }
    const url = match[1].trim();
    console.log("Adding POSTGRES_URL to production...");
    try {
        execSync(`npx vercel env rm POSTGRES_URL production -y`, { stdio: 'ignore' });
    } catch(e) {} // ignore if it doesn't exist

    fs.writeFileSync('url.txt', url);
    execSync(`npx vercel env add POSTGRES_URL production < url.txt`, { stdio: 'inherit' });
    
    console.log("Triggering Vercel deployment...");
    execSync(`npx vercel --prod -y`, { stdio: 'inherit' });
    
} catch (e) {
    console.error(e.message);
}

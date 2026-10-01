const fs = require('fs');
fs.mkdirSync('app/api/test_db', { recursive: true });
fs.writeFileSync('app/api/test_db/route.ts', `
import { NextResponse } from "next/server";
import { getInspections } from "@/app/actions";

export async function GET() {
    const res = await getInspections();
    return NextResponse.json(res);
}
`);

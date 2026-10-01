
import { NextResponse } from "next/server";
import { getInspections } from "@/app/actions";

export async function GET() {
    const res = await getInspections();
    return NextResponse.json(res);
}

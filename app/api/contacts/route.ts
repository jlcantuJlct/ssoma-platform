import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM notification_contacts ORDER BY id ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, area, is_permanent_cc } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const { rows } = await db.query(
      'INSERT INTO notification_contacts (name, email, area, is_permanent_cc) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, area || null, is_permanent_cc || false]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    await db.query('DELETE FROM notification_contacts WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Logic to save user settings
  const body = await request.json();
  return NextResponse.json({ message: 'Settings saved', data: body });
}

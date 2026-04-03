import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // OLLAMA_HOST is typically http://localhost:11434
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      next: { revalidate: 30 } // Cache for 30s to keep it fast
    });

    if (!response.ok) {
      throw new Error(`Ollama check failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract model names
    const models = data.models?.map((m: any) => m.name.split(':')[0]) || [];
    
    // De-duplicate if needed
    const uniqueModels = Array.from(new Set(models));

    return NextResponse.json({ models: uniqueModels });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ollama Offline';
    console.warn('[ZenLens] Ollama Sync Error:', msg);
    return NextResponse.json({ models: [], error: msg }, { status: 500 });
  }
}

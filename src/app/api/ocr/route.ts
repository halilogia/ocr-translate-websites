import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      image, 
      model, // No more default llava here
      prompt = 'Read the text in this image. Only provide the text found, no descriptions.' 
    } = body;

    if (!model) {
      return NextResponse.json({ error: 'No Ollama vision model selected' }, { status: 400 });
    }

    console.log(`[ZenLens] Aether Request: Model="${model}", Size=${image?.length || 0} bytes`);

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        images: [base64Data],
        stream: false
      })
    });

    if (response.status === 404) {
      const err = `Model "${model}" not found in Ollama. Run "ollama run ${model}" first.`;
      console.error(`[ZenLens] Aether Error: ${err}`);
      return NextResponse.json({ error: err }, { status: 404 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json({ text: data.response.trim(), confidence: 100 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Aether Vision Failure';
    console.error('[ZenLens] Aether API Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

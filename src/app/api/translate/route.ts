import { translate } from '@vitalets/google-translate-api';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { 
      text, 
      from = 'en', 
      to = 'tr', 
      engine = 'google', 
      ollamaModel, 
      openRouterKey, 
      openRouterModel 
    } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let translatedText = '';

    if (engine === 'google') {
      const res = await translate(text, { from, to });
      translatedText = res.text;
    } else if (engine === 'ollama') {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: ollamaModel || 'llama3',
          prompt: `Translate the following text from ${from} to ${to}. Only provide the translation: ${text}`,
          stream: false
        })
      });
      const data = await response.json();
      translatedText = data.response.trim();
    } else if (engine === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Kamui Translator'
        },
        body: JSON.stringify({
          model: openRouterModel || 'neversleep/llama-3-lumimaid-8b:extended',
          messages: [{ role: 'user', content: `Translate from ${from} to ${to}: ${text}. Return ONLY the translated text.` }]
        })
      });
      const data = await response.json();
      translatedText = data.choices[0].message.content.trim();
    } else {
      // Fallback or MyMemory
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      const data = await res.json();
      translatedText = data.responseData.translatedText;
    }
    
    return NextResponse.json({ translatedText });
  } catch (err) {
    console.error('Translation API Error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

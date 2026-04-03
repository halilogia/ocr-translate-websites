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
      try {
        const res = await translate(text, { from, to });
        translatedText = res.text;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ 
          error: 'Google Translate API failed',
          details: errorMessage
        }, { status: 500 });
      }
    } else if (engine === 'ollama') {
      if (!ollamaModel) {
        return NextResponse.json({ 
          error: 'Ollama model is required',
          details: 'Please select an Ollama model in Settings for translation'
        }, { status: 400 });
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: `Translate the following text from ${from} to ${to}. Output ONLY the translation, no explanations or additional text: ${text}`,
            stream: false,
            options: {
              temperature: 0.0,
              top_p: 0.95,
              repeat_penalty: 1.1
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json({ 
            error: `Ollama API error (${response.status})`,
            details: errorText
          }, { status: response.status });
        }
        
        const data = await response.json();
        translatedText = data.response.trim();
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
          return NextResponse.json({ 
            error: 'Ollama request timed out',
            details: 'Translation took longer than 10 seconds. Try again or use a different model.'
          }, { status: 504 });
        }
        
        return NextResponse.json({ 
          error: 'Ollama connection failed',
          details: `Could not connect to Ollama: ${errorMessage}\n\nMake sure Ollama is running: ollama serve`
        }, { status: 500 });
      }
    } else if (engine === 'openrouter') {
      if (!openRouterKey) {
        return NextResponse.json({ 
          error: 'OpenRouter API key is required',
          details: 'Please add your OpenRouter API key in Settings'
        }, { status: 400 });
      }
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'ZenLens'
        },
        body: JSON.stringify({
          model: openRouterModel || 'neversleep/llama-3-lumimaid-8b:extended',
          messages: [{ role: 'user', content: `Translate from ${from} to ${to}: ${text}. Return ONLY the translated text.` }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ 
          error: `OpenRouter API error (${response.status})`,
          details: errorData.error?.message || 'Unknown error'
        }, { status: response.status });
      }
      
      const data = await response.json();
      translatedText = data.choices[0].message.content.trim();
    } else if (engine === 'mymemory') {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      const data = await res.json();
      
      if (!data.responseData || !data.responseData.translatedText) {
        return NextResponse.json({ 
          error: 'MyMemory API failed',
          details: data.responseDetails || 'Unknown error'
        }, { status: 500 });
      }
      
      translatedText = data.responseData.translatedText;
    } else {
      return NextResponse.json({ 
        error: 'Unknown translation engine',
        details: `Engine "${engine}" is not supported. Use: google, ollama, openrouter, or mymemory`
      }, { status: 400 });
    }
    
    return NextResponse.json({ translatedText });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Translation API Error:', errorMessage);
    return NextResponse.json({ 
      error: 'Translation failed',
      details: errorMessage
    }, { status: 500 });
  }
}

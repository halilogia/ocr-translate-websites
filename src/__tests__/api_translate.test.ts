/**
 * @jest-environment node
 */
import { POST } from '../app/api/translate/route';
import { translate } from '@vitalets/google-translate-api';

jest.mock('@vitalets/google-translate-api', () => ({
  translate: jest.fn(),
}));

global.fetch = jest.fn() as jest.Mock;

describe('Translation API Route (POST)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if text is missing', async () => {
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('uses Google Translate engine when specified', async () => {
    (translate as jest.Mock).mockResolvedValue({ text: 'Merhaba' });
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', engine: 'google' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.translatedText).toBe('Merhaba');
    expect(translate).toHaveBeenCalledWith('Hello', { to: 'tr' });
  });

  it('uses MyMemory fallback when engine is mymemory', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ responseData: { translatedText: 'Selam' } }),
    });
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hi', engine: 'mymemory' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.translatedText).toBe('Selam');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('mymemory'));
  });

  it('uses Ollama engine when specified', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ response: ' Local Merhaba' }),
    });
    const req = new Request('http://localhost/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello', engine: 'ollama', ollamaModel: 'llama3' }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.translatedText).toBe('Local Merhaba');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', expect.any(Object));
  });

  it('uses OpenRouter engine when specified', async () => {
     (global.fetch as jest.Mock).mockResolvedValue({
       json: jest.fn().mockResolvedValue({ choices: [{ message: { content: ' Cloud Merhaba' } }] }),
     });
     const req = new Request('http://localhost/api/translate', {
       method: 'POST',
       body: JSON.stringify({ text: 'Hello', engine: 'openrouter', openRouterKey: 'test-key' }),
     });
     const res = await POST(req);
     const data = await res.json();
     expect(data.translatedText).toBe('Cloud Merhaba');
     expect(global.fetch).toHaveBeenCalledWith('https://openrouter.ai/api/v1/chat/completions', expect.any(Object));
  });
});

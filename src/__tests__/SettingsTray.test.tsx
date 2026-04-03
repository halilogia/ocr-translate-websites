import { render, screen, fireEvent } from '@testing-library/react';
import SettingsTray from '../components/panels/SettingsTray';
import { AppSettings } from '../types';

const mockSettings: AppSettings = {
  translationMode: true,
  targetLanguage: 'tr',
  engine: 'google',
  autoScan: false,
  scanRegion: 'full',
  furigana: false,
  ollamaModel: 'llama3',
  openRouterKey: '',
  openRouterModel: 'neversleep/llama-3-lumimaid-8b:extended'
};

describe('SettingsTray Component', () => {
  const mockUpdateSettings = jest.fn();

  it('renders all main settings sections', () => {
    render(<SettingsTray settings={mockSettings} updateSettings={mockUpdateSettings} />);
    expect(screen.getByText(/ENGINE SETTINGS/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider/i)).toBeInTheDocument();
    expect(screen.getByText(/^Region$/i)).toBeInTheDocument();
  });

  it('shows Ollama model input when Ollama is selected', () => {
    const ollamaSettings = { ...mockSettings, engine: 'ollama' as const };
    render(<SettingsTray settings={ollamaSettings} updateSettings={mockUpdateSettings} />);
    expect(screen.getByText(/Ollama Model Name/i)).toBeInTheDocument();
  });

  it('shows OpenRouter inputs when OpenRouter is selected', () => {
    const orSettings = { ...mockSettings, engine: 'openrouter' as const };
    render(<SettingsTray settings={orSettings} updateSettings={mockUpdateSettings} />);
    expect(screen.getByText(/OpenRouter API Key/i)).toBeInTheDocument();
    expect(screen.getByText(/Model ID/i)).toBeInTheDocument();
  });

  it('calls updateSettings when engine is changed', () => {
    render(<SettingsTray settings={mockSettings} updateSettings={mockUpdateSettings} />);
    const select = screen.getByDisplayValue(/Google Translate/i);
    fireEvent.change(select, { target: { value: 'ollama' } });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ engine: 'ollama' });
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../app/page';

// Mock fetch for the API call
global.fetch = jest.fn() as jest.Mock;

describe('Language Switching Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ translatedText: 'Merhaba' }),
    });
  });

  it('updates settings when source language is changed', async () => {
    render(<Home />);
    
    // Find the SOURCE select (labeled via SettingsTray)
    const sourceSelect = screen.getByDisplayValue(/English/i);
    fireEvent.change(sourceSelect, { target: { value: 'jpn' } });
    
    expect(sourceSelect).toHaveValue('jpn');
  });

  it('updates settings when target language is changed', async () => {
    render(<Home />);
    
    const targetSelect = screen.getByDisplayValue(/Turkish/i);
    fireEvent.change(targetSelect, { target: { value: 'de' } });
    
    expect(targetSelect).toHaveValue('de');
  });
});

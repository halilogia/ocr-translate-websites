import { render, screen, fireEvent } from '@testing-library/react';
import TranslationDisplay from '../components/workspace/TranslationDisplay';

describe('TranslationDisplay Component', () => {
  const mockOnCopy = jest.fn();
  const mockOnSpeak = jest.fn();
  const mockOnSelectWindow = jest.fn();
  const mockOnUploadImage = jest.fn();

  it('renders Welcome Screen when text is empty', () => {
    render(
      <TranslationDisplay 
        text="" 
        isScanning={false} 
        onCopy={mockOnCopy} 
        onSpeak={mockOnSpeak} 
        onSelectWindow={mockOnSelectWindow}
        onUploadImage={mockOnUploadImage}
      />
    );
    expect(screen.getByText(/Welcome to ZenLens/i)).toBeInTheDocument();
  });

  it('shows capture window and upload image action cards', () => {
    render(
      <TranslationDisplay 
        text="" 
        isScanning={false} 
        onCopy={mockOnCopy} 
        onSpeak={mockOnSpeak} 
        onSelectWindow={mockOnSelectWindow}
        onUploadImage={mockOnUploadImage}
      />
    );
    expect(screen.getByText(/Capture Window/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
  });

  it('renders translation result when text is provided', () => {
    render(
      <TranslationDisplay 
        text="Merhaba Dünya" 
        isScanning={false} 
        onCopy={mockOnCopy} 
        onSpeak={mockOnSpeak} 
        onSelectWindow={mockOnSelectWindow}
        onUploadImage={mockOnUploadImage}
      />
    );
    expect(screen.getByText(/Merhaba Dünya/i)).toBeInTheDocument();
  });

  it('triggers onSelectWindow when action card is clicked', () => {
    render(
      <TranslationDisplay 
        text="" 
        isScanning={false} 
        onCopy={mockOnCopy} 
        onSpeak={mockOnSpeak} 
        onSelectWindow={mockOnSelectWindow}
        onUploadImage={mockOnUploadImage}
      />
    );
    const card = screen.getByText(/Capture Window/i);
    fireEvent.click(card);
    expect(mockOnSelectWindow).toHaveBeenCalled();
  });
});

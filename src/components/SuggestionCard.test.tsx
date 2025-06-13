import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionCard } from './SuggestionCard';
import type { AiSuggestionDto } from '@/types';

describe('SuggestionCard', () => {
  const suggestion: AiSuggestionDto = {
    id: '1',
    front_suggestion: 'What is Astro?',
    back_suggestion: 'A framework for building fast websites.',
    batch_id: 'batch1',
    created_at: new Date().toISOString(),
    status: 'pending',
    user_id: 'user1',
  };

  it('should render the suggestion', () => {
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAccept={() => {}}
        onReject={() => {}}
        isProcessing={false}
      />
    );

    expect(screen.getByText('What is Astro?')).toBeInTheDocument();
    expect(screen.getByText('A framework for building fast websites.')).toBeInTheDocument();
  });

  it('should call onAccept when accept button is clicked', () => {
    const handleAccept = vi.fn();
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAccept={handleAccept}
        onReject={() => {}}
        isProcessing={false}
      />
    );

    fireEvent.click(screen.getByText('Akceptuj'));
    expect(handleAccept).toHaveBeenCalledWith('1');
  });

  it('should call onReject when reject button is clicked', () => {
    const handleReject = vi.fn();
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAccept={() => {}}
        onReject={handleReject}
        isProcessing={false}
      />
    );

    fireEvent.click(screen.getByText('Odrzuć'));
    expect(handleReject).toHaveBeenCalledWith('1');
  });

  it('should disable buttons when processing', () => {
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAccept={() => {}}
        onReject={() => {}}
        isProcessing={true}
      />
    );

    expect(screen.getByText('Akceptuj')).toBeDisabled();
    expect(screen.getByText('Odrzuć')).toBeDisabled();
  });
}); 
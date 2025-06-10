import { useState, useEffect } from "react";
import { useAiSuggestionsStore } from "@/lib/stores/useAiSuggestionsStore";
import { SuggestionCard } from "@/components/SuggestionCard";

export function SuggestionReviewer() {
  const { suggestions, acceptSuggestion, rejectSuggestion } = useAiSuggestionsStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [initialCount, setInitialCount] = useState(0);

  useEffect(() => {
    if (suggestions.length > 0) {
      setInitialCount(suggestions.length);
    }
  }, []); // Run only once on mount to capture the initial count

  useEffect(() => {
    // If there are no suggestions left and we had some initially, redirect.
    if (initialCount > 0 && suggestions.length === 0) {
      window.location.href = "/app/flashcards"; // Or wherever the user should go next
    } else if (initialCount === 0 && suggestions.length === 0) {
      // If the page is loaded without suggestions, redirect to dashboard.
      window.location.href = "/app/dashboard";
    }
  }, [suggestions, initialCount]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    await acceptSuggestion(id);
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    await rejectSuggestion(id);
    setProcessingId(null);
  };

  if (suggestions.length === 0) {
    // Render nothing or a loading/redirecting indicator while useEffect handles redirection.
    return null;
  }

  const currentCount = initialCount - suggestions.length + 1;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Weryfikuj sugestie</h2>
        <p className="text-muted-foreground">
          Przejrzyj propozycje fiszek. Zaakceptuj, aby dodać je do swojej talii,
          lub odrzuć.
        </p>
        {initialCount > 0 && (
          <p className="mt-2 text-sm font-semibold">
            Postęp: {currentCount} / {initialCount}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={handleAccept}
            onReject={handleReject}
            isProcessing={processingId === suggestion.id}
          />
        ))}
      </div>
    </div>
  );
} 
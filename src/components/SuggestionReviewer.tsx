import { useState, useEffect } from "react";
import { useAiSuggestionsStore } from "@/lib/stores/useAiSuggestionsStore";
import { SuggestionCard } from "@/components/SuggestionCard";
import { navigate } from "astro:transitions/client";
import { Button } from "@/components/ui/button";

export function SuggestionReviewer() {
  const { suggestions, acceptSuggestion, rejectSuggestion, isLoading } = useAiSuggestionsStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [initialCount, setInitialCount] = useState(0);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  // Set the initial total number of suggestions, but only once when they appear.
  useEffect(() => {
    if (suggestions.length > 0 && initialCount === 0) {
      setInitialCount(suggestions.length);
    }
  }, [suggestions, initialCount]);

  // Handle redirecting when all suggestions have been reviewed.
  useEffect(() => {
    if (initialCount > 0 && suggestions.length === 0) {
      navigate("/app/dashboard");
    }
  }, [suggestions, initialCount]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    setError(null);
    try {
      await acceptSuggestion(id);
      setProcessingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
      setError({ id, message });
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    await rejectSuggestion(id);
    setProcessingId(null);
  };

  // While generating suggestions (if user somehow lands here)
  if (isLoading) {
    return <p className="text-center">Trwa generowanie sugestii...</p>;
  }

  // If there are no suggestions AFTER the loading process is complete.
  // This handles direct access to the page.
  if (suggestions.length === 0) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Brak sugestii do weryfikacji</h2>
        <p className="text-muted-foreground">
          Wygląda na to, że nie masz żadnych oczekujących sugestii.
        </p>
        <Button onClick={() => navigate("/app/dashboard")}>Wróć do panelu</Button>
      </div>
    );
  }

  const currentCount = initialCount - suggestions.length + 1;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Weryfikuj sugestie</h2>
        <p className="text-muted-foreground">
          Przejrzyj propozycje fiszek. Zaakceptuj, aby dodać je do swojej talii, lub odrzuć.
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
            errorMessage={error && error.id === suggestion.id ? error.message : null}
          />
        ))}
      </div>
    </div>
  );
}

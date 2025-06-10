import { useState, useEffect } from "react";
import { useAiSuggestionsStore } from "@/lib/stores/useAiSuggestionsStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MIN_TEXT_LENGTH = 20;
const MAX_TEXT_LENGTH = 5000;

export function AiGeneratorForm() {
  const [text, setText] = useState("");
  const [isValid, setIsValid] = useState(false);
  const { generateSuggestions, isLoading } = useAiSuggestionsStore();

  useEffect(() => {
    const textLength = text.trim().length;
    setIsValid(textLength >= MIN_TEXT_LENGTH && textLength <= MAX_TEXT_LENGTH);
  }, [text]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || isLoading) {
      return;
    }
    generateSuggestions(text);
  };

  const getValidationMessage = () => {
    const textLength = text.trim().length;
    if (textLength > 0 && textLength < MIN_TEXT_LENGTH) {
      return `Wprowadź jeszcze ${MIN_TEXT_LENGTH - textLength} znaków.`;
    }
    if (textLength > MAX_TEXT_LENGTH) {
      return `Tekst jest za długi o ${textLength - MAX_TEXT_LENGTH} znaków.`;
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full gap-2">
        <Label htmlFor="ai-text-input">Wklej swój tekst źródłowy</Label>
        <Textarea
          id="ai-text-input"
          placeholder="Wklej tutaj swoje notatki, artykuł lub dowolny tekst, z którego chcesz stworzyć fiszki."
          value={text}
          onChange={(e) => setText(e.target.value)}
          minLength={MIN_TEXT_LENGTH}
          maxLength={MAX_TEXT_LENGTH}
          className="min-h-[200px]"
          disabled={isLoading}
        />
        {validationMessage && (
          <p className="text-sm text-red-500">{validationMessage}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Wprowadź od {MIN_TEXT_LENGTH} do {MAX_TEXT_LENGTH} znaków.
        </p>
      </div>
      <Button type="submit" disabled={!isValid || isLoading} className="w-full">
        {isLoading ? "Generowanie..." : "Generuj fiszki"}
      </Button>
    </form>
  );
} 
import { useState } from "react";
import type { Flashcard } from "src/types";

export function FlashcardGenerator() {
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFlashcards([]);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An unknown error occurred");
      }

      const data = await response.json();
      setFlashcards(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-4 text-3xl font-bold">Flashcard Generator</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full rounded-md border p-2"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here to generate flashcards..."
        />
        <button
          type="submit"
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isLoading || !text}
        >
          {isLoading ? "Generating..." : "Generate Flashcards"}
        </button>
      </form>

      {error && <div className="mt-4 rounded-md border border-red-400 bg-red-100 p-4 text-red-700">{error}</div>}

      {flashcards.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-bold">Generated Flashcards</h2>
          <div className="space-y-4">
            {flashcards.map((card, index) => (
              <div key={index} className="rounded-md border p-4">
                <p className="font-bold">Q: {card.question}</p>
                <p>A: {card.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

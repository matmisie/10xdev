import { useState, useEffect, useMemo } from "react";
import type { FlashcardDto, StudySessionState, ReviewOutcome } from "@/types";
import { toast } from "sonner";

const useStudySession = () => {
  const [sessionState, setSessionState] = useState<StudySessionState>({
    status: "loading",
    cards: [],
    currentCardIndex: 0,
    isAnswerVisible: false,
  });
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  useEffect(() => {
    const fetchReviewCards = async () => {
      try {
        const response = await fetch("/api/flashcards/review");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const cards: FlashcardDto[] = await response.json();

        if (cards.length === 0) {
          setSessionState((prev) => ({ ...prev, status: "empty" }));
        } else {
          setSessionState({
            status: "studying",
            cards,
            currentCardIndex: 0,
            isAnswerVisible: false,
          });
        }
      } catch {
        toast.error("Wystąpił błąd podczas pobierania fiszek. Spróbuj odświeżyć stronę.");
        // Optional: Set a specific error status to show a message in the UI
        // setSessionState(prev => ({ ...prev, status: 'error' }));
      }
    };

    fetchReviewCards();
  }, []);

  const showAnswer = () => {
    setSessionState((prev) => ({ ...prev, isAnswerVisible: true }));
  };

  const gradeAnswer = async (outcome: ReviewOutcome) => {
    const currentCard = sessionState.cards[sessionState.currentCardIndex];
    if (!currentCard) return;

    if (outcome === "correct") {
      setCorrectAnswersCount((prev) => prev + 1);
    }

    try {
      const response = await fetch(`/api/flashcards/${currentCard.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });

      if (!response.ok) {
        throw new Error("Failed to grade the flashcard.");
      }

      // Move to the next card or end session
      if (sessionState.currentCardIndex < sessionState.cards.length - 1) {
        setSessionState((prev) => ({
          ...prev,
          currentCardIndex: prev.currentCardIndex + 1,
          isAnswerVisible: false,
        }));
      } else {
        setSessionState((prev) => ({ ...prev, status: "summary" }));
      }
    } catch {
      toast.error("Wystąpił błąd podczas zapisywania oceny. Spróbuj ponownie.");
    }
  };

  const currentCard = useMemo(
    () => (sessionState.cards.length > 0 ? sessionState.cards[sessionState.currentCardIndex] : null),
    [sessionState.cards, sessionState.currentCardIndex]
  );

  const reviewedCount = useMemo(() => {
    if (sessionState.status === "summary") {
      return sessionState.cards.length;
    }
    return sessionState.currentCardIndex;
  }, [sessionState.status, sessionState.currentCardIndex, sessionState.cards.length]);

  return {
    ...sessionState,
    currentCard,
    reviewedCount,
    correctAnswersCount,
    showAnswer,
    gradeAnswer,
  };
};

export default useStudySession;

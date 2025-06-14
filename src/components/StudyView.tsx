import React from "react";
import useStudySession from "./hooks/useStudySession";
import EmptyState from "./EmptyState";
import FlashcardDisplay from "./FlashcardDisplay";
import SessionSummary from "./SessionSummary";

const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
  </div>
);

const StudyView = () => {
  const {
    status,
    currentCard,
    isAnswerVisible,
    reviewedCount,
    correctAnswersCount,
    showAnswer,
    gradeAnswer,
  } = useStudySession();

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "empty") {
    return <EmptyState />;
  }

  if (status === "summary") {
    return <SessionSummary reviewedCount={reviewedCount} correctAnswersCount={correctAnswersCount} />;
  }

  if (status === "studying" && currentCard) {
    return (
      <FlashcardDisplay
        card={currentCard}
        isAnswerVisible={isAnswerVisible}
        onShowAnswer={showAnswer}
        onGradeAnswer={gradeAnswer}
      />
    );
  }

  return null; // Should not be reached in normal flow
};

export default StudyView; 
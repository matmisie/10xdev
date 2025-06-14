import React from "react";
import type { FlashcardDto, ReviewOutcome } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlashcardDisplayProps {
  card: FlashcardDto;
  isAnswerVisible: boolean;
  onShowAnswer: () => void;
  onGradeAnswer: (outcome: ReviewOutcome) => void;
}

const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({
  card,
  isAnswerVisible,
  onShowAnswer,
  onGradeAnswer,
}) => {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Pytanie</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[150px]">
          <p className="text-lg">{card.front}</p>
        </CardContent>
        {isAnswerVisible && (
          <>
            <CardHeader>
              <CardTitle>Odpowiedź</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[150px]">
              <p className="text-lg">{card.back}</p>
            </CardContent>
          </>
        )}
        <CardFooter className="flex justify-end gap-4">
          {!isAnswerVisible ? (
            <Button onClick={onShowAnswer} data-test-id="show-answer-button">Pokaż odpowiedź</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onGradeAnswer("incorrect")} data-test-id="grade-incorrect-button">
                Nie wiedziałem
              </Button>
              <Button onClick={() => onGradeAnswer("correct")} data-test-id="grade-correct-button">Wiedziałem</Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default FlashcardDisplay; 
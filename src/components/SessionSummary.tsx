import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SessionSummaryProps {
  reviewedCount: number;
  correctAnswersCount: number;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ reviewedCount, correctAnswersCount }) => {
  const accuracy = reviewedCount > 0 ? ((correctAnswersCount / reviewedCount) * 100).toFixed(0) : 0;

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-2xl text-center" data-test-id="session-summary-card">
        <CardHeader>
          <CardTitle>Sesja zakończona!</CardTitle>
          <CardDescription>Gratulacje!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg">
            Powtórzono {reviewedCount} {reviewedCount === 1 ? "fiszkę" : "fiszek"}.
          </p>
          <p className="text-lg text-muted-foreground">
            Poprawne odpowiedzi: {correctAnswersCount} z {reviewedCount} ({accuracy}%)
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <a href="/app/dashboard">
            <Button data-test-id="back-to-dashboard-button">Wróć do panelu</Button>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SessionSummary; 
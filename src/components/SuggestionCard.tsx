import type { AiSuggestionDto } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface SuggestionCardProps {
  suggestion: AiSuggestionDto;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isProcessing: boolean;
  errorMessage?: string | null;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  isProcessing,
  errorMessage,
}: SuggestionCardProps) {
  const { id, front_suggestion, back_suggestion } = suggestion;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pytanie</CardTitle>
        <CardDescription>{front_suggestion}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-lg font-semibold">Odpowiedź</h3>
            <p className="text-muted-foreground">{back_suggestion}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onReject(id)} disabled={isProcessing}>
          <X className="mr-2 h-4 w-4" /> Odrzuć
        </Button>
        <Button onClick={() => onAccept(id)} disabled={isProcessing}>
          <Check className="mr-2 h-4 w-4" /> Akceptuj
        </Button>
      </CardFooter>
      {errorMessage && (
        <CardFooter>
          <p className="w-full text-center text-sm text-red-500">{errorMessage}</p>
        </CardFooter>
      )}
    </Card>
  );
}

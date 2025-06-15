import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EmptyState = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle>Brak fiszek do powtórzenia</CardTitle>
          <CardDescription>Dobra robota!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Wszystko na dziś powtórzone! Wróć jutro, aby kontynuować naukę.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <a href="/app/dashboard">
            <Button>Wróć do panelu</Button>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmptyState;

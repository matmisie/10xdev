"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Wystąpił nieznany błąd podczas rejestracji.");
      }
      
      // On successful registration, redirect immediately.
      window.location.href = "/app/dashboard";

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white/80">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white focus:border-white"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-white/80">Hasło</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white focus:border-white"
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password" className="text-white/80">Potwierdź hasło</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white focus:border-white"
              disabled={isLoading}
            />
          </div>
          {error && (
            <div className="text-red-400 bg-red-900/50 border border-red-500/50 rounded-lg p-3 text-sm font-medium" role="alert">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={isLoading}>
             {isLoading ? "Tworzenie konta..." : "Utwórz konto"}
          </Button>
          <p className="text-center text-sm text-white/60">
            Masz już konto?{" "}
            <a href="/login" className="font-semibold text-white/90 hover:text-white underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiGeneratorForm } from "@/components/AiGeneratorForm";

export function AiFlashcardGenerator() {
  return (
    <Tabs defaultValue="ai-generator" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ai-generator">Generator AI</TabsTrigger>
        <TabsTrigger value="manual-add">Dodaj ręcznie</TabsTrigger>
      </TabsList>
      <TabsContent value="ai-generator">
        <AiGeneratorForm />
      </TabsContent>
      <TabsContent value="manual-add">
        <p className="p-4 text-center text-muted-foreground">Funkcjonalność w trakcie budowy.</p>
      </TabsContent>
    </Tabs>
  );
}

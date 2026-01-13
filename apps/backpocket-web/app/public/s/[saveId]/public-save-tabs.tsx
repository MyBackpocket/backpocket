"use client";

import { BookOpen, FileText } from "lucide-react";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PublicSaveTabsProps {
  sourceContent: ReactNode;
  noteContent: ReactNode;
  hasNote: boolean;
}

export function PublicSaveTabs({ sourceContent, noteContent, hasNote }: PublicSaveTabsProps) {
  return (
    <Tabs defaultValue={hasNote ? "note" : "source"} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="source" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Source
        </TabsTrigger>
        <TabsTrigger value="note" className="gap-2">
          <FileText className="h-4 w-4" />
          Note
          {hasNote && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="source">{sourceContent}</TabsContent>

      <TabsContent value="note">{noteContent}</TabsContent>
    </Tabs>
  );
}

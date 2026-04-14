"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Lock, Globe, StickyNote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  isPrivate: boolean | null;
  authorId: string;
  createdAt: Date;
}

interface Props {
  sessionId: string;
  initialNotes: Note[];
  currentUserId: string;
}

export function NotesClient({ sessionId, initialNotes, currentUserId }: Props) {
  const t = useTranslations("session");
  const tCommon = useTranslations("common");

  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const addNote = trpc.sessions.addNote.useMutation({
    onSuccess: (note) => {
      setNotes((prev) => [...prev, note]);
      setContent("");
    },
  });

  const deleteNote = trpc.sessions.deleteNote.useMutation({
    onSuccess: (_, { noteId }) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    },
  });

  function handleAdd() {
    const trimmed = content.trim();
    if (!trimmed) return;
    addNote.mutate({ sessionId, content: trimmed, isPrivate });
  }

  return (
    <div className="space-y-3">
      {notes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
          <StickyNote className="w-8 h-8" />
          <p className="text-sm">{tCommon("noResults")}</p>
        </div>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className={cn(
            "p-3 rounded-xl border text-sm leading-relaxed group relative",
            note.isPrivate
              ? "bg-amber-50 border-amber-100 text-amber-900"
              : "bg-slate-50 border-slate-100 text-slate-800"
          )}
        >
          <div className="flex items-start gap-2">
            {note.isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{note.content}</p>
            {note.authorId === currentUserId && (
              <button
                onClick={() => deleteNote.mutate({ noteId: note.id })}
                disabled={deleteNote.isPending}
                className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="pt-2 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("notesPlaceholder")}
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
          disabled={addNote.isPending}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrivate(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                isPrivate
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <Lock className="w-3 h-3" />
              {t("isPrivate")}
            </button>
            <button
              onClick={() => setIsPrivate(false)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                !isPrivate
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              <Globe className="w-3 h-3" />
              {tCommon("view")}
            </button>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!content.trim() || addNote.isPending}>
            {t("addNote")}
          </Button>
        </div>
      </div>
    </div>
  );
}

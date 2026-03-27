"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ListChecks } from "lucide-react";

interface AgendaItem {
  id: string;
  content: string;
  addedBy: string;
}

interface Props {
  sessionId: string;
  initialItems: AgendaItem[];
  currentUserId: string;
  isRTL: boolean;
}

export function AgendaClient({ sessionId, initialItems, currentUserId, isRTL }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [newContent, setNewContent] = useState("");

  const addItem = trpc.sessions.addAgendaItem.useMutation({
    onSuccess: (item) => {
      setItems((prev) => [...prev, item]);
      setNewContent("");
    },
  });

  const removeItem = trpc.sessions.removeAgendaItem.useMutation({
    onSuccess: (_, { itemId }) => {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      router.refresh();
    },
  });

  function handleAdd() {
    const content = newContent.trim();
    if (!content) return;
    addItem.mutate({ sessionId, content });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
          <ListChecks className="w-8 h-8" />
          <p className="text-sm">{isRTL ? "لا توجد بنود في الأجندة بعد" : "No agenda items yet"}</p>
        </div>
      )}

      {items.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group"
        >
          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {idx + 1}
          </span>
          <p className="flex-1 text-sm text-slate-800 leading-relaxed">{item.content}</p>
          {item.addedBy === currentUserId && (
            <button
              onClick={() => removeItem.mutate({ itemId: item.id })}
              disabled={removeItem.isPending}
              className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {/* Add new item */}
      <div className="flex gap-2 pt-2">
        <Input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={isRTL ? "أضف بنداً للأجندة..." : "Add agenda item..."}
          className="flex-1"
          disabled={addItem.isPending}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newContent.trim() || addItem.isPending}
          className="gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? "إضافة" : "Add"}
        </Button>
      </div>
    </div>
  );
}

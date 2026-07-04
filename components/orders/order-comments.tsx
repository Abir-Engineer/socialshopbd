"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Lock } from "lucide-react";
import { formatOrderDateTime } from "@/lib/orders/map-row";
import { addOrderComment } from "@/app/(dashboard)/orders/actions";
import type { OrderCommentRow } from "@/types/orders";

type OrderCommentsProps = {
  orderId: string;
  comments: OrderCommentRow[];
  role: string;
};

export function OrderComments({ orderId, comments, role }: OrderCommentsProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isViewer = role === "viewer";

  const sorted = [...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    setIsPending(true);
    setError(null);

    const result = await addOrderComment(orderId, "Staff", content.trim(), isInternal);
    if (!result.ok) {
      setError(result.error);
    } else {
      setContent("");
      router.refresh();
    }
    setIsPending(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
        <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
      </h3>

      {!isViewer && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            disabled={isPending}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <Lock className="h-3 w-3" /> Internal note
            </label>
            <button
              type="submit"
              disabled={isPending || !content.trim()}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-3 w-3" /> Send Comment
            </button>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No comments yet. Add the first comment.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3 ${c.is_internal ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-card-foreground">{c.author}</span>
                  {c.is_internal && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      <Lock className="h-2.5 w-2.5" /> Internal
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatOrderDateTime(c.created_at)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

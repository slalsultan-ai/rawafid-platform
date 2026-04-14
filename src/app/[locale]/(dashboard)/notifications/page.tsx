"use client";

import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const t = useTranslations("notifications");

  const { data, isLoading, refetch } = trpc.notifications.list.useQuery();
  const markAll = trpc.notifications.markAllRead.useMutation({ onSuccess: () => refetch() });
  const markOne = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        {(data?.length ?? 0) > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {(data?.length ?? 0) === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.map((n) => (
            <Card
              key={n.id}
              className={n.isRead ? "" : "border-amber-200 bg-amber-50/30"}
              onClick={() => !n.isRead && markOne.mutate({ notificationId: n.id })}
            >
              <CardContent className="p-4 flex items-start gap-3 cursor-pointer">
                <Bell
                  className={`w-5 h-5 mt-0.5 shrink-0 ${
                    n.isRead ? "text-slate-300" : "text-amber-500"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    {!n.isRead && <Badge variant="warning">{t("unread")}</Badge>}
                  </div>
                  {n.body && <p className="text-sm text-slate-600 mt-1">{n.body}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

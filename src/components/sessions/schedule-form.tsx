"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Video, MapPin, Link2 } from "lucide-react";

interface MatchOption {
  id: string;
  otherPersonName: string;
  otherPersonTitle: string | null;
}

interface Props {
  matches: MatchOption[];
  locale: string;
  preselectedMatchId?: string;
}

export function ScheduleForm({ matches, locale, preselectedMatchId }: Props) {
  const router = useRouter();
  const t = useTranslations("session");
  const tCommon = useTranslations("common");

  const [matchId, setMatchId] = useState(preselectedMatchId ?? matches[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"virtual" | "in_person">("virtual");
  const [duration, setDuration] = useState(60);
  const [locationOrLink, setLocationOrLink] = useState("");
  const [error, setError] = useState("");

  const schedule = trpc.sessions.schedule.useMutation({
    onSuccess: (session) => {
      router.push(`/${locale}/sessions/${session.id}`);
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!matchId || !date || !time) {
      setError(tCommon("error"));
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`).toISOString();
    schedule.mutate({
      matchId,
      scheduledAt,
      type,
      durationMinutes: duration,
      locationOrLink: locationOrLink || undefined,
    });
  }

  const selectClass =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {!preselectedMatchId && matches.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">{t("selectMatch")}</label>
          <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className={selectClass}>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.otherPersonName}
                {m.otherPersonTitle ? ` — ${m.otherPersonTitle}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            {t("scheduledAt")} *
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {tCommon("schedule")} *
          </label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{t("duration")}</label>
        <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={selectClass}>
          {[30, 45, 60, 90, 120].map((value) => (
            <option key={value} value={value}>
              {value} {tCommon("minutes")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t("type")}</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType("virtual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              type === "virtual"
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Video className="w-4 h-4" />
            {t("virtual")}
          </button>
          <button
            type="button"
            onClick={() => setType("in_person")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              type === "in_person"
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t("inPerson")}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-slate-400" />
          {t("locationOrLink")}
        </label>
        <Input
          value={locationOrLink}
          onChange={(e) => setLocationOrLink(e.target.value)}
          placeholder={type === "virtual" ? "https://..." : ""}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full h-11" disabled={schedule.isPending}>
        {schedule.isPending ? tCommon("loading") : t("scheduleAction")}
      </Button>
    </form>
  );
}

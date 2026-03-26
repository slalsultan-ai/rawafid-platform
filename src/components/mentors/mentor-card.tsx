import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, getScoreBgColor, formatScore } from "@/lib/utils";
import { Star, Briefcase, Clock } from "lucide-react";
import Link from "next/link";
import type { User, MentorProfile } from "@/server/db/schema";

interface MentorCardProps {
  user: User;
  profile: MentorProfile;
  score?: number;
  locale: string;
  onSelect?: () => void;
  actionLabel?: string;
}

export function MentorCard({ user, profile, score, locale, onSelect, actionLabel }: MentorCardProps) {
  const isRTL = locale === "ar";
  const skills = (profile.skills as Array<{ id: string; nameAr: string; nameEn: string }>) ?? [];
  const areas = (profile.areasOfExpertise as Array<{ id: string; nameAr: string; nameEn: string }>) ?? [];

  const getLabel = (item: { nameAr: string; nameEn: string }) =>
    isRTL ? item.nameAr : item.nameEn;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
              <p className="text-sm text-slate-500 truncate">{user.jobTitle}</p>
              <p className="text-xs text-slate-400">{user.department}</p>
            </div>
            {score !== undefined && (
              <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold ${getScoreBgColor(score)}`}>
                {formatScore(score)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Briefcase className="w-3.5 h-3.5" />
              {user.yearsOfExperience} {isRTL ? "سنة خبرة" : "yrs exp"}
            </span>
            {profile.averageRating && profile.totalRatings && profile.totalRatings > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                {(profile.averageRating / 10).toFixed(1)}
              </span>
            )}
            <Badge
              variant={
                profile.sessionPreference === "virtual"
                  ? "default"
                  : profile.sessionPreference === "in_person"
                  ? "secondary"
                  : "outline"
              }
              className="text-xs"
            >
              {profile.sessionPreference === "virtual"
                ? isRTL ? "افتراضي" : "Virtual"
                : profile.sessionPreference === "in_person"
                ? isRTL ? "حضوري" : "In Person"
                : isRTL ? "كلاهما" : "Both"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Expertise areas */}
      {areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {areas.slice(0, 3).map((area) => (
            <Badge key={area.id} variant="secondary" className="text-xs">
              {getLabel(area)}
            </Badge>
          ))}
          {areas.length > 3 && (
            <Badge variant="outline" className="text-xs">+{areas.length - 3}</Badge>
          )}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.slice(0, 4).map((skill) => (
            <span key={skill.id} className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {getLabel(skill)}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="text-xs text-slate-500 px-2 py-0.5">+{skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Motivation preview */}
      {profile.motivation && (
        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {profile.motivation}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link href={`/${locale}/mentors/${user.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            {isRTL ? "عرض الملف" : "View Profile"}
          </Button>
        </Link>
        {onSelect && actionLabel && (
          <Button size="sm" onClick={onSelect} className="flex-1">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

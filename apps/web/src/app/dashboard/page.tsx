"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/DashboardHeader";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth, getUserJobRole } from "@/contexts/AuthContext";

interface ScheduledMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  platform: "Native" | "Zoom" | "Google Meet" | "Teams";
  participants: { name: string; initials: string; color: string }[];
  status: "upcoming" | "live" | "ended";
}

interface RecentMeeting {
  id: string;
  title: string;
  type: "native" | "external" | "channel";
  platform: string;
  date: string;
  duration: string | null;
  languages: string[];
  status: string;
  participantCount: number;
  href: string;
}

const DEFAULT_MEETINGS: ScheduledMeeting[] = [];

function getScheduleDateRange(): { today: string; weekEnd: string } {
  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];
  return { today, weekEnd };
}

export default function MainDashboardPage() {
  const router = useRouter();
  const { isOrganization, currentWorkspace, hasPermission, members, fetchMembers } = useWorkspace();
  const { user } = useAuth();

  const [externalLink, setExternalLink] = useState("");

  // Schedule state
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(DEFAULT_MEETINGS);
  const [scheduleTab, setScheduleTab] = useState<"today" | "week" | "all">(
    "today",
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: "",
    time: "",
    duration: "30m",
    platform: "Native" as ScheduledMeeting["platform"],
  });

  // Real data state
  const [recentMeetings, setRecentMeetings] = useState<RecentMeeting[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [weeklyMeetings, setWeeklyMeetings] = useState<RecentMeeting[]>([]);

  const isOrg = isOrganization();

  const fetchRecentMeetings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "6" });
      if (isOrg) params.set("workspaceId", currentWorkspace.id);
      const res = await fetch(`/api/meetings/recent?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRecentMeetings(data);
      }
    } catch (e) {
      console.warn("Could not fetch recent meetings:", e);
    }
  }, [isOrg, currentWorkspace.id]);

  const fetchLiveCount = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (isOrg) params.set("workspaceId", currentWorkspace.id);
      const res = await fetch(`/api/meetings/live-count?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLiveCount(data.liveCount);
      }
    } catch (e) {
      console.warn("Could not fetch live count:", e);
    }
  }, [isOrg, currentWorkspace.id]);

  const fetchWeeklyMeetings = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (isOrg) params.set("workspaceId", currentWorkspace.id);
      const res = await fetch(`/api/meetings/recent?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklyMeetings(data);
      }
    } catch (e) {
      console.warn("Could not fetch weekly meetings:", e);
    }
  }, [isOrg, currentWorkspace.id]);

  // Fetch scheduled meetings from API
  const fetchScheduledMeetings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (isOrg) params.set("workspaceId", currentWorkspace.id);
      const res = await fetch(`/api/meetings/schedule?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: ScheduledMeeting[] = (data as any[]).map((m) => {
          const d = new Date(m.scheduledAt);
          return {
            id: m.id,
            title: m.title,
            date: d.toISOString().split("T")[0],
            time: d.toTimeString().split(" ")[0].slice(0, 5),
            duration: m.duration,
            platform: m.platform,
            participants: [{ name: user?.fullName || "You", initials: (user?.fullName || "U").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase(), color: "bg-border text-ink" }],
            status: m.status,
          };
        });
        setMeetings(mapped);
      }
    } catch (e) {
      console.warn("Could not fetch scheduled meetings:", e);
    }
  }, [isOrg, currentWorkspace.id, user?.fullName]);

  // Fetch real data
  useEffect(() => {
    fetchRecentMeetings();
    fetchLiveCount();
    fetchWeeklyMeetings();
    fetchScheduledMeetings();
    if (isOrg) fetchMembers();
  }, [fetchRecentMeetings, fetchLiveCount, fetchWeeklyMeetings, fetchScheduledMeetings, isOrg, fetchMembers]);

  // Compute weekly streak from real data
  const weeklyStreak = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Map<string, number>();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    weeklyMeetings.forEach((m) => {
      const d = new Date(m.date);
      if (d >= weekStart) {
        const day = dayNames[d.getDay()];
        counts.set(day, (counts.get(day) || 0) + 1);
      }
    });

    const maxCount = Math.max(...Array.from(counts.values()), 1);
    return ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => ({
      day,
      count: counts.get(day) || 0,
      height: counts.has(day) ? ((counts.get(day) || 0) / maxCount) * 100 : 0,
    }));
  }, [weeklyMeetings]);

  // Compute weekly total
  const weeklyTotal = useMemo(
    () => weeklyStreak.reduce((sum, d) => sum + d.count, 0),
    [weeklyStreak],
  );

  // Extract real action items from recent meeting summaries
  const actionItems = useMemo(() => {
    const items: Array<{ text: string; source: string }> = [];
    recentMeetings.forEach((m) => {
      if (items.length >= 3) return;
      items.push({ text: m.title, source: m.platform });
    });
    return items.length > 0
      ? items
      : [
          { text: "Start a meeting to see action items", source: "Relay AI" },
        ];
  }, [recentMeetings]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatRelativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHr = Math.floor(diffMs / 3600000);
    if (diffHr < 1) return "Just now";
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 0) return "Today";
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const platformIcon = (type: string, platform: string) => {
    if (type === "native") return "videocam";
    if (type === "channel") return "tag";
    if (platform === "Zoom") return "videocam";
    if (platform === "Microsoft Teams") return "meeting_room";
    return "groups";
  };

  const langName = (code: string) => {
    const map: Record<string, string> = {
      en: "EN", es: "ES", zh: "ZH", ar: "AR", ja: "JA",
      fr: "FR", de: "DE", ko: "KO", pt: "PT", hi: "HI",
    };
    return map[code.toLowerCase()] || code.toUpperCase();
  };

  // Filter meetings
  const filteredMeetings = useMemo(() => {
    const { today, weekEnd } = getScheduleDateRange();
    return meetings
      .filter((m) => m.status !== "ended")
      .filter((m) => {
        if (scheduleTab === "today") return m.date === today;
        if (scheduleTab === "week") return m.date >= today && m.date <= weekEnd;
        return true;
      })
      .sort((a, b) => {
        if (a.date === b.date) return a.time.localeCompare(b.time);
        return a.date.localeCompare(b.date);
      });
  }, [meetings, scheduleTab]);

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim() || !newMeeting.date || !newMeeting.time)
      return;
    try {
      const scheduledAt = new Date(`${newMeeting.date}T${newMeeting.time}`);
      const res = await fetch("/api/meetings/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newMeeting.title.trim(),
          scheduledAt: scheduledAt.toISOString(),
          duration: newMeeting.duration,
          platform: newMeeting.platform,
          workspaceId: isOrg ? currentWorkspace.id : undefined,
        }),
      });
      if (res.ok) {
        await fetchScheduledMeetings();
        setNewMeeting({
          title: "",
          date: "",
          time: "",
          duration: "30m",
          platform: "Native",
        });
        setShowScheduleModal(false);
      }
    } catch (e) {
      console.warn("Could not create scheduled meeting:", e);
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/schedule/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (e) {
      console.warn("Could not delete scheduled meeting:", e);
    }
  };

  const joinMeeting = (meeting: ScheduledMeeting) => {
    if (meeting.platform === "Native") {
      const roomName = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/meeting/${roomName}?create=1`);
    } else {
      router.push(`/dashboard/external-meeting`);
    }
  };

  const handleStartNativeMeeting = () => {
    const roomName = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/meeting/${roomName}?create=1`);
  };

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader
          searchPlaceholder={
            isOrganization()
              ? "Search channels, logs, or team..."
              : "Search meetings, insights, or people..."
          }
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink">
                    {isOrganization()
                      ? currentWorkspace.name
                      : `${getGreeting()}, ${user?.fullName?.split(" ")[0] || "there"}`}
                  </h1>
                  {(() => {
                    const role = isOrganization()
                      ? currentWorkspace.role
                      : null;
                    const jobRole = getUserJobRole(user);
                    if (role) {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-md ">
                          <span className="material-symbols-outlined text-[13px]">
                            {role === "owner"
                              ? "shield"
                              : role === "admin"
                                ? "admin_panel_settings"
                                : "person"}
                          </span>
                          {role}
                        </span>
                      );
                    }
                    if (jobRole) {
                      return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface text-ink text-[13px] font-bold tracking-wide shadow-card border border-border">
                          {jobRole}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <p className="text-muted text-base sm:text-lg">
                  {isOrganization()
                    ? `${recentMeetings.length > 0 ? `${recentMeetings.length} recent meetings` : "Welcome to your team hub"}`
                    : "Your cross-border meetings and AI translation studio."}
                </p>
              </div>
            </div>

            {/* Hero Meeting Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div
                onClick={handleStartNativeMeeting}
                className="group bg-surface text-ink p-5 sm:p-8 rounded-xl flex flex-col justify-between min-h-[200px] sm:min-h-[220px] hover:shadow-pop hover: hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-border hover:border-accent/30 cursor-pointer"
              >                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-chrome rounded-xl flex items-center justify-center shadow-lg  mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[24px]">
                        video_call
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mb-2">
                      Native Meeting
                    </h2>
                    <p className="text-muted text-sm leading-relaxed max-w-xs">
                      Start a meeting with real-time AI translation and live
                      captions built in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartNativeMeeting();
                    }}
                    className="mt-6 bg-accent text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm shadow-lg  flex items-center justify-center gap-2 group/btn w-fit hover:scale-105 transition-all"
                  >
                    Start Meeting
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              <div className="group bg-surface border border-border/30 p-5 sm:p-8 rounded-xl flex flex-col justify-between min-h-[200px] sm:min-h-[220px] hover:shadow-pop hover:-translate-y-1 hover:border-accent/30 transition-all duration-300 relative overflow-hidden">                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-chrome flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg ">
                    <span className="material-symbols-outlined text-white text-[24px]">
                      link
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mb-2">
                    External Meeting
                  </h2>
                  <p className="text-muted text-sm leading-relaxed max-w-xs">
                    Paste a Zoom, Google Meet, or Teams link to join with live
                    translation overlay.
                  </p>
                </div>
                <form
                  className="relative flex flex-col sm:flex-row gap-3 mt-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (externalLink.trim()) {
                      router.push(
                        `/dashboard/external-meeting?url=${encodeURIComponent(externalLink)}`,
                      );
                    }
                  }}
                >
                  <input
                    type="url"
                    placeholder="Paste meeting link..."
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    className="flex-1 bg-canvas border border-border/30 rounded-full py-3 px-5 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!externalLink.trim()}
                    className="bg-accent text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg "
                  >
                    Join
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_forward
                    </span>
                  </button>
                </form>
              </div>
            </div>

            {/* Context-Dependent Sections */}
            {isOrganization() ? (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                  {[
                    {
                      label: "Members",
                      value: String(members.length || 0),
                      icon: "group",
                      color:
                        "bg-chrome text-white shadow-lg ",
                    },
                    {
                      label: "Live Now",
                      value: String(liveCount),
                      icon: "cell_tower",
                      color:
                        liveCount > 0
                          ? "bg-accent/10 text-accent shadow-pop border border-accent/20"
                          : "bg-surface text-ink shadow-pop border border-border",
                    },
                    {
                      label: "Channels",
                      value: "5",
                      icon: "tag",
                      color:
                        "bg-chrome text-white shadow-lg ",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="group bg-surface border border-border/30 rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 shadow-card hover:shadow-card hover:-translate-y-0.5 hover:border-accent/30 transition-all duration-300 cursor-default first:col-span-2 sm:first:col-span-1"
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}
                      >
                        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                          {stat.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-ink leading-none">
                          {stat.value}
                        </p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Now Card */}
                {meetings.some((m) => m.status === "live") && (
                  <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">                    <div className="flex items-center gap-4 relative min-w-0">
                      <div className="relative flex h-3 w-3 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink font-bold text-sm">
                          Meeting in Progress
                        </p>
                        <p className="text-muted text-xs mt-0.5 truncate">
                          {meetings.find((m) => m.status === "live")?.title} —{" "}
                          {
                            meetings.find((m) => m.status === "live")
                              ?.participants.length
                          }{" "}
                          participants
                        </p>
                      </div>
                    </div>
                    <button className="bg-accent text-white px-5 py-2.5 rounded-full text-xs font-bold hover:scale-105 transition-all duration-200 shadow-lg  relative flex items-center justify-center gap-2 self-start sm:self-auto">
                      <span className="material-symbols-outlined text-[16px]">
                        videocam
                      </span>
                      Join Now
                    </button>
                  </div>
                )}

                {/* Recent Meetings — Grid Cards (Org) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                      <span className="material-symbols-outlined text-muted text-[20px]">
                        history
                      </span>
                      Recent Meetings
                    </h2>
                    <Link href="/dashboard/native-meeting" className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-accent-deep transition-colors">
                      View All
                    </Link>
                  </div>

                  {recentMeetings.length === 0 ? (
                    <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-card">
                      <div className="w-16 h-16 bg-chrome rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ">
                        <span className="material-symbols-outlined text-white text-[32px]">
                          videocam_off
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-ink mb-2">
                        No meetings yet
                      </h3>
                      <p className="text-muted text-sm">
                        Start your first meeting to see it here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recentMeetings.map((meeting) => (
                        <Link
                          key={meeting.id}
                          href={meeting.href}
                          className="bg-surface border border-border p-5 rounded-xl shadow-card hover:shadow-pop hover:border-accent/30 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                  meeting.status === "active" || meeting.status === "ended"
                                    ? "bg-chrome text-white border-accent/30"
                                    : "bg-canvas text-muted border-border/20"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {platformIcon(meeting.type, meeting.platform)}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                {meeting.languages.length > 0 && (
                                  <span className="bg-canvas border border-border/20 text-muted px-2 py-0.5 rounded text-[9px] font-bold">
                                    {meeting.languages.slice(0, 2).map(langName).join(" | ")}
                                  </span>
                                )}
                                <span className="bg-accent text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-sm">
                                  {meeting.platform}
                                </span>
                              </div>
                            </div>
                            <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                              {meeting.title}
                            </h3>
                            <p className="text-muted text-xs">
                              {formatRelativeDate(meeting.date)} · {meeting.duration || "In progress"} · {meeting.participantCount} participants
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="w-6 h-6 rounded-full bg-border text-ink flex items-center justify-center text-[8px] font-bold">
                              {meeting.participantCount}
                            </div>
                            <span className="material-symbols-outlined text-faint text-[18px] group-hover:text-accent transition-colors">
                              arrow_forward
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Items + Quick AI Query & Weekly Streak */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Action Items */}
                  <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden">                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-accent text-[18px]">
                            check_circle
                          </span>
                          <span className="text-sm font-bold text-ink">
                            Action Items
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                          This Week
                        </span>
                      </div>
                      <div className="space-y-3">
                        {actionItems.map((item, i) => (
                           <div
                             key={i}
                             className="flex items-center gap-3 p-3 rounded-xl bg-canvas border border-border/20 hover:border-accent/20 transition-all cursor-pointer group"
                           >
                             <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                               <span className="text-[10px] font-bold text-accent">
                                 {i + 1}
                               </span>
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-ink/90 text-sm font-medium group-hover:text-ink transition-colors truncate">
                                 {item.text}
                               </p>
                               <p className="text-muted text-xs mt-0.5">
                                 from {item.source}
                               </p>
                             </div>
                             <span className="material-symbols-outlined text-faint text-[16px] group-hover:text-accent transition-colors flex-shrink-0">
                               check
                             </span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quick AI Query + Weekly Streak */}
                  <div className="space-y-6">
                    {/* Quick AI Query */}
                    <div className="bg-surface border border-accent/20 rounded-xl p-4 sm:p-5 shadow-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-chrome flex items-center justify-center shadow-md  flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-[18px]">
                            smart_toy
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink">
                            Ask About Your Meetings
                          </p>
                          <p className="text-[10px] text-muted">
                            Powered by AI Query Studio
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. What were the key decisions last week?"
                          className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 pr-12 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all"
                          readOnly
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-accent text-[18px]">
                          auto_awesome
                        </span>
                      </div>
                    </div>

                    {/* Weekly Streak */}
                    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-ink">
                          This Week
                        </h3>
                        <span className="text-xs font-bold text-accent">
                           {weeklyTotal} meetings
                         </span>
                      </div>
                      <div className="flex items-end gap-2 h-20">
                        {weeklyStreak.map((bar) => (
                          <div
                            key={bar.day}
                            className="flex-1 flex flex-col items-center gap-1.5"
                          >
                            <div
                              className="w-full relative"
                              style={{ height: `${bar.height}%` }}
                            >
                              <div className="absolute inset-0 bg-accent rounded-lg" />
                            </div>
                            <span className="text-[9px] font-bold text-muted uppercase">
                              {bar.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-card hover:shadow-card transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink">
                      Recent Activity
                    </h2>
                    <Link href="/dashboard/channels" className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-accent-deep transition-colors flex-shrink-0">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {recentMeetings.length === 0 ? (
                      <p className="text-muted text-sm text-center py-4">No recent activity</p>
                    ) : (
                      recentMeetings.slice(0, 3).map((meeting) => (
                        <Link
                          key={meeting.id}
                          href={meeting.href}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-canvas border border-border/20 rounded-xl hover:border-accent/30 transition-all cursor-pointer group"
                        >
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meeting.status === "active" ? "bg-accent text-white" : "bg-surface text-accent border border-accent/20"}`}
                          >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                              {platformIcon(meeting.type, meeting.platform)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-ink text-sm">
                                {meeting.title}
                              </span>
                              <span className="text-muted text-xs">
                                · {formatRelativeDate(meeting.date)}
                              </span>
                            </div>
                            <p className="text-sm text-muted mt-0.5 truncate">
                              {meeting.platform} · {meeting.participantCount} participants
                            </p>
                          </div>
                          {meeting.status === "active" ? (
                            <span className="bg-accent text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                              <span className="w-1.5 h-1.5 bg-surface rounded-full animate-pulse" />
                              Live
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-faint text-[18px] group-hover:text-accent transition-colors flex-shrink-0">
                              chevron_right
                            </span>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {hasPermission("owner") && (
                  <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-card">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink mb-5">
                      Quick Management
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        {
                          href: "/dashboard/settings",
                          icon: "group",
                          label: "Manage Members",
                          sub: "Invite & roles",
                          iconBg:
                            "bg-chrome text-white shadow-md  group-hover:shadow-pop",
                        },
                        {
                          href: "/dashboard/channels",
                          icon: "tag",
                          label: "Channels",
                          sub: "Team spaces",
                          iconBg:
                            "bg-surface text-ink shadow-card border border-border group-hover:shadow-pop",
                        },
                        {
                          href: "/dashboard/billing",
                          icon: "payments",
                          label: "Billing",
                          sub: "Plans & usage",
                          iconBg:
                            "bg-chrome text-white shadow-md  group-hover:shadow-pop",
                        },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group flex items-center gap-4 p-4 border border-border/30 rounded-xl hover:border-accent/30 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${item.iconBg}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {item.icon}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-ink">
                              {item.label}
                            </p>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
                              {item.sub}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Recent Meetings — Grid Cards (Personal) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                      <span className="material-symbols-outlined text-muted text-[20px]">
                        history
                      </span>
                      Recent Meetings
                    </h2>
                    <Link href="/dashboard/external-meeting" className="text-[10px] font-bold text-accent uppercase tracking-widest hover:text-accent-deep transition-colors">
                      View All
                    </Link>
                  </div>

                  {recentMeetings.length === 0 ? (
                    <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-card">
                      <div className="w-16 h-16 bg-chrome rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ">
                        <span className="material-symbols-outlined text-white text-[32px]">
                          videocam_off
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-ink mb-2">
                        No meetings yet
                      </h3>
                      <p className="text-muted text-sm">
                        Start your first meeting to see it here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recentMeetings.map((meeting) => (
                        <Link
                          key={meeting.id}
                          href={meeting.href}
                          className="bg-surface border border-border p-5 rounded-xl shadow-card hover:shadow-pop hover:border-accent/30 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col justify-between min-h-[170px]"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                  meeting.status === "active" || meeting.status === "ended"
                                    ? "bg-chrome text-white border-accent/30"
                                    : "bg-canvas text-muted border-border/20"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {platformIcon(meeting.type, meeting.platform)}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                {meeting.languages.length > 0 && (
                                  <span className="bg-canvas border border-border/20 text-muted px-2 py-0.5 rounded text-[9px] font-bold">
                                    {meeting.languages.slice(0, 2).map(langName).join(" | ")}
                                  </span>
                                )}
                                <span className="bg-accent text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-sm">
                                  {meeting.platform}
                                </span>
                              </div>
                            </div>
                            <h3 className="font-bold text-ink mb-1 group-hover:text-accent transition-colors">
                              {meeting.title}
                            </h3>
                            <p className="text-muted text-xs">
                              {formatRelativeDate(meeting.date)} · {meeting.duration || "In progress"} · {meeting.participantCount} participants
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="w-6 h-6 rounded-full bg-border text-ink flex items-center justify-center text-[8px] font-bold">
                              {meeting.participantCount}
                            </div>
                            <span className="material-symbols-outlined text-faint text-[18px] group-hover:text-accent transition-colors">
                              arrow_forward
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Items + Quick AI Query & Weekly Streak */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Action Items */}
                  <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 relative overflow-hidden">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-accent text-[18px]">
                            check_circle
                          </span>
                          <span className="text-sm font-bold text-ink">
                            Action Items
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                          This Week
                        </span>
                      </div>
                      <div className="space-y-3">
                        {actionItems.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-canvas border border-border/20 hover:border-accent/20 transition-all cursor-pointer group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-accent">
                                {i + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-ink/90 text-sm font-medium group-hover:text-ink transition-colors truncate">
                                {item.text}
                              </p>
                              <p className="text-muted text-xs mt-0.5">
                                from {item.source}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-faint text-[16px] group-hover:text-accent transition-colors flex-shrink-0">
                              check
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quick AI Query + Weekly Streak */}
                  <div className="space-y-6">
                    {/* Quick AI Query */}
                    <div className="bg-surface border border-accent/20 rounded-xl p-4 sm:p-5 shadow-card">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-chrome flex items-center justify-center shadow-md  flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-[18px]">
                            smart_toy
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ink">
                            Ask About Your Meetings
                          </p>
                          <p className="text-[10px] text-muted">
                            Powered by AI Query Studio
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. What were the key decisions last week?"
                          className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 pr-12 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all"
                          readOnly
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-accent text-[18px]">
                          auto_awesome
                        </span>
                      </div>
                    </div>

                    {/* Weekly Streak */}
                    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-ink">
                          This Week
                        </h3>
                        <span className="text-xs font-bold text-accent">
                          {weeklyTotal} meetings
                        </span>
                      </div>
                      <div className="flex items-end gap-2 h-20">
                        {weeklyStreak.map((bar) => (
                          <div
                            key={bar.day}
                            className="flex-1 flex flex-col items-center gap-1.5"
                          >
                            <div
                              className="w-full relative"
                              style={{ height: `${bar.height}%` }}
                            >
                              <div className="absolute inset-0 bg-accent rounded-lg" />
                            </div>
                            <span className="text-[9px] font-bold text-muted uppercase">
                              {bar.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                        <span className="material-symbols-outlined text-muted text-[20px]">
                          calendar_month
                        </span>
                        Upcoming Schedule
                      </h2>
                      <div className="flex gap-1 bg-canvas p-1 rounded-xl overflow-x-auto no-scrollbar">
                        {(["today", "week", "all"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setScheduleTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap flex-shrink-0 ${
                              scheduleTab === tab
                                ? "bg-accent text-white shadow-md "
                                : "text-muted hover:text-accent"
                            }`}
                          >
                            {tab === "week"
                              ? "This Week"
                              : tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:brightness-105 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/5 self-start w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        add
                      </span>
                      Schedule
                    </button>
                  </div>

                  {filteredMeetings.length === 0 ? (
                    <div className="py-10 sm:py-12 text-center">
                      <div className="w-16 h-16 bg-chrome rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg ">
                        <span className="material-symbols-outlined text-white text-[32px]">
                          event_busy
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-ink mb-2">
                        No meetings scheduled
                      </h3>
                      <p className="text-muted text-sm mb-4">
                        {scheduleTab === "today"
                          ? "Your calendar is clear for today."
                          : "No meetings in this time range."}
                      </p>
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:brightness-105 transition-all"
                      >
                        Schedule a Meeting
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMeetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-canvas border border-border/20 rounded-xl hover:border-accent/30 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="text-center w-16 sm:w-20 flex-shrink-0">
                              <p className="font-bold text-ink text-sm">
                                {formatDate(meeting.date)}
                              </p>
                              <p className="text-muted text-xs">
                                {formatTime(meeting.time)} · {meeting.duration}
                              </p>
                            </div>
                            <div className="w-px h-10 bg-border/60 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-ink text-sm group-hover:text-accent transition-colors truncate">
                                  {meeting.title}
                                </p>
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                    meeting.platform === "Native"
                                      ? "bg-accent/10 text-accent border border-accent/20"
                                      : "bg-canvas text-muted border border-border"
                                  }`}
                                >
                                  {meeting.platform}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex -space-x-1.5">
                                  {meeting.participants
                                    .slice(0, 3)
                                    .map((p, i) => (
                                      <div
                                        key={i}
                                        className={`w-5 h-5 rounded-full border-2 border-white ${p.color} flex items-center justify-center text-[7px] font-bold`}
                                        title={p.name}
                                      >
                                        {p.initials}
                                      </div>
                                    ))}
                                  {meeting.participants.length > 3 && (
                                    <div className="w-5 h-5 rounded-full border-2 border-white bg-border text-muted flex items-center justify-center text-[7px] font-bold">
                                      +{meeting.participants.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-muted text-xs">
                                  {meeting.participants.length} participant
                                  {meeting.participants.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-0 sm:ml-4 pl-[4.5rem] sm:pl-0">
                            <button
                              onClick={() => joinMeeting(meeting)}
                              className="bg-accent text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:brightness-105 hover:scale-105 transition-all duration-200 flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {meeting.platform === "Native"
                                  ? "videocam"
                                  : "link"}
                              </span>
                              Join
                            </button>
                            <button
                              onClick={() => deleteMeeting(meeting.id)}
                              className="w-8 h-8 rounded-xl border border-border/30 flex items-center justify-center text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all flex-shrink-0"
                              title="Remove meeting"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                close
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-chrome/50 backdrop-blur-sm p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-surface rounded-xl shadow-2xl border border-border/30 w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-border/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">
                  Schedule a Meeting
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-8 h-8 rounded-xl border border-border/30 flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>
            </div>
            <form onSubmit={addMeeting} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) =>
                    setNewMeeting((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Client Sync, Design Review..."
                  className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 text-sm text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 text-sm text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                    Duration
                  </label>
                  <select
                    value={newMeeting.duration}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 text-sm text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                  >
                    <option value="15m">15 minutes</option>
                    <option value="30m">30 minutes</option>
                    <option value="45m">45 minutes</option>
                    <option value="60m">1 hour</option>
                    <option value="90m">1.5 hours</option>
                    <option value="120m">2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-widest mb-1.5">
                    Platform
                  </label>
                  <select
                    value={newMeeting.platform}
                    onChange={(e) =>
                      setNewMeeting((prev) => ({
                        ...prev,
                        platform: e.target
                          .value as ScheduledMeeting["platform"],
                      }))
                    }
                    className="w-full bg-canvas border border-border/30 rounded-xl py-3 px-4 text-sm text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-black/5 transition-all"
                  >
                    <option value="Native">Relay Native</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Teams">Microsoft Teams</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-muted hover:bg-canvas transition-colors border border-border/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:scale-[1.02] transition-all duration-200 shadow-lg "
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

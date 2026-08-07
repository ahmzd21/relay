"use client";
import React, { useState, useEffect, useMemo } from "react";
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

const MOCK_PARTICIPANTS = [
  {
    name: "Elias Thompson",
    initials: "ET",
    color: "bg-indigo-100 text-indigo-700",
  },
  { name: "Sarah Chen", initials: "SC", color: "bg-rose-100 text-rose-700" },
  {
    name: "Yousef Al-Rashid",
    initials: "YA",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Sofia Martinez",
    initials: "SM",
    color: "bg-emerald-100 text-emerald-700",
  },
  { name: "Wei Zhang", initials: "WZ", color: "bg-blue-100 text-blue-700" },
  {
    name: "Marcus Klein",
    initials: "MK",
    color: "bg-purple-100 text-purple-700",
  },
  { name: "Priya Sharma", initials: "PS", color: "bg-pink-100 text-pink-700" },
];

const DEFAULT_MEETINGS: ScheduledMeeting[] = [
  {
    id: "mtg-1",
    title: "Client Sync: Website Redesign",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    duration: "45m",
    platform: "Zoom",
    participants: [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[1],
      MOCK_PARTICIPANTS[2],
    ],
    status: "upcoming",
  },
  {
    id: "mtg-2",
    title: "Interview: Frontend Dev",
    date: new Date().toISOString().split("T")[0],
    time: "14:30",
    duration: "60m",
    platform: "Google Meet",
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[3]],
    status: "upcoming",
  },
  {
    id: "mtg-3",
    title: "Design Review",
    date: new Date().toISOString().split("T")[0],
    time: "16:00",
    duration: "30m",
    platform: "Native",
    participants: [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[4],
      MOCK_PARTICIPANTS[5],
      MOCK_PARTICIPANTS[6],
    ],
    status: "upcoming",
  },
  {
    id: "mtg-4",
    title: "Weekly Team Standup",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "09:00",
    duration: "15m",
    platform: "Native",
    participants: [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[1],
      MOCK_PARTICIPANTS[2],
      MOCK_PARTICIPANTS[3],
    ],
    status: "upcoming",
  },
  {
    id: "mtg-5",
    title: "Product Roadmap Planning",
    date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    time: "11:00",
    duration: "90m",
    platform: "Google Meet",
    participants: [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[5],
      MOCK_PARTICIPANTS[6],
    ],
    status: "upcoming",
  },
];

const RECENT_MEETINGS = [
  {
    id: "rm-1",
    title: "Client Sync: Website Redesign",
    timeAgo: "2h ago",
    platform: "Zoom" as const,
    participants: [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[1],
      MOCK_PARTICIPANTS[2],
    ],
  },
  {
    id: "rm-2",
    title: "Weekly Team Standup",
    timeAgo: "Yesterday",
    platform: "Native" as const,
    participants: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1]],
  },
  {
    id: "rm-3",
    title: "Design Review",
    timeAgo: "2 days ago",
    platform: "Google Meet" as const,
    participants: [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[4],
      MOCK_PARTICIPANTS[5],
    ],
  },
];

const WEEKLY_STREAK = [
  { day: "Mon", height: 80, count: 2 },
  { day: "Tue", height: 60, count: 1 },
  { day: "Wed", height: 100, count: 3 },
  { day: "Thu", height: 40, count: 1 },
  { day: "Fri", height: 70, count: 2 },
];

const ACTION_ITEMS = [
  { text: "Finalize API schema", source: "Client Sync" },
  { text: "Schedule vendor follow-up", source: "Roadmap Planning" },
  { text: "Review frontend candidates", source: "Interview Session" },
];

function getScheduleDateRange(): { today: string; weekEnd: string } {
  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];
  return { today, weekEnd };
}

export default function MainDashboardPage() {
  const router = useRouter();
  const { isOrganization, currentWorkspace, hasPermission } = useWorkspace();
  const { user } = useAuth();

  const [externalLink, setExternalLink] = useState("");

  // Schedule state
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_MEETINGS;
    const saved = localStorage.getItem("relay-scheduled-meetings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_MEETINGS;
      }
    }
    return DEFAULT_MEETINGS;
  });
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

  // Persist to localStorage
  useEffect(() => {
    if (meetings.length > 0) {
      localStorage.setItem(
        "relay-scheduled-meetings",
        JSON.stringify(meetings),
      );
    }
  }, [meetings]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const orgFeed = [
    {
      id: 101,
      type: "channel" as const,
      name: "#engineering",
      activity: "Sarah Chen started a live meeting",
      time: "Just now",
      live: true,
    },
    {
      id: 102,
      type: "insight" as const,
      name: "#marketing",
      activity: 'AI Transcript summary generated for "Q3 Campaign Review"',
      time: "2 hours ago",
      live: false,
    },
    {
      id: 103,
      type: "channel" as const,
      name: "#leadership",
      activity: "Elias Thompson uploaded 3 files",
      time: "Yesterday",
      live: false,
    },
  ];

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

  const addMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim() || !newMeeting.date || !newMeeting.time)
      return;
    const participants = [
      MOCK_PARTICIPANTS[0],
      MOCK_PARTICIPANTS[
        Math.floor(Math.random() * (MOCK_PARTICIPANTS.length - 1)) + 1
      ],
    ];
    const meeting: ScheduledMeeting = {
      id: "mtg-" + Date.now(),
      ...newMeeting,
      participants,
      status: "upcoming",
    };
    setMeetings((prev) => [...prev, meeting]);
    setNewMeeting({
      title: "",
      date: "",
      time: "",
      duration: "30m",
      platform: "Native",
    });
    setShowScheduleModal(false);
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  const joinMeeting = (meeting: ScheduledMeeting) => {
    if (meeting.platform === "Native") {
      // These are the signed-in user's own scheduled meetings, so they are the
      // organizer and may start the room.
      router.push(`/meeting/${meeting.id}?create=1`);
    } else {
      router.push(`/dashboard/external-meeting`);
    }
  };

  const handleStartNativeMeeting = () => {
    const meetingId = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/meeting/${meetingId}?create=1`);
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
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-helvetica tracking-tight text-slate-900">
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white text-[10px] font-bold uppercase tracking-widest shadow-md shadow-[#FF416C]/20">
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFFDF8] text-[#1c1b1b] text-[13px] font-bold tracking-wide shadow-warm border border-[#E4E0D6]">
                          {jobRole}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <p className="text-slate-600 text-base sm:text-lg">
                  {isOrganization()
                    ? `${orgFeed.length} recent activities across your team`
                    : "Your cross-border meetings and AI translation studio."}
                </p>
              </div>
            </div>

            {/* Hero Meeting Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div
                onClick={handleStartNativeMeeting}
                className="group bg-[#FFFDF8] text-[#1c1b1b] p-5 sm:p-8 rounded-2xl flex flex-col justify-between min-h-[200px] sm:min-h-[220px] hover:shadow-warm-md hover:shadow-[#FF416C]/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-[#E4E0D6] hover:border-[#FF416C]/30 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
                <div className="relative z-10 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF416C]/20 mb-4 sm:mb-5 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[24px]">
                        video_call
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-helvetica tracking-tight text-[#1c1b1b] mb-2">
                      Native Meeting
                    </h2>
                    <p className="text-[#8C8880] text-sm leading-relaxed max-w-xs">
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
                    className="mt-6 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-sm shadow-lg shadow-[#FF416C]/20 flex items-center justify-center gap-2 group/btn w-fit hover:scale-105 transition-all"
                  >
                    Start Meeting
                    <span className="material-symbols-outlined text-[18px] group-hover/btn:translate-x-0.5 transition-transform">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>

              <div className="group bg-[#FFFDF8] border border-[#E4E0D6]/30 p-5 sm:p-8 rounded-2xl flex flex-col justify-between min-h-[200px] sm:min-h-[220px] hover:shadow-lg hover:-translate-y-1 hover:border-[#FF416C]/30 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/[0.02] to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-[#FF416C]/20">
                    <span className="material-symbols-outlined text-white text-[24px]">
                      link
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">
                    External Meeting
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
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
                    className="flex-1 bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-full py-3 px-5 text-[15px] text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!externalLink.trim()}
                    className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#FF416C]/20"
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
                      value: "12",
                      icon: "group",
                      color:
                        "bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20",
                    },
                    {
                      label: "Live Now",
                      value: "3",
                      icon: "cell_tower",
                      color:
                        "bg-[#FFFDF8] text-[#1c1b1b] shadow-warm-md border border-[#E4E0D6]",
                    },
                    {
                      label: "Channels",
                      value: "5",
                      icon: "tag",
                      color:
                        "bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white shadow-lg shadow-[#FF416C]/20",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="group bg-[#FFFDF8] border border-[#E4E0D6]/30 rounded-2xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 shadow-warm hover:shadow-md hover:-translate-y-0.5 hover:border-[#FF416C]/30 transition-all duration-300 cursor-default first:col-span-2 sm:first:col-span-1"
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}
                      >
                        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                          {stat.icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold font-helvetica text-slate-900 leading-none">
                          {stat.value}
                        </p>
                        <p className="text-[10px] font-bold text-[#8C8880] uppercase tracking-widest mt-1">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Now Card */}
                {meetings.some((m) => m.status === "live") && (
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF416C]/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-4 relative min-w-0">
                      <div className="relative flex h-3 w-3 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF416C] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF416C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1c1b1b] font-bold text-sm font-helvetica">
                          Meeting in Progress
                        </p>
                        <p className="text-[#8C8880] text-xs mt-0.5 truncate">
                          {meetings.find((m) => m.status === "live")?.title} —{" "}
                          {
                            meetings.find((m) => m.status === "live")
                              ?.participants.length
                          }{" "}
                          participants
                        </p>
                      </div>
                    </div>
                    <button className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:scale-105 transition-all duration-200 shadow-lg shadow-[#FF416C]/20 relative flex items-center justify-center gap-2 self-start sm:self-auto">
                      <span className="material-symbols-outlined text-[16px]">
                        videocam
                      </span>
                      Join Now
                    </button>
                  </div>
                )}

                {/* Recent Meetings */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 shadow-warm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg sm:text-xl font-bold font-helvetica tracking-tight text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8C8880] text-[20px]">
                        history
                      </span>
                      Recent Meetings
                    </h2>
                    <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors flex-shrink-0">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {RECENT_MEETINGS.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl hover:border-[#FF416C]/30 transition-all cursor-pointer group gap-2"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#E4E0D6]/30 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[#8C8880] text-[18px] sm:text-[20px]">
                              {meeting.platform === "Native"
                                ? "videocam"
                                : "link"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm group-hover:text-[#FF416C] transition-colors truncate">
                                {meeting.title}
                              </p>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 hidden sm:inline-block ${
                                  meeting.platform === "Native"
                                    ? "bg-[#FF416C]/10 text-[#FF416C] border border-[#FF416C]/20"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
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
                                  <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 text-slate-600 flex items-center justify-center text-[7px] font-bold">
                                    +{meeting.participants.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-[#8C8880] text-xs">
                                {meeting.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#c4c7c7] text-[18px] group-hover:text-[#FF416C] transition-colors flex-shrink-0">
                          chevron_right
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items + Quick AI Query & Weekly Streak */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Action Items */}
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#FF416C] text-[18px]">
                            check_circle
                          </span>
                          <span className="text-sm font-bold font-helvetica text-[#1c1b1b]">
                            Action Items
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#8C8880] uppercase tracking-widest">
                          This Week
                        </span>
                      </div>
                      <div className="space-y-3">
                        {ACTION_ITEMS.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]/20 hover:border-[#FF416C]/20 transition-all cursor-pointer group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-[#FF416C]/10 border border-[#FF416C]/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-[#FF416C]">
                                {i + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#1c1b1b]/90 text-sm font-medium group-hover:text-[#1c1b1b] transition-colors truncate">
                                {item.text}
                              </p>
                              <p className="text-[#8C8880] text-xs mt-0.5">
                                from {item.source}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-[#c4c7c7] text-[16px] group-hover:text-[#FF416C] transition-colors flex-shrink-0">
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
                    <div className="bg-[#FFFDF8] border border-[#FF416C]/20 rounded-2xl p-4 sm:p-5 shadow-warm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-[18px]">
                            smart_toy
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Ask About Your Meetings
                          </p>
                          <p className="text-[10px] text-[#8C8880]">
                            Powered by AI Query Studio
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. What were the key decisions last week?"
                          className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 pr-12 text-sm text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-[#FF416C]/40 focus:ring-1 focus:ring-[#FF416C]/10 transition-all"
                          readOnly
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#FF416C] text-[18px]">
                          auto_awesome
                        </span>
                      </div>
                    </div>

                    {/* Weekly Streak */}
                    <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-5 shadow-warm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold font-helvetica text-slate-900">
                          This Week
                        </h3>
                        <span className="text-xs font-bold text-[#FF416C]">
                          9 meetings
                        </span>
                      </div>
                      <div className="flex items-end gap-2 h-20">
                        {WEEKLY_STREAK.map((bar) => (
                          <div
                            key={bar.day}
                            className="flex-1 flex flex-col items-center gap-1.5"
                          >
                            <div
                              className="w-full relative"
                              style={{ height: `${bar.height}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-[#FF416C] to-[#FF4B2B] rounded-lg" />
                            </div>
                            <span className="text-[9px] font-bold text-[#8C8880] uppercase">
                              {bar.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 shadow-warm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-bold font-helvetica tracking-tight text-slate-900">
                      Recent Activity
                    </h2>
                    <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors flex-shrink-0">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {orgFeed.map((feed) => (
                      <div
                        key={feed.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl hover:border-[#FF416C]/30 transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${feed.live ? "bg-[#FF416C] text-white" : "bg-white text-[#FF416C] border border-[#FF416C]/20"}`}
                        >
                          <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                            {feed.type === "channel" ? "tag" : "lightbulb"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {feed.name}
                            </span>
                            <span className="text-[#8C8880] text-xs">
                              · {feed.time}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5 truncate">
                            {feed.activity}
                          </p>
                        </div>
                        {feed.live ? (
                          <span className="bg-[#FF416C] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[#c4c7c7] text-[18px] group-hover:text-[#FF416C] transition-colors flex-shrink-0">
                            chevron_right
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {hasPermission("owner") && (
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 shadow-warm">
                    <h2 className="text-lg sm:text-xl font-bold font-helvetica tracking-tight text-slate-900 mb-5">
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
                            "bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white shadow-md shadow-[#FF416C]/20 group-hover:shadow-lg",
                        },
                        {
                          href: "/dashboard/channels",
                          icon: "tag",
                          label: "Channels",
                          sub: "Team spaces",
                          iconBg:
                            "bg-[#FFFDF8] text-[#1c1b1b] shadow-warm border border-[#E4E0D6] group-hover:shadow-lg",
                        },
                        {
                          href: "/dashboard/billing",
                          icon: "payments",
                          label: "Billing",
                          sub: "Plans & usage",
                          iconBg:
                            "bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white shadow-md shadow-[#FF416C]/20 group-hover:shadow-lg",
                        },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group flex items-center gap-4 p-4 border border-[#E4E0D6]/30 rounded-xl hover:border-[#FF416C]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${item.iconBg}`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {item.icon}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {item.label}
                            </p>
                            <p className="text-[10px] font-bold text-[#8C8880] uppercase tracking-widest mt-0.5">
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
                {/* Live Now Card */}
                {meetings.some((m) => m.status === "live") && (
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF416C]/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-4 relative min-w-0">
                      <div className="relative flex h-3 w-3 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF416C] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF416C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1c1b1b] font-bold text-sm font-helvetica">
                          Meeting in Progress
                        </p>
                        <p className="text-[#8C8880] text-xs mt-0.5 truncate">
                          {meetings.find((m) => m.status === "live")?.title} —{" "}
                          {
                            meetings.find((m) => m.status === "live")
                              ?.participants.length
                          }{" "}
                          participants
                        </p>
                      </div>
                    </div>
                    <button className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:scale-105 transition-all duration-200 shadow-lg shadow-[#FF416C]/20 relative flex items-center justify-center gap-2 self-start sm:self-auto">
                      <span className="material-symbols-outlined text-[16px]">
                        videocam
                      </span>
                      Join Now
                    </button>
                  </div>
                )}

                {/* Recent Meetings */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 shadow-warm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg sm:text-xl font-bold font-helvetica tracking-tight text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8C8880] text-[20px]">
                        history
                      </span>
                      Recent Meetings
                    </h2>
                    <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors flex-shrink-0">
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {RECENT_MEETINGS.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl hover:border-[#FF416C]/30 transition-all cursor-pointer group gap-2"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-[#E4E0D6]/30 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[#8C8880] text-[18px] sm:text-[20px]">
                              {meeting.platform === "Native"
                                ? "videocam"
                                : "link"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 text-sm group-hover:text-[#FF416C] transition-colors truncate">
                                {meeting.title}
                              </p>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 hidden sm:inline-block ${
                                  meeting.platform === "Native"
                                    ? "bg-[#FF416C]/10 text-[#FF416C] border border-[#FF416C]/20"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
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
                                  <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 text-slate-600 flex items-center justify-center text-[7px] font-bold">
                                    +{meeting.participants.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-[#8C8880] text-xs">
                                {meeting.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#c4c7c7] text-[18px] group-hover:text-[#FF416C] transition-colors flex-shrink-0">
                          chevron_right
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items + Quick AI Query & Weekly Streak */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Action Items */}
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#FF416C] text-[18px]">
                            check_circle
                          </span>
                          <span className="text-sm font-bold font-helvetica text-[#1c1b1b]">
                            Action Items
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#8C8880] uppercase tracking-widest">
                          This Week
                        </span>
                      </div>
                      <div className="space-y-3">
                        {ACTION_ITEMS.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#E4E0D6]/20 hover:border-[#FF416C]/20 transition-all cursor-pointer group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-[#FF416C]/10 border border-[#FF416C]/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-[#FF416C]">
                                {i + 1}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#1c1b1b]/90 text-sm font-medium group-hover:text-[#1c1b1b] transition-colors truncate">
                                {item.text}
                              </p>
                              <p className="text-[#8C8880] text-xs mt-0.5">
                                from {item.source}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-[#c4c7c7] text-[16px] group-hover:text-[#FF416C] transition-colors flex-shrink-0">
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
                    <div className="bg-[#FFFDF8] border border-[#FF416C]/20 rounded-2xl p-4 sm:p-5 shadow-warm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-[18px]">
                            smart_toy
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Ask About Your Meetings
                          </p>
                          <p className="text-[10px] text-[#8C8880]">
                            Powered by AI Query Studio
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="e.g. What were the key decisions last week?"
                          className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 pr-12 text-sm text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-[#FF416C]/40 focus:ring-1 focus:ring-[#FF416C]/10 transition-all"
                          readOnly
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#FF416C] text-[18px]">
                          auto_awesome
                        </span>
                      </div>
                    </div>

                    {/* Weekly Streak */}
                    <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-5 shadow-warm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold font-helvetica text-slate-900">
                          This Week
                        </h3>
                        <span className="text-xs font-bold text-[#FF416C]">
                          9 meetings
                        </span>
                      </div>
                      <div className="flex items-end gap-2 h-20">
                        {WEEKLY_STREAK.map((bar) => (
                          <div
                            key={bar.day}
                            className="flex-1 flex flex-col items-center gap-1.5"
                          >
                            <div
                              className="w-full relative"
                              style={{ height: `${bar.height}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-[#FF416C] to-[#FF4B2B] rounded-lg" />
                            </div>
                            <span className="text-[9px] font-bold text-[#8C8880] uppercase">
                              {bar.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Schedule */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-4 sm:p-6 shadow-warm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <h2 className="text-lg sm:text-xl font-bold font-helvetica tracking-tight text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#8C8880] text-[20px]">
                          calendar_month
                        </span>
                        Upcoming Schedule
                      </h2>
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                        {(["today", "week", "all"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setScheduleTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase font-helvetica transition-all whitespace-nowrap flex-shrink-0 ${
                              scheduleTab === tab
                                ? "bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-md shadow-[#FF416C]/20"
                                : "text-slate-500 hover:text-[#FF416C]"
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
                      className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/5 self-start w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        add
                      </span>
                      Schedule
                    </button>
                  </div>

                  {filteredMeetings.length === 0 ? (
                    <div className="py-10 sm:py-12 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF416C]/20">
                        <span className="material-symbols-outlined text-white text-[32px]">
                          event_busy
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-helvetica text-slate-900 mb-2">
                        No meetings scheduled
                      </h3>
                      <p className="text-slate-500 text-sm mb-4">
                        {scheduleTab === "today"
                          ? "Your calendar is clear for today."
                          : "No meetings in this time range."}
                      </p>
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                      >
                        Schedule a Meeting
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredMeetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl hover:border-[#FF416C]/30 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="text-center w-16 sm:w-20 flex-shrink-0">
                              <p className="font-bold text-slate-900 text-sm">
                                {formatDate(meeting.date)}
                              </p>
                              <p className="text-[#8C8880] text-xs">
                                {formatTime(meeting.time)} · {meeting.duration}
                              </p>
                            </div>
                            <div className="w-px h-10 bg-[#c4c7c7]/30 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-900 text-sm group-hover:text-[#FF416C] transition-colors truncate">
                                  {meeting.title}
                                </p>
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                    meeting.platform === "Native"
                                      ? "bg-[#FF416C]/10 text-[#FF416C] border border-[#FF416C]/20"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
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
                                    <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 text-slate-600 flex items-center justify-center text-[7px] font-bold">
                                      +{meeting.participants.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[#8C8880] text-xs">
                                  {meeting.participants.length} participant
                                  {meeting.participants.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-0 sm:ml-4 pl-[4.5rem] sm:pl-0">
                            <button
                              onClick={() => joinMeeting(meeting)}
                              className="bg-black text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-slate-800 hover:scale-105 transition-all duration-200 flex items-center gap-1.5"
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
                              className="w-8 h-8 rounded-xl border border-[#E4E0D6]/30 flex items-center justify-center text-[#8C8880] hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all flex-shrink-0"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-[#FFFDF8] rounded-2xl shadow-2xl border border-[#E4E0D6]/30 w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-[#E4E0D6]/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-helvetica text-slate-900">
                  Schedule a Meeting
                </h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="w-8 h-8 rounded-xl border border-[#E4E0D6]/30 flex items-center justify-center text-[#8C8880] hover:text-[#FF416C] hover:border-[#FF416C]/30 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>
            </div>
            <form onSubmit={addMeeting} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                  className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-[#1c1b1b] placeholder:text-[#8C8880]/60 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                    className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-[#1c1b1b] focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                    className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-[#1c1b1b] focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                    className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-[#1c1b1b] focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                    className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-[#1c1b1b] focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
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
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-[#E4E0D6]/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white text-sm font-bold hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-[#FF416C]/20"
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

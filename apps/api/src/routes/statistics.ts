import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function parsePeriod(period: string): { days: number; groupBy: 'day' | 'week' | 'month' } {
  switch (period) {
    case '30d': return { days: 30, groupBy: 'week' };
    case '90d': return { days: 90, groupBy: 'month' };
    default: return { days: 7, groupBy: 'day' };
  }
}

function formatPeriodLabel(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'day') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (groupBy === 'week') {
    return `W${Math.ceil(date.getDate() / 7)}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function changePercent(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '—';
  const pct = ((current - previous) / previous) * 100;
  return pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
}

async function getUserIdsForWorkspace(workspaceId: string): Promise<string[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });
  return members.map((m) => m.userId);
}

// --- GET /api/statistics ---
router.get('/', authMiddleware, async (req, res: Response) => {
  try {
    const userId = req.user!.userId;
    const workspaceId = (req.query.workspaceId as string) || 'personal';
    const period = (req.query.period as string) || '7d';
    const { days, groupBy } = parsePeriod(period);

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

    const isOrg = workspaceId !== 'personal';
    const userIds = isOrg ? await getUserIdsForWorkspace(workspaceId) : [userId];

    if (isOrg && userIds.length === 0) {
      return res.json({
        summary: {
          totalMeetings: 0, translationHours: 0, languagesUsed: 0,
          teamMembers: 0, activeNow: 0,
          meetingsChange: '—', hoursChange: '—', languagesChange: '—', membersChange: '—',
        },
        meetingActivity: [], translationVolume: [], languages: [], platforms: [],
        topContributors: [], recentActivity: [],
        usage: { minutesUsed: 0, minutesLimit: 20000, tier: 'FREE' },
      });
    }

    // ---- CURRENT PERIOD: External Meetings ----
    const extMeetings = await prisma.externalMeeting.findMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: periodStart },
      },
      select: {
        id: true, userId: true, title: true, platform: true, status: true,
        hearingLang: true, speakingLang: true, languages: true,
        durationMinutes: true, createdAt: true, participants: true,
      },
    });

    // ---- CURRENT PERIOD: Channel Meetings ----
    const channelMeetings = isOrg
      ? await prisma.channelMeeting.findMany({
          where: {
            channel: { workspaceId },
            startedAt: { gte: periodStart },
          },
          select: {
            id: true, createdById: true, title: true, status: true,
            startedAt: true, endedAt: true, participantCount: true,
            language: true, meetingType: true,
          },
        })
      : [];

    // ---- CURRENT PERIOD: Native Meetings ----
    const nativeMeetings = await prisma.nativeMeeting.findMany({
      where: {
        createdById: { in: userIds },
        startedAt: { gte: periodStart },
      },
      select: {
        id: true, createdById: true, title: true, status: true,
        startedAt: true, endedAt: true, participantCount: true,
        languages: true, durationMinutes: true,
      },
    });

    // ---- PREVIOUS PERIOD ----
    const prevExtMeetings = await prisma.externalMeeting.findMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: prevPeriodStart, lt: periodStart },
      },
      select: { durationMinutes: true, hearingLang: true, speakingLang: true, languages: true },
    });

    const prevChannelMeetings = isOrg
      ? await prisma.channelMeeting.findMany({
          where: {
            channel: { workspaceId },
            startedAt: { gte: prevPeriodStart, lt: periodStart },
          },
          select: { startedAt: true, endedAt: true },
        })
      : [];

    const prevNativeMeetings = await prisma.nativeMeeting.findMany({
      where: {
        createdById: { in: userIds },
        startedAt: { gte: prevPeriodStart, lt: periodStart },
      },
      select: { startedAt: true, endedAt: true, durationMinutes: true, languages: true },
    });

    // ---- SUMMARY ----
    const totalExtMeetings = extMeetings.length;
    const totalChannelMeetings = channelMeetings.length;
    const totalNativeMeetings = nativeMeetings.length;
    const totalMeetings = totalExtMeetings + totalChannelMeetings + totalNativeMeetings;

    const extHours = extMeetings.reduce((sum, m) => sum + (m.durationMinutes || 0), 0) / 60;
    const channelHours = channelMeetings.reduce((sum, m) => {
      if (m.endedAt) return sum + (m.endedAt.getTime() - m.startedAt.getTime()) / 60000;
      return sum;
    }, 0) / 60;
    const nativeHours = nativeMeetings.reduce((sum, m) => sum + (m.durationMinutes || 0), 0) / 60;
    const translationHours = Math.round((extHours + channelHours + nativeHours) * 10) / 10;

    const allLangs = new Set<string>();
    extMeetings.forEach((m) => {
      allLangs.add(m.hearingLang);
      allLangs.add(m.speakingLang);
      m.languages.forEach((l) => allLangs.add(l));
    });
    channelMeetings.forEach((m) => { if (m.language) allLangs.add(m.language); });
    nativeMeetings.forEach((m) => { m.languages.forEach((l) => allLangs.add(l)); });
    const languagesUsed = allLangs.size;

    const teamMembers = isOrg ? userIds.length : 1;

    // Active now: users with in-progress meetings
    const activeExtUserIds = new Set(
      extMeetings
        .filter((m) => m.status === 'IN_CALL' || m.status === 'PROCESSING')
        .map((m) => m.userId)
    );
    const activeChannelUserIds = new Set(
      channelMeetings
        .filter((m) => m.status === 'starting' || m.status === 'live')
        .map((m) => m.createdById)
    );
    const activeNativeUserIds = new Set(
      nativeMeetings
        .filter((m) => m.status === 'active')
        .map((m) => m.createdById)
    );
    const activeNow = new Set([...activeExtUserIds, ...activeChannelUserIds, ...activeNativeUserIds]).size;

    // Previous period totals
    const prevTotal = prevExtMeetings.length + prevChannelMeetings.length + prevNativeMeetings.length;
    const prevExtHrs = prevExtMeetings.reduce((s, m) => s + (m.durationMinutes || 0), 0) / 60;
    const prevChanHrs = prevChannelMeetings.reduce((s, m) => {
      if (m.endedAt) return m.endedAt.getTime() - m.startedAt.getTime();
      return 0;
    }, 0) / 60000 / 60;
    const prevNativeHrs = prevNativeMeetings.reduce((s, m) => s + (m.durationMinutes || 0), 0) / 60;
    const prevHours = prevExtHrs + prevChanHrs + prevNativeHrs;

    const prevLangs = new Set<string>();
    prevExtMeetings.forEach((m) => {
      prevLangs.add(m.hearingLang);
      prevLangs.add(m.speakingLang);
      m.languages.forEach((l) => prevLangs.add(l));
    });
    prevNativeMeetings.forEach((m) => { m.languages.forEach((l) => prevLangs.add(l)); });

    const summary = {
      totalMeetings,
      translationHours,
      languagesUsed,
      teamMembers,
      activeNow,
      meetingsChange: changePercent(totalMeetings, prevTotal),
      hoursChange: changePercent(translationHours, prevHours),
      languagesChange: languagesUsed - prevLangs.size > 0 ? `+${languagesUsed - prevLangs.size}` : `${languagesUsed - prevLangs.size}`,
      membersChange: isOrg ? `+0` : '—',
    };

    // ---- MEETING ACTIVITY CHART ----
    const allMeetingDates = [
      ...extMeetings.map((m) => m.createdAt),
      ...channelMeetings.map((m) => m.startedAt),
      ...nativeMeetings.map((m) => m.startedAt),
    ];

    const activityMap = new Map<string, number>();
    allMeetingDates.forEach((date) => {
      const key = formatPeriodLabel(date, groupBy);
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    });

    // Build ordered labels
    const meetingActivity = buildChartLabels(groupBy, days, periodStart, now, activityMap);

    // ---- TRANSLATION VOLUME CHART ----
    const translatedDates = [
      ...extMeetings.filter((m) => m.durationMinutes && m.durationMinutes > 0).map((m) => m.createdAt),
      ...channelMeetings.filter((m) => m.endedAt).map((m) => m.startedAt),
      ...nativeMeetings.filter((m) => m.durationMinutes && m.durationMinutes > 0).map((m) => m.startedAt),
    ];

    const volumeMap = new Map<string, number>();
    translatedDates.forEach((date) => {
      const key = formatPeriodLabel(date, groupBy);
      volumeMap.set(key, (volumeMap.get(key) || 0) + 1);
    });

    const translationVolume = buildChartLabels(groupBy, days, periodStart, now, volumeMap);

    // ---- LANGUAGE BREAKDOWN ----
    const langCounts = new Map<string, number>();
    extMeetings.forEach((m) => {
      langCounts.set(m.hearingLang, (langCounts.get(m.hearingLang) || 0) + 1);
      langCounts.set(m.speakingLang, (langCounts.get(m.speakingLang) || 0) + 1);
      m.languages.forEach((l) => {
        langCounts.set(l, (langCounts.get(l) || 0) + 1);
      });
    });
    channelMeetings.forEach((m) => {
      if (m.language) langCounts.set(m.language, (langCounts.get(m.language) || 0) + 1);
    });
    nativeMeetings.forEach((m) => {
      m.languages.forEach((l) => {
        langCounts.set(l, (langCounts.get(l) || 0) + 1);
      });
    });

    const totalLangMentions = Array.from(langCounts.values()).reduce((s, v) => s + v, 0);
    const languages = Array.from(langCounts.entries())
      .map(([name, count]) => ({
        name: langName(name),
        percentage: totalLangMentions > 0 ? Math.round((count / totalLangMentions) * 100) : 0,
        meetings: count,
      }))
      .sort((a, b) => b.meetings - a.meetings)
      .slice(0, 6);

    // ---- PLATFORM USAGE ----
    const platformCounts = new Map<string, number>();
    extMeetings.forEach((m) => {
      const p = platformLabel(m.platform);
      platformCounts.set(p, (platformCounts.get(p) || 0) + 1);
    });
    platformCounts.set('Native Relay', (platformCounts.get('Native Relay') || 0) + totalNativeMeetings + totalChannelMeetings);

    const totalPlatformMeetings = Array.from(platformCounts.values()).reduce((s, v) => s + v, 0);
    const platforms = Array.from(platformCounts.entries())
      .map(([name, count]) => ({
        name,
        percentage: totalPlatformMeetings > 0 ? Math.round((count / totalPlatformMeetings) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // ---- TOP CONTRIBUTORS (org only) ----
    let topContributors: Array<{ id: string; name: string; avatar: string | null; meetings: number; hours: number; languages: number }> = [];
    if (isOrg) {
      const userMeetingMap = new Map<string, { meetings: number; hours: number; langs: Set<string> }>();

      extMeetings.forEach((m) => {
        const entry = userMeetingMap.get(m.userId) || { meetings: 0, hours: 0, langs: new Set() };
        entry.meetings++;
        entry.hours += (m.durationMinutes || 0) / 60;
        entry.langs.add(m.hearingLang);
        entry.langs.add(m.speakingLang);
        m.languages.forEach((l) => entry.langs.add(l));
        userMeetingMap.set(m.userId, entry);
      });

      channelMeetings.forEach((m) => {
        const entry = userMeetingMap.get(m.createdById) || { meetings: 0, hours: 0, langs: new Set() };
        entry.meetings++;
        if (m.endedAt) entry.hours += (m.endedAt.getTime() - m.startedAt.getTime()) / 3600000;
        if (m.language) entry.langs.add(m.language);
        userMeetingMap.set(m.createdById, entry);
      });

      nativeMeetings.forEach((m) => {
        const entry = userMeetingMap.get(m.createdById) || { meetings: 0, hours: 0, langs: new Set() };
        entry.meetings++;
        entry.hours += (m.durationMinutes || 0) / 60;
        m.languages.forEach((l) => entry.langs.add(l));
        userMeetingMap.set(m.createdById, entry);
      });

      const contributorIds = Array.from(userMeetingMap.keys());
      const contributorUsers = await prisma.user.findMany({
        where: { id: { in: contributorIds } },
        select: { id: true, fullName: true, avatar: true },
      });
      const userMap = new Map(contributorUsers.map((u) => [u.id, u]));

      topContributors = Array.from(userMeetingMap.entries())
        .map(([uid, data]) => {
          const u = userMap.get(uid);
          return {
            id: uid,
            name: u?.fullName || 'Unknown',
            avatar: u?.avatar || null,
            meetings: data.meetings,
            hours: Math.round(data.hours * 10) / 10,
            languages: data.langs.size,
          };
        })
        .sort((a, b) => b.meetings - a.meetings)
        .slice(0, 6);
    }

    // ---- RECENT ACTIVITY ----
    const recentExt = extMeetings
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        title: m.title,
        date: m.createdAt.toISOString(),
        duration: m.durationMinutes ? `${m.durationMinutes}m` : '—',
        languages: Array.from(new Set([m.hearingLang, m.speakingLang, ...m.languages])).map(langName),
        platform: platformLabel(m.platform),
        participants: Array.isArray(m.participants) ? m.participants.length : 0,
      }));

    const recentChannel = channelMeetings
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        title: m.title,
        date: m.startedAt.toISOString(),
        duration: m.endedAt
          ? `${Math.round((m.endedAt.getTime() - m.startedAt.getTime()) / 60000)}m`
          : 'In progress',
        languages: m.language ? [langName(m.language)] : [],
        platform: 'Channel',
        participants: m.participantCount,
      }));

    const recentNative = nativeMeetings
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        title: m.title,
        date: m.startedAt.toISOString(),
        duration: m.durationMinutes ? `${m.durationMinutes}m` : 'In progress',
        languages: m.languages.map(langName),
        platform: 'Native Relay',
        participants: m.participantCount,
      }));

    const recentActivity = [...recentExt, ...recentChannel, ...recentNative]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    // ---- USAGE ----
    let usage = { minutesUsed: 0, minutesLimit: 20000, tier: 'FREE' };
    if (isOrg) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { minutesUsed: true, minutesLimit: true, subscriptionTier: true },
      });
      if (workspace) {
        usage = {
          minutesUsed: workspace.minutesUsed,
          minutesLimit: workspace.minutesLimit,
          tier: workspace.subscriptionTier,
        };
      }
    }

    return res.json({
      summary,
      meetingActivity,
      translationVolume,
      languages,
      platforms,
      topContributors,
      recentActivity,
      usage,
    });
  } catch (error) {
    console.error('Statistics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- Helpers ----

function buildChartLabels(
  groupBy: 'day' | 'week' | 'month',
  days: number,
  start: Date,
  end: Date,
  dataMap: Map<string, number>,
): Array<{ label: string; value: number }> {
  const result: Array<{ label: string; value: number }> = [];

  if (groupBy === 'day') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cursor = new Date(start);
    // Align to start of week
    cursor.setDate(cursor.getDate() - cursor.getDay());
    for (let i = 0; i < 7; i++) {
      const label = dayNames[cursor.getDay()];
      result.push({ label, value: dataMap.get(label) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (groupBy === 'week') {
    const numWeeks = Math.ceil(days / 7);
    for (let i = 1; i <= numWeeks; i++) {
      const label = `W${i}`;
      result.push({ label, value: dataMap.get(label) || 0 });
    }
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const numMonths = Math.ceil(days / 30);
    const cursor = new Date(start);
    for (let i = 0; i < numMonths; i++) {
      const label = monthNames[cursor.getMonth()];
      result.push({ label, value: dataMap.get(label) || 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return result;
}

function langName(code: string): string {
  const map: Record<string, string> = {
    en: 'English', es: 'Spanish', zh: 'Mandarin', ar: 'Arabic',
    ja: 'Japanese', fr: 'French', de: 'German', ko: 'Korean',
    pt: 'Portuguese', hi: 'Hindi', ru: 'Russian', it: 'Italian',
    nl: 'Dutch', tr: 'Turkish', vi: 'Vietnamese', th: 'Thai',
    pl: 'Polish', sv: 'Swedish', he: 'Hebrew', id: 'Indonesian',
  };
  return map[code.toLowerCase()] || code.toUpperCase();
}

function platformLabel(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'zoom': return 'Zoom';
    case 'google_meet': return 'Google Meet';
    case 'teams': return 'Microsoft Teams';
    default: return platform;
  }
}

export default router;

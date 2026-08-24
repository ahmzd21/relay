import { prisma } from './prisma.js';
import { roomService } from './livekit.js';

let isCleaning = false;

/**
 * Reconciles active meetings in the database against actual live sessions.
 * Can be called periodically or on-demand when loading dashboards.
 */
export async function cleanupStaleMeetings() {
  if (isCleaning) return;
  isCleaning = true;

  try {
    const now = new Date();

    // 1. Reconcile Active Native Meetings
    const activeNative = await prisma.nativeMeeting.findMany({
      where: { status: 'active' },
      select: { id: true, roomName: true, startedAt: true },
    });

    for (const meeting of activeNative) {
      try {
        const rooms = await roomService.listRooms([meeting.roomName]);
        const room = rooms.length > 0 ? rooms[0] : null;

        const elapsedMs = now.getTime() - meeting.startedAt.getTime();
        const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

        // If room doesn't exist in LiveKit, or is empty and older than 3 minutes
        if (!room || (room.numParticipants === 0 && elapsedMs > 3 * 60 * 1000)) {
          if (room) {
            await roomService.deleteRoom(meeting.roomName).catch(() => {});
          }

          await prisma.nativeMeeting.update({
            where: { id: meeting.id },
            data: {
              status: 'ended',
              endedAt: now,
              durationMinutes: elapsedMinutes,
            },
          });
          console.log(`[Cleanup] Reconciled stale native meeting: ${meeting.roomName} (${elapsedMinutes}m)`);
        }
      } catch (err) {
        // If LiveKit unreachable, mark meetings older than 30 mins as ended
        const elapsedMs = now.getTime() - meeting.startedAt.getTime();
        if (elapsedMs > 30 * 60 * 1000) {
          await prisma.nativeMeeting.update({
            where: { id: meeting.id },
            data: {
              status: 'ended',
              endedAt: now,
              durationMinutes: Math.round(elapsedMs / 60000),
            },
          }).catch(() => {});
        }
      }
    }

    // 2. Reconcile Active Channel Meetings
    const activeChannel = await prisma.channelMeeting.findMany({
      where: { status: { in: ['starting', 'live'] } },
      select: { id: true, startedAt: true },
    });

    for (const meeting of activeChannel) {
      const elapsedMs = now.getTime() - meeting.startedAt.getTime();
      // Channel meetings older than 15 minutes with no live session are ended
      if (elapsedMs > 15 * 60 * 1000) {
        await prisma.channelMeeting.update({
          where: { id: meeting.id },
          data: {
            status: 'ended',
            endedAt: now,
          },
        }).catch(() => {});
        console.log(`[Cleanup] Reconciled stale channel meeting: ${meeting.id}`);
      }
    }

    // 3. Reconcile External Meetings (IN_CALL / PROCESSING older than 2 hours)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    await prisma.externalMeeting.updateMany({
      where: {
        status: { in: ['IN_CALL', 'PROCESSING'] },
        createdAt: { lt: twoHoursAgo },
      },
      data: {
        status: 'ENDED',
      },
    }).catch(() => {});

  } catch (error) {
    console.warn('[Cleanup] Error during meeting reconciliation:', error);
  } finally {
    isCleaning = false;
  }
}

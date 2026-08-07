'use client';

import React, { useEffect, useState } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RemoteParticipant, DataPacket_Kind } from 'livekit-client';

interface SubtitleMessage {
  id: string;
  speakerIdentity: string;
  speakerName: string;
  text: string;
  language: string;
  timestamp: number;
}

export function CustomSubtitles() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [subtitles, setSubtitles] = useState<SubtitleMessage[]>([]);

  // 1. Get preferred subtitle language from metadata
  const subtitleLang = React.useMemo(() => {
    try {
      const meta = JSON.parse(localParticipant?.metadata || '{}');
      return meta?.preferences?.subtitle || 'none';
    } catch {
      return 'none';
    }
  }, [localParticipant?.metadata]);

  useEffect(() => {
    if (!room) return;

    const handleData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind,
      topic?: string
    ) => {
      if (topic === 'subtitle') {
        try {
          const strData = new TextDecoder().decode(payload);
          const data = JSON.parse(strData);
          if (data.type === 'subtitle') {
            const newSub: SubtitleMessage = {
              id: `${data.speakerIdentity}-${data.timestamp}-${Math.random()}`,
              speakerIdentity: data.speakerIdentity,
              speakerName: data.speakerName || 'Speaker',
              text: data.text,
              language: data.language,
              timestamp: data.timestamp,
            };

            setSubtitles((prev) => {
              const updated = [...prev, newSub];
              // Keep maximum 3 lines at a time
              return updated.slice(-3);
            });

            // Auto expire subtitle after 6 seconds
            setTimeout(() => {
              setSubtitles((prev) => prev.filter((s) => s.id !== newSub.id));
            }, 6000);
          }
        } catch (e) {
          console.error('[Relay Subtitles] Error decoding data payload:', e);
        }
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room]);

  if (subtitleLang === 'none' || subtitles.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[90%] flex flex-col items-center gap-2 pointer-events-none transition-all duration-300">
      {subtitles.map((sub) => (
        <div
          key={sub.id}
          className="bg-black/80 backdrop-blur-xl border border-white/15 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-center max-w-full"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 shrink-0">
            {sub.speakerName}
          </span>
          <span className="text-white text-sm md:text-base font-medium leading-relaxed drop-shadow-md">
            {sub.text}
          </span>
        </div>
      ))}
    </div>
  );
}

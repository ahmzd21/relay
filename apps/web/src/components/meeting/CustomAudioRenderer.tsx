'use client';

import React, { useMemo } from 'react';
import { useTracks, useLocalParticipant, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function CustomAudioRenderer({ audioLang }: { audioLang: string }) {
  const { localParticipant } = useLocalParticipant();

  // 2. Get all remote audio tracks in the room. Local mic is never rendered —
  //    playing your own microphone back is echo.
  const audioTracks = useTracks([Track.Source.Microphone, Track.Source.Unknown], { onlySubscribed: true })
    .filter(t => t.publication.kind === Track.Kind.Audio)
    .filter(t => t.participant.identity !== localParticipant?.identity);

  const isDubbingEnabled = audioLang !== 'none';

  return (
    <div style={{ display: 'none' }}>
      {audioTracks.map((trackRef) => {
        const trackName = trackRef.publication.trackName || '';
        const isTranslation = trackName.startsWith('translation_');

        if (isTranslation) {
          // Dubbed audio: play only the track matching the chosen language, and
          // only while dubbing is on.
          if (!isDubbingEnabled) return null;
          if (!trackName.startsWith(`translation_${audioLang}_`)) return null;
          return (
            <AudioTrack key={trackRef.publication.trackSid} trackRef={trackRef} volume={1.0} />
          );
        }

        // Normal speech. This must always render, otherwise nobody can hear each
        // other. When dubbing is active it is ducked under the translated voice
        // rather than silenced, so the room still feels live.
        return (
          <AudioTrack
            key={trackRef.publication.trackSid}
            trackRef={trackRef}
            volume={isDubbingEnabled ? 0.15 : 1.0}
          />
        );
      })}
    </div>
  );
}

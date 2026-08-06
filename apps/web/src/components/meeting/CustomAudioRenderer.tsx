'use client';

import React, { useEffect, useMemo } from 'react';
import { useTracks, useLocalParticipant, AudioTrack } from '@livekit/components-react';
import { Track, RemoteAudioTrack } from 'livekit-client';

export function CustomAudioRenderer() {
  const { localParticipant } = useLocalParticipant();
  
  // 1. Get preferred audio language from metadata
  const audioLang = useMemo(() => {
    try {
      const meta = JSON.parse(localParticipant?.metadata || '{}');
      return meta?.preferences?.audio || 'none';
    } catch {
      return 'none';
    }
  }, [localParticipant?.metadata]);

  // 2. Get all audio tracks in the room
  const audioTracks = useTracks([Track.Source.Microphone, Track.Source.Unknown], { onlySubscribed: true })
    .filter(t => t.publication.kind === Track.Kind.Audio);

  const isDubbingEnabled = audioLang !== 'none';

  // 3. Manually duck original speakers using the LiveKit SDK
  useEffect(() => {
    audioTracks.forEach(trackRef => {
      const trackName = trackRef.publication.trackName;
      const isTranslation = trackName.startsWith('translation_');
      
      if (!isTranslation && trackRef.publication.track instanceof RemoteAudioTrack) {
        // Apply ducking (15% volume) to original speakers when listening to dubbed voice
        trackRef.publication.track.setVolume(isDubbingEnabled ? 0.15 : 1.0);
      }
    });
  }, [audioTracks, isDubbingEnabled]);

  return (
    <div style={{ display: 'none' }}>
      {audioTracks.map((trackRef) => {
        const trackName = trackRef.publication.trackName;
        const isTranslation = trackName.startsWith('translation_');
        
        // 4. ONLY render translation tracks, and ONLY if they match our preference
        if (isTranslation && trackName.startsWith(`translation_${audioLang}_`)) {
          return <AudioTrack key={trackRef.publication.trackSid} trackRef={trackRef} volume={1.0} />;
        }
        
        return null;
      })}
    </div>
  );
}

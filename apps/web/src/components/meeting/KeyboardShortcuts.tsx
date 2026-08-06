'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';

interface KeyboardShortcutsProps {
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onToggleHandRaise: () => void;
  audioLocked?: boolean;
  videoLocked?: boolean;
}

export function KeyboardShortcuts({
  onToggleMic,
  onToggleVideo,
  onToggleChat,
  onToggleWhiteboard,
  onToggleHandRaise,
  audioLocked,
  videoLocked,
}: KeyboardShortcutsProps) {
  const room = useRoomContext();
  const spacePressedRef = useRef(false);
  const wasMutedBeforePTTRef = useRef(false);

  useEffect(() => {
    function isInputActive() {
      const activeElement = document.activeElement;
      if (!activeElement) return false;
      const tagName = activeElement.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      const inInput = isInputActive();

      // Ctrl+Shift+A or Ctrl+Shift+M: Toggle Microphone
      if (event.ctrlKey && event.shiftKey && (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'm')) {
        event.preventDefault();
        if (!audioLocked) {
          onToggleMic();
        }
        return;
      }

      // Ctrl+Shift+V: Toggle Camera
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        if (!videoLocked) {
          onToggleVideo();
        }
        return;
      }

      // Ctrl+Shift+C or Ctrl+Shift+H: Toggle Chat
      if (event.ctrlKey && event.shiftKey && (event.key.toLowerCase() === 'c' || event.key.toLowerCase() === 'h')) {
        event.preventDefault();
        onToggleChat();
        return;
      }

      if (inInput) return;

      // W key: Toggle Whiteboard
      if (event.key.toLowerCase() === 'w' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        onToggleWhiteboard();
        return;
      }

      // H key: Toggle Raise Hand
      if (event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        onToggleHandRaise();
        return;
      }

      // Escape: Close panels
      if (event.key === 'Escape') {
        event.preventDefault();
        // Here we just map Escape to onToggleChat as requested for closing panels
        onToggleChat(); 
        return;
      }

      // Push-to-Talk (Spacebar)
      if (event.code === 'Space' && !event.repeat) {
        if (audioLocked) return;
        if (room?.localParticipant) {
          event.preventDefault(); // Prevent scrolling down the page
          if (!spacePressedRef.current) {
            spacePressedRef.current = true;
            
            const isCurrentlyEnabled = room.localParticipant.isMicrophoneEnabled;
            if (!isCurrentlyEnabled) {
              wasMutedBeforePTTRef.current = true;
              room.localParticipant.setMicrophoneEnabled(true).catch(console.error);
            } else {
              wasMutedBeforePTTRef.current = false;
            }
          }
        }
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') {
        if (spacePressedRef.current) {
          spacePressedRef.current = false;
          if (wasMutedBeforePTTRef.current && room?.localParticipant) {
            room.localParticipant.setMicrophoneEnabled(false).catch(console.error);
          }
        }
      }
    }

    // Prevent stuck PTT if user alt-tabs or clicks away while holding space
    function handleBlur() {
      if (spacePressedRef.current) {
        spacePressedRef.current = false;
        if (wasMutedBeforePTTRef.current && room?.localParticipant) {
          room.localParticipant.setMicrophoneEnabled(false).catch(console.error);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    onToggleMic,
    onToggleVideo,
    onToggleChat,
    onToggleWhiteboard,
    onToggleHandRaise,
    audioLocked,
    videoLocked,
    room,
  ]);

  return null;
}

'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export interface Reaction {
  id: string;
  emoji: string;
  xPosition: number;
}

const EMOJIS = ['👍', '❤️', '😂', '👏', '😲', '🎉', '🔥', '🚀'];

export const ReactionsOverlay: React.FC = () => {
  const room = useRoomContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const addReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    // Random X position between 10% and 90% of screen width
    const xPosition = 10 + Math.random() * 80;
    
    setReactions((prev) => [...prev, { id, emoji, xPosition }]);
    
    // Automatically remove after animation completes (2.5s)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  }, []);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === 'reaction' && msg.emoji) {
          addReaction(msg.emoji);
        }
      } catch (e) {
        // ignore non-json messages
      }
    };

    const handleLocalReaction = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.emoji) {
        addReaction(detail.emoji);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    window.addEventListener('relay-local-reaction', handleLocalReaction);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      window.removeEventListener('relay-local-reaction', handleLocalReaction);
    };
  }, [room, addReaction]);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUpAndFade {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) scale(1.2);
          }
          100% {
            transform: translateY(-200px) scale(1);
            opacity: 0;
          }
        }
        .reaction-particle {
          animation: floatUpAndFade 2.5s ease-out forwards;
        }
      `}} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40 flex items-end">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="reaction-particle absolute bottom-24 text-4xl"
            style={{ left: `${reaction.xPosition}%` }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>
    </>
  );
};

export const ReactionsControl: React.FC = () => {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sendReaction = async (emoji: string) => {
    const payload = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji, sender: localParticipant?.identity }));
    window.dispatchEvent(new CustomEvent('relay-local-reaction', { detail: { emoji } }));
    
    try {
      if (localParticipant) {
        await localParticipant.publishData(payload, { reliable: false });
      }
    } catch (e) {
      console.error('Failed to send reaction', e);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#111116]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex gap-1 z-50">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="p-2 text-2xl hover:bg-white/10 rounded-lg transition-transform hover:scale-110 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
          isOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
      </button>
    </div>
  );
};

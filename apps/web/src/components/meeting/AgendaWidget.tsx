'use client'

import React, { useEffect, useState, useMemo } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export interface AgendaItem {
  id: string;
  text: string;
  done: boolean;
}

export function AgendaWidget() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const isHost = useMemo(() => {
    if (!localParticipant?.metadata) return false;
    try {
      const meta = JSON.parse(localParticipant.metadata);
      return meta.role === 'host';
    } catch {
      return false;
    }
  }, [localParticipant]);

  useEffect(() => {
    const updateAgendaFromMeta = (metaStr?: string) => {
      if (!metaStr) return;
      try {
        const meta = JSON.parse(metaStr);
        if (meta.agenda && Array.isArray(meta.agenda)) {
          setAgenda(meta.agenda);
        }
      } catch (e) {
         console.error('Failed to parse room metadata', e);
      }
    };

    updateAgendaFromMeta(room.metadata);

    const handleMetaChange = () => {
      updateAgendaFromMeta(room.metadata);
    };

    room.on(RoomEvent.RoomMetadataChanged, handleMetaChange);
    room.on(RoomEvent.Connected, handleMetaChange);
    
    // In case we are already connected when this mounts
    if (room.state === 'connected') {
      handleMetaChange();
    }

    return () => {
      room.off(RoomEvent.RoomMetadataChanged, handleMetaChange);
      room.off(RoomEvent.Connected, handleMetaChange);
    };
  }, [room]);

  if (agenda.length === 0) return null;

  const toggleItem = async (id: string) => {
    if (!isHost) return;
    const newAgenda = agenda.map(item => item.id === id ? { ...item, done: !item.done } : item);
    // Optimistic update
    setAgenda(newAgenda);
    
    // Send to API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/meetings/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: room.name, agenda: newAgenda })
      });
    } catch (e) {
      console.error('Failed to update agenda', e);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-30 w-72 bg-[#111116]/90 backdrop-blur border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white transition-all duration-300">
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className={`flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${isMinimized ? '' : 'border-b border-white/10'}`}
      >
        <span className="font-semibold text-sm">Meeting Agenda</span>
        <svg 
          className={`text-gray-400 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`} 
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </div>

      {!isMinimized && (
        <div className="py-2 max-h-72 overflow-y-auto">
          {agenda.map((item) => (
            <div 
              key={item.id} 
              className={`flex items-start gap-3 px-4 py-2 transition-opacity duration-200 ${item.done ? 'opacity-50' : 'opacity-100'}`}
            >
              {isHost ? (
                <input 
                  type="checkbox" 
                  checked={item.done} 
                  onChange={() => toggleItem(item.id)}
                  className="mt-1 cursor-pointer w-4 h-4 accent-blue-500 rounded border-white/20 bg-transparent shrink-0"
                />
              ) : (
                <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.done ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                  {item.done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              )}
              <span className={`text-sm font-medium leading-relaxed ${item.done ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

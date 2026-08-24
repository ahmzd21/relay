'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  settings: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  messageCount: number;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    user: { fullName: string };
  } | null;
  isMember: boolean;
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  members: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  lastReadAt: string | null;
  joinedAt: string;
  user: { id: string; fullName: string; avatar: string | null; email?: string };
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  user: { id: string; fullName: string; avatar: string | null };
  mentions: Array<{ user: { id: string; fullName: string } }>;
  attachments: MessageAttachment[];
  _count: { replies: number };
}

export interface ChannelMeeting {
  id: string;
  channelId: string;
  createdById: string;
  title: string;
  meetingType: string;
  meetingUrl: string | null;
  roomName: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  participantCount: number;
  language: string | null;
  creator: { id: string; fullName: string; avatar: string | null };
}

interface ChannelContextType {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: ChannelMessage[];
  meetings: ChannelMeeting[];
  channelMembers: ChannelMember[];
  typingUsers: string[];
  isLoadingChannels: boolean;
  isLoadingMessages: boolean;
  wsConnected: boolean;
  fetchChannels: (workspaceId: string) => Promise<void>;
  createChannel: (workspaceId: string, name: string, description?: string) => Promise<Channel | null>;
  joinChannel: (channelId: string) => Promise<boolean>;
  leaveChannel: (channelId: string) => Promise<boolean>;
  setActiveChannel: (channel: Channel | null) => void;
  fetchMessages: (channelId: string, before?: string) => Promise<boolean>;
  sendMessage: (channelId: string, content: string, replyToId?: string, attachmentIds?: Array<{ url: string; fileName: string; fileSize: number; mimeType: string }>) => Promise<boolean>;
  editMessage: (channelId: string, messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (channelId: string, messageId: string) => Promise<boolean>;
  fetchThread: (channelId: string, messageId: string) => Promise<{ parent: ChannelMessage; replies: ChannelMessage[] } | null>;
  startMeeting: (channelId: string, title: string, meetingType?: string) => Promise<ChannelMeeting | null>;
  endMeeting: (channelId: string, meetingId: string) => Promise<boolean>;
  fetchMeetings: (channelId: string) => Promise<void>;
  fetchChannelMembers: (channelId: string) => Promise<void>;
  updateChannelSettings: (channelId: string, data: { name?: string; description?: string; settings?: Record<string, unknown> }) => Promise<boolean>;
  deleteChannel: (channelId: string) => Promise<boolean>;
  uploadFile: (file: File) => Promise<MessageAttachment | null>;
  sendTyping: (channelId: string) => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannelState] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [meetings, setMeetings] = useState<ChannelMeeting[]>([]);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const activeChannelRef = useRef<Channel | null>(null);
  const wsMessageRef = useRef<(data: Record<string, unknown>) => void>(() => {});

  const handleWsMessage = useCallback((data: Record<string, unknown>) => {
    const type = data.type as string;

    switch (type) {
      case 'message': {
        const msg = data.message as ChannelMessage;
        if (msg.channelId === activeChannelRef.current?.id) {
          setMessages(prev => [...prev, msg]);
        }
        // Update last message in channel list
        setChannels(prev => prev.map(ch =>
          ch.id === msg.channelId
            ? { ...ch, lastMessage: { id: msg.id, content: msg.content, createdAt: msg.createdAt, user: msg.user }, messageCount: ch.messageCount + 1 }
            : ch
        ));
        break;
      }
      case 'message:edited': {
        const msg = data.message as ChannelMessage;
        if (msg.channelId === activeChannelRef.current?.id) {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
        }
        break;
      }
      case 'message:deleted': {
        const channelId = data.channelId as string;
        const messageId = data.messageId as string;
        if (channelId === activeChannelRef.current?.id) {
          setMessages(prev => prev.filter(m => m.id !== messageId));
        }
        break;
      }
      case 'typing': {
        const userId = data.userId as string;
        const channelId = data.channelId as string;
        if (channelId === activeChannelRef.current?.id) {
          setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
          // Auto-remove after 3s
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(id => id !== userId));
          }, 3000);
        }
        break;
      }
      case 'stop_typing': {
        const userId = data.userId as string;
        setTypingUsers(prev => prev.filter(id => id !== userId));
        break;
      }
      case 'member:joined': {
        const member = data.member as ChannelMember;
        setChannelMembers(prev => {
          if (prev.some(m => m.id === member.id)) return prev;
          return [...prev, member];
        });
        break;
      }
      case 'member:left': {
        const userId = data.userId as string;
        setChannelMembers(prev => prev.filter(m => m.userId !== userId));
        break;
      }
      case 'meeting:started':
      case 'meeting:ended': {
        const meeting = data.meeting as ChannelMeeting;
        if (meeting.channelId === activeChannelRef.current?.id) {
          setMeetings(prev => {
            const idx = prev.findIndex(m => m.id === meeting.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = meeting;
              return updated;
            }
            return [meeting, ...prev];
          });
        }
        break;
      }
      case 'channel:updated': {
        const channel = data.channel as Channel;
        setChannels(prev => prev.map(ch => ch.id === channel.id ? { ...ch, ...channel } : ch));
        if (activeChannelRef.current?.id === channel.id) {
          setActiveChannelState(prev => prev ? { ...prev, ...channel } : prev);
        }
        break;
      }
      case 'channel:deleted': {
        const channelId = data.channelId as string;
        setChannels(prev => prev.filter(ch => ch.id !== channelId));
        if (activeChannelRef.current?.id === channelId) {
          setActiveChannelState(null);
        }
        break;
      }
    }
  }, []);

  // Keep ref updated so WS handler always uses latest handleWsMessage
  useEffect(() => {
    wsMessageRef.current = handleWsMessage;
  });

  const sendTyping = useCallback((channelId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', channelId }));
    }
  }, []);

  const setActiveChannel = useCallback((channel: Channel | null) => {
    const prevChannel = activeChannelRef.current;

    // Leave previous channel
    if (prevChannel && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave', channelId: prevChannel.id }));
    }

    activeChannelRef.current = channel;
    setActiveChannelState(channel);
    setMessages([]);
    setMeetings([]);
    setChannelMembers([]);
    setTypingUsers([]);

    // Join new channel
    if (channel && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join', channelId: channel.id }));
    }
  }, []);

  // WebSocket connection
  useEffect(() => {
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          if (activeChannelRef.current) {
            ws.send(JSON.stringify({ type: 'join', channelId: activeChannelRef.current.id }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            wsMessageRef.current(data);
          } catch (err) {
            console.error('[WS] Parse error:', err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setTimeout(connectWs, 3000);
      }
    };

    connectWs();
    return () => { wsRef.current?.close(); };
  }, []);

  // --- API calls ---

  const fetchChannels = useCallback(async (workspaceId: string) => {
    setIsLoadingChannels(true);
    try {
      const res = await fetch(`/api/channels?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setIsLoadingChannels(false);
    }
  }, []);

  const createChannel = useCallback(async (workspaceId: string, name: string, description?: string): Promise<Channel | null> => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, name, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(prev => [...prev, data.channel]);
        return data.channel;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const joinChannel = useCallback(async (channelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/join`, { method: 'POST' });
      if (res.ok) {
        await fetchChannels(activeChannelRef.current?.workspaceId || '');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchChannels]);

  const leaveChannel = useCallback(async (channelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/leave`, { method: 'POST' });
      if (res.ok) {
        setChannels(prev => prev.filter(ch => ch.id !== channelId));
        if (activeChannelRef.current?.id === channelId) {
          setActiveChannelState(null);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const fetchMessages = useCallback(async (channelId: string, before?: string): Promise<boolean> => {
    setIsLoadingMessages(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (before) params.set('before', before);
      const res = await fetch(`/api/channels/${channelId}/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (before) {
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages || []);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    channelId: string,
    content: string,
    replyToId?: string,
    attachmentIds?: Array<{ url: string; fileName: string; fileSize: number; mimeType: string }>
  ): Promise<boolean> => {
    try {
      const body: Record<string, unknown> = { content };
      if (replyToId) body.replyToId = replyToId;
      if (attachmentIds?.length) body.attachmentIds = attachmentIds;

      const res = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        // Message will arrive via WS broadcast, but also add locally for immediate feedback
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const editMessage = useCallback(async (channelId: string, messageId: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === messageId ? data.message : m));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const deleteMessage = useCallback(async (channelId: string, messageId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const fetchThread = useCallback(async (channelId: string, messageId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages/${messageId}/thread`);
      if (res.ok) {
        const data = await res.json();
        return { parent: data.parent, replies: data.replies };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const startMeeting = useCallback(async (channelId: string, title: string, meetingType = 'native'): Promise<ChannelMeeting | null> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, meetingType }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(prev => [data.meeting, ...prev]);
        return data.meeting;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const endMeeting = useCallback(async (channelId: string, meetingId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}/meetings/${meetingId}/end`, {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const fetchMeetings = useCallback(async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/meetings`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  }, []);

  const fetchChannelMembers = useCallback(async (channelId: string) => {
    try {
      const res = await fetch(`/api/channels/${channelId}/members`);
      if (res.ok) {
        const data = await res.json();
        setChannelMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch channel members:', err);
    }
  }, []);

  const updateChannelSettings = useCallback(async (channelId: string, updateData: { name?: string; description?: string; settings?: Record<string, unknown> }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, ...data.channel } : ch));
        if (activeChannelRef.current?.id === channelId) {
          setActiveChannelState(prev => prev ? { ...prev, ...data.channel } : prev);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const deleteChannel = useCallback(async (channelId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: 'DELETE' });
      if (res.ok) {
        setChannels(prev => prev.filter(ch => ch.id !== channelId));
        if (activeChannelRef.current?.id === channelId) {
          setActiveChannelState(null);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<MessageAttachment | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/channels/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: `temp-${Date.now()}`,
          ...data.attachment,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return (
    <ChannelContext.Provider
      value={{
        channels,
        activeChannel,
        messages,
        meetings,
        channelMembers,
        typingUsers,
        isLoadingChannels,
        isLoadingMessages,
        wsConnected,
        fetchChannels,
        createChannel,
        joinChannel,
        leaveChannel,
        setActiveChannel,
        fetchMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        fetchThread,
        startMeeting,
        endMeeting,
        fetchMeetings,
        fetchChannelMembers,
        updateChannelSettings,
        deleteChannel,
        uploadFile,
        sendTyping,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannels() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannels must be used within a ChannelProvider');
  }
  return context;
}

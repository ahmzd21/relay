'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChannels, ChannelMessage } from '@/contexts/ChannelContext';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function MessageBubble({ msg, onReply, onEdit, onDelete, currentUserId, onOpenThread }: {
  msg: ChannelMessage;
  onReply: (parentId: string) => void;
  onEdit: (msg: ChannelMessage) => void;
  onDelete: (msgId: string) => void;
  currentUserId: string;
  onOpenThread: (msgId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isOwn = msg.userId === currentUserId;

  return (
    <div
      className="group flex gap-3 px-6 py-1.5 hover:bg-chrome/5 transition-colors relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-9 h-9 rounded-full bg-chrome text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {msg.user.avatar ? (
          <img src={msg.user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          msg.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-ink text-sm">{msg.user.fullName}</span>
          <span className="text-xs text-muted">{formatTime(msg.createdAt)}</span>
          {msg.editedAt && <span className="text-xs text-muted italic">(edited)</span>}
        </div>
        <div className="text-sm text-ink/80 mt-0.5 whitespace-pre-wrap break-words">
          {msg.content.split(/(@\w[\w.-]*)/g).map((part: string, i: number) =>
            part.startsWith('@') ? (
              <span key={i} className="text-accent font-semibold bg-accent/10 px-1 rounded">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
        {msg.attachments?.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-surface border border-border/40 rounded-lg hover:border-accent/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-accent">
                  {att.mimeType.startsWith('image/') ? 'image' : att.mimeType.startsWith('video/') ? 'movie' : 'attach_file'}
                </span>
                <span className="text-sm text-ink font-medium truncate">{att.fileName}</span>
                <span className="text-xs text-muted ml-auto">{formatFileSize(att.fileSize)}</span>
              </a>
            ))}
          </div>
        )}
        {msg._count?.replies > 0 && (
          <button
            onClick={() => onOpenThread(msg.id)}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-accent font-semibold hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
            {msg._count.replies} {msg._count.replies === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
      {showActions && (
        <div className="absolute top-0 right-4 -translate-y-1/2 flex items-center bg-surface border border-border/40 rounded-lg shadow-lg overflow-hidden">
          <button onClick={() => onReply(msg.id)} className="p-1.5 hover:bg-chrome/10 transition-colors" title="Reply">
            <span className="material-symbols-outlined text-[16px] text-muted">reply</span>
          </button>
          {isOwn && (
            <>
              <button onClick={() => onEdit(msg)} className="p-1.5 hover:bg-chrome/10 transition-colors" title="Edit">
                <span className="material-symbols-outlined text-[16px] text-muted">edit</span>
              </button>
              <button onClick={() => onDelete(msg.id)} className="p-1.5 hover:bg-danger/10 transition-colors" title="Delete">
                <span className="material-symbols-outlined text-[16px] text-danger">delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ThreadPanel({ channelId, messageId, onClose, currentUserId }: {
  channelId: string;
  messageId: string;
  onClose: () => void;
  currentUserId: string;
}) {
  const { fetchThread, sendMessage } = useChannels();
  const [parent, setParent] = useState<ChannelMessage | null>(null);
  const [replies, setReplies] = useState<ChannelMessage[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchThread(channelId, messageId).then((data) => {
      if (data) {
        setParent(data.parent);
        setReplies(data.replies);
      }
      setLoaded(true);
    });
  }, [channelId, messageId, fetchThread]);

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    const ok = await sendMessage(channelId, replyContent.trim(), messageId);
    if (ok) {
      setReplyContent('');
      // Refetch thread
      const data = await fetchThread(channelId, messageId);
      if (data) {
        setReplies(data.replies);
      }
    }
  };

  return (
    <div className="w-96 border-l border-border/40 bg-surface flex flex-col h-full">
      <div className="h-14 border-b border-border/40 px-4 flex items-center justify-between">
        <h3 className="font-bold text-ink text-sm">Thread</h3>
        <button onClick={onClose} className="p-1 hover:bg-chrome/10 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[18px] text-muted">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!loaded ? (
          <div className="text-center py-8 text-muted text-sm">Loading...</div>
        ) : !parent ? (
          <div className="text-center py-8 text-muted text-sm">Message not found</div>
        ) : (
          <>
            <div className="flex gap-3 pb-3 border-b border-border/40">
              <div className="w-8 h-8 rounded-full bg-chrome text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {parent.user.avatar ? (
                  <img src={parent.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  parent.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-ink text-sm">{parent.user.fullName}</span>
                  <span className="text-xs text-muted">{formatTime(parent.createdAt)}</span>
                </div>
                <p className="text-sm text-ink/80 mt-0.5 whitespace-pre-wrap">{parent.content}</p>
              </div>
            </div>
            <div className="text-xs text-muted font-medium">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</div>
            {replies.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-chrome text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {r.user.avatar ? (
                    <img src={r.user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    r.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-ink text-xs">{r.user.fullName}</span>
                    <span className="text-[10px] text-muted">{formatTime(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink/80 mt-0.5 whitespace-pre-wrap">{r.content}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="p-3 border-t border-border/40">
        <div className="flex items-center gap-2 bg-canvas border border-border/60 rounded-xl px-3 py-2">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())}
            placeholder="Reply to thread..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-ink"
          />
          <button
            onClick={handleSendReply}
            disabled={!replyContent.trim()}
            className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center hover:brightness-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChannelsPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const {
    channels, activeChannel, messages, meetings, channelMembers, typingUsers,
    isLoadingChannels, isLoadingMessages, wsConnected,
    fetchChannels, createChannel, setActiveChannel, fetchMessages, sendMessage,
    editMessage, deleteMessage, startMeeting, endMeeting, fetchMeetings, fetchChannelMembers,
    updateChannelSettings, deleteChannel, uploadFile, sendTyping,
  } = useChannels();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChannelMessage | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ url: string; fileName: string; fileSize: number; mimeType: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch channels when workspace changes
  useEffect(() => {
    if (currentWorkspace.id && currentWorkspace.id !== 'personal') {
      fetchChannels(currentWorkspace.id);
    }
  }, [currentWorkspace.id, fetchChannels]);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      fetchChannelMembers(activeChannel.id);
      fetchMeetings(activeChannel.id);
    }
  }, [activeChannel?.id, fetchMessages, fetchChannelMembers, fetchMeetings]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || creating) return;
    setCreating(true);
    const ch = await createChannel(currentWorkspace.id, newChannelName.trim(), newChannelDesc.trim() || undefined);
    if (ch) {
      setActiveChannel(ch);
      setShowCreateModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
    }
    setCreating(false);
  };

  const handleSend = async () => {
    if (!activeChannel || (!messageInput.trim() && pendingAttachments.length === 0)) return;

    const content = editingMsg ? messageInput.trim() : messageInput.trim();

    if (editingMsg) {
      await editMessage(activeChannel.id, editingMsg.id, content);
      setEditingMsg(null);
      setMessageInput('');
      return;
    }

    const ok = await sendMessage(
      activeChannel.id,
      content,
      replyToId || undefined,
      pendingAttachments.length > 0 ? pendingAttachments : undefined
    );

    if (ok) {
      setMessageInput('');
      setReplyToId(null);
      setPendingAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (!activeChannel) return;
    sendTyping(activeChannel.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const att = await uploadFile(file);
    if (att) {
      setPendingAttachments(prev => [...prev, att]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartMeeting = async () => {
    if (!activeChannel || !meetTitle.trim()) return;
    const meeting = await startMeeting(activeChannel.id, meetTitle.trim());
    if (meeting) {
      setShowMeetModal(false);
      setMeetTitle('');
    }
  };

  const handleEditChannel = async () => {
    if (!activeChannel) return;
    await updateChannelSettings(activeChannel.id, {
      name: settingsName.trim(),
      description: settingsDesc.trim() || undefined,
    });
    setShowSettings(false);
  };

  const handleToggleReadOnly = async () => {
    if (!activeChannel) return;
    const currentReadOnly = (activeChannel.settings as Record<string, unknown>)?.isReadOnly as boolean;
    await updateChannelSettings(activeChannel.id, {
      settings: { isReadOnly: !currentReadOnly },
    });
  };

  const typingIndicator = typingUsers.length > 0
    ? typingUsers.length === 1
      ? 'Someone is typing...'
      : `${typingUsers.length} people are typing...`
    : null;

  const myRole = activeChannel?.myRole;
  const canAdmin = myRole === 'OWNER' || myRole === 'ADMIN';

  return (
    <>
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader searchPlaceholder="Search channels, messages, or files..." />

        <div className="flex-1 flex overflow-hidden">
          {/* Channels Sidebar */}
          <div className="w-64 border-r border-border/40 bg-surface/50 flex flex-col hidden md:flex">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-bold text-ink text-sm">All Channels</h2>
              {currentWorkspace.id !== 'personal' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-muted hover:text-ink transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isLoadingChannels ? (
                <div className="text-center py-8 text-muted text-sm">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[32px] text-muted/40 mb-2">tag</span>
                  <p className="text-xs text-muted">No channels yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 text-xs text-accent font-semibold hover:underline"
                  >
                    Create your first channel
                  </button>
                </div>
              ) : (
                channels.filter(ch => ch.isMember).map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setReplyToId(null);
                      setThreadMessageId(null);
                      setEditingMsg(null);
                      setActiveChannel(channel);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                      activeChannel?.id === channel.id
                        ? 'bg-accent text-white shadow-md'
                        : 'hover:bg-chrome/5 text-muted hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[18px] opacity-70">tag</span>
                      <span className="font-medium text-sm truncate">{channel.name}</span>
                    </div>
                    {channel.lastMessage && (
                      <span className="text-[10px] text-muted ml-1 flex-shrink-0">{formatTime(channel.lastMessage.createdAt)}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Channel Content Area */}
          <div className="flex-1 flex flex-col bg-surface">
            {activeChannel ? (
              <>
                {/* Channel Header */}
                <div className="h-16 border-b border-border/40 px-6 flex items-center justify-between bg-surface">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-ink opacity-40 text-[24px]">tag</span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-ink capitalize truncate">{activeChannel.name}</h2>
                      {activeChannel.description && (
                        <p className="text-xs text-muted truncate">{activeChannel.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-2">
                      {channelMembers.slice(0, 3).map((m) => (
                        <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-chrome text-white flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          {m.user.avatar ? (
                            <img src={m.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            m.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                          )}
                        </div>
                      ))}
                      {channelMembers.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-border flex items-center justify-center text-[10px] font-bold text-muted">
                          +{channelMembers.length - 3}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowMeetModal(true)}
                      className="bg-accent text-white px-4 py-2 rounded-full font-bold text-sm hover:brightness-105 transition-transform flex items-center gap-2 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                      Meet Now
                    </button>
                    {canAdmin && (
                      <button
                        onClick={() => {
                          setSettingsName(activeChannel.name);
                          setSettingsDesc(activeChannel.description || '');
                          setShowSettings(true);
                        }}
                        className="p-2 text-muted hover:text-ink hover:bg-chrome/10 rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4 space-y-1">
                  {isLoadingMessages ? (
                    <div className="text-center py-12 text-muted text-sm">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-[48px] text-muted/30 mb-3">tag</span>
                      <h3 className="font-bold text-ink text-lg">Welcome to #{activeChannel.name}</h3>
                      <p className="text-sm text-muted mt-1">This is the beginning of the conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        currentUserId={user?.id || ''}
                        onReply={(parentId) => {
                          setReplyToId(parentId);
                          setMessageInput('');
                        }}
                        onEdit={(m) => {
                          setEditingMsg(m);
                          setMessageInput(m.content);
                        }}
                        onDelete={(msgId) => deleteMessage(activeChannel.id, msgId)}
                        onOpenThread={(msgId) => setThreadMessageId(msgId)}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply indicator */}
                {replyToId && (
                  <div className="px-6 py-2 bg-accent/5 border-t border-accent/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink">
                      <span className="material-symbols-outlined text-[16px] text-accent">reply</span>
                      Replying to a message
                    </div>
                    <button onClick={() => setReplyToId(null)} className="text-muted hover:text-ink">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {/* Editing indicator */}
                {editingMsg && (
                  <div className="px-6 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">edit</span>
                      Editing message
                    </div>
                    <button onClick={() => { setEditingMsg(null); setMessageInput(''); }} className="text-muted hover:text-ink">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                {/* Pending attachments */}
                {pendingAttachments.length > 0 && (
                  <div className="px-6 py-2 border-t border-border/40 flex gap-2 flex-wrap">
                    {pendingAttachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border/40 rounded-lg text-sm">
                        <span className="material-symbols-outlined text-[14px] text-accent">attach_file</span>
                        <span className="text-ink truncate max-w-[150px]">{att.fileName}</span>
                        <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Typing indicator */}
                {typingIndicator && (
                  <div className="px-6 py-1 text-xs text-muted italic">{typingIndicator}</div>
                )}

                {/* Message Input */}
                <div className="p-4 bg-surface border-t border-border/40">
                  <div className="bg-canvas border border-border/60 rounded-xl p-2 pr-4 flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip,.mp4,.mp3"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-muted hover:text-ink transition-colors rounded-xl hover:bg-chrome/5"
                      disabled={uploading}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {uploading ? 'hourglass_empty' : 'add_circle'}
                      </span>
                    </button>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => { setMessageInput(e.target.value); handleTyping(); }}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message #${activeChannel.name}...`}
                      className="flex-1 bg-transparent text-sm focus:outline-none text-ink"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!messageInput.trim() && pendingAttachments.length === 0}
                      className="bg-accent text-white w-8 h-8 rounded-xl flex items-center justify-center hover:brightness-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No Channel Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-[64px] text-muted/20 mb-4">tag</span>
                  <h3 className="font-bold text-ink text-xl">Select a channel</h3>
                  <p className="text-sm text-muted mt-2">Choose a channel from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>

          {/* Thread Panel */}
          {threadMessageId && activeChannel && (
            <ThreadPanel
              key={threadMessageId}
              channelId={activeChannel.id}
              messageId={threadMessageId}
              onClose={() => setThreadMessageId(null)}
              currentUserId={user?.id || ''}
            />
          )}
        </div>
      </main>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-ink mb-4">Create Channel</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Channel Name</label>
                <div className="flex items-center gap-2 bg-canvas border border-border/60 rounded-xl px-3 py-2.5">
                  <span className="text-muted">#</span>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                    placeholder="e.g. engineering"
                    className="flex-1 bg-transparent text-sm focus:outline-none text-ink"
                    autoFocus
                    maxLength={50}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Description (optional)</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  className="w-full bg-canvas border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none text-ink"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim() || creating}
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Meeting Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMeetModal(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-ink mb-4">Start Meeting</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Meeting Title</label>
                <input
                  type="text"
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                  placeholder={`${activeChannel?.name || 'Channel'} meeting`}
                  className="w-full bg-canvas border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none text-ink"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowMeetModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border/60 rounded-xl text-sm font-medium text-muted hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartMeeting}
                  disabled={!meetTitle.trim()}
                  className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40"
                >
                  Start Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Settings Slide-over */}
      {showSettings && activeChannel && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="w-96 bg-surface h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="h-14 border-b border-border/40 px-4 flex items-center justify-between">
              <h3 className="font-bold text-ink text-sm">Channel Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-chrome/10 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[18px] text-muted">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Channel Name</label>
                <div className="flex items-center gap-2 bg-canvas border border-border/60 rounded-xl px-3 py-2.5">
                  <span className="text-muted">#</span>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="flex-1 bg-transparent text-sm focus:outline-none text-ink"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-1 block">Description</label>
                <input
                  type="text"
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  className="w-full bg-canvas border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none text-ink"
                />
              </div>
              <button
                onClick={handleEditChannel}
                className="w-full px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all"
              >
                Save Changes
              </button>

              {canAdmin && (
                <>
                  <div className="border-t border-border/40 pt-4">
                    <label className="text-sm font-medium text-ink mb-2 block">Permissions</label>
                    <div className="flex items-center justify-between p-3 bg-canvas border border-border/40 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-ink">Read Only</p>
                        <p className="text-xs text-muted">Only admins can send messages</p>
                      </div>
                      <button
                        onClick={handleToggleReadOnly}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          (activeChannel.settings as Record<string, unknown>)?.isReadOnly ? 'bg-accent' : 'bg-chrome/30'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          (activeChannel.settings as Record<string, unknown>)?.isReadOnly ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4">
                    <h4 className="text-sm font-medium text-ink mb-3">Members ({channelMembers.length})</h4>
                    <div className="space-y-2">
                      {channelMembers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-chrome/5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-chrome text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                              {m.user.avatar ? (
                                <img src={m.user.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                m.user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink">{m.user.fullName}</p>
                              <p className="text-[10px] text-muted">{m.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-border/40 pt-4">
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to leave this channel?')) {
                      await deleteChannel(activeChannel.id);
                      setShowSettings(false);
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-danger/30 text-danger rounded-xl text-sm font-medium hover:bg-danger/5 transition-colors"
                >
                  {myRole === 'OWNER' ? 'Delete Channel' : 'Leave Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useWorkspace, Workspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace, isUserOrgOwner, joinWorkspaceWithCode } = useWorkspace();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowJoinInput(false);
        setJoinCode('');
        setJoinError(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setJoinError(null);

    const success = await joinWorkspaceWithCode(joinCode);
    if (success) {
      setShowJoinInput(false);
      setJoinCode('');
      setIsOpen(false);
    } else {
      setJoinError('Invalid invite code. Please check and try again.');
    }
    setIsJoining(false);
  };

  const getWorkspaceAvatar = (workspace: Workspace) => {
    if (workspace.type === 'personal') {
      return (
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[16px]">person</span>
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-xs">
        {workspace.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  // Standalone individual with no organization affiliations
  if (workspaces.length === 1 && workspaces[0].type === 'personal') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 pl-3 pr-3 py-2.5 bg-white border border-[#c4c7c7]/30 text-[#1c1b1b] rounded-xl hover:border-[#FF416C]/30 hover:shadow-md transition-all shadow-sm"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center text-white text-[11px] font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <span className="text-[13px] font-bold line-clamp-1 max-w-[90px] sm:max-w-[120px]">
            {currentWorkspace.name}
          </span>
          <span className={`material-symbols-outlined text-[#8C8880] text-[16px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0f1115] rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-slate-700/50">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Your Workspace</p>
            </div>

            <div className="p-1.5">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
                {getWorkspaceAvatar(workspaces[0])}
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-white line-clamp-1">{workspaces[0].name}</p>
                  <p className="text-[10px] text-white/40">Personal Workspace</p>
                </div>
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
              </div>
            </div>

            {/* Join Workspace Option */}
            <div className="border-t border-slate-700/50 p-1.5">
              {!showJoinInput ? (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/50 text-[16px]">group_add</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Join an Organization</p>
                    <p className="text-[10px] text-white/40">Enter an invite code to join a team</p>
                  </div>
                </button>
              ) : (
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-white/40">Invite Code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value); setJoinError(null); }}
                      className="w-full bg-white/5 border border-slate-700/50 rounded-lg py-2.5 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10 transition-all"
                      placeholder="e.g. ABC123"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    {joinError && (
                      <p className="text-xs text-rose-400 font-medium">{joinError}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowJoinInput(false); setJoinCode(''); setJoinError(null); }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-white/50 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoin}
                      disabled={isJoining || !joinCode.trim()}
                      className="flex-1 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      {isJoining ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Link */}
            <div className="border-t border-slate-700/50 p-1.5">
              <Link
                href="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/50 text-[16px]">settings</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Settings</p>
                  <p className="text-[10px] text-white/40">Profile, notifications, security</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User has multiple workspaces (Owner or Member with org access)
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-3 pr-3 py-2.5 bg-white border border-[#c4c7c7]/30 text-[#1c1b1b] rounded-xl hover:border-[#FF416C]/30 hover:shadow-md transition-all shadow-sm"
      >
        {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center text-white text-[11px] font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        <span className="text-[13px] font-bold line-clamp-1 max-w-[90px] sm:max-w-[120px]">
          {currentWorkspace.name}
        </span>
        <span className={`material-symbols-outlined text-[#8C8880] text-[16px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Profile Toggle & Context Dropdown Container */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0f1115] rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-700/50">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              {isUserOrgOwner() ? 'Switch Context Profile' : 'Your Workspaces'}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
            {workspaces.map((workspace) => {
              const isSelected = workspace.id === currentWorkspace.id;
              return (
                <button
                  key={workspace.id}
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {getWorkspaceAvatar(workspace)}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white line-clamp-1">{workspace.name}</p>
                      {workspace.type === 'organization' && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          workspace.role === 'owner' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/50'
                        }`}>
                          {workspace.role}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40">
                      {workspace.type === 'personal' ? 'Personal Workspace' : 'Organization'}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Link */}
          <div className="border-t border-slate-700/50 p-1.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/50 text-[16px]">settings</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Settings</p>
                <p className="text-[10px] text-white/40">Profile, notifications, security</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

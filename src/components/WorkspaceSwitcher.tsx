'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace, Workspace } from '@/contexts/WorkspaceContext';

export default function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getWorkspaceAvatar = (workspace: Workspace) => {
    if (workspace.type === 'personal') {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[18px]">person</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xs">
        {workspace.avatar || workspace.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  const getWorkspaceBadge = (workspace: Workspace) => {
    if (workspace.type === 'personal') {
      return null;
    }
    const roleColors = {
      owner: 'bg-rose-100 text-rose-600',
      admin: 'bg-indigo-100 text-indigo-600',
      member: 'bg-slate-100 text-slate-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColors[workspace.role || 'member']}`}>
        {workspace.role}
      </span>
    );
  };

  if (workspaces.length === 1) {
    return (
      <div className="flex items-center gap-3 px-2 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-black">Relay</span>
          <span className="text-xl font-bold tracking-tighter text-[#8C8880]">.ai</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-black/5 transition-all group"
        aria-label="Switch workspace"
      >
        {getWorkspaceAvatar(currentWorkspace)}
        <div className="text-left">
          <p className="text-sm font-bold text-black group-hover:text-indigo-600 transition-colors">
            {currentWorkspace.name}
          </p>
          {currentWorkspace.type === 'organization' && (
            <p className="text-[10px] text-[#8C8880] uppercase tracking-wider font-medium">
              {currentWorkspace.role}
            </p>
          )}
        </div>
        <span
          className={`material-symbols-outlined text-[#8C8880] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#D9D7D0]/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-[#D9D7D0]/40">
            <p className="text-[10px] font-bold text-[#8C8880] uppercase tracking-wider">Switch Workspace</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  switchWorkspace(workspace.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF9F5] transition-colors ${
                  workspace.id === currentWorkspace.id ? 'bg-[#FAF9F5]' : ''
                }`}
              >
                {getWorkspaceAvatar(workspace)}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-black">{workspace.name}</p>
                    {getWorkspaceBadge(workspace)}
                  </div>
                  {workspace.type === 'organization' && (
                    <p className="text-[10px] text-[#8C8880]">Organization</p>
                  )}
                </div>
                {workspace.id === currentWorkspace.id && (
                  <span className="material-symbols-outlined text-indigo-600 text-[18px]">check</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-[#D9D7D0]/40">
            <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-[#FAF9F5] transition-colors text-sm font-bold text-black">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create or Join Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

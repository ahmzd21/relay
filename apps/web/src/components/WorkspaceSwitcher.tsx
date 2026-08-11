"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWorkspace, Workspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";

export default function WorkspaceSwitcher() {
  const {
    currentWorkspace,
    workspaces,
    switchWorkspace,
    isUserOrgOwner,
    joinWorkspaceWithCode,
  } = useWorkspace();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowJoinInput(false);
        setJoinCode("");
        setJoinError(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setJoinError(null);

    const success = await joinWorkspaceWithCode(joinCode);
    if (success) {
      setShowJoinInput(false);
      setJoinCode("");
      setIsOpen(false);
    } else {
      setJoinError("Invalid invite code. Please check and try again.");
    }
    setIsJoining(false);
  };

  const getWorkspaceAvatar = (workspace: Workspace) => {
    return (
      <div className="w-7 h-7 rounded-lg bg-canvas border border-border flex items-center justify-center text-muted">
        {workspace.type === "personal" ? (
          <span className="material-symbols-outlined text-[16px]">
            person
          </span>
        ) : (
          <span className="font-bold text-xs">
            {workspace.name.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    );
  };

  const userAvatar = user?.avatar ? (
    <Image
      src={user.avatar}
      alt=""
      width={24}
      height={24}
      className="w-6 h-6 rounded-lg object-cover"
    />
  ) : (
    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-accent-deep flex items-center justify-center text-white text-[11px] font-bold">
      {user?.fullName?.charAt(0).toUpperCase() || "?"}
    </div>
  );

  const triggerClass =
    "flex items-center gap-2.5 pl-3 pr-3 py-2.5 bg-surface border border-border text-ink rounded-lg hover:border-border-strong hover:shadow-pop transition-all shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

  const dropdownClass =
    "absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-surface rounded-xl shadow-pop border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200";

  const footerLinkClass =
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-canvas transition-colors";

  const dropdown = (showSettings: boolean) => (
    <>
      {showSettings && (
        <div className="border-t border-border p-1.5">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className={footerLinkClass}
          >
            <div className="w-7 h-7 rounded-lg bg-canvas border border-border flex items-center justify-center text-muted">
              <span className="material-symbols-outlined text-[16px]">
                settings
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Settings</p>
              <p className="text-[10px] text-muted">
                Profile, notifications, security
              </p>
            </div>
          </Link>
        </div>
      )}
    </>
  );

  // Standalone individual with no organization affiliations
  if (workspaces.length === 1 && workspaces[0].type === "personal") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setIsOpen(!isOpen)} className={triggerClass}>
          {userAvatar}
          <span className="text-[13px] font-bold line-clamp-1 max-w-[90px] sm:max-w-[120px]">
            {currentWorkspace.name}
          </span>
          <span
            className={`material-symbols-outlined text-muted text-[16px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          >
            expand_more
          </span>
        </button>

        {isOpen && (
          <div className={dropdownClass}>
            <div className="p-3 border-b border-border">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Your Workspace
              </p>
            </div>

            <div className="p-1.5">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-canvas">
                {getWorkspaceAvatar(workspaces[0])}
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-ink line-clamp-1">
                    {workspaces[0].name}
                  </p>
                  <p className="text-[10px] text-muted">
                    Personal Workspace
                  </p>
                </div>
                <span className="material-symbols-outlined text-success text-[18px]">
                  check_circle
                </span>
              </div>
            </div>

            {/* Join Workspace Option */}
            <div className="border-t border-border p-1.5">
              {!showJoinInput ? (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-canvas transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-canvas border border-border flex items-center justify-center text-muted">
                    <span className="material-symbols-outlined text-[16px]">
                      group_add
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      Join an Organization
                    </p>
                    <p className="text-[10px] text-muted">
                      Enter an invite code to join a team
                    </p>
                  </div>
                </button>
              ) : (
                <div className="p-3 space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted">
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value);
                        setJoinError(null);
                      }}
                      className="w-full bg-canvas border border-border rounded-lg py-2.5 px-4 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                      placeholder="e.g. ABC123"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    />
                    {joinError && (
                      <p className="text-xs text-danger font-medium">
                        {joinError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowJoinInput(false);
                        setJoinCode("");
                        setJoinError(null);
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-muted hover:bg-canvas transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleJoin}
                      disabled={isJoining || !joinCode.trim()}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-accent to-accent-deep text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isJoining ? "Joining..." : "Join"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {dropdown(true)}
          </div>
        )}
      </div>
    );
  }

  // User has multiple workspaces (Owner or Member with org access)
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={triggerClass}>
        {userAvatar}
        <span className="text-[13px] font-bold line-clamp-1 max-w-[90px] sm:max-w-[120px]">
          {currentWorkspace.name}
        </span>
        <span
          className={`material-symbols-outlined text-muted text-[16px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className={dropdownClass}>
          <div className="p-3 border-b border-border">
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {isUserOrgOwner() ? "Switch Context Profile" : "Your Workspaces"}
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
                    isSelected ? "bg-accent/10" : "hover:bg-canvas"
                  }`}
                >
                  {getWorkspaceAvatar(workspace)}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink line-clamp-1">
                        {workspace.name}
                      </p>
                      {workspace.type === "organization" && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            workspace.role === "owner"
                              ? "bg-danger/10 text-danger"
                              : "bg-canvas text-muted"
                          }`}
                        >
                          {workspace.role}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted">
                      {workspace.type === "personal"
                        ? "Personal Workspace"
                        : "Organization"}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-success text-[18px]">
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {dropdown(true)}
        </div>
      )}
    </div>
  );
}

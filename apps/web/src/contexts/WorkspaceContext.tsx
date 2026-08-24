'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type WorkspaceType = 'personal' | 'organization';

export interface Workspace {
  id: string;
  type: WorkspaceType;
  name: string;
  avatar?: string;
  role?: 'owner' | 'admin' | 'member';
  inviteCode?: string;
  settings?: Record<string, unknown>;
  subscriptionTier?: string;
  minutesUsed?: number;
  minutesLimit?: number;
}

export interface Member {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  createdAt: string;
}

export interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  members: Member[];
  invites: Invite[];
  isLoading: boolean;
  membersLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  joinWorkspaceWithCode: (code: string) => Promise<boolean>;
  removeWorkspace: (workspaceId: string) => void;
  isPersonal: () => boolean;
  isOrganization: () => boolean;
  hasPermission: (permission: 'owner' | 'admin' | 'member') => boolean;
  isUserOrgOwner: () => boolean;
  refetchWorkspaces: () => Promise<void>;
  fetchMembers: (workspaceId?: string) => Promise<void>;
  fetchInvites: () => Promise<void>;
  inviteMember: (email: string, role: 'admin' | 'member') => Promise<boolean>;
  resendInvite: (inviteId: string) => Promise<boolean>;
  revokeInvite: (inviteId: string) => Promise<boolean>;
  changeMemberRole: (userId: string, role: 'owner' | 'admin' | 'member') => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  regenerateInviteCode: () => Promise<string | null>;
  updateWorkspaceSettings: (settings: Record<string, unknown>) => Promise<boolean>;
  updateWorkspaceName: (name: string) => Promise<boolean>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const DEFAULT_WORKSPACES: Workspace[] = [{ id: 'personal', type: 'personal', name: 'Personal Profile', role: 'owner' }];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('personal');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchWorkspaces = useCallback(async (): Promise<{ workspaces: Workspace[]; currentId: string } | null> => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        if (data.workspaces && data.workspaces.length > 0) {
          const savedId = localStorage.getItem('current-workspace');
          const validId = data.workspaces.find((w: Workspace) => w.id === savedId) ? savedId : data.workspaces[0].id;
          return { workspaces: data.workspaces, currentId: validId };
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
    return null;
  }, []);

  const applyWorkspaceResult = useCallback(
    (result: { workspaces: Workspace[]; currentId: string } | null) => {
      if (result) {
        setWorkspaces(result.workspaces);
        setCurrentWorkspaceId(result.currentId);
      }
      setIsLoading(false);
      setIsInitialized(true);
    },
    [],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem('relay-workspaces');
      const savedId = localStorage.getItem('current-workspace');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkspaces(parsed);
          if (savedId && parsed.some(w => w.id === savedId)) {
            setCurrentWorkspaceId(savedId);
          }
        }
      }
    } catch {
      // ignore
    }

    let cancelled = false;
    fetchWorkspaces().then((result) => {
      if (cancelled) return;
      applyWorkspaceResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchWorkspaces, applyWorkspaceResult]);

  const refetchWorkspaces = useCallback(async () => {
    const result = await fetchWorkspaces();
    applyWorkspaceResult(result);
  }, [fetchWorkspaces, applyWorkspaceResult]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('relay-workspaces', JSON.stringify(workspaces));
  }, [workspaces, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('current-workspace', currentWorkspaceId);
  }, [currentWorkspaceId, isInitialized]);

  const defaultWorkspace: Workspace = { id: 'personal', type: 'personal', name: 'Personal Profile', role: 'owner' };
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || defaultWorkspace;

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceId(workspaceId);
      setMembers([]);
      setInvites([]);
    }
  };

  const createWorkspace = async (name: string): Promise<Workspace | null> => {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newWorkspace: Workspace = {
        id: data.workspace.id,
        type: data.workspace.type as WorkspaceType,
        name: data.workspace.name,
        role: data.workspace.role as Workspace['role'],
      };
      setWorkspaces(prev => [...prev, newWorkspace]);
      setCurrentWorkspaceId(newWorkspace.id);
      return newWorkspace;
    } catch (err) {
      console.error('Failed to create workspace:', err);
      return null;
    }
  };

  const joinWorkspaceWithCode = async (code: string): Promise<boolean> => {
    if (!code || code.trim().length < 2) return false;

    try {
      const res = await fetch('/api/workspaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      const joinedWorkspace: Workspace = {
        id: data.workspace.id,
        type: data.workspace.type as WorkspaceType,
        name: data.workspace.name,
        role: data.workspace.role as Workspace['role'],
      };

      setWorkspaces(prev => {
        if (prev.some(w => w.id === joinedWorkspace.id)) return prev;
        return [...prev, joinedWorkspace];
      });
      setCurrentWorkspaceId(joinedWorkspace.id);
      return true;
    } catch (err) {
      console.error('Failed to join workspace:', err);
      return false;
    }
  };

  const removeWorkspace = (workspaceId: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    if (currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId(workspaces[0]?.id || 'personal');
    }
  };

  const isPersonal = () => currentWorkspace.type === 'personal';
  const isOrganization = () => currentWorkspace.type === 'organization';

  const isUserOrgOwner = () => {
    return workspaces.some(w => w.type === 'organization' && w.role === 'owner');
  };

  const hasPermission = (permission: 'owner' | 'admin' | 'member') => {
    if (!currentWorkspace.role) return false;
    const roleHierarchy = { owner: 3, admin: 2, member: 1 };
    return roleHierarchy[currentWorkspace.role] >= roleHierarchy[permission];
  };

  // --- Members ---
  const fetchMembers = useCallback(async (workspaceId?: string) => {
    const id = workspaceId || currentWorkspaceId;
    if (id === 'personal') return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [currentWorkspaceId]);

  // --- Invites ---
  const fetchInvites = useCallback(async () => {
    if (currentWorkspaceId === 'personal') return;
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/invites`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data.invites || []);
      }
    } catch (err) {
      console.error('Failed to fetch invites:', err);
    }
  }, [currentWorkspaceId]);

  const inviteMember = async (email: string, role: 'admin' | 'member'): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        await fetchInvites();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resendInvite = async (inviteId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/invite/resend/${inviteId}`, {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const revokeInvite = async (inviteId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/invite/${inviteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchInvites();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const changeMemberRole = async (userId: string, role: 'owner' | 'admin' | 'member'): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        await fetchMembers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const removeMember = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/members/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchMembers();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const regenerateInviteCode = async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}/invite/regenerate-code`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(prev =>
          prev.map(w =>
            w.id === currentWorkspaceId ? { ...w, inviteCode: data.inviteCode, settings: { ...w.settings, inviteCode: data.inviteCode } } : w
          )
        );
        return data.inviteCode;
      }
      return null;
    } catch {
      return null;
    }
  };

  const updateWorkspaceSettings = async (settings: Record<string, unknown>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(prev =>
          prev.map(w =>
            w.id === currentWorkspaceId ? { ...w, settings: data.workspace.settings } : w
          )
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateWorkspaceName = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(prev =>
          prev.map(w =>
            w.id === currentWorkspaceId ? { ...w, name: data.workspace.name } : w
          )
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        removeWorkspace(workspaceId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        members,
        invites,
        isLoading,
        membersLoading,
        switchWorkspace,
        createWorkspace,
        joinWorkspaceWithCode,
        removeWorkspace,
        isPersonal,
        isOrganization,
        hasPermission,
        isUserOrgOwner,
        refetchWorkspaces,
        fetchMembers,
        fetchInvites,
        inviteMember,
        resendInvite,
        revokeInvite,
        changeMemberRole,
        removeMember,
        regenerateInviteCode,
        updateWorkspaceSettings,
        updateWorkspaceName,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

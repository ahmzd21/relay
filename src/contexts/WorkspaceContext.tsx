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
}

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  joinWorkspaceWithCode: (code: string) => Promise<boolean>;
  removeWorkspace: (workspaceId: string) => void;
  isPersonal: () => boolean;
  isOrganization: () => boolean;
  hasPermission: (permission: 'owner' | 'admin' | 'member') => boolean;
  isUserOrgOwner: () => boolean;
  refetchWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'personal', type: 'personal', name: 'Personal Profile', role: 'owner' }
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('personal');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        if (data.workspaces && data.workspaces.length > 0) {
          setWorkspaces(data.workspaces);
          // Restore last selected workspace or default to first
          const savedId = localStorage.getItem('current-workspace');
          const validId = data.workspaces.find((w: Workspace) => w.id === savedId) ? savedId : data.workspaces[0].id;
          setCurrentWorkspaceId(validId!);
        }
      }
    } catch (err) {
      // Keep fallback workspaces on network failure
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Fetch workspaces from backend on mount, with localStorage fallback
  useEffect(() => {
    const savedWorkspaces = localStorage.getItem('relay-workspaces');
    const savedWorkspaceId = localStorage.getItem('current-workspace');

    // Set initial fallback from localStorage
    if (savedWorkspaces) {
      try {
        setWorkspaces(JSON.parse(savedWorkspaces));
      } catch {}
    }
    if (savedWorkspaceId) {
      setCurrentWorkspaceId(savedWorkspaceId);
    }

    // Then fetch fresh data from backend
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Persist to localStorage whenever workspaces or current changes
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('relay-workspaces', JSON.stringify(workspaces));
  }, [workspaces, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('current-workspace', currentWorkspaceId);
  }, [currentWorkspaceId, isInitialized]);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceId(workspaceId);
    }
  };

  const addWorkspace = (workspace: Workspace) => {
    setWorkspaces(prev => {
      if (prev.some(w => w.id === workspace.id)) return prev;
      return [...prev, workspace];
    });
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
        type: data.workspace.type,
        name: data.workspace.name,
        role: data.workspace.role,
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

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        isLoading,
        switchWorkspace,
        addWorkspace,
        joinWorkspaceWithCode,
        removeWorkspace,
        isPersonal,
        isOrganization,
        hasPermission,
        isUserOrgOwner,
        refetchWorkspaces: fetchWorkspaces,
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

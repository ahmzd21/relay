'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WorkspaceType = 'personal' | 'organization';

export interface Workspace {
  id: string;
  type: WorkspaceType;
  name: string;
  avatar?: string;
  role?: 'owner' | 'admin' | 'member';
  settings?: {
    accentColor?: string;
    logo?: string;
  };
}

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
  isPersonal: () => boolean;
  isOrganization: () => boolean;
  hasPermission: (permission: 'owner' | 'admin' | 'member') => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 'personal',
      type: 'personal',
      name: 'Personal Workspace',
      role: 'owner',
    }
  ]);

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('personal');

  // Load from localStorage on mount
  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('current-workspace');
    if (savedWorkspaceId) {
      setCurrentWorkspaceId(savedWorkspaceId);
    }
  }, []);

  // Save to localStorage when workspace changes
  useEffect(() => {
    localStorage.setItem('current-workspace', currentWorkspaceId);
  }, [currentWorkspaceId]);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceId(workspaceId);
    }
  };

  const addWorkspace = (workspace: Workspace) => {
    setWorkspaces(prev => [...prev, workspace]);
  };

  const removeWorkspace = (workspaceId: string) => {
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    if (currentWorkspaceId === workspaceId) {
      setCurrentWorkspaceId('personal');
    }
  };

  const isPersonal = () => currentWorkspace.type === 'personal';
  const isOrganization = () => currentWorkspace.type === 'organization';

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
        switchWorkspace,
        addWorkspace,
        removeWorkspace,
        isPersonal,
        isOrganization,
        hasPermission,
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

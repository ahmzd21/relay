'use client';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth, getUserJobRole } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import Modal from '@/components/ui/Modal';
import { Button, Input, Toggle } from '@/components/ui';

type SettingsTab = 'profile' | 'language' | 'workspace' | 'members' | 'policies';

export default function SettingsPage() {
  const { isOrganization, currentWorkspace, hasPermission, joinWorkspaceWithCode, addWorkspace } = useWorkspace();
  const { user, refetchUser } = useAuth();
  const { preferences, updatePreferences, deviceCount, pushEnabled, requestPushPermission } = useNotifications();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const isOrg = isOrganization();
  const isOwner = hasPermission('owner');

  const [tab, setTab] = useState<SettingsTab>('profile');

  // Personal settings state
  const [speakingLanguage, setSpeakingLanguage] = useState('english');
  const [hearingLanguage, setHearingLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
  const [selectedVoice, setSelectedVoice] = useState('natural');

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'intro' | 'qr' | 'verify' | 'backup'>('intro');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSetupLoading, setIsSetupLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isDisableLoading, setIsDisableLoading] = useState(false);

  // Edit profile state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editJobRole, setEditJobRole] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Org join/create state
  const [joinCode, setJoinCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Org settings state
  const [meetingHostPolicy, setMeetingHostPolicy] = useState('all');
  const [autoRecording, setAutoRecording] = useState(false);

  const tabs = isOrg
    ? ([
        { key: 'profile' as const, label: 'Profile' },
        { key: 'language' as const, label: 'Languages' },
        { key: 'members' as const, label: 'Members' },
        ...(isOwner ? [{ key: 'policies' as const, label: 'Policies' }] : []),
      ])
    : ([
        { key: 'profile' as const, label: 'Profile' },
        { key: 'language' as const, label: 'Languages' },
        { key: 'workspace' as const, label: 'Workspace' },
      ]);

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const success = await joinWorkspaceWithCode(joinCode);
    if (success) {
      setStatusMessage('Successfully joined organization!');
      setJoinCode('');
      setShowJoinInput(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    addWorkspace({
      id: 'org-' + Date.now(),
      type: 'organization',
      name: orgName,
      role: 'owner',
      inviteCode: 'RELAY-' + Math.floor(1000 + Math.random() * 9000),
    });
    setStatusMessage(`Created "${orgName}" workspace!`);
    setOrgName('');
    setShowCreateInput(false);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader
          rightContent={
            statusMessage ? (
              <span className="text-xs font-bold text-white bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] px-3 py-1.5 rounded-full shadow-sm shadow-[#FF416C]/20">
                {statusMessage}
              </span>
            ) : null
          }
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Page Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">
                {isOrg ? `${currentWorkspace.name} Settings` : 'Personal Settings'}
              </h1>
              <p className="text-slate-600 text-lg">
                {isOrg && isOwner ? 'Manage members, policies, and workspace configuration.' : isOrg ? 'Manage your profile and language preferences.' : 'Manage your account, preferences, and workspace connections.'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#FFFDF8] border border-[#E4E0D6]/30 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase font-helvetica transition-all ${
                    tab === t.key
                      ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ==================== PROFILE TAB ==================== */}
            {tab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {user?.avatar ? (
                        <Image src={user.avatar} alt={user.fullName} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#FF416C]/20">
                          {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold font-helvetica text-slate-900">{user?.fullName || 'User'}</h3>
                        <p className="text-slate-500 text-sm">{user?.email || ''}</p>
                        {getUserJobRole(user) && (
                          <p className="text-xs font-bold text-slate-600 mt-0.5">{getUserJobRole(user)}</p>
                        )}
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20">
                          {isOrg ? `${currentWorkspace.role} · ${currentWorkspace.name}` : 'Solo Account'}
                        </span>
                      </div>
                    </div>
                    <button
                      className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors"
                      onClick={() => {
                        setEditFullName(user?.fullName || '');
                        setEditJobRole(getUserJobRole(user) || '');
                        setProfileError(null);
                        setAvatarPreview(null);
                        setShowEditProfileModal(true);
                      }}
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-6">Account Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                          <span className="material-symbols-outlined text-white text-[20px]">lock</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Password</p>
                          <p className="text-xs text-slate-500">
                            {user?.hasPassword
                              ? 'Set a new password'
                              : 'No password set'}
                          </p>
                        </div>
                      </div>
                      {!user?.hasPassword ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {user?.provider === 'google' ? 'Google' : 'None'}
                        </span>
                      ) : (
                        <button
                          className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors"
                          onClick={() => {
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordError(null);
                            setShowPasswordModal(true);
                          }}
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl cursor-pointer hover:border-[#FF416C]/30 hover:shadow-md transition-all duration-300"
                      onClick={() => {
                        if (user?.twoFactorEnabled) {
                          setShow2FADisable(true);
                        } else {
                          setShow2FASetup(true);
                          setTwoFactorStep('intro');
                          setSetupCode('');
                          setSetupError(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                          <span className="material-symbols-outlined text-white text-[20px]">shield</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Two-Factor Authentication</p>
                          <p className="text-xs text-slate-500">{user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        user?.twoFactorEnabled
                          ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {user?.twoFactorEnabled ? 'Active' : 'Setup'}
                        <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                          <span className="material-symbols-outlined text-white text-[20px]">notifications</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Notifications</p>
                          <p className="text-xs text-slate-500">Email and push notifications</p>
                        </div>
                      </div>
                      <button
                        className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors"
                        onClick={() => setShowNotificationModal(true)}
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== LANGUAGE TAB ==================== */}
            {tab === 'language' && (
              <div className="space-y-6">
                {/* Language Preferences */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[20px]">translate</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Language Preferences</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Configure your translation matrix</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SelectField
                      label="My Speech"
                      value={speakingLanguage}
                      onChange={setSpeakingLanguage}
                      options={[
                        { value: 'english', label: 'English' },
                        { value: 'spanish', label: 'Spanish' },
                        { value: 'french', label: 'French' },
                        { value: 'arabic', label: 'Arabic' },
                        { value: 'mandarin', label: 'Mandarin' },
                        { value: 'japanese', label: 'Japanese' },
                      ]}
                    />
                    <SelectField
                      label="Incoming Audio Translation"
                      value={hearingLanguage}
                      onChange={setHearingLanguage}
                      options={[
                        { value: 'english', label: 'English' },
                        { value: 'spanish', label: 'Spanish' },
                        { value: 'french', label: 'French' },
                        { value: 'arabic', label: 'Arabic' },
                        { value: 'mandarin', label: 'Mandarin' },
                        { value: 'japanese', label: 'Japanese' },
                      ]}
                    />
                    <SelectField
                      label="Subtitles Output"
                      value={subtitleLanguage}
                      onChange={setSubtitleLanguage}
                      options={[
                        { value: 'english', label: 'English' },
                        { value: 'spanish', label: 'Spanish' },
                        { value: 'french', label: 'French' },
                        { value: 'arabic', label: 'Arabic' },
                        { value: 'mandarin', label: 'Mandarin' },
                        { value: 'japanese', label: 'Japanese' },
                      ]}
                    />
                  </div>
                </div>

                {/* Voice Configuration */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[20px]">record_voice_over</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Output Voice</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Choose your translation voice style</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'natural', name: 'Natural Accent', desc: 'Human cadence mapping, optimal for casual calls.', icon: 'record_voice_over' },
                      { id: 'professional', name: 'Professional Tone', desc: 'Clear crisp articulation, optimal for pitches.', icon: 'business_center' },
                    ].map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          selectedVoice === voice.id
                            ? 'border-[#FF416C]/30 bg-[#FF416C]/5'
                            : 'border-[#E4E0D6]/30 hover:border-[#E4E0D6]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            selectedVoice === voice.id ? 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white shadow-md shadow-[#FF416C]/20' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">{voice.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{voice.name}</p>
                            <p className="text-xs text-slate-500">{voice.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== WORKSPACE TAB (Personal only) ==================== */}
            {tab === 'workspace' && !isOrg && (
              <div className="space-y-6">
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[20px]">domain</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Workspace Connections</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Join or create an organization</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-6">
                    Connect to an organization workspace to collaborate with your team, or create your own.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => { setShowCreateInput(!showCreateInput); setShowJoinInput(false); }}
                      className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-[#FF416C]/20 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      {showCreateInput ? 'Cancel' : 'Create Organization'}
                    </button>
                    <button
                      onClick={() => { setShowJoinInput(!showJoinInput); setShowCreateInput(false); }}
                      className="bg-white border border-[#E4E0D6]/30 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:border-[#FF416C]/30 hover:text-[#FF416C] transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">group_add</span>
                      {showJoinInput ? 'Cancel' : 'Join with Invite Code'}
                    </button>
                  </div>

                  {showJoinInput && (
                    <form onSubmit={handleJoinOrg} className="mt-4 p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl flex gap-3">
                      <input
                        type="text"
                        placeholder="Paste invite code (e.g. RELAY-8841)"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="flex-1 bg-white border border-[#E4E0D6]/30 rounded-xl px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20"
                      />
                      <button type="submit" className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-[#FF416C]/20">
                        Join
                      </button>
                    </form>
                  )}

                  {showCreateInput && (
                    <form onSubmit={handleCreateOrg} className="mt-4 p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="e.g. Acme Corp"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="flex-1 bg-white border border-[#E4E0D6]/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20"
                        />
                        <button type="submit" className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-[#FF416C]/20">
                          Create
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Current Workspace Info */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-4">Current Workspace</h2>
                  <div className="p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-[#FF416C]/20">
                        P
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Personal Profile</p>
                        <p className="text-xs text-slate-500">Solo workspace · Owner</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== MEMBERS TAB (Org only) ==================== */}
            {tab === 'members' && isOrg && (
              <div className="space-y-6">
                {/* Invite Code (Owner only) */}
                {isOwner && (
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                        <span className="material-symbols-outlined text-white text-[20px]">vpn_key</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Invite Code</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Share this code to add members</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#FAF9F5] border border-dashed border-[#E4E0D6]/50 rounded-xl">
                      <span className="font-mono text-lg font-black tracking-widest text-slate-900 select-all">
                        {currentWorkspace.inviteCode || 'RELAY-8841'}
                      </span>
                      <button className="ml-auto text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Member List */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">
                      Members ({orgMembers.length})
                    </h2>
                    {isOwner && (
                      <button className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-[#FF416C]/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">person_add</span>
                        Invite
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {orgMembers.map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-[#E4E0D6]/20 rounded-xl hover:border-[#FF416C]/30 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${member.color} flex items-center justify-center text-[11px] font-bold group-hover:scale-110 transition-transform`}>
                            {member.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-[#FF416C] transition-colors">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            member.role === 'Owner' ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20' :
                            member.role === 'Admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {member.role}
                          </span>
                          {isOwner && member.role !== 'Owner' && (
                            <button className="w-8 h-8 rounded-xl border border-[#E4E0D6]/30 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all">
                              <span className="material-symbols-outlined text-[16px]">person_remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== POLICIES TAB (Org Owner only) ==================== */}
            {tab === 'policies' && isOrg && isOwner && (
              <div className="space-y-6">
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[20px]">policy</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Workspace Policies</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Configure operational rules</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <PolicyRow
                      label="Meeting Hosting"
                      desc="Who can start meetings in this workspace"
                      value={meetingHostPolicy}
                      onChange={setMeetingHostPolicy}
                      options={['all', 'admins']}
                    />
                    <PolicyRow
                      label="Auto-Recording"
                      desc="Automatically record all meetings for compliance"
                      value={autoRecording ? 'on' : 'off'}
                      onChange={(v) => setAutoRecording(v === 'on')}
                      options={['on', 'off']}
                    />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-[#FFFDF8] border border-rose-200 rounded-2xl p-6 shadow-warm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                      <span className="material-symbols-outlined text-white text-[20px]">warning</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Danger Zone</h2>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Irreversible actions</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Delete Workspace</p>
                      <p className="text-xs text-slate-500">Permanently delete this workspace and all its data.</p>
                    </div>
                    <button className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ===== EDIT PROFILE MODAL ===== */}
      <Modal open={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} title="Edit Profile">
        <div className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative w-20 h-20 rounded-2xl overflow-hidden group cursor-pointer disabled:opacity-50"
            >
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Preview" fill className="object-cover" />
              ) : user?.avatar ? (
                <Image src={user.avatar} alt={user.fullName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploadingAvatar ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                )}
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingAvatar(true);
                setProfileError(null);
                try {
                  const formData = new FormData();
                  formData.append('avatar', file);
                  const res = await fetch('/api/auth/avatar', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  await refetchUser();
                  setAvatarPreview(null);
                } catch (err: unknown) {
                  setProfileError(err instanceof Error ? err.message : 'Failed to upload avatar');
                } finally {
                  setIsUploadingAvatar(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />

            {user?.avatar && (
              <button
                type="button"
                onClick={async () => {
                  setIsUploadingAvatar(true);
                  setProfileError(null);
                  try {
                    const res = await fetch('/api/auth/avatar', {
                      method: 'DELETE',
                      credentials: 'include',
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    await refetchUser();
                    setAvatarPreview(null);
                  } catch (err: unknown) {
                    setProfileError(err instanceof Error ? err.message : 'Failed to remove avatar');
                  } finally {
                    setIsUploadingAvatar(false);
                  }
                }}
                className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
              >
                Remove Photo
              </button>
            )}
          </div>

          <Input
            label="Full Name"
            value={editFullName}
            onChange={(e) => { setEditFullName(e.target.value); setProfileError(null); }}
            placeholder="Your full name"
            required
            radius="xl"
          />

          <Input
            label="Job Title / Role"
            value={editJobRole}
            onChange={(e) => { setEditJobRole(e.target.value); setProfileError(null); }}
            placeholder="e.g. Lead Manager, Product Designer..."
            radius="xl"
          />

          {profileError && (
            <p className="text-xs text-rose-500 text-center font-medium">{profileError}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="white"
              fullWidth
              onClick={() => setShowEditProfileModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              fullWidth
              isLoading={isUpdatingProfile}
              disabled={!editFullName.trim()}
              onClick={async () => {
                if (!editFullName.trim()) return;
                setIsUpdatingProfile(true);
                setProfileError(null);
                try {
                  const res = await fetch('/api/auth/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      fullName: editFullName.trim(),
                      jobRole: editJobRole.trim() || null,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  await refetchUser();
                  setShowEditProfileModal(false);
                  setStatusMessage('Profile updated successfully!');
                  setTimeout(() => setStatusMessage(null), 3000);
                } catch (err: unknown) {
                  setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
                } finally {
                  setIsUpdatingProfile(false);
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== NOTIFICATIONS MODAL ===== */}
      <Modal open={showNotificationModal} onClose={() => setShowNotificationModal(false)} title="Notifications">
        <div className="p-6 space-y-6">
          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
            <div>
              <p className="text-sm font-bold text-slate-900">Push Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {pushEnabled
                  ? `Enabled on ${deviceCount} device${deviceCount === 1 ? '' : 's'}`
                  : 'Not set up'}
              </p>
            </div>
            <Toggle
              enabled={preferences.push}
              onToggle={() => {
                const next = !preferences.push;
                updatePreferences({ push: next });
                if (next && !pushEnabled) {
                  requestPushPermission();
                }
              }}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
            <div>
              <p className="text-sm font-bold text-slate-900">Email Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">Receive email alerts for meeting invites and updates</p>
            </div>
            <Toggle
              enabled={preferences.email}
              onToggle={() => updatePreferences({ email: !preferences.email })}
            />
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Push notifications require browser permission. You&apos;ll receive meeting invites, reminders, and updates.
          </p>
        </div>
      </Modal>

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(null); }}
              className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Password</label>
            <input
              type="password"
              placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
              className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
              className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
            />
          </div>

          {passwordError && (
            <p className="text-xs text-rose-500 text-center font-medium">{passwordError}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="white"
              fullWidth
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              fullWidth
              isLoading={isChangingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              onClick={async () => {
                if (!currentPassword || !newPassword || !confirmPassword) return;
                setIsChangingPassword(true);
                setPasswordError(null);
                try {
                  const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      currentPassword,
                      newPassword,
                      confirmPassword,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setStatusMessage('Password changed successfully!');
                  setTimeout(() => setStatusMessage(null), 3000);
                } catch (err: unknown) {
                  setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
                } finally {
                  setIsChangingPassword(false);
                }
              }}
            >
              Save Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== 2FA SETUP MODAL ===== */}
      <Modal open={show2FASetup} onClose={() => setShow2FASetup(false)} title="Set Up Two-Factor Authentication">
        <div className="p-6">
          {/* Step 1: Intro */}
          {twoFactorStep === 'intro' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-lg shadow-[#FF416C]/20">
                  <span className="material-symbols-outlined text-white text-[32px]">shield</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                Two-factor authentication adds an extra layer of security to your account.
                After enabling it, you&apos;ll be prompted for a 6-digit code from your
                authenticator app when signing in.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-800 font-medium">
                  You&apos;ll need an authenticator app like Google Authenticator or Authy to scan the QR code.
                </p>
              </div>
              <Button
                variant="gradient"
                fullWidth
                onClick={async () => {
                  setIsSetupLoading(true);
                  setSetupError(null);
                  try {
                    const res = await fetch('/api/auth/2fa/setup', { credentials: 'include' });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setTwoFactorSecret(data.secret);
                    setTwoFactorQrCode(data.qrCode);
                    setTwoFactorStep('qr');
                  } catch (err: unknown) {
                    setSetupError(err instanceof Error ? err.message : 'Failed to start setup');
                  } finally {
                    setIsSetupLoading(false);
                  }
                }}
                isLoading={isSetupLoading}
                icon="arrow_forward"
              >
                Get Started
              </Button>
              {setupError && (
                <p className="text-xs text-rose-500 text-center font-medium">{setupError}</p>
              )}
            </div>
          )}

          {/* Step 2: QR Code */}
          {twoFactorStep === 'qr' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                Scan this QR code with your authenticator app.
              </p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={twoFactorQrCode}
                  alt="QR Code"
                  className="w-48 h-48 border-2 border-[#E4E0D6]/30 rounded-xl p-2 bg-white"
                />
              </div>
              <div className="bg-[#FAF9F5] rounded-xl p-4 border border-[#E4E0D6]/20">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Manual Setup Key</p>
                <p className="text-sm font-mono font-bold text-slate-900 select-all break-all">{twoFactorSecret}</p>
              </div>
              <Button
                variant="gradient"
                fullWidth
                onClick={() => {
                  setTwoFactorStep('verify');
                  setSetupCode('');
                  setSetupError(null);
                }}
                icon="arrow_forward"
              >
                I&apos;ve Scanned It
              </Button>
            </div>
          )}

          {/* Step 3: Verify */}
          {twoFactorStep === 'verify' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                Enter the 6-digit verification code from your authenticator app to confirm setup.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={setupCode}
                onChange={(e) => {
                  setSetupCode(e.target.value.replace(/[^0-9]/g, ''));
                  setSetupError(null);
                }}
                className="w-full text-center text-3xl tracking-[0.5em] font-mono bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-4 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
                autoFocus
              />
              {setupError && (
                <p className="text-xs text-rose-500 text-center font-medium">{setupError}</p>
              )}
              <Button
                variant="gradient"
                fullWidth
                disabled={setupCode.length !== 6}
                isLoading={isSetupLoading}
                onClick={async () => {
                  if (setupCode.length !== 6) return;
                  setIsSetupLoading(true);
                  setSetupError(null);
                  try {
                    const res = await fetch('/api/auth/2fa/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ code: setupCode }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setBackupCodes(data.backupCodes);
                    setTwoFactorStep('backup');
                  } catch (err: unknown) {
                    setSetupError(err instanceof Error ? err.message : 'Invalid code');
                  } finally {
                    setIsSetupLoading(false);
                  }
                }}
              >
                Verify &amp; Enable
              </Button>
              <button
                onClick={() => {
                  setTwoFactorStep('qr');
                  setSetupError(null);
                }}
                className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Back to QR Code
              </button>
            </div>
          )}

          {/* Step 4: Backup Codes */}
          {twoFactorStep === 'backup' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-200">
                  <span className="material-symbols-outlined text-emerald-600 text-[28px]">check_circle</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 text-center leading-relaxed">
                Two-factor authentication is now enabled. Save these backup codes in a safe place —
                you&apos;ll need them if you lose access to your authenticator app.
              </p>
              <div className="bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl p-4 space-y-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-slate-900 tracking-wider">{code}</span>
                  </div>
                ))}
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-xs text-rose-700 font-medium">
                  These codes won&apos;t be shown again. Copy them now.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="white"
                  fullWidth
                  onClick={() => {
                    const text = backupCodes.join('\n');
                    navigator.clipboard.writeText(text);
                  }}
                  icon="content_copy"
                >
                  Copy Codes
                </Button>
                <Button
                  variant="gradient"
                  fullWidth
                  onClick={async () => {
                    setShow2FASetup(false);
                    setTwoFactorStep('intro');
                    await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(() => {
                      // refetch will happen in AuthContext automatically
                    });
                    window.location.reload();
                  }}
                  icon="done"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ===== 2FA DISABLE MODAL ===== */}
      <Modal open={show2FADisable} onClose={() => setShow2FADisable(false)} title="Disable Two-Factor Authentication">
        <div className="p-6 space-y-6">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-xs text-rose-700 font-medium">
              This will remove two-factor authentication from your account. Your account will be less secure.
            </p>
          </div>

          {disableError && (
            <p className="text-xs text-rose-500 text-center font-medium">{disableError}</p>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={disablePassword}
              onChange={(e) => { setDisablePassword(e.target.value); setDisableError(null); }}
              className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Authenticator Code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={disableCode}
              onChange={(e) => { setDisableCode(e.target.value.replace(/[^0-9]/g, '')); setDisableError(null); }}
              className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20 transition-all"
            />
          </div>

          <Button
            variant="danger"
            fullWidth
            disabled={!disablePassword || disableCode.length !== 6}
            isLoading={isDisableLoading}
            onClick={async () => {
              if (!disablePassword || disableCode.length !== 6) return;
              setIsDisableLoading(true);
              setDisableError(null);
              try {
                const res = await fetch('/api/auth/2fa/disable', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ password: disablePassword, code: disableCode }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setShow2FADisable(false);
                setDisablePassword('');
                setDisableCode('');
                window.location.reload();
              } catch (err: unknown) {
                setDisableError(err instanceof Error ? err.message : 'Failed to disable');
              } finally {
                setIsDisableLoading(false);
              }
            }}
          >
            Disable 2FA
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ==================== COMPONENTS ==================== */

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#FAF9F5] border border-[#E4E0D6]/30 rounded-xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function PolicyRow({ label, desc, value, onChange, options }: {
  label: string;
  desc: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-[#E4E0D6]/30 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-black transition-all"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === 'all' ? 'All Members' : opt === 'admins' ? 'Admins Only' : opt === 'on' ? 'Enabled' : opt === 'off' ? 'Disabled' : opt}</option>
        ))}
      </select>
    </div>
  );
}

/* ==================== DATA ==================== */

const orgMembers = [
  { name: 'Elias Thompson', email: 'elias@relay.ai', role: 'Owner', initials: 'ET', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Sarah Chen', email: 'sarah@relay.ai', role: 'Admin', initials: 'SC', color: 'bg-rose-100 text-rose-700' },
  { name: 'Yousef Al-Rashid', email: 'yousef@relay.ai', role: 'Member', initials: 'YA', color: 'bg-amber-100 text-amber-700' },
  { name: 'Marcus Klein', email: 'marcus@relay.ai', role: 'Member', initials: 'MK', color: 'bg-purple-100 text-purple-700' },
  { name: 'Sofia Martinez', email: 'sofia@relay.ai', role: 'Member', initials: 'SM', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Wei Zhang', email: 'wei@relay.ai', role: 'Member', initials: 'WZ', color: 'bg-blue-100 text-blue-700' },
];

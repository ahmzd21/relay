'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

type SettingsTab = 'profile' | 'language' | 'workspace' | 'members' | 'policies';

export default function SettingsPage() {
  const { isOrganization, currentWorkspace, hasPermission, joinWorkspaceWithCode, addWorkspace } = useWorkspace();
  const isOrg = isOrganization();
  const isOwner = hasPermission('owner');

  const [tab, setTab] = useState<SettingsTab>('profile');

  // Personal settings state
  const [speakingLanguage, setSpeakingLanguage] = useState('english');
  const [hearingLanguage, setHearingLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
  const [selectedVoice, setSelectedVoice] = useState('natural');
  const [twoFactor, setTwoFactor] = useState(false);

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
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader
          rightContent={
            statusMessage ? (
              <span className="text-xs font-bold text-white bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] px-3 py-1.5 rounded-full shadow-sm shadow-[#FF416C]/20">
                {statusMessage}
              </span>
            ) : null
          }
        />

        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 pb-24">
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
            <div className="flex gap-1 bg-white border border-[#c4c7c7]/30 p-1 rounded-xl w-fit">
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
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#FF416C]/20">
                        ET
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-helvetica text-slate-900">Elias Thompson</h3>
                        <p className="text-slate-500 text-sm">elias.thompson@relay.ai</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20">
                          {isOrg ? `${currentWorkspace.role} · ${currentWorkspace.name}` : 'Solo Account'}
                        </span>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors">
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-6">Account Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                          <span className="material-symbols-outlined text-white text-[20px]">lock</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Password</p>
                          <p className="text-xs text-slate-500">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors">Change</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                          <span className="material-symbols-outlined text-white text-[20px]">shield</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Two-Factor Authentication</p>
                          <p className="text-xs text-slate-500">{twoFactor ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={`w-12 h-7 rounded-full relative transition-colors cursor-pointer ${twoFactor ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] shadow-sm shadow-[#FF416C]/20' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${twoFactor ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                          <span className="material-symbols-outlined text-white text-[20px]">notifications</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Notifications</p>
                          <p className="text-xs text-slate-500">Email and push notifications</p>
                        </div>
                      </div>
                      <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors">Configure</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== LANGUAGE TAB ==================== */}
            {tab === 'language' && (
              <div className="space-y-6">
                {/* Language Preferences */}
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
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
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
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
                            : 'border-[#c4c7c7]/30 hover:border-[#c4c7c7]/60'
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
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
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
                      className="bg-white border border-[#c4c7c7]/30 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:border-[#FF416C]/30 hover:text-[#FF416C] transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">group_add</span>
                      {showJoinInput ? 'Cancel' : 'Join with Invite Code'}
                    </button>
                  </div>

                  {showJoinInput && (
                    <form onSubmit={handleJoinOrg} className="mt-4 p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl flex gap-3">
                      <input
                        type="text"
                        placeholder="Paste invite code (e.g. RELAY-8841)"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="flex-1 bg-white border border-[#c4c7c7]/30 rounded-xl px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20"
                      />
                      <button type="submit" className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-[#FF416C]/20">
                        Join
                      </button>
                    </form>
                  )}

                  {showCreateInput && (
                    <form onSubmit={handleCreateOrg} className="mt-4 p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="e.g. Acme Corp"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="flex-1 bg-white border border-[#c4c7c7]/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF416C] focus:ring-1 focus:ring-[#FF416C]/20"
                        />
                        <button type="submit" className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-md shadow-[#FF416C]/20">
                          Create
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Current Workspace Info */}
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-4">Current Workspace</h2>
                  <div className="p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl">
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
                  <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                        <span className="material-symbols-outlined text-white text-[20px]">vpn_key</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Invite Code</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Share this code to add members</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-[#FAF9F5] border border-dashed border-[#c4c7c7]/50 rounded-xl">
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
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
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
                      <div key={i} className="flex items-center justify-between p-4 border border-[#c4c7c7]/20 rounded-xl hover:border-[#FF416C]/30 hover:shadow-md transition-all duration-300 group">
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
                            <button className="w-8 h-8 rounded-xl border border-[#c4c7c7]/30 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all">
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
                <div className="bg-white border border-[#c4c7c7]/30 rounded-2xl p-6 shadow-sm">
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
                <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm">
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
    </div>
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
        className="w-full bg-[#FAF9F5] border border-[#c4c7c7]/30 rounded-xl py-3 px-4 text-sm text-slate-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all"
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
    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#c4c7c7]/20 rounded-xl">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-[#c4c7c7]/30 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-black transition-all"
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

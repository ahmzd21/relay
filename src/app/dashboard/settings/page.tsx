'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function SettingsPage() {
  // Personal Settings State
  const [speakingLanguage, setSpeakingLanguage] = useState('english');
  const [hearingLanguage, setHearingLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
  const [aiMode, setAiMode] = useState('balanced');
  const [autoTranscription, setAutoTranscription] = useState(true);
  const [recordingStorage, setRecordingStorage] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('natural');

  // Organization Settings State
  const [orgTab, setOrgTab] = useState<'overview' | 'members' | 'meetings' | 'analytics' | 'billing' | 'settings'>('overview');

  // Workspace Switcher hook left by Devin
  const { isOrganization, hasPermission } = useWorkspace();

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header */}
        <header className="h-20 border-b border-[#D9D7D0]/40 flex items-center justify-between px-6 md:px-10 bg-white/80 backdrop-blur-xl z-20 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 -ml-2 text-black">
              <span className="material-symbols-outlined">menu</span>
            </button>
            {/* Workspace Switcher */}
            <WorkspaceSwitcher />
            <h1 className="text-2xl font-bold tracking-tight text-black">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#8C8880] hover:text-black transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-[#D9D7D0]"></div>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                ET
              </div>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Dynamic Context Header */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-black mb-2">
                {isOrganization ? 'Workspace Settings' : 'Personal Settings'}
              </h2>
              <p className="text-[#8C8880] text-base">
                {isOrganization 
                  ? 'Manage your team members, workspace properties, and organization billing.' 
                  : 'Manage your individual account preferences and personal AI configuration.'}
              </p>
            </div>

            {/* --- WORKSPACE / ORGANIZATION VIEW --- */}
            {isOrganization ? (
              <div className="space-y-8">
                {/* Organization Navigation Tabs */}
                <div className="flex gap-2 bg-white border border-[#D9D7D0]/40 rounded-2xl p-1.5 w-fit overflow-x-auto">
                  {(['overview', 'members', 'meetings', 'analytics', 'billing', 'settings'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setOrgTab(tab)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap capitalize ${
                        orgTab === tab ? 'bg-black text-white' : 'text-[#8C8880] hover:text-black'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Org Tab: Overview */}
                {orgTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-indigo-600 text-[20px]">groups</span>
                          </div>
                          <div>
                            <p className="text-[#8C8880] text-xs font-medium">Total Members</p>
                            <p className="text-2xl font-bold text-black">24</p>
                          </div>
                        </div>
                        <p className="text-[#8C8880] text-xs">+3 this month</p>
                      </div>

                      <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">videocam</span>
                          </div>
                          <div>
                            <p className="text-[#8C8880] text-xs font-medium">Meetings This Month</p>
                            <p className="text-2xl font-bold text-black">156</p>
                          </div>
                        </div>
                        <p className="text-[#8C8880] text-xs">+12% from last month</p>
                      </div>

                      <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600 text-[20px]">storage</span>
                          </div>
                          <div>
                            <p className="text-[#8C8880] text-xs font-medium">Storage Used</p>
                            <p className="text-2xl font-bold text-black">45 GB</p>
                          </div>
                        </div>
                        <p className="text-[#8C8880] text-xs">45% of 100 GB</p>
                      </div>

                      <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-rose-600 text-[20px]">workspace_premium</span>
                          </div>
                          <div>
                            <p className="text-[#8C8880] text-xs font-medium">Current Plan</p>
                            <p className="text-2xl font-bold text-black">Enterprise</p>
                          </div>
                        </div>
                        <p className="text-[#8C8880] text-xs">$499/month</p>
                      </div>
                    </div>

                    <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold tracking-tight text-black mb-6">Recent Activity</h2>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-[#FAF9F5] rounded-2xl">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-indigo-600">person_add</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-black text-sm">Sarah Chen joined the organization</p>
                            <p className="text-[#8C8880] text-xs">2 hours ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[#FAF9F5] rounded-2xl">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600">videocam</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-black text-sm">Team sync meeting completed</p>
                            <p className="text-[#8C8880] text-xs">5 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Org Tab: Members */}
                {orgTab === 'members' && (
                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-black">Team Members</h2>
                      {hasPermission('invite_members') && (
                        <button className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                          Invite Member
                        </button>
                      )}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-[#8C8880] uppercase tracking-wider mb-3">Pending Invites</h3>
                      <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600">mail</span>
                          </div>
                          <div>
                            <p className="font-bold text-black text-sm">john.doe@company.com</p>
                            <p className="text-[#8C8880] text-xs">Sent 2 days ago</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs font-bold text-black hover:text-indigo-600 transition-colors">Resend</button>
                          <button className="text-xs font-bold text-[#8C8880] hover:text-rose-600 transition-colors">Cancel</button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#8C8880] uppercase tracking-wider mb-3">Active Members</h3>
                      <div className="space-y-3">
                        {[
                          { name: 'Elias Thompson', email: 'elias@relay.ai', role: 'Owner', avatar: 'ET' },
                          { name: 'Sarah Chen', email: 'sarah@relay.ai', role: 'Admin', avatar: 'SC' },
                          { name: 'Michael Rodriguez', email: 'michael@relay.ai', role: 'Member', avatar: 'MR' },
                        ].map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-[#D9D7D0]/40 rounded-2xl hover:border-black/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {member.avatar}
                              </div>
                              <div>
                                <p className="font-bold text-black text-sm">{member.name}</p>
                                <p className="text-[#8C8880] text-xs">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                member.role === 'Owner' ? 'bg-rose-100 text-rose-600' :
                                member.role === 'Admin' ? 'bg-indigo-100 text-indigo-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>{member.role}</span>
                              <button className="text-[#8C8880] hover:text-black transition-colors">
                                <span className="material-symbols-outlined">more_horiz</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Org Tab: Meetings */}
                {orgTab === 'meetings' && (
                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#D9D7D0]/40">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight text-black">Workspace Logs</h2>
                        <select className="bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-full px-4 py-2 text-sm">
                          <option>All Members</option>
                        </select>
                      </div>
                    </div>
                    <div className="divide-y divide-[#D9D7D0]/40">
                      {[
                        { title: 'Weekly Team Sync', host: 'Elias Thompson', date: 'Jul 17, 2024', duration: '45 min', participants: 8 },
                        { title: 'Product Planning', host: 'Sarah Chen', date: 'Jul 16, 2024', duration: '60 min', participants: 12 },
                      ].map((meeting, index) => (
                        <div key={index} className="p-5 hover:bg-[#FAF9F5] transition-colors group cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-indigo-600 text-[20px]">videocam</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-black group-hover:text-indigo-600 transition-colors">{meeting.title}</h4>
                                <p className="text-[#8C8880] text-xs mt-0.5">Hosted by {meeting.host} • {meeting.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[#8C8880] text-xs">
                              <span>{meeting.duration}</span>
                              <span>{meeting.participants} participants</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Org Tab: Analytics */}
                {orgTab === 'analytics' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold tracking-tight text-black mb-6">Translation Usage</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <p className="text-sm font-medium text-black">Elias Thompson</p>
                            <p className="text-sm font-bold text-black">1,245 min</p>
                          </div>
                          <div className="w-full h-2 bg-[#FAF9F5] rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold tracking-tight text-black mb-6">Top Languages Used</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#FAF9F5] rounded-2xl">
                          <p className="font-bold text-black mb-2">English</p>
                          <p className="text-[#8C8880] text-xs">45%</p>
                        </div>
                        <div className="p-4 bg-[#FAF9F5] rounded-2xl">
                          <p className="font-bold text-black mb-2">Spanish</p>
                          <p className="text-[#8C8880] text-xs">25%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Org Tab: Billing */}
                {orgTab === 'billing' && (
                  <div className="space-y-6">
                    <div className="bg-black rounded-3xl p-8 text-white shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="bg-indigo-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">Current Plan</span>
                          <h2 className="text-3xl font-bold mb-2">Enterprise Plan</h2>
                        </div>
                        <p className="text-4xl font-bold">$499<span className="text-sm text-white/60">/mo</span></p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Org Tab: Settings Policies */}
                {orgTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold tracking-tight text-black mb-6">Workspace Policies</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                          <div>
                            <p className="font-bold text-black">Who Can Host Meetings</p>
                            <p className="text-[#8C8880] text-xs">Control creation permissions</p>
                          </div>
                          <select className="bg-white border border-[#D9D7D0]/60 rounded-full px-4 py-2 text-sm">
                            <option>All Members</option>
                            <option>Admins Only</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold tracking-tight text-black mb-6">Workspace Branding</h2>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-[#8C8880] ml-4">Workspace Name</label>
                          <input
                            className="w-full bg-white border border-[#D9D7D0]/60 rounded-full py-3 px-6 text-[#1c1b1b] text-[15px] focus:outline-none focus:border-black"
                            placeholder="Relay AI Technologies"
                            type="text"
                            defaultValue="Relay AI Technologies"
                          />
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-black text-white py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-md">
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* --- PERSONAL SETTINGS VIEW --- */
              <div className="space-y-8">
                {/* Profile Section */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        ET
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black">Elias Thompson</h3>
                        <p className="text-[#8C8880] text-sm">elias.thompson@relay.ai</p>
                        <p className="text-[#8C8880] text-xs mt-1">Personal Account</p>
                      </div>
                    </div>
                    <button className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Organization Setup */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600">domain</span>
                        Join or Create Organization
                      </h3>
                      <p className="text-[#8C8880] text-sm mt-1 max-w-xl">
                        Upgrade your workspace to collaborate with your team, manage shared channels, and access organization-wide translation metrics.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <button className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform shadow-md text-center">
                        Create Org
                      </button>
                      <button className="bg-white border border-[#D9D7D0] text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#FAF9F5] transition-colors text-center">
                        Join with Code
                      </button>
                    </div>
                  </div>
                </div>

                {/* Language & AI Intelligence */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-black mb-6">Language & AI Intelligence</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-black mb-2">Default Speaking Language</label>
                      <select
                        value={speakingLanguage}
                        onChange={(e) => setSpeakingLanguage(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-black transition-all font-medium"
                      >
                        <option value="english">English 🇬🇧</option>
                        <option value="spanish">Spanish 🇪🇸</option>
                        <option value="french">French 🇫🇷</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-black mb-2">AI Accuracy Mode</label>
                      <select
                        value={aiMode}
                        onChange={(e) => setAiMode(e.target.value)}
                        className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-black transition-all font-medium"
                      >
                        <option value="balanced">Balanced (Recommended)</option>
                        <option value="accuracy">Maximum Accuracy</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Output Voice Selection */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-black mb-6">Output Voice Selection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'natural', name: 'Natural', description: 'Balanced, human-like voice', icon: 'record_voice_over' },
                      { id: 'professional', name: 'Professional', description: 'Clear, formal tone', icon: 'business_center' },
                    ].map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedVoice === voice.id
                            ? 'border-black bg-[#FAF9F5]'
                            : 'border-[#D9D7D0]/40 hover:border-black/30'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedVoice === voice.id ? 'bg-black' : 'bg-slate-100'}`}>
                            <span className={`material-symbols-outlined text-[20px] ${selectedVoice === voice.id ? 'text-white' : 'text-slate-600'}`}>{voice.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-black text-sm">{voice.name}</p>
                            <p className="text-[#8C8880] text-xs">{voice.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Section */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-black mb-6">Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                      <div>
                        <p className="font-bold text-black">Two-Factor Authentication</p>
                        <p className="text-[#8C8880] text-xs">Add an extra layer of security</p>
                      </div>
                      <button
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={`w-12 h-7 rounded-full relative transition-colors ${twoFactor ? 'bg-black' : 'bg-[#D9D7D0]'}`}
                      >
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${twoFactor ? 'left-6' : 'left-1'}`}></span>
                      </button>
                    </div>
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
'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
  const [speakingLanguage, setSpeakingLanguage] = useState('english');
  const [hearingLanguage, setHearingLanguage] = useState('english');
  const [subtitleLanguage, setSubtitleLanguage] = useState('english');
  const [aiMode, setAiMode] = useState('balanced');
  const [autoTranscription, setAutoTranscription] = useState(true);
  const [recordingStorage, setRecordingStorage] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('natural');

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex font-helvetica selection:bg-black selection:text-white">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header */}
        <header className="h-20 border-b border-[#D9D7D0]/40 flex items-center justify-between px-6 md:px-10 bg-white/80 backdrop-blur-xl z-20 sticky top-0 shadow-sm">
          <div className="flex-1 flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 -ml-2 text-black">
              <span className="material-symbols-outlined">menu</span>
            </button>
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
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-black mb-2">Settings</h2>
              <p className="text-[#8C8880] text-base">Manage your account preferences and configuration.</p>
            </div>

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
                    <p className="text-[#8C8880] text-xs mt-1">Enterprise Admin</p>
                  </div>
                </div>
                <button className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                  Edit Profile
                </button>
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
                    className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                  >
                    <option value="english">English 🇬🇧</option>
                    <option value="spanish">Spanish 🇪🇸</option>
                    <option value="french">French 🇫🇷</option>
                    <option value="german">German 🇩🇪</option>
                    <option value="chinese">Chinese 🇨🇳</option>
                    <option value="japanese">Japanese 🇯🇵</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Default Hearing Language</label>
                  <select
                    value={hearingLanguage}
                    onChange={(e) => setHearingLanguage(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                  >
                    <option value="english">English 🇬🇧</option>
                    <option value="spanish">Spanish 🇪🇸</option>
                    <option value="french">French 🇫🇷</option>
                    <option value="german">German 🇩🇪</option>
                    <option value="chinese">Chinese 🇨🇳</option>
                    <option value="japanese">Japanese 🇯🇵</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">Default Subtitle Language</label>
                  <select
                    value={subtitleLanguage}
                    onChange={(e) => setSubtitleLanguage(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                  >
                    <option value="english">English 🇬🇧</option>
                    <option value="spanish">Spanish 🇪🇸</option>
                    <option value="french">French 🇫🇷</option>
                    <option value="german">German 🇩🇪</option>
                    <option value="chinese">Chinese 🇨🇳</option>
                    <option value="japanese">Japanese 🇯🇵</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">AI Accuracy Mode</label>
                  <select
                    value={aiMode}
                    onChange={(e) => setAiMode(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-xl py-3 px-4 text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
                  >
                    <option value="balanced">Balanced (Recommended)</option>
                    <option value="speed">Speed Priority</option>
                    <option value="accuracy">Maximum Accuracy</option>
                  </select>
                  <p className="text-[#8C8880] text-xs mt-2">Balanced mode provides optimal performance for most use cases.</p>
                </div>
              </div>
            </div>

            {/* Output Voice Selection */}
            <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold tracking-tight text-black mb-6">Output Voice Selection</h3>
              <p className="text-[#8C8880] text-sm mb-6">Choose the voice style for translated audio output.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'natural', name: 'Natural', description: 'Balanced, human-like voice', icon: 'record_voice_over' },
                  { id: 'professional', name: 'Professional', description: 'Clear, formal tone', icon: 'business_center' },
                  { id: 'friendly', name: 'Friendly', description: 'Warm, conversational', icon: 'sentiment_satisfied' },
                  { id: 'energetic', name: 'Energetic', description: 'Dynamic, engaging', icon: 'bolt' },
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
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedVoice === voice.id ? 'bg-black' : 'bg-slate-100'
                        }`}>
                        <span className={`material-symbols-outlined text-[20px] ${selectedVoice === voice.id ? 'text-white' : 'text-slate-600'
                          }`}>{voice.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-black text-sm">{voice.name}</p>
                        <p className="text-[#8C8880] text-xs">{voice.description}</p>
                      </div>
                      {selectedVoice === voice.id && (
                        <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-[#FAF9F5] rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-black text-[18px]">volume_up</span>
                  <span className="font-bold text-black text-sm">Preview Voice</span>
                </div>
                <button className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Play Sample
                </button>
              </div>
            </div>

            {/* Meeting Experience */}
            <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold tracking-tight text-black mb-6">Meeting Experience</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                  <div>
                    <p className="font-bold text-black">Auto-Transcription</p>
                    <p className="text-[#8C8880] text-xs">Automatically transcribe all meetings</p>
                  </div>
                  <button
                    onClick={() => setAutoTranscription(!autoTranscription)}
                    className={`w-12 h-7 rounded-full relative transition-colors ${autoTranscription ? 'bg-black' : 'bg-[#D9D7D0]'
                      }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${autoTranscription ? 'left-6' : 'left-1'
                      }`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                  <div>
                    <p className="font-bold text-black">Recording Storage</p>
                    <p className="text-[#8C8880] text-xs">Store meeting recordings in cloud</p>
                  </div>
                  <button
                    onClick={() => setRecordingStorage(!recordingStorage)}
                    className={`w-12 h-7 rounded-full relative transition-colors ${recordingStorage ? 'bg-black' : 'bg-[#D9D7D0]'
                      }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${recordingStorage ? 'left-6' : 'left-1'
                      }`}></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-gradient-to-br from-black to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="bg-indigo-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Active</span>
                    <h3 className="text-xl font-bold">Enterprise Plan</h3>
                  </div>
                  <button className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/20 text-sm">
                    Manage
                  </button>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  Next billing: August 15, 2024
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold tracking-tight text-black mb-6">Security</h3>

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl hover:bg-[#F0EFEB] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 text-[20px]">lock</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-black">Reset Password</p>
                      <p className="text-[#8C8880] text-xs">Change your account password</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#8C8880] group-hover:text-black transition-colors">chevron_right</span>
                </button>

                <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 text-[20px]">security</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-black">Two-Factor Authentication</p>
                      <p className="text-[#8C8880] text-xs">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`w-12 h-7 rounded-full relative transition-colors ${twoFactor ? 'bg-black' : 'bg-[#D9D7D0]'
                      }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${twoFactor ? 'left-6' : 'left-1'
                      }`}></span>
                  </button>
                </div>

                <button className="w-full flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl hover:bg-[#F0EFEB] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 text-[20px]">history</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-black">Login History</p>
                      <p className="text-[#8C8880] text-xs">View recent account activity</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#8C8880] group-hover:text-black transition-colors">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold tracking-tight text-rose-600 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-black">Delete Account</p>
                  <p className="text-[#8C8880] text-xs">Permanently delete your account and all data</p>
                </div>
                <button className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all border border-rose-200">
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

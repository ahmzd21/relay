'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { switchWorkspace, addWorkspace } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalSteps = 4;

  // Form State
  const [jobRole, setJobRole] = useState('');
  const [speakingLanguage, setSpeakingLanguage] = useState('English');
  const [hearingLanguage, setHearingLanguage] = useState('Spanish');
  const [selectedVoice, setSelectedVoice] = useState('natural');
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'organization' | null>(null);
  const [orgName, setOrgName] = useState('');

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    setIsTransitioning(true);
    // Update global workspace context based on selection
    if (workspaceType === 'organization') {
      const newOrgId = 'org-' + Date.now();
      addWorkspace({
        id: newOrgId,
        type: 'organization',
        name: orgName || 'My Team Workspace',
        role: 'owner',
        settings: {
          accentColor: 'indigo',
        }
      });
      switchWorkspace(newOrgId);
    } else {
      switchWorkspace('personal');
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1c1b1b] flex flex-col font-helvetica selection:bg-black selection:text-white">
      {/* Navbar / Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-10 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-black">Relay</span>
        </div>
        <div className="text-sm font-bold text-[#8C8880]">
          Step {currentStep} of {totalSteps}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto relative">
        
        {/* Progress Bar */}
        <div className="w-full bg-[#D9D7D0]/40 h-1.5 rounded-full mb-12 overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-black transition-all duration-700 ease-out rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className={`w-full transition-all duration-300 ease-in-out ${
          isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          
          {/* STEP 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-black">Welcome to Relay.</h1>
                <p className="text-[#8C8880] text-lg">Let's get your personalized AI studio set up.</p>
              </div>

              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-8 shadow-sm space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg relative group cursor-pointer overflow-hidden">
                    ET
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#8C8880] hover:text-black cursor-pointer transition-colors">Upload Avatar</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-[#8C8880] ml-4">Your Role / Job Title</label>
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-full py-4 px-6 text-[#1c1b1b] text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      placeholder="e.g. Product Manager"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Language & Voice */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-black">Your Digital Voice.</h1>
                <p className="text-[#8C8880] text-lg">Configure how you sound and translate.</p>
              </div>

              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-8 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-[#8C8880] ml-4">I Speak</label>
                    <select
                      value={speakingLanguage}
                      onChange={(e) => setSpeakingLanguage(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-2xl py-4 px-5 text-[#1c1b1b] text-sm font-medium focus:outline-none focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Mandarin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-[#8C8880] ml-4">I usually translate to</label>
                    <select
                      value={hearingLanguage}
                      onChange={(e) => setHearingLanguage(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#D9D7D0]/60 rounded-2xl py-4 px-5 text-[#1c1b1b] text-sm font-medium focus:outline-none focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      <option>Spanish</option>
                      <option>English</option>
                      <option>French</option>
                      <option>Mandarin</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#D9D7D0]/40">
                  <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-[#8C8880] ml-4">AI Output Voice Style</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'natural', name: 'Natural (Recommended)', desc: 'Balanced, conversational, human-like cadence', icon: 'record_voice_over' },
                      { id: 'professional', name: 'Professional', desc: 'Clear, crisp, and formal articulation', icon: 'business_center' },
                      { id: 'expressive', name: 'Expressive', desc: 'High emotion and dynamic range', icon: 'mood' },
                    ].map(voice => (
                      <div 
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          selectedVoice === voice.id 
                            ? 'border-black bg-[#FAF9F5]' 
                            : 'border-[#D9D7D0]/40 hover:border-black/30 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedVoice === voice.id ? 'bg-black text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <span className="material-symbols-outlined text-[20px]">{voice.icon}</span>
                          </div>
                          <div>
                            <p className="font-bold text-black text-sm">{voice.name}</p>
                            <p className="text-[#8C8880] text-xs">{voice.desc}</p>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-white border border-[#D9D7D0] flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all group">
                          <span className="material-symbols-outlined text-[18px] text-[#8C8880] group-hover:text-white">play_arrow</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Workspace */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-black">How will you use Relay?</h1>
                <p className="text-[#8C8880] text-lg">Choose your primary workspace context.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setWorkspaceType('personal')}
                  className={`p-6 bg-white border-2 rounded-3xl cursor-pointer transition-all ${
                    workspaceType === 'personal' 
                      ? 'border-black shadow-md scale-[1.02]' 
                      : 'border-[#D9D7D0]/40 hover:border-black/30 hover:scale-[1.01]'
                  }`}
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-indigo-600 text-[24px]">person</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Personal Use</h3>
                  <p className="text-[#8C8880] text-sm">For individuals wanting seamless real-time translation for external meetings.</p>
                </div>

                <div 
                  onClick={() => setWorkspaceType('organization')}
                  className={`p-6 bg-white border-2 rounded-3xl cursor-pointer transition-all ${
                    workspaceType === 'organization' 
                      ? 'border-black shadow-md scale-[1.02]' 
                      : 'border-[#D9D7D0]/40 hover:border-black/30 hover:scale-[1.01]'
                  }`}
                >
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-rose-600 text-[24px]">domain</span>
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">Team & Organization</h3>
                  <p className="text-[#8C8880] text-sm">Create a shared workspace for your team with shared billing and policies.</p>
                </div>
              </div>

              {workspaceType === 'organization' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-[#8C8880] ml-4">Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full bg-white border border-[#D9D7D0]/60 rounded-full py-4 px-6 text-[#1c1b1b] text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-sm transition-all"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Integrations */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-black">Connect Your Apps.</h1>
                <p className="text-[#8C8880] text-lg">Supercharge Relay by syncing your calendar and meetings.</p>
              </div>

              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#D9D7D0]/40 rounded-2xl hover:border-black/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">Google Calendar</p>
                      <p className="text-[#8C8880] text-xs">Sync schedules & auto-join links</p>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-black text-white rounded-full text-xs font-bold hover:opacity-90 transition-opacity">
                    Connect
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#D9D7D0]/40 rounded-2xl hover:border-black/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#2D8CFF] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-white text-[20px]">videocam</span>
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">Zoom Integration</p>
                      <p className="text-[#8C8880] text-xs">Enable native translation overlay</p>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-black text-white rounded-full text-xs font-bold hover:opacity-90 transition-opacity">
                    Connect
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#D9D7D0]/40 rounded-2xl hover:border-black/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#464EB8] rounded-xl flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-white text-[20px]">group</span>
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">Microsoft Teams</p>
                      <p className="text-[#8C8880] text-xs">Bot deployment for external meetings</p>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-white border border-[#D9D7D0] text-black rounded-full text-xs font-bold hover:bg-[#FAF9F5] transition-colors">
                    Connected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex items-center gap-4 w-full max-w-2xl">
          {currentStep > 1 && (
            <button 
              onClick={prevStep}
              className="px-6 py-4 rounded-full font-bold text-black hover:bg-black/5 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back
            </button>
          )}
          
          <div className="flex-1"></div>

          {currentStep === 4 && (
            <button 
              onClick={handleComplete}
              className="px-6 py-4 rounded-full font-bold text-[#8C8880] hover:text-black transition-colors"
            >
              Skip & Finish
            </button>
          )}

          <button 
            onClick={currentStep === totalSteps ? handleComplete : nextStep}
            disabled={currentStep === 3 && !workspaceType}
            className={`px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
              currentStep === 3 && !workspaceType 
                ? 'bg-[#D9D7D0] cursor-not-allowed shadow-none' 
                : 'bg-black hover:scale-105'
            }`}
          >
            {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
            {currentStep < totalSteps && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { switchWorkspace, refetchWorkspaces } = useWorkspace();
  const [currentStep, setCurrentStep] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalSteps = 3;

  const [jobRole, setJobRole] = useState('');
  const [speakingLanguage, setSpeakingLanguage] = useState('English');
  const [hearingLanguage, setHearingLanguage] = useState('Spanish');
  const [subtitleLanguage, setSubtitleLanguage] = useState('English');
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

  const handleComplete = async () => {
    setIsTransitioning(true);

    try {
      const res = await fetch('/api/workspaces/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceType,
          orgName,
          jobRole,
          speakingLanguage,
          hearingLanguage,
          subtitleLanguage,
          selectedVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await refetchWorkspaces();
        if (workspaceType === 'organization' && data.workspace) {
          switchWorkspace(data.workspace.id);
        }
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }

    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-chrome selection:text-white">
      <header className="h-20 flex items-center justify-between px-6 md:px-10 z-20">
        <span className="text-xl font-bold tracking-tighter text-ink">Relay</span>
        <div className="text-xs font-bold text-muted uppercase tracking-widest">
          Step {currentStep} of {totalSteps}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto relative">
        <div className="w-full bg-border/40 h-1.5 rounded-full mb-12 overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full bg-accent transition-all duration-700 ease-out rounded-full"
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
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink">Welcome to Relay.</h1>
                <p className="text-muted text-lg">Let&apos;s get your personalized AI studio set up.</p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-8 shadow-card space-y-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-chrome flex items-center justify-center text-white font-bold text-3xl relative group cursor-pointer overflow-hidden">
                    ET
                    <div className="absolute inset-0 bg-chrome/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-muted hover:text-ink cursor-pointer transition-colors">Upload Avatar</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted ml-4">Your Role / Job Title</label>
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      className="w-full bg-canvas border border-border/30 rounded-full py-4 px-6 text-ink text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
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
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink">Your Digital Voice.</h1>
                <p className="text-muted text-lg">Configure how you sound and translate.</p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-8 shadow-card space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted ml-4">I Speak</label>
                    <div className="relative">
                      <select
                        value={speakingLanguage}
                        onChange={(e) => setSpeakingLanguage(e.target.value)}
                        className="w-full bg-canvas border border-border/30 rounded-xl py-4 pl-5 pr-10 text-ink text-sm font-medium focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all appearance-none cursor-pointer"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>Mandarin</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted ml-4">I Listen In</label>
                    <div className="relative">
                      <select
                        value={hearingLanguage}
                        onChange={(e) => setHearingLanguage(e.target.value)}
                        className="w-full bg-canvas border border-border/30 rounded-xl py-4 pl-5 pr-10 text-ink text-sm font-medium focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all appearance-none cursor-pointer"
                      >
                        <option>Spanish</option>
                        <option>English</option>
                        <option>French</option>
                        <option>Mandarin</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted ml-4">My Subtitles</label>
                    <div className="relative">
                      <select
                        value={subtitleLanguage}
                        onChange={(e) => setSubtitleLanguage(e.target.value)}
                        className="w-full bg-canvas border border-border/30 rounded-xl py-4 pl-5 pr-10 text-ink text-sm font-medium focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all appearance-none cursor-pointer"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>Mandarin</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-faint pointer-events-none text-[18px]">keyboard_arrow_down</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/30">
                  <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted ml-4">AI Output Voice Style</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'natural', name: 'Natural (Recommended)', desc: 'Balanced, conversational, human-like cadence', icon: 'record_voice_over' },
                      { id: 'professional', name: 'Professional', desc: 'Clear, crisp, and formal articulation', icon: 'business_center' },
                      { id: 'expressive', name: 'Expressive', desc: 'High emotion and dynamic range', icon: 'mood' },
                    ].map(voice => (
                      <div
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice.id)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedVoice === voice.id
                            ? 'border-accent bg-gradient-to-br from-accent/[0.03] to-transparent'
                            : 'border-border/30 hover:border-accent/30 bg-surface'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-12 rounded-xl flex items-center justify-center ${selectedVoice === voice.id ? 'bg-accent' : 'bg-canvas text-muted'}`}>
                            <span className={`material-symbols-outlined text-[20px] ${selectedVoice === voice.id ? 'text-white' : ''}`}>{voice.icon}</span>
                          </div>
                          <div>
                            <p className="font-bold text-ink text-sm">{voice.name}</p>
                            <p className="text-muted text-xs">{voice.desc}</p>
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-surface border border-border/60 flex items-center justify-center hover:bg-accent hover:text-white hover:border-transparent transition-all group">
                          <span className="material-symbols-outlined text-[18px] text-muted group-hover:text-white">play_arrow</span>
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
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink">How will you use Relay?</h1>
                <p className="text-muted text-lg">Choose your primary workspace context.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setWorkspaceType('personal')}
                  className={`p-6 bg-surface border-2 rounded-xl cursor-pointer transition-all ${
                    workspaceType === 'personal'
                      ? 'border-accent shadow-pop scale-[1.02]'
                      : 'border-border/30 hover:border-accent/30 hover:scale-[1.01]'
                  }`}
                >
                  <div className="w-12 h-12 bg-chrome rounded-xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-white text-[24px]">person</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-ink mb-2">Personal Use</h3>
                  <p className="text-muted text-sm">For individuals wanting seamless real-time translation for external meetings.</p>
                </div>

                <div
                  onClick={() => setWorkspaceType('organization')}
                  className={`p-6 bg-surface border-2 rounded-xl cursor-pointer transition-all ${
                    workspaceType === 'organization'
                      ? 'border-accent shadow-pop scale-[1.02]'
                      : 'border-border/30 hover:border-accent/30 hover:scale-[1.01]'
                  }`}
                >
                  <div className="w-12 h-12 bg-chrome rounded-xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-white text-[24px]">domain</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-ink mb-2">Team & Organization</h3>
                  <p className="text-muted text-sm">Create a shared workspace for your team with shared billing and policies.</p>
                </div>
              </div>

              {workspaceType === 'organization' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] font-bold text-muted ml-4">Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full bg-surface border border-border/30 rounded-full py-4 px-6 text-ink text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/15 transition-all"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center gap-4 w-full max-w-2xl">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-4 rounded-full font-bold text-muted hover:text-ink transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Back
            </button>
          )}

          <div className="flex-1"></div>

          <button
            onClick={currentStep === totalSteps ? handleComplete : nextStep}
            disabled={currentStep === 3 && !workspaceType}
            className={`px-8 py-4 rounded-full font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
              currentStep === 3 && !workspaceType
                ? 'bg-border cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-accent to-accent-deep hover:scale-105 '
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

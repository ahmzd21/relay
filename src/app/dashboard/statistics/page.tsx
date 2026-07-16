'use client';
import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function StatisticsPage() {
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
            <h1 className="text-2xl font-bold tracking-tight text-black">Statistics & Analytics</h1>
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
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Time Period Selector */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-black text-white rounded-xl text-sm font-bold">7 Days</button>
                <button className="px-4 py-2 bg-white border border-[#D9D7D0]/60 text-black rounded-xl text-sm font-medium hover:bg-[#FAF9F5] transition-colors">30 Days</button>
                <button className="px-4 py-2 bg-white border border-[#D9D7D0]/60 text-black rounded-xl text-sm font-medium hover:bg-[#FAF9F5] transition-colors">90 Days</button>
                <button className="px-4 py-2 bg-white border border-[#D9D7D0]/60 text-black rounded-xl text-sm font-medium hover:bg-[#FAF9F5] transition-colors">Custom</button>
              </div>
              <button className="flex items-center gap-2 text-sm font-bold text-black hover:text-indigo-600 transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Report
              </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Metric 1 */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-indigo-600 text-[20px]">videocam</span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +12.5%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-black mb-1">248</h3>
                <p className="text-[#8C8880] text-sm">Total Meetings</p>
              </div>

              {/* Metric 2 */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">schedule</span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +8.3%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-black mb-1">142h</h3>
                <p className="text-[#8C8880] text-sm">Translation Hours</p>
              </div>

              {/* Metric 3 */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">translate</span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +15.2%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-black mb-1">18</h3>
                <p className="text-[#8C8880] text-sm">Languages Used</p>
              </div>

              {/* Metric 4 */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-rose-600 text-[20px]">groups</span>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                    +5.7%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-black mb-1">1,247</h3>
                <p className="text-[#8C8880] text-sm">Participants</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meeting Activity Chart */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold tracking-tight text-black">Meeting Activity</h2>
                  <button className="text-[#8C8880] hover:text-black transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                {/* Simulated Chart */}
                <div className="h-48 flex items-end gap-2">
                  {[
                    { value: 65, label: 'Mon' },
                    { value: 45, label: 'Tue' },
                    { value: 80, label: 'Wed' },
                    { value: 55, label: 'Thu' },
                    { value: 90, label: 'Fri' },
                    { value: 30, label: 'Sat' },
                    { value: 40, label: 'Sun' },
                  ].map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-indigo-500 rounded-t-lg transition-all hover:bg-indigo-600"
                        style={{ height: `${item.value}%` }}
                      ></div>
                      <span className="text-xs text-[#8C8880] font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translation Volume Chart */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold tracking-tight text-black">Translation Volume</h2>
                  <button className="text-[#8C8880] hover:text-black transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                {/* Simulated Chart */}
                <div className="h-48 flex items-end gap-2">
                  {[
                    { value: 75, label: 'Mon' },
                    { value: 60, label: 'Tue' },
                    { value: 85, label: 'Wed' },
                    { value: 70, label: 'Thu' },
                    { value: 95, label: 'Fri' },
                    { value: 45, label: 'Sat' },
                    { value: 55, label: 'Sun' },
                  ].map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                        style={{ height: `${item.value}%` }}
                      ></div>
                      <span className="text-xs text-[#8C8880] font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold tracking-tight text-black">Language Breakdown</h2>
                <button className="text-sm font-bold text-black hover:text-indigo-600 transition-colors">View All</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { language: 'English', percentage: 42, flag: '🇬🇧' },
                  { language: 'Spanish', percentage: 18, flag: '🇪🇸' },
                  { language: 'Chinese', percentage: 15, flag: '🇨🇳' },
                  { language: 'German', percentage: 12, flag: '🇩🇪' },
                  { language: 'French', percentage: 8, flag: '🇫🇷' },
                  { language: 'Japanese', percentage: 5, flag: '🇯🇵' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-[#FAF9F5] rounded-2xl">
                    <span className="text-2xl">{item.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-black text-sm">{item.language}</span>
                        <span className="text-[#8C8880] text-xs font-medium">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight text-black mb-6">Platform Usage</h2>
                <div className="space-y-4">
                  {[
                    { platform: 'Native Relay', percentage: 55, color: 'bg-indigo-500' },
                    { platform: 'Zoom', percentage: 25, color: 'bg-blue-500' },
                    { platform: 'Microsoft Teams', percentage: 15, color: 'bg-indigo-600' },
                    { platform: 'Google Meet', percentage: 5, color: 'bg-emerald-500' },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-black text-sm">{item.platform}</span>
                        <span className="text-[#8C8880] text-xs font-medium">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#FAF9F5] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Participants */}
              <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-tight text-black mb-6">Top Participants</h2>
                <div className="space-y-4">
                  {[
                    { name: 'Sarah Chen', meetings: 42, hours: 38 },
                    { name: 'Marcus Weber', meetings: 38, hours: 35 },
                    { name: 'Yuki Tanaka', meetings: 35, hours: 32 },
                    { name: 'Elena Rossi', meetings: 31, hours: 28 },
                    { name: 'Ahmed Hassan', meetings: 28, hours: 25 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#FAF9F5] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {item.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-black text-sm">{item.name}</p>
                          <p className="text-[#8C8880] text-xs">{item.meetings} meetings</p>
                        </div>
                      </div>
                      <span className="text-black font-bold text-sm">{item.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

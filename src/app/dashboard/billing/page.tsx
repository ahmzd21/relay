'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function BillingPage() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'invoices' | 'payment'>('overview');

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
            <h1 className="text-2xl font-bold tracking-tight text-black">Billing</h1>
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

            {/* Tabs */}
            <div className="flex gap-2 bg-white border border-[#D9D7D0]/40 rounded-2xl p-1.5 w-fit">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedTab === 'overview' ? 'bg-black text-white' : 'text-[#8C8880] hover:text-black'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('invoices')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedTab === 'invoices' ? 'bg-black text-white' : 'text-[#8C8880] hover:text-black'
                }`}
              >
                Invoices
              </button>
              <button
                onClick={() => setSelectedTab('payment')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedTab === 'payment' ? 'bg-black text-white' : 'text-[#8C8880] hover:text-black'
                }`}
              >
                Payment Methods
              </button>
            </div>

            {selectedTab === 'overview' && (
              <>
                {/* Current Plan Card */}
                <div className="bg-black rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <span className="bg-indigo-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">Current Plan</span>
                        <h2 className="text-3xl font-bold mb-2">Enterprise Plan</h2>
                        <p className="text-white/60">Unlimited translation minutes • Advanced analytics • Priority support</p>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold">$499</p>
                        <p className="text-white/60 text-sm">/month</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg">
                        Upgrade Plan
                      </button>
                      <button className="border border-white text-slate-900 bg-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black hover:text-white transition-all shadow-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Usage Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600 text-[20px]">schedule</span>
                      </div>
                      <div>
                        <p className="text-[#8C8880] text-xs font-medium">Translation Minutes</p>
                        <p className="text-2xl font-bold text-black">2,847 / 5,000</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#FAF9F5] rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '57%' }}></div>
                    </div>
                    <p className="text-[#8C8880] text-xs mt-2">57% of monthly limit</p>
                  </div>

                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px]">videocam</span>
                      </div>
                      <div>
                        <p className="text-[#8C8880] text-xs font-medium">Active Meetings</p>
                        <p className="text-2xl font-bold text-black">248</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#FAF9F5] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '83%' }}></div>
                    </div>
                    <p className="text-[#8C8880] text-xs mt-2">83% of monthly limit</p>
                  </div>

                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600 text-[20px]">storage</span>
                      </div>
                      <div>
                        <p className="text-[#8C8880] text-xs font-medium">Storage Used</p>
                        <p className="text-2xl font-bold text-black">45 GB / 100 GB</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#FAF9F5] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-[#8C8880] text-xs mt-2">45% of storage limit</p>
                  </div>
                </div>

                {/* Billing Summary */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold tracking-tight text-black mb-6">Billing Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-[#D9D7D0]/40">
                      <div>
                        <p className="font-bold text-black">Enterprise Plan</p>
                        <p className="text-[#8C8880] text-xs">Monthly subscription</p>
                      </div>
                      <p className="font-bold text-black">$499.00</p>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#D9D7D0]/40">
                      <div>
                        <p className="font-bold text-black">Additional Translation Minutes</p>
                        <p className="text-[#8C8880] text-xs">500 extra minutes</p>
                      </div>
                      <p className="font-bold text-black">$50.00</p>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#D9D7D0]/40">
                      <div>
                        <p className="font-bold text-black">Storage Upgrade</p>
                        <p className="text-[#8C8880] text-xs">Additional 50 GB</p>
                      </div>
                      <p className="font-bold text-black">$25.00</p>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <div>
                        <p className="font-bold text-black">Tax</p>
                        <p className="text-[#8C8880] text-xs">VAT 20%</p>
                      </div>
                      <p className="font-bold text-black">$114.80</p>
                    </div>
                    <div className="flex justify-between items-center py-4 bg-[#FAF9F5] rounded-2xl px-4 mt-4">
                      <p className="font-bold text-black text-lg">Total Due</p>
                      <p className="font-bold text-black text-2xl">$688.80</p>
                    </div>
                  </div>
                  <button className="w-full mt-6 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg">
                    Pay Now
                  </button>
                </div>
              </>
            )}

            {selectedTab === 'invoices' && (
              <>
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#D9D7D0]/40">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold tracking-tight text-black">Invoices</h2>
                      <button className="text-sm font-bold text-black hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Download All
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-[#D9D7D0]/40">
                    {[
                      { id: 'INV-2024-001', date: 'July 15, 2024', amount: '$688.80', status: 'paid' },
                      { id: 'INV-2024-002', date: 'June 15, 2024', amount: '$688.80', status: 'paid' },
                      { id: 'INV-2024-003', date: 'May 15, 2024', amount: '$599.00', status: 'paid' },
                      { id: 'INV-2024-004', date: 'April 15, 2024', amount: '$599.00', status: 'paid' },
                      { id: 'INV-2024-005', date: 'March 15, 2024', amount: '$499.00', status: 'paid' },
                    ].map((invoice, index) => (
                      <div key={index} className="p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                              <span className="material-symbols-outlined text-slate-600 text-[20px]">description</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-black group-hover:text-indigo-600 transition-colors">{invoice.id}</h4>
                              <p className="text-[#8C8880] text-xs mt-0.5">{invoice.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-black">{invoice.amount}</span>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>{invoice.status}</span>
                            <button className="text-[#8C8880] hover:text-black transition-colors">
                              <span className="material-symbols-outlined">download</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedTab === 'payment' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Methods */}
                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-black">Payment Methods</h2>
                      <button className="text-sm font-bold text-black hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add New
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-indigo-500 bg-indigo-50/20 rounded-2xl relative">
                        <div className="absolute top-3 right-3 bg-indigo-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Default</div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">VISA</span>
                          </div>
                          <div>
                            <p className="font-bold text-black">•••• •••• •••• 4242</p>
                            <p className="text-[#8C8880] text-xs">Expires 12/25</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs font-bold text-black hover:text-indigo-600 transition-colors">Edit</button>
                          <button className="text-xs font-bold text-[#8C8880] hover:text-rose-600 transition-colors">Remove</button>
                        </div>
                      </div>

                      <div className="p-4 border border-[#D9D7D0]/40 rounded-2xl hover:border-black/30 transition-colors">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">MC</span>
                          </div>
                          <div>
                            <p className="font-bold text-black">•••• •••• •••• 5555</p>
                            <p className="text-[#8C8880] text-xs">Expires 08/24</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs font-bold text-black hover:text-indigo-600 transition-colors">Edit</button>
                          <button className="text-xs font-bold text-[#8C8880] hover:text-rose-600 transition-colors">Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold tracking-tight text-black">Billing Address</h2>
                      <button className="text-sm font-bold text-black hover:text-indigo-600 transition-colors">Edit</button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[#8C8880] text-xs mb-1">Company Name</p>
                        <p className="font-bold text-black">Relay AI Technologies</p>
                      </div>
                      <div>
                        <p className="text-[#8C8880] text-xs mb-1">Email</p>
                        <p className="font-bold text-black">billing@relay.ai</p>
                      </div>
                      <div>
                        <p className="text-[#8C8880] text-xs mb-1">Address</p>
                        <p className="font-bold text-black">123 Innovation Drive</p>
                        <p className="font-bold text-black">San Francisco, CA 94105</p>
                        <p className="font-bold text-black">United States</p>
                      </div>
                      <div>
                        <p className="text-[#8C8880] text-xs mb-1">Tax ID</p>
                        <p className="font-bold text-black">US-123456789</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Pay Settings */}
                <div className="bg-white border border-[#D9D7D0]/40 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold tracking-tight text-black mb-6">Auto-Pay Settings</h2>
                  <div className="flex items-center justify-between p-4 bg-[#FAF9F5] rounded-2xl">
                    <div>
                      <p className="font-bold text-black">Automatic Payments</p>
                      <p className="text-[#8C8880] text-xs">Automatically pay invoices on due date</p>
                    </div>
                    <button className="w-12 h-7 bg-black rounded-full relative transition-colors">
                      <span className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full transition-transform"></span>
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

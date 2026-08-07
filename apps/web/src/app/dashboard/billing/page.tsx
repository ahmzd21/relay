'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { useWorkspace } from '@/contexts/WorkspaceContext';

type BillingTab = 'overview' | 'invoices' | 'payment';

export default function BillingPage() {
  const { isOrganization, currentWorkspace, hasPermission } = useWorkspace();
  const isOrg = isOrganization();
  const isOwner = hasPermission('owner');

  const [tab, setTab] = useState<BillingTab>('overview');

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'invoices' as const, label: 'Invoices' },
    ...((isOrg && !isOwner) ? [] : [{ key: 'payment' as const, label: 'Payment Methods' }]),
  ];

  return (
    <>

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative">
        <DashboardHeader searchPlaceholder={isOrg ? "Search billing, invoices..." : "Search billing, plans..."} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 z-10 pb-24">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-helvetica tracking-tight text-slate-900 mb-2">
                  {isOrg ? `${currentWorkspace.name} Billing` : 'Billing & Plans'}
                </h1>
                <p className="text-slate-600 text-lg">
                  {isOrg && isOwner ? 'Manage your organization plan, usage, and payments.' : isOrg ? 'View your workspace plan and usage.' : 'Manage your subscription, usage, and payments.'}
                </p>
              </div>
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

            {/* ==================== OVERVIEW TAB ==================== */}
            {tab === 'overview' && (
              <div className="space-y-8">
                {/* Plan Card */}
                {isOrg ? (
                  <OrgPlanCard isOwner={isOwner} />
                ) : (
                  <PersonalPlanCard />
                )}

                {/* Usage Metrics */}
                {isOrg ? (
                  <OrgUsageMetrics />
                ) : (
                  <PersonalUsageMetrics />
                )}

                {/* Team Member Usage (Org Owner only) */}
                {isOrg && isOwner && <OrgMemberUsage />}

                {/* Billing Summary */}
                {(isOrg ? isOwner : true) && <BillingSummary isOrg={isOrg} />}
              </div>
            )}

            {/* ==================== INVOICES TAB ==================== */}
            {tab === 'invoices' && (
              <div className="space-y-6">
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl shadow-warm overflow-hidden">
                  <div className="p-6 border-b border-[#E4E0D6]/30">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">
                        {isOrg ? 'Organization Invoices' : 'Your Invoices'}
                      </h2>
                      {(isOrg ? isOwner : true) && (
                        <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          Download All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-[#c4c7c7]/20">
                    {invoices.map((invoice, i) => (
                      <div key={i} className="p-5 hover:bg-[#FAF9F5] transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] rounded-xl flex items-center justify-center shadow-md shadow-[#FF416C]/20">
                              <span className="material-symbols-outlined text-white text-[20px]">description</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-[#FF416C] transition-colors">{invoice.id}</h4>
                              <p className="text-slate-500 text-xs mt-0.5">{invoice.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-900">{invoice.amount}</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              invoice.status === 'paid'
                                ? 'bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white shadow-sm shadow-[#FF416C]/20'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>{invoice.status}</span>
                            <button className="w-8 h-8 rounded-xl border border-[#E4E0D6]/30 flex items-center justify-center text-slate-500 hover:text-[#FF416C] hover:border-[#FF416C]/30 transition-all">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PAYMENT TAB ==================== */}
            {tab === 'payment' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Methods */}
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Payment Methods</h2>
                      <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        Add New
                      </button>
                    </div>
                    <div className="space-y-3">
                      {paymentMethods.map((method, i) => (
                        <div key={i} className={`p-4 rounded-2xl relative transition-all ${
                          method.default
                            ? 'border-2 border-[#FF416C]/30 bg-[#FF416C]/5'
                            : 'border border-[#E4E0D6]/30 hover:border-[#E4E0D6]/60'
                        }`}>
                          {method.default && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-[#FF416C]/20">Default</div>
                          )}
                          <div className="flex items-center gap-4 mb-3">
                            <div className={`w-12 h-8 rounded-lg flex items-center justify-center ${method.cardColor}`}>
                              <span className="text-white text-xs font-bold">{method.cardType}</span>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{method.number}</p>
                              <p className="text-slate-500 text-xs">Expires {method.expiry}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-xs font-bold text-[#FF416C] hover:text-[#FF4B2B] transition-colors">Edit</button>
                            {!method.default && (
                              <button className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors">Remove</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">
                        {isOrg ? 'Organization Address' : 'Billing Address'}
                      </h2>
                      <button className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors">Edit</button>
                    </div>
                    <div className="space-y-4">
                      {billingAddress.map((field, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{field.label}</p>
                          <p className="text-sm font-bold text-slate-900">{field.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auto-Pay Settings */}
                <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
                  <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-4">Auto-Pay Settings</h2>
                  <div className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#E4E0D6]/20 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Automatic Payments</p>
                      <p className="text-xs text-slate-500">Automatically pay invoices on due date</p>
                    </div>
                    <button className="w-12 h-7 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] rounded-full relative transition-colors cursor-pointer shadow-sm shadow-[#FF416C]/20">
                      <span className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}

/* ==================== COMPONENTS ==================== */

function PersonalPlanCard() {
  return (
    <div className="bg-[#FFFDF8] rounded-2xl p-8 text-[#1c1b1b] shadow-warm-md relative overflow-hidden border border-[#E4E0D6]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block shadow-sm shadow-[#FF416C]/20">Current Plan</span>
            <h2 className="text-3xl font-bold font-helvetica tracking-tight mb-2">Pro Plan</h2>
            <p className="text-[#8C8880] text-sm">5,000 translation minutes · 100 GB storage · Advanced analytics</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold font-helvetica">$29</p>
            <p className="text-[#8C8880] text-sm">/month</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-[#FF416C]/20">
            Upgrade Plan
          </button>
          <button className="border border-[#E4E0D6] text-[#1c1b1b] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#FAF9F5] transition-all">
            View All Plans
          </button>
        </div>
      </div>
    </div>
  );
}

function OrgPlanCard({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="bg-[#FFFDF8] rounded-2xl p-8 text-[#1c1b1b] shadow-warm-md relative overflow-hidden border border-[#E4E0D6]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF416C]/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block shadow-sm shadow-[#FF416C]/20">Organization Plan</span>
            <h2 className="text-3xl font-bold font-helvetica tracking-tight mb-2">Enterprise Plan</h2>
            <p className="text-[#8C8880] text-sm">Unlimited translation · 12 seats · Priority support · SSO</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold font-helvetica">$499</p>
            <p className="text-[#8C8880] text-sm">/month · 12 seats</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isOwner ? (
            <>
              <button className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white px-6 py-3 rounded-full text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-[#FF416C]/20">
                Manage Plan
              </button>
              <button className="border border-[#E4E0D6] text-[#1c1b1b] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#FAF9F5] transition-all">
                Add Seats
              </button>
            </>
          ) : (
            <p className="text-[#8C8880] text-sm">Contact your workspace owner to manage this plan.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalUsageMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UsageCard icon="schedule" color="text-indigo-600 bg-indigo-50" label="Translation Minutes" used={2847} limit={5000} unit="minutes" />
      <UsageCard icon="videocam" color="text-emerald-600 bg-emerald-50" label="Meetings Hosted" used={248} limit={300} unit="meetings" />
      <UsageCard icon="storage" color="text-amber-600 bg-amber-50" label="Storage Used" used={45} limit={100} unit="GB" />
    </div>
  );
}

function OrgUsageMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UsageCard icon="schedule" color="text-indigo-600 bg-indigo-50" label="Translation Minutes" used={4280} limit={5000} unit="minutes" />
      <UsageCard icon="videocam" color="text-emerald-600 bg-emerald-50" label="Total Meetings" used={342} limit={500} unit="meetings" />
      <UsageCard icon="storage" color="text-amber-600 bg-amber-50" label="Storage Used" used={78} limit={100} unit="GB" />
    </div>
  );
}

function UsageCard({ icon, label, used, limit }: {
  icon: string;
  color: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = Math.round((used / limit) * 100);
  return (
    <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm hover:shadow-lg hover:border-[#FF416C]/30 hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-[#FF416C]/20 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-white text-[20px]">{icon}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-bold font-helvetica text-slate-900 mb-1">{used.toLocaleString()} <span className="text-lg text-slate-400">/ {limit.toLocaleString()}</span></p>
      <p className="text-xs text-slate-500 mb-3">{pct}% of monthly limit</p>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct > 80
              ? 'linear-gradient(to right, #ef4444, #f87171)'
              : pct > 60
                ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                : 'linear-gradient(to right, #FF416C, #FF4B2B)',
          }}
        />
      </div>
    </div>
  );
}

function OrgMemberUsage() {
  const members = [
    { name: 'Sarah Chen', initials: 'SC', color: 'bg-rose-100 text-rose-700', minutes: 820, meetings: 68, storage: '12 GB' },
    { name: 'Yousef Al-Rashid', initials: 'YA', color: 'bg-amber-100 text-amber-700', minutes: 640, meetings: 52, storage: '9 GB' },
    { name: 'Marcus Klein', initials: 'MK', color: 'bg-purple-100 text-purple-700', minutes: 580, meetings: 48, storage: '8 GB' },
    { name: 'Elias Thompson', initials: 'ET', color: 'bg-indigo-100 text-indigo-700', minutes: 520, meetings: 45, storage: '7 GB' },
    { name: 'Sofia Martinez', initials: 'SM', color: 'bg-emerald-100 text-emerald-700', minutes: 420, meetings: 38, storage: '6 GB' },
    { name: 'Wei Zhang', initials: 'WZ', color: 'bg-blue-100 text-blue-700', minutes: 380, meetings: 35, storage: '5 GB' },
  ];

  return (
    <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900">Member Usage</h2>
        <Link href="/dashboard/statistics" className="text-[10px] font-bold text-[#FF416C] uppercase tracking-widest hover:text-[#FF4B2B] transition-colors">
          Full Statistics →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m, i) => {
          const pct = Math.round((m.minutes / 5000) * 100 * 10);
          return (
            <div key={i} className="bg-[#FAF9F5] border border-[#E4E0D6]/20 p-4 rounded-xl hover:border-[#FF416C]/30 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${m.color} flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform`}>{m.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#FF416C] transition-colors">{m.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">{m.minutes.toLocaleString()} min</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-500">{m.meetings} mtgs</span>
                    <span className="text-[10px] text-slate-400">·</span>
                    <span className="text-[10px] text-slate-500">{m.storage}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct > 80
                        ? 'linear-gradient(to right, #ef4444, #f87171)'
                        : 'linear-gradient(to right, #FF416C, #FF4B2B)',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BillingSummary({ isOrg }: { isOrg: boolean }) {
  return (
    <div className="bg-[#FFFDF8] border border-[#E4E0D6] rounded-2xl p-6 shadow-warm">
      <h2 className="text-lg font-bold font-helvetica tracking-tight text-slate-900 mb-6">Billing Summary</h2>
      <div className="space-y-4">
        <BillingRow label={isOrg ? 'Enterprise Plan (12 seats)' : 'Pro Plan'} sub="Monthly subscription" amount={isOrg ? '$499.00' : '$29.00'} />
        <BillingRow label="Additional Translation Minutes" sub="500 extra minutes" amount="$50.00" />
        {isOrg && <BillingRow label="Seat Add-on" sub="3 additional seats" amount="$75.00" />}
        <BillingRow label="Tax" sub="VAT 20%" amount={isOrg ? '$124.80' : '$15.80'} />
        <div className="flex justify-between items-center py-4 rounded-xl px-4 mt-4" style={{ background: 'linear-gradient(to right, rgba(255,65,108,0.05), rgba(255,75,43,0.05))', border: '1px solid rgba(255,65,108,0.15)' }}>
          <p className="font-bold text-slate-900">Total Due</p>
          <p className="font-bold text-slate-900 text-2xl font-helvetica">{isOrg ? '$748.80' : '$94.80'}</p>
        </div>
      </div>
      <button className="w-full mt-6 bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white py-4 rounded-full text-sm font-bold hover:scale-[1.01] hover:shadow-lg transition-all duration-200 shadow-lg shadow-[#FF416C]/20">
        Pay Now
      </button>
    </div>
  );
}

function BillingRow({ label, sub, amount }: { label: string; sub: string; amount: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-[#E4E0D6]/20">
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{sub}</p>
      </div>
      <p className="text-sm font-bold text-slate-900">{amount}</p>
    </div>
  );
}

/* ==================== DATA ==================== */

const invoices = [
  { id: 'INV-2026-007', date: 'July 15, 2026', amount: '$748.80', status: 'paid' },
  { id: 'INV-2026-006', date: 'June 15, 2026', amount: '$748.80', status: 'paid' },
  { id: 'INV-2026-005', date: 'May 15, 2026', amount: '$688.80', status: 'paid' },
  { id: 'INV-2026-004', date: 'April 15, 2026', amount: '$599.00', status: 'paid' },
  { id: 'INV-2026-003', date: 'March 15, 2026', amount: '$499.00', status: 'paid' },
  { id: 'INV-2026-002', date: 'February 15, 2026', amount: '$499.00', status: 'paid' },
  { id: 'INV-2026-001', date: 'January 15, 2026', amount: '$499.00', status: 'paid' },
];

const paymentMethods = [
  { cardType: 'VISA', cardColor: 'bg-gradient-to-r from-blue-600 to-blue-800', number: '•••• •••• •••• 4242', expiry: '12/27', default: true },
  { cardType: 'MC', cardColor: 'bg-gradient-to-r from-red-500 to-orange-500', number: '•••• •••• •••• 5555', expiry: '08/26', default: false },
];

const billingAddress = [
  { label: 'Company Name', value: 'Relay AI Technologies' },
  { label: 'Email', value: 'billing@relay.ai' },
  { label: 'Address', value: '123 Innovation Drive, San Francisco, CA 94105, United States' },
  { label: 'Tax ID', value: 'US-123456789' },
];

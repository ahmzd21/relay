'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    window.location.href = `/api/auth/verify-email?token=${token}`;
  }, [token]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-helvetica">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#c4c7c7]/30">
              <svg className="animate-spin h-8 w-8 text-[#FF416C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verifying your email...</h1>
            <p className="text-slate-500">Please wait while we confirm your account.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center font-helvetica">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#c4c7c7]/30">
            <svg className="animate-spin h-8 w-8 text-[#FF416C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}

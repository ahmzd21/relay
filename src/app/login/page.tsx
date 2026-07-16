'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Simplified shader animation for both canvases (consistent with signup)
    useEffect(() => {
        const canvases = [canvasRef.current, mobileCanvasRef.current];
        let animationFrameId: number;
        let time = 0;

        function resize() {
            canvases.forEach(canvas => {
                if (canvas) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                }
            });
        }

        function animate() {
            time += 0.005;
            canvases.forEach(canvas => {
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const gradient = ctx.createRadialGradient(
                    canvas.width * (0.5 + Math.cos(time) * 0.2),
                    canvas.height * (0.5 + Math.sin(time) * 0.3),
                    0,
                    canvas.width * 0.5,
                    canvas.height * 0.5,
                    canvas.width
                );

                gradient.addColorStop(0, 'rgba(50, 50, 50, 0.4)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < 30; i++) {
                    const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
                    const y = (Math.cos(time * 0.8 + i) * 0.5 + 0.5) * canvas.height;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen text-[#1c1b1b] selection:bg-black selection:text-white overflow-x-hidden font-helvetica">
            <style dangerouslySetInnerHTML={{
                __html: `
        .shader-bg {
            background-color: #010614;
            position: relative;
            overflow: hidden;
        }
        
        .shader-overlay {
            position: absolute;
            inset: 0;
            background: 
                radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.01) 0%, transparent 40%), 
                radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.005) 0%, transparent 50%);
            pointer-events: none;
        }


        .auth-input {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Desktop Focus State */
        @media (min-width: 1024px) {
          .auth-input:focus {
              background: #ffffff !important;
              border-color: #000000 !important;
              outline: none;
              box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
          }
        }

        /* Mobile Focus State Improvements */
        @media (max-width: 1023px) {
          .auth-input {
            color: #000000 !important;
          }
          .auth-input:focus {
              background: rgba(255, 255, 255, 0.9) !important;
              border-color: #4285F4 !important;
              outline: none;
              box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
          }
        }

        .cta-button {
            transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.2);
        }
      `}} />

            <div className="flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden min-h-screen shader-bg lg:bg-transparent">

                {/* Canvas Background (Only covers full screen on mobile) */}
                <div className="absolute inset-0 z-0 lg:hidden">
                    <canvas ref={mobileCanvasRef} className="w-full h-full opacity-40"></canvas>
                    <div className="shader-overlay"></div>
                </div>

                {/* Left Side (Desktop Editorial / Brand Intro) - Hidden on mobile */}
                <section className="hidden lg:flex shader-bg lg:w-[50%] relative flex-col p-[128px] pb-[48px] justify-between border-r border-black/5 min-h-screen">
                    <div className="absolute inset-0 z-0">
                        <canvas ref={canvasRef} className="w-full h-full opacity-40"></canvas>
                        <div className="shader-overlay"></div>
                    </div>
                    <div className="relative z-10 flex flex-col gap-[64px]">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-10 w-10 text-white">
                                <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <Link href="/" className="text-[32px] font-bold tracking-tight font-helvetica text-white">Relay <span className="text-white/40">.ai</span></Link>
                        </div>
                        <div className="max-w-lg">
                            <h2 className="text-[64px] font-bold tracking-tight font-helvetica leading-[1.05] text-white mb-[64px]">
                                Connect with clarity, speak with confidence.
                            </h2>
                            <div className="h-1 w-24 bg-white/20 mb-[16px]"></div>
                            <p className="text-white/60 text-[18px] leading-relaxed font-helvetica">
                                The premier intelligence layer for cross-border collaboration and high-stakes communication.
                            </p>
                        </div>
                    </div>
                    <footer className="relative z-10 flex flex-col items-center justify-center gap-y-4 w-full mt-auto">
                        <div className="flex items-center justify-center gap-x-[64px]">
                            <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Privacy</a>
                            <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Terms</a>
                            <a className="text-[11px] font-bold text-white/60 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Security</a>
                        </div>
                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.1em] font-['Inter']">© 2024 Relay AI</span>
                    </footer>
                </section>

                {/* Right Side / Mobile Foreground Form Layer */}
                <main className="relative z-10 w-full lg:w-[50%] flex flex-col justify-between items-center p-[24px] md:p-[40px] bg-transparent lg:bg-[#FAF9F5] min-h-screen lg:h-full lg:overflow-y-auto">

                    {/* Mobile Header Brand Element */}
                    <div className="w-full max-w-[420px] flex items-center gap-3 lg:hidden pt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 text-white">
                            <path d="M30 20 L70 50 L30 80 L50 50 Z" fill="currentColor" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <Link href="/" className="text-[24px] font-bold tracking-tight font-helvetica text-white">Relay <span className="text-white/40">.ai</span></Link>
                    </div>

                    <div className="w-full max-w-[420px] my-auto py-12 space-y-[40px] lg:space-y-[32px]">
                        <div className="text-left">
                            <h1 className="text-[36px] lg:text-[48px] font-bold font-helvetica mb-[8px] text-white lg:text-black tracking-tight">Welcome Back</h1>
                            <p className="text-white/70 lg:text-[#444748] text-[15px] lg:opacity-80">
                                Sign in to your account to access the neural network.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-[16px]">
                            <div className="space-y-[4px]">
                                <label className="block text-[10px] uppercase tracking-[0.1em] font-bold font-['Inter'] text-[#FAF9F5]/70 lg:text-[#8C8880] ml-4 mb-2">Email Address</label>
                                <input
                                    className="auth-input w-full px-6 py-4 rounded-full border border-white/10 lg:border-[#c4c7c7]/30 
                             text-black lg:text-[#1c1b1b] 
                             bg-white/80 lg:bg-white/50 
                             placeholder:text-black/40 lg:placeholder:text-[#8C8880]/60 
                             text-[15px]"
                                    placeholder="name@domain.com"
                                    type="email"
                                    required
                                />
                            </div>
                            <div className="space-y-[4px]">
                                <label className="block text-[10px] uppercase tracking-[0.1em] font-bold font-['Inter'] text-[#FAF9F5]/70 lg:text-[#8C8880] ml-4 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        className="auth-input w-full px-6 py-4 rounded-full border border-white/10 lg:border-[#c4c7c7]/30 
                               text-black lg:text-[#1c1b1b] 
                               bg-white/80 lg:bg-white/50 
                               placeholder:text-black/40 lg:placeholder:text-[#8C8880]/60 
                               text-[15px]"
                                        placeholder="Enter your password"
                                        type="password"
                                        required
                                    />
                                    <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 lg:text-[#8C8880] hover:text-white lg:hover:text-black transition-colors" type="button">
                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                    </button>
                                </div>
                                <div className="text-right mr-6">
                                    <Link href="#" className="inline-block text-[10px] uppercase tracking-[0.1em] font-bold font-['Inter'] text-white/50 lg:text-black lg:hover:underline transition-all mb-2">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <div className="pt-[16px]">
                                <button className="cta-button w-full py-4 bg-white lg:bg-black text-black lg:text-white rounded-full text-[15px] font-bold shadow-xl shadow-black/5 flex items-center justify-center gap-2 group" type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <svg className="animate-spin h-5 w-5 text-black lg:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Authenticating...
                                        </span>
                                    ) : (
                                        <>
                                            Sign In
                                            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center gap-4 py-4">
                                <div className="h-[1px] flex-grow bg-white/10 lg:bg-[#c4c7c7]/40"></div>
                                <span className="text-[12px] text-white/50 lg:text-[#8C8880] uppercase tracking-widest font-bold">or</span>
                                <div className="h-[1px] flex-grow bg-white/10 lg:bg-[#c4c7c7]/40"></div>
                            </div>

                            {/* Google Button */}
                            <button type="button" className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-white/10 lg:border-[#c4c7c7]/60 rounded-full font-medium bg-white/10 lg:bg-white/50 hover:bg-white/20 lg:hover:bg-white transition-all duration-300">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span className="text-white lg:text-[#1c1b1b] text-[15px] font-semibold">Continue with Google</span>
                            </button>
                        </form>

                        <p className="text-center text-sm text-white/50 lg:text-[#8C8880]">
                            Don't have an account? <Link className="text-white lg:text-black font-bold hover:underline transition-all" href="/signup">Sign up</Link>
                        </p>
                    </div>

                    {/* Footer on Mobile */}
                    <footer className="w-full max-w-[420px] flex flex-col items-center justify-center gap-y-3 pt-4 pb-4 lg:hidden">
                        <div className="flex items-center justify-center gap-x-[32px]">
                            <a className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Privacy</a>
                            <a className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Terms</a>
                            <a className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.1em] font-['Inter']" href="#">Security</a>
                        </div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em] font-['Inter']">© 2024 Relay AI</span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
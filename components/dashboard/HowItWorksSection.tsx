'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Download,
  UploadCloud,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Star,
  Check,
  Lock,
  ArrowLeft,
  Play,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      stepNumber: '01',
      title: 'Select a Task',
      subtitle: 'Task Chunein',
      description: 'Browse live tasks on PlayPay. Check reward amounts (₹10 - ₹100+) and requirements before enrolling.',
      icon: <Smartphone className="w-5 h-5 text-indigo-500" />,
      badge: 'Step 1',
      highlight: 'Guest users can view all live tasks!',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 1,
      stepNumber: '02',
      title: 'Download & Review',
      subtitle: 'Install Karein',
      description: 'Tap to open Google Play Store directly. Install the app, give 5 stars & write a genuine review.',
      icon: <Download className="w-5 h-5 text-amber-500" />,
      badge: 'Step 2',
      highlight: 'Direct Google Play link provided',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 2,
      stepNumber: '03',
      title: 'Upload Proof',
      subtitle: 'Proof Upload Karein',
      description: 'Take a quick screenshot of your published review and upload it directly from your gallery in 1 tap.',
      icon: <UploadCloud className="w-5 h-5 text-emerald-500" />,
      badge: 'Step 3',
      highlight: 'Fast gallery upload & instant submit',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 3,
      stepNumber: '04',
      title: 'Get Instant Cash',
      subtitle: 'Paise Receive Karein',
      description: 'Once verified by Team Leaders, rewards are credited directly to your UPI ID or Bank account.',
      icon: <Wallet className="w-5 h-5 text-blue-500" />,
      badge: 'Step 4',
      highlight: 'UPI, PhonePe, GPay & Bank transfer',
      color: 'from-blue-500 to-cyan-600',
    },
  ];

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: 'Fast Verification',
      description: 'Submissions are reviewed within 24-48 hrs by team leaders.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      title: '100% Free & Safe',
      description: 'No fees required. Only verified Play Store apps are listed.',
    },
    {
      icon: <Wallet className="w-5 h-5 text-indigo-500" />,
      title: 'Direct UPI Cash',
      description: 'Withdraw earnings directly to Google Pay, PhonePe, or Paytm.',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-purple-500" />,
      title: 'Mobile First',
      description: 'Built specifically for smartphone users. Earn on the go.',
    },
  ];

  const faqs = [
    {
      id: 'faq-1',
      question: 'Can guest users view available tasks?',
      answer: 'Yes! Guest users can browse all live tasks and see reward details. When you tap "Enroll" or "Start Task", you will be guided to log in or create an account in seconds.',
    },
    {
      id: 'faq-2',
      question: 'How long does approval take after submitting proof?',
      answer: 'Team Leaders usually review and verify screenshot submissions within 24 to 48 hours. You will receive real-time updates directly in your dashboard.',
    },
    {
      id: 'faq-3',
      question: 'How do I receive my payment?',
      answer: 'Once approved, earnings are credited to your PlayPay balance. Enter your UPI ID (Google Pay / PhonePe / Paytm / BHIM) or bank account details to receive direct payouts.',
    },
    {
      id: 'faq-4',
      question: 'Is there any fee or investment required?',
      answer: 'No! PlayPay is 100% free to join and use. You never need to pay any money to complete tasks or withdraw your earnings.',
    },
    {
      id: 'faq-5',
      question: 'What if my task submission gets rejected?',
      answer: 'If rejected, Team Leaders will state the exact reason (e.g., incorrect screenshot or missing review text). You can easily re-submit corrected screenshot proof.',
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-6 sm:py-12 bg-[var(--bg)] border-t border-[var(--border)] scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Top Header Badge & Titles */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Step-by-Step Mobile Tutorial</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-heading tracking-tight">
            How PlayPay Works
          </h2>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
            Follow our simple 4-step mobile process to review apps and earn instant cash rewards directly to your UPI ID.
          </p>
        </div>

        {/* ==========================================
            INTERACTIVE REALISTIC MOBILE INFOGRAPHIC
            ========================================== */}
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading uppercase tracking-wider">
                Live Interactive Tutorial
              </h3>
            </div>
            <Badge variant="primary" size="sm" className="font-bold">
              Tap Steps Below
            </Badge>
          </div>

          {/* Mobile Step Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded-[var(--radius-lg)] border text-left transition-all duration-200 min-h-[54px] flex flex-col justify-between ${
                    isActive
                      ? 'bg-[var(--surface)] border-[var(--primary)] shadow-sm ring-1 ring-[var(--primary)]'
                      : 'bg-[var(--surface)]/50 border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isActive ? 'bg-[var(--primary)] text-white' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                      {s.stepNumber}
                    </span>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />}
                  </div>
                  <span className={`text-xs font-bold mt-1 line-clamp-1 ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Smartphone Infographic Screen Display */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[var(--surface)] p-4 sm:p-6 rounded-[var(--radius-lg)] border border-[var(--border)]">
            
            {/* Left: Interactive Phone Screen Mockup */}
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-[280px] bg-slate-950 text-slate-100 rounded-[32px] p-3 shadow-2xl border-4 border-slate-800 relative overflow-hidden">
                {/* Phone Notch */}
                <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto mb-2 flex items-center justify-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                  <div className="w-8 h-1 rounded-full bg-slate-800" />
                </div>

                {/* Phone Screen Display Content based on activeStep */}
                <div className="bg-slate-900 rounded-[20px] p-3 text-slate-200 min-h-[380px] flex flex-col justify-between relative overflow-hidden text-xs">
                  
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>9:41 AM</span>
                    <span className="text-emerald-400 font-bold">5G • 100%</span>
                  </div>

                  {/* STEP 0: Select Task */}
                  {activeStep === 0 && (
                    <div className="space-y-3 py-2 animate-in fade-in duration-300">
                      <div className="bg-slate-800/80 p-2.5 rounded-xl border border-indigo-500/30">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                            P
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">PlayPay Marketplace</p>
                            <p className="text-[10px] text-indigo-300">Verified App Tasks</p>
                          </div>
                        </div>
                      </div>

                      {/* Mock Task Card */}
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            ₹50.00 REWARD
                          </span>
                          <span className="text-[10px] text-slate-400">5 Slots Left</span>
                        </div>
                        <p className="font-bold text-slate-100 text-xs">Ludo Supreme Play & Review</p>
                        <p className="text-[10px] text-slate-400">Install app from Play Store & rate 5 stars</p>
                        <div className="pt-1">
                          <button type="button" className="w-full py-2 rounded-lg bg-indigo-600 font-bold text-white text-center text-xs shadow">
                            Enroll Now →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 1: Download App */}
                  {activeStep === 1 && (
                    <div className="space-y-3 py-2 animate-in fade-in duration-300">
                      <div className="bg-slate-800/80 p-2 rounded-xl flex items-center gap-2 border border-slate-700">
                        <Play className="w-5 h-5 text-emerald-400 fill-current" />
                        <span className="font-bold text-slate-200">Google Play Store</span>
                      </div>

                      {/* App Listing */}
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base border border-amber-500/30">
                            ★
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">Ludo Supreme</p>
                            <div className="flex items-center text-amber-400 text-[10px]">
                              ★★★★★ 4.8 (120K)
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                          <p className="text-[10px] text-slate-300 font-bold">Write Your 5-Star Review</p>
                          <p className="text-[9px] text-slate-400 italic">“Great gaming app, fast withdrawal!”</p>
                        </div>

                        <button type="button" className="w-full py-2 rounded-lg bg-emerald-600 font-bold text-white text-center text-xs">
                          Installed ✓
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Screenshot Proof */}
                  {activeStep === 2 && (
                    <div className="space-y-3 py-2 animate-in fade-in duration-300">
                      <div className="bg-slate-800/80 p-2 rounded-xl flex items-center justify-between border border-emerald-500/30">
                        <span className="font-bold text-emerald-400 text-xs">Proof Upload</span>
                        <UploadCloud className="w-4 h-4 text-emerald-400" />
                      </div>

                      <div className="bg-slate-800 p-3 rounded-xl border-2 border-dashed border-emerald-500/50 text-center space-y-2">
                        <div className="w-16 h-20 bg-slate-900 rounded-lg mx-auto border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          <span className="text-[8px] text-slate-400 mt-1">screenshot.jpg</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-bold">Review Screenshot Selected</p>
                        <button type="button" className="w-full py-2 rounded-lg bg-emerald-600 font-bold text-white text-xs">
                          Submit Proof
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Instant UPI Cash */}
                  {activeStep === 3 && (
                    <div className="space-y-3 py-2 animate-in fade-in duration-300">
                      {/* Realistic UPI Payment Receipt */}
                      <div className="bg-gradient-to-b from-emerald-600 to-teal-700 p-3 rounded-2xl text-white text-center space-y-1 shadow-lg border border-emerald-400/40">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white font-bold">
                          ✓
                        </div>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-90">Payment Successful</p>
                        <p className="text-xl font-black">₹50.00</p>
                        <p className="text-[10px] bg-black/20 py-0.5 px-2 rounded-full inline-block">
                          Credited to UPI: user@upi
                        </p>
                      </div>

                      <div className="bg-slate-800 p-2 rounded-xl text-[10px] text-slate-300 space-y-1 border border-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transaction ID:</span>
                          <span className="font-mono text-slate-200">PAY20260810X</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className="text-emerald-400 font-bold">APPROVED & PAID</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone Navigation Bar */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-around">
                    <button
                      type="button"
                      disabled={activeStep === 0}
                      onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1 rounded bg-slate-800 text-[10px] font-bold disabled:opacity-30"
                    >
                      ← Prev
                    </button>
                    <span className="text-[10px] font-bold text-slate-400">
                      {activeStep + 1} of 4
                    </span>
                    <button
                      type="button"
                      disabled={activeStep === 3}
                      onClick={() => setActiveStep((prev) => Math.min(3, prev + 1))}
                      className="px-3 py-1 rounded bg-indigo-600 text-[10px] font-bold disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Right: Step Detailed Explanation */}
            <div className="md:col-span-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm" className="font-black">
                    {steps[activeStep].badge}
                  </Badge>
                  <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                    {steps[activeStep].subtitle}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-heading">
                  {steps[activeStep].title}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                {steps[activeStep].description}
              </p>

              <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--success)]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Key Highlight</span>
                </div>
                <p className="text-xs text-[var(--text-primary)] font-semibold">
                  {steps[activeStep].highlight}
                </p>
              </div>

              {/* Step Navigation Dots */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`h-2 rounded-full transition-all ${
                        activeStep === i ? 'w-6 bg-[var(--primary)]' : 'w-2 bg-[var(--border)]'
                      }`}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (activeStep < 3) {
                      setActiveStep((p) => p + 1);
                    } else {
                      const el = document.getElementById('tasks-marketplace');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else window.location.href = '/dashboard#tasks-marketplace';
                    }
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="font-bold text-xs"
                >
                  {activeStep < 3 ? 'Next Step' : 'View Tasks Now'}
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step) => (
            <Card
              key={step.stepNumber}
              variant="elevated"
              className={`p-5 relative border transition-all duration-200 flex flex-col justify-between ${
                activeStep === step.id
                  ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/30 bg-[var(--surface)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/40 bg-[var(--surface)]'
              }`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="space-y-3 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)] shadow-2xs">
                    {step.icon}
                  </div>
                  <span className="text-2xl font-black text-[var(--text-muted)] opacity-40 font-heading">
                    {step.stepNumber}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] font-heading">
                    {step.title}
                  </h3>
                  <p className="text-[11px] font-bold text-[var(--primary)] mt-0.5">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mt-2">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-1.5 text-[11px] font-semibold text-[var(--success)]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{step.highlight}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Features & Security */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--primary)]" />
            Why Mobile Users Trust PlayPay
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)]">
                <div className="p-2 rounded-[var(--radius-md)] bg-[var(--surface)] shrink-0 border border-[var(--border)]">
                  {feat.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">{feat.title}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium leading-normal">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] font-heading">
              Frequently Asked Questions (FAQ)
            </h3>
          </div>

          <Accordion type="single" defaultValue="faq-1" className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} id={faq.id}>
                <AccordionTrigger className="text-xs sm:text-sm font-bold py-3.5 px-4 text-[var(--text-primary)] hover:text-[var(--primary)]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-[var(--text-secondary)] px-4 pb-4 font-medium leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom Call to Action Button */}
        <div className="text-center pt-2 pb-4">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => {
              const el = document.getElementById('tasks-marketplace');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = '/dashboard#tasks-marketplace';
              }
            }}
            className="w-full sm:w-auto font-black text-sm py-3.5 px-8 shadow-md rounded-[var(--radius-pill)] min-h-[48px]"
          >
            Browse Available Tasks Now
          </Button>
        </div>

      </div>
    </section>
  );
}

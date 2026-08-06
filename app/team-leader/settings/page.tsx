'use client';

import React, { useState } from 'react';
import { Settings, ShieldCheck, Copy, Check, Users, Key, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function TeamLeaderSettingsPage() {
  const { userProfile } = useAuth();
  const [copied, setCopied] = useState(false);

  const leaderCode = userProfile?.leaderCode || userProfile?.teamLeaderCode || 'N/A';
  const leaderName = userProfile?.displayName || userProfile?.email || 'Team Leader';
  const email = userProfile?.email || 'N/A';
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?leaderCode=${encodeURIComponent(leaderCode)}`
    : `https://playpay.app/register?leaderCode=${encodeURIComponent(leaderCode)}`;

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-300 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Team Leader Settings</h1>
          <p className="text-xs text-slate-400">View team leader account parameters, permanent leader code, and referral links.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Permanent Leader Code */}
        <Card className="p-6 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{leaderName}</h2>
              <p className="text-xs text-slate-400">{email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Permanent Leader Code
              </label>
              <div className="px-3.5 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <span className="font-mono text-base font-bold text-emerald-400">{leaderCode}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  Permanent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This leader code remains stable for your account and is used to invite team members.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Member Status
              </label>
              <div className="px-3.5 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Team Leader</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Active Role
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Invite & Referral Settings */}
        <Card className="p-6 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Team Referral Link</h2>
              <p className="text-xs text-slate-400">Share with new members to automatically assign them to your team.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Direct Registration Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs font-mono text-slate-300 focus:outline-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                New members entering your Leader Code during registration will instantly link to your team roster and receive your custom configured task rewards.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

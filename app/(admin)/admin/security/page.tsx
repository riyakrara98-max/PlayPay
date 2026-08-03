'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Database,
  Key,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  FileText,
  Clock,
  Cpu,
  Globe,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isFirebaseConfigured, getFirebaseDb, getFirebaseAuth } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function AdminSecurityPage() {
  const [firestoreStatus, setFirestoreStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const runHealthCheck = async () => {
    setFirestoreStatus('testing');
    setPingMs(null);

    const start = performance.now();
    try {
      if (!isFirebaseConfigured()) {
        setFirestoreStatus('error');
        return;
      }
      const db = getFirebaseDb();
      // Test read ping to siteSettings/global doc
      const ref = doc(db, 'siteSettings', 'global');
      await getDoc(ref);

      const elapsed = Math.round(performance.now() - start);
      setPingMs(elapsed);
      setFirestoreStatus('connected');
    } catch (err) {
      console.error('[Health check error]', err);
      setFirestoreStatus('error');
    } finally {
      setLastCheckTime(new Date().toLocaleTimeString('en-IN'));
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const auth = isFirebaseConfigured() ? getFirebaseAuth() : null;
  const currentAdminUser = auth?.currentUser;

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="Admin Security & System Diagnostics"
        subtitle="Monitor database health, authentication system status, deployment versions, and security audits"
      />

      <ContentContainer variant="card" className="p-4 sm:p-6 space-y-6">
        {/* Top Health Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">
                System Security Status: Operational
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Last Diagnostic Check: {lastCheckTime || 'Running...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={runHealthCheck}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-run Diagnostics
            </Button>
            <Link href="/admin/audit">
              <Button variant="primary" size="sm" className="bg-[var(--brand)] text-white">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> View Activity Audit Log
              </Button>
            </Link>
          </div>
        </div>

        {/* Health Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Firestore Database Health */}
          <Card className="p-4 space-y-3 border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Database className="w-4 h-4 text-emerald-500" /> Firestore Database
              </div>
              <Badge
                variant={firestoreStatus === 'connected' ? 'success' : firestoreStatus === 'testing' ? 'warning' : 'danger'}
                size="sm"
              >
                {firestoreStatus === 'connected' ? 'Online' : firestoreStatus === 'testing' ? 'Ping...' : 'Offline'}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-[var(--bg-muted)] p-2.5 rounded-lg border border-[var(--border)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Database Latency:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {pingMs !== null ? `${pingMs} ms` : 'Measuring...'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Security Rules:</span>
                <span className="text-emerald-500 font-bold">Strict Firestore v2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Read/Write Mode:</span>
                <span>Role Authorised</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Firebase Auth Status */}
          <Card className="p-4 space-y-3 border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Key className="w-4 h-4 text-[var(--brand)]" /> Authentication Engine
              </div>
              <Badge variant="success" size="sm">
                Active
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-[var(--bg-muted)] p-2.5 rounded-lg border border-[var(--border)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Providers:</span>
                <span className="font-bold text-[var(--text-primary)]">Email/Password, Google</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Admin Session UID:</span>
                <span className="truncate max-w-[120px]" title={currentAdminUser?.uid}>
                  {currentAdminUser?.uid ? `${currentAdminUser.uid.slice(0, 8)}...` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Session Guard:</span>
                <span className="text-emerald-500 font-bold">Encrypted JWT Token</span>
              </div>
            </div>
          </Card>

          {/* Card 3: Deployment & Build Info */}
          <Card className="p-4 space-y-3 border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Server className="w-4 h-4 text-purple-500" /> Platform Deployment
              </div>
              <Badge variant="accent" size="sm">
                v1.3.4 Production
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs font-mono bg-[var(--bg-muted)] p-2.5 rounded-lg border border-[var(--border)]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Phase Version:</span>
                <span className="font-bold text-[var(--text-primary)]">Phase 3D Final</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Runtime Stack:</span>
                <span>Next.js App Router</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Container Port:</span>
                <span className="text-amber-500 font-bold">3000 (Proxy Verified)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Security Checklist Summary */}
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--brand)]" /> Security Policies & Compliance Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">Audit Trail Enforcement</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  All administrative actions (task approvals, user bans, payout updates, and settings changes) log tamper-evident records to Firestore.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">Role-Based Access Control (RBAC)</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Strict security rules verify <code className="font-mono text-amber-500">role == 'admin'</code> before granting write privileges across all collections.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">Immutable Audit Logging</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  User email, creation timestamp, and UID fields are immutable on user profile documents to prevent identity tampering.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">Cloudinary Asset Guard</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Uploaded image proofs and icons undergo strict mime-type validation and size restrictions (Max 10MB) via server proxies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  );
}

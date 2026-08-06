'use client';

import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  MessageSquare,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Calendar,
  Filter,
  Download,
  Copy,
  Check,
  Printer,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useTeamLeaderReports } from '@/hooks/useTeamLeaderReports';
import {
  formatReportItems,
  generateWhatsAppReport,
  downloadTxtFile,
  printPdfReport,
  printImageSheet,
} from '@/lib/team-reports';

type DateFilter = 'today' | 'yesterday' | 'last_7_days' | 'custom';
type StatusFilter = 'completed' | 'approved' | 'paid' | 'all';

export default function TeamLeaderReportsPage() {
  const { submissions, membersMap, uniqueTasks, loading, error } = useTeamLeaderReports();

  // Filters State
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('completed');

  // Generation / Loading States
  const [activeGenerating, setActiveGenerating] = useState<string | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState('');
  const [copied, setCopied] = useState(false);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    return submissions.filter((s) => {
      // 1. Status Filter
      if (statusFilter === 'completed') {
        const isDone = s.status === 'approved' || s.paymentStatus === 'paid';
        if (!isDone) return false;
      } else if (statusFilter === 'approved') {
        if (s.status !== 'approved') return false;
      } else if (statusFilter === 'paid') {
        if (s.paymentStatus !== 'paid') return false;
      }

      // 2. Task Filter
      if (taskFilter !== 'all') {
        const title = s.taskTitle || s.appName;
        if (title !== taskFilter) return false;
      }

      // 3. Date Filter
      const rawDate = s.submittedAt || s.enrolledAt;
      if (!rawDate) return false;
      const subDate = new Date(rawDate);
      const dateStr = subDate.toISOString().split('T')[0];

      if (dateFilter === 'today') {
        return dateStr === todayStr;
      }
      if (dateFilter === 'yesterday') {
        return dateStr === yesterdayStr;
      }
      if (dateFilter === 'last_7_days') {
        return subDate >= sevenDaysAgo;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && dateStr < customStartDate) return false;
        if (customEndDate && dateStr > customEndDate) return false;
      }

      return true;
    });
  }, [submissions, dateFilter, customStartDate, customEndDate, taskFilter, statusFilter]);

  // Prepared Report Dataset
  const reportItems = useMemo(() => {
    return formatReportItems(filteredSubmissions, membersMap);
  }, [filteredSubmissions, membersMap]);

  // Dynamic Date Label
  const dateLabel = useMemo(() => {
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (dateFilter === 'today') return todayFormatted;
    if (dateFilter === 'yesterday') return `Yesterday (${todayFormatted})`;
    if (dateFilter === 'last_7_days') return `Last 7 Days (Ending ${todayFormatted})`;
    if (dateFilter === 'custom') {
      return `${customStartDate || 'Start'} to ${customEndDate || 'End'}`;
    }
    return todayFormatted;
  }, [dateFilter, customStartDate, customEndDate]);

  const appNameLabel = taskFilter === 'all' ? 'All Team Tasks' : taskFilter;
  const nowFormatted = new Date().toLocaleString();

  // Handlers
  const handleGenerateWhatsApp = () => {
    setActiveGenerating('whatsapp');
    setTimeout(() => {
      const text = generateWhatsAppReport({
        dateLabel,
        appName: appNameLabel,
        items: reportItems,
        generatedTime: nowFormatted,
      });
      setWhatsAppText(text);
      setWhatsAppModalOpen(true);
      setActiveGenerating(null);
    }, 400);
  };

  const handleDownloadTxt = () => {
    setActiveGenerating('txt');
    setTimeout(() => {
      const text = generateWhatsAppReport({
        dateLabel,
        appName: appNameLabel,
        items: reportItems,
        generatedTime: nowFormatted,
      });
      const filename = `Team_Report_${appNameLabel.replace(/\s+/g, '_')}_${dateFilter}.txt`;
      downloadTxtFile(filename, text);
      setActiveGenerating(null);
    }, 400);
  };

  const handlePrintPdf = () => {
    setActiveGenerating('pdf');
    setTimeout(() => {
      printPdfReport({
        dateLabel,
        appName: appNameLabel,
        items: reportItems,
        generatedTime: nowFormatted,
      });
      setActiveGenerating(null);
    }, 400);
  };

  const handlePrintImageSheet = () => {
    setActiveGenerating('imagesheet');
    setTimeout(() => {
      printImageSheet({
        dateLabel,
        appName: appNameLabel,
        items: reportItems,
        generatedTime: nowFormatted,
      });
      setActiveGenerating(null);
    }, 400);
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
          <FileBarChart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
          <p className="text-xs text-slate-400">Generate professional reports for your team&apos;s completed work.</p>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <span>Report Scope & Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Task Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Target Task</label>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Tasks</option>
              {uniqueTasks.map((task) => (
                <option key={task} value={task}>
                  {task}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="completed">Completed (Approved or Paid)</option>
              <option value="approved">Approved Only</option>
              <option value="paid">Paid Only</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Custom Date Picker Inputs */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Start Date</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">End Date</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Matches Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span>Matching Submissions:</span>
          <span className="font-bold text-purple-400">{filteredSubmissions.length} records</span>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading ? (
        <Card className="p-8 text-center bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading team submissions data...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 text-center bg-red-500/5 border-red-500/20 text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h3 className="font-bold text-sm">Error Loading Submissions</h3>
          <p className="text-xs text-slate-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </Card>
      ) : (
        /* Report Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: WhatsApp Report */}
          <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">WhatsApp Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clean, formatted list ready for instant sharing or copying on WhatsApp.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleGenerateWhatsApp}
              disabled={activeGenerating === 'whatsapp' || filteredSubmissions.length === 0}
              leftIcon={
                activeGenerating === 'whatsapp' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )
              }
            >
              {activeGenerating === 'whatsapp' ? 'Generating...' : 'View / Copy Report'}
            </Button>
          </Card>

          {/* Card 2: TXT Report */}
          <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between space-y-4 hover:border-blue-500/30 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">TXT Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard plain text UTF-8 file download for simple record archiving.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
              onClick={handleDownloadTxt}
              disabled={activeGenerating === 'txt' || filteredSubmissions.length === 0}
              leftIcon={
                activeGenerating === 'txt' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )
              }
            >
              {activeGenerating === 'txt' ? 'Preparing...' : 'Download TXT'}
            </Button>
          </Card>

          {/* Card 3: PDF Report */}
          <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between space-y-4 hover:border-purple-500/30 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">PDF Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Printable PDF summary containing title, metadata, member list, and page numbering.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
              onClick={handlePrintPdf}
              disabled={activeGenerating === 'pdf' || filteredSubmissions.length === 0}
              leftIcon={
                activeGenerating === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )
              }
            >
              {activeGenerating === 'pdf' ? 'Generating...' : 'Print / Export PDF'}
            </Button>
          </Card>

          {/* Card 4: Image Sheet */}
          <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Image Sheet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual contact grid sheet featuring member proof screenshot thumbnails and timestamps.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              onClick={handlePrintImageSheet}
              disabled={activeGenerating === 'imagesheet' || filteredSubmissions.length === 0}
              leftIcon={
                activeGenerating === 'imagesheet' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )
              }
            >
              {activeGenerating === 'imagesheet' ? 'Preparing...' : 'Generate Image Sheet'}
            </Button>
          </Card>
        </div>
      )}

      {/* WhatsApp Modal Viewer */}
      <Modal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        size="md"
        title="WhatsApp Report Preview"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setWhatsAppModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyWhatsAppText}
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Copy the text block below and paste directly into WhatsApp chat or group.
          </p>
          <pre className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono whitespace-pre-wrap max-h-[50vh] overflow-auto select-all">
            {whatsAppText}
          </pre>
        </div>
      </Modal>
    </div>
  );
}

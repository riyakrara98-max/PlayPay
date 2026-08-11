'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Save,
  Lock,
  MessageSquare,
  FileText,
  DollarSign,
  Smartphone,
  Link as LinkIcon,
  Calendar,
  AlertCircle,
  HelpCircle,
  Loader2,
  List,
  Sparkles,
  Check,
  Users,
  UserCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Settings,
  ShieldCheck,
  PenTool,
  CheckCircle2,
  Info,
  ArrowRight,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  X,
  Plus,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseDb } from '@/firebase/config';
import { parseAndCleanComments } from '@/lib/cleanComment';
import {
  TaskDocument,
  TaskCategory,
  TaskStatus,
  CommentMode,
  TaskAssignmentType,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CloudinaryIconUpload } from '@/components/admin/CloudinaryIconUpload';
import { LiveTaskPreview, TaskFormData } from '@/components/admin/LiveTaskPreview';

interface TaskFormProps {
  initialTask?: TaskDocument | null;
  isEditMode?: boolean;
}

export function TaskForm({ initialTask = null, isEditMode = false }: TaskFormProps) {
  const router = useRouter();
  const { currentUser } = useAuth();

  const enrolledCount = initialTask?.enrolledCount ?? initialTask?.currentSubmissions ?? 0;
  const isLockedByEnrollments = isEditMode && enrolledCount > 0;

  // Collapsible Sections State (Multi-section accordion style)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    app: true,
    config: true,
    rewards: true,
    assignment: false,
    instructions: false,
    comments: false,
    previewMobile: false
  });

  // Form Field States
  const [title, setTitle] = useState(initialTask?.title || '');
  const [appName, setAppName] = useState(initialTask?.appName || '');
  const [playStoreUrl, setPlayStoreUrl] = useState(initialTask?.playStoreUrl || initialTask?.appUrl || '');
  const [rewardAmount, setRewardAmount] = useState<number>(initialTask?.rewardAmount || 10);
  const [category, setCategory] = useState<TaskCategory>(initialTask?.category || 'app_download');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [instructions, setInstructions] = useState(
    initialTask?.instructions ||
      '1. Download the app from the official Google Play Store.\n2. Open the app.\n3. Search and post your assigned review/comment.\n4. Take a clear screenshot of your published comment and upload proof.'
  );
  const [appIcon, setAppIcon] = useState(initialTask?.appIcon || '');

  const [commentMode, setCommentMode] = useState<CommentMode>(initialTask?.commentMode || 'fixed');
  const [rawCommentsText, setRawCommentsText] = useState<string>(
    initialTask?.comments ? initialTask.comments.join('\n') : ''
  );
  const [hintText, setHintText] = useState<string>(initialTask?.hint || '');
  const [manualSlots, setManualSlots] = useState<number>(
    initialTask?.totalSlots || initialTask?.maxSubmissions || 10
  );

  const [expiresAt, setExpiresAt] = useState<string>(() => {
    if (initialTask?.expiresAt) {
      try {
        return new Date(initialTask.expiresAt).toISOString().slice(0, 16);
      } catch {
        return '';
      }
    }
    return '';
  });

  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'active');

  const [reenrollmentOption, setReenrollmentOption] = useState<string>(() => {
    if (initialTask?.reenrollmentPolicy === 'none') return 'none';
    const days = initialTask?.cooldownDays;
    if (days === 0) return 'none';
    if (days === 7) return '7';
    if (days === 10 || days === undefined) return '10';
    if (days === 15) return '15';
    if (days === 30) return '30';
    if (days === 45) return '45';
    if (days === 60) return '60';
    if (days === 90) return '90';
    if (typeof days === 'number' && days > 0) return 'custom';
    return '10';
  });

  const [customCooldownDays, setCustomCooldownDays] = useState<number>(() => {
    const days = initialTask?.cooldownDays;
    if (typeof days === 'number' && days > 0) return days;
    return 10;
  });

  const [assignmentType, setAssignmentType] = useState<TaskAssignmentType>(
    initialTask?.assignmentType || 'all'
  );
  const [assignedLeaderIds, setAssignedLeaderIds] = useState<string[]>(
    initialTask?.assignedLeaderIds || []
  );

  const [teamLeaders, setTeamLeaders] = useState<any[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState<boolean>(false);
  const [leaderSearchQuery, setLeaderSearchQuery] = useState<string>('');

  // Local Validation States (Presentation Layer Only)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFetchingPlayStore, setIsFetchingPlayStore] = useState(false);
  const [playStoreFetchError, setPlayStoreFetchError] = useState<string | null>(null);
  const [fetchedPackageName, setFetchedPackageName] = useState<string | null>(null);

  // Fetch Team Leaders on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchTeamLeaders = async () => {
      setIsLoadingLeaders(true);
      try {
        const db = getFirebaseDb();
        const q = query(
          collection(db, FIRESTORE_COLLECTIONS.USERS),
          where('memberType', '==', 'team_leader')
        );
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          list.push({
            uid: d.uid || docSnap.id,
            displayName: d.displayName || 'Unnamed Leader',
            email: d.email || '',
            photoURL: d.photoURL || '',
            leaderCode: d.teamLeaderCode || d.leaderCode || '',
          });
        });
        if (isMounted) setTeamLeaders(list);
      } catch (err) {
        console.error('[Fetch Leaders Error]', err);
      } finally {
        if (isMounted) setIsLoadingLeaders(false);
      }
    };
    fetchTeamLeaders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered leaders search
  const filteredLeaders = useMemo(() => {
    if (!leaderSearchQuery.trim()) return teamLeaders;
    const q = leaderSearchQuery.toLowerCase();
    return teamLeaders.filter(
      (l) =>
        l.displayName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.leaderCode || '').toLowerCase().includes(q)
    );
  }, [teamLeaders, leaderSearchQuery]);

  // Play Store automatic metadata fetching
  const fetchPlayStoreMetadata = async (urlInput?: string) => {
    const targetUrl = (urlInput !== undefined ? urlInput : playStoreUrl).trim();
    if (!targetUrl) return;
    setPlayStoreFetchError(null);
    setIsFetchingPlayStore(true);
    try {
      const res = await fetch('/api/playstore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch');
      if (data.appName) {
        setAppName(data.appName);
        if (!title.trim()) setTitle(`Rate & Review ${data.appName} on Play Store`);
      }
      if (data.appIcon) setAppIcon(data.appIcon);
      if (!targetUrl.startsWith('http')) {
        setPlayStoreUrl(`https://play.google.com/store/apps/details?id=${data.packageName}`);
      }
      setFetchedPackageName(data.packageName);
      
      // Clear errors
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated.playStoreUrl;
        delete updated.appName;
        return updated;
      });
    } catch (err: any) {
      setPlayStoreFetchError(err.message || 'Unable to fetch Play Store info.');
    } finally {
      setIsFetchingPlayStore(false);
    }
  };

  // Fixed Comments database analysis (automatically ignores serial numbers like 1., 2., 3., bullet points, etc.)
  const commentAnalysis = useMemo(() => {
    if (commentMode !== 'fixed') return { validComments: [], hasDuplicates: false, duplicates: [] };
    return parseAndCleanComments(rawCommentsText);
  }, [rawCommentsText, commentMode]);

  const effectiveTotalSlots = commentMode === 'fixed' ? commentAnalysis.validComments.length : manualSlots;

  // Live Preview Data assembly
  const previewData: TaskFormData = {
    title,
    appName,
    playStoreUrl,
    rewardAmount: Number(rewardAmount) || 0,
    category,
    description,
    instructions,
    appIcon,
    commentMode,
    commentsText: rawCommentsText,
    parsedComments: commentAnalysis.validComments,
    hintText,
    manualSlots: Number(manualSlots) || 1,
    expiresAt,
    status,
  };

  // Section Expansion Helper
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const expandAll = () => {
    setExpandedSections({
      app: true,
      config: true,
      rewards: true,
      assignment: true,
      instructions: true,
      comments: true,
      previewMobile: true
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      app: false,
      config: false,
      rewards: false,
      assignment: false,
      instructions: false,
      comments: false,
      previewMobile: false
    });
  };

  // Android Keyboard Friendly Scroll-Into-View Focus Event
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Client-Side Validation Logic (Presentation layer validation UX)
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setFormError(null);

    if (!playStoreUrl.trim()) {
      errors.playStoreUrl = 'Play Store URL is required';
    }
    if (!appName.trim()) {
      errors.appName = 'Partner App Name is required';
    }
    if (!title.trim()) {
      errors.title = 'Task Title is required';
    }
    if (!rewardAmount || rewardAmount <= 0) {
      errors.rewardAmount = 'Base reward must be greater than 0';
    }

    if (commentMode === 'fixed' && commentAnalysis.validComments.length === 0) {
      errors.comments = 'Fixed Comments mode requires at least 1 valid comment.';
    }

    if (commentMode === 'hint') {
      if (!hintText.trim()) {
        errors.hintText = 'Hint / Guidance Text is required.';
      }
      if (!manualSlots || manualSlots <= 0) {
        errors.manualSlots = 'Manual Slots count must be greater than 0.';
      }
    }

    if (assignmentType === 'leaders' && assignedLeaderIds.length === 0) {
      errors.assignment = 'Exclusive Team assignment requires selecting at least 1 Team Leader.';
    }

    setValidationErrors(errors);

    // If any error exists, automatically expand relevant sections & focus
    if (Object.keys(errors).length > 0) {
      const updatedExpanded = { ...expandedSections };
      if (errors.playStoreUrl || errors.appName) {
        updatedExpanded.app = true;
      }
      if (errors.title) {
        updatedExpanded.config = true;
      }
      if (errors.rewardAmount) {
        updatedExpanded.rewards = true;
      }
      if (errors.comments || errors.hintText || errors.manualSlots) {
        updatedExpanded.comments = true;
      }
      if (errors.assignment) {
        updatedExpanded.assignment = true;
      }
      setExpandedSections(updatedExpanded);
      setFormError('Please resolve all validation errors in the highlighted sections.');
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const db = getFirebaseDb();
      const userUid = currentUser?.uid || 'admin_system';
      const formattedExpiry = expiresAt ? new Date(expiresAt).toISOString() : undefined;
      const baseRewardValue = Number(rewardAmount);

      let targetTaskId = '';
      const calculatedPolicy = reenrollmentOption === 'none' ? 'none' : 'cooldown';
      const calculatedCooldownDays =
        reenrollmentOption === 'none'
          ? 0
          : reenrollmentOption === 'custom'
          ? Math.max(1, Number(customCooldownDays) || 10)
          : Number(reenrollmentOption);

      if (isEditMode && initialTask?.id) {
        targetTaskId = initialTask.id;
        const updatePayload: any = {
          title: title.trim(),
          rewardAmount: baseRewardValue,
          baseReward: baseRewardValue,
          assignmentType,
          assignedLeaderIds: assignmentType === 'leaders' ? assignedLeaderIds : [],
          category,
          description: description.trim(),
          instructions: instructions.trim(),
          status,
          reenrollmentPolicy: calculatedPolicy,
          cooldownDays: calculatedCooldownDays,
          updatedAt: serverTimestamp(),
          updatedBy: userUid,
        };
        if (appIcon) updatePayload.appIcon = appIcon;
        if (formattedExpiry) updatePayload.expiresAt = formattedExpiry;
        if (!isLockedByEnrollments) {
          updatePayload.appName = appName.trim();
          updatePayload.playStoreUrl = playStoreUrl.trim();
          updatePayload.commentMode = commentMode;
          updatePayload.totalSlots = effectiveTotalSlots;
          updatePayload.maxSubmissions = effectiveTotalSlots;
          if (commentMode === 'fixed') {
            updatePayload.comments = commentAnalysis.validComments;
            updatePayload.hint = '';
          } else {
            updatePayload.comments = [];
            updatePayload.hint = hintText.trim();
          }
        }
        await updateDoc(doc(db, FIRESTORE_COLLECTIONS.TASKS, targetTaskId), updatePayload);
      } else {
        const newDocRef = doc(collection(db, FIRESTORE_COLLECTIONS.TASKS));
        targetTaskId = newDocRef.id;
        await setDoc(newDocRef, {
          id: newDocRef.id,
          title: title.trim(),
          appName: appName.trim(),
          playStoreUrl: playStoreUrl.trim(),
          rewardAmount: baseRewardValue,
          baseReward: baseRewardValue,
          assignmentType,
          assignedLeaderIds: assignmentType === 'leaders' ? assignedLeaderIds : [],
          category,
          description: description.trim(),
          instructions: instructions.trim(),
          appIcon: appIcon || '',
          commentMode,
          comments: commentMode === 'fixed' ? commentAnalysis.validComments : [],
          hint: commentMode === 'hint' ? hintText.trim() : '',
          totalSlots: effectiveTotalSlots,
          maxSubmissions: effectiveTotalSlots,
          enrolledCount: 0,
          currentSubmissions: 0,
          status,
          reenrollmentPolicy: calculatedPolicy,
          cooldownDays: calculatedCooldownDays,
          isVerified: true,
          expiresAt: formattedExpiry,
          createdBy: userUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Sync Leader Task Assignments in leaderTaskAssignments collection
      try {
        let targetLeaderUids: string[] = [];
        if (assignmentType === 'leaders') {
          targetLeaderUids = assignedLeaderIds;
        } else if (assignmentType === 'all') {
          targetLeaderUids = teamLeaders.map((l) => l.uid);
          if (targetLeaderUids.length === 0) {
            const leadersSnap = await getDocs(
              query(
                collection(db, FIRESTORE_COLLECTIONS.USERS),
                where('memberType', '==', 'team_leader')
              )
            );
            leadersSnap.forEach((d) => targetLeaderUids.push(d.id));
          }
        }

        if (targetLeaderUids.length > 0) {
          const nowIso = new Date().toISOString();
          const batch = writeBatch(db);

          for (const leaderUid of targetLeaderUids) {
            const assignmentRef = doc(
              db,
              FIRESTORE_COLLECTIONS.LEADER_TASK_ASSIGNMENTS,
              `${targetTaskId}_${leaderUid}`
            );
            batch.set(
              assignmentRef,
              {
                id: `${targetTaskId}_${leaderUid}`,
                taskId: targetTaskId,
                leaderId: leaderUid,
                assignmentStatus: 'active',
                status: 'active',
                assignedBy: userUid,
                assignedAt: nowIso,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }

          if (isEditMode && initialTask?.assignedLeaderIds) {
            const removedLeaderIds = initialTask.assignedLeaderIds.filter(
              (id) => !targetLeaderUids.includes(id)
            );
            for (const removedId of removedLeaderIds) {
              const removedRef = doc(
                db,
                FIRESTORE_COLLECTIONS.LEADER_TASK_ASSIGNMENTS,
                `${targetTaskId}_${removedId}`
              );
              batch.set(
                removedRef,
                {
                  assignmentStatus: 'removed',
                  status: 'inactive',
                  removedAt: nowIso,
                  removedBy: userUid,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          }

          await batch.commit();
        }
      } catch (assignErr) {
        console.error('[TaskForm Leader Assignment Sync Error]', assignErr);
      }

      router.push('/admin/tasks');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save task.');
      setIsSubmitting(false);
    }
  };

  // Helper values for assignment counts
  const selectedLeadersCount = assignedLeaderIds.length;
  const assignmentSummaryText =
    assignmentType === 'all'
      ? 'Global Assignment (Available to all registered team members immediately)'
      : `Exclusive Assignment (Visible only to sub-teams under the ${selectedLeadersCount} whitelisted Team Leaders)`;

  return (
    <div className="pb-32 space-y-6">
      {/* Structural Lock Alert */}
      {isLockedByEnrollments && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-sm text-amber-800 shadow-xs">
          <Lock className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <span className="font-bold text-amber-950">Structural Parameters Frozen</span>
            <p className="text-xs leading-relaxed text-amber-700/90">
              There are <strong>{enrolledCount} active user enrollments</strong> on this task. To prevent structural mismatch or data loss for working members, the Play Store URL, Partner Name, Comment Strategy, and Slots cannot be modified.
            </p>
          </div>
        </div>
      )}

      {/* Global Form Validation Error Summary */}
      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-sm text-rose-800 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-rose-600" />
          <div className="space-y-1">
            <span className="font-bold text-rose-950">Review Form Requirements</span>
            <p className="text-xs text-rose-700/90">{formError}</p>
          </div>
        </div>
      )}

      {/* Controller Buttons to Expand/Collapse All */}
      <div className="flex items-center justify-between gap-3 bg-white/50 border border-slate-100 rounded-xl p-3 shadow-xs">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Form Workspace Organizer
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="text-xs font-semibold px-3 py-1.5 h-8 border-slate-200"
          >
            Collapse All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="text-xs font-semibold px-3 py-1.5 h-8 border-slate-200"
          >
            Expand All
          </Button>
        </div>
      </div>

      {/* Primary Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor Accordions */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Section 1: Application Information */}
          <div className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
            expandedSections.app ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div
              onClick={() => toggleSection('app')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none border-b border-transparent bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.app ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Application Information</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Define Play Store parameters, package, and logo</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.app ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.app && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 sm:p-6 border-t border-slate-50 space-y-5">
                    {/* Play Store URL */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Google Play Store URL <span className="text-rose-500">*</span>
                        </label>
                        {!isLockedByEnrollments && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchPlayStoreMetadata()}
                            disabled={isFetchingPlayStore || !playStoreUrl.trim()}
                            className="h-7 text-xs text-slate-800 hover:bg-slate-50 font-bold px-2 rounded-lg"
                          >
                            {isFetchingPlayStore ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                            )}
                            Fetch Metadata
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                        value={playStoreUrl}
                        onChange={(e) => {
                          setPlayStoreUrl(e.target.value);
                          if (validationErrors.playStoreUrl) {
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated.playStoreUrl;
                              return updated;
                            });
                          }
                        }}
                        disabled={isLockedByEnrollments}
                        onFocus={handleFocus}
                        leftIcon={isLockedByEnrollments ? <Lock className="w-4 h-4 text-amber-500" /> : <LinkIcon className="w-4 h-4 text-slate-400" />}
                        className={`h-11 rounded-xl text-sm ${
                          validationErrors.playStoreUrl ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                      {validationErrors.playStoreUrl && (
                        <p className="text-xs text-rose-500 font-semibold">{validationErrors.playStoreUrl}</p>
                      )}
                      {playStoreFetchError && (
                        <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {playStoreFetchError}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Paste the full URL from the play store, then click &quot;Fetch Metadata&quot; to automatically pre-populate the App Name and App Icon.
                      </p>
                    </div>

                    {/* Partner App Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Partner App Name <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Dream11, PhonePe, My11Circle"
                        value={appName}
                        onChange={(e) => {
                          setAppName(e.target.value);
                          if (validationErrors.appName) {
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated.appName;
                              return updated;
                            });
                          }
                        }}
                        disabled={isLockedByEnrollments}
                        onFocus={handleFocus}
                        leftIcon={isLockedByEnrollments ? <Lock className="w-4 h-4 text-amber-500" /> : <Smartphone className="w-4 h-4 text-slate-400" />}
                        className={`h-11 rounded-xl text-sm ${
                          validationErrors.appName ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                      {validationErrors.appName && (
                        <p className="text-xs text-rose-500 font-semibold">{validationErrors.appName}</p>
                      )}
                    </div>

                    {/* App Icon Upload */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        App Logo / Icon
                      </label>
                      <CloudinaryIconUpload
                        value={appIcon}
                        onChange={(url) => setAppIcon(url)}
                        disabled={isLockedByEnrollments}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: Task Configuration */}
          <div className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
            expandedSections.config ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div
              onClick={() => toggleSection('config')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.config ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Task Configuration</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Control campaign title, status, category, & policies</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.config ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.config && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 sm:p-6 border-t border-slate-50 space-y-5">
                    {/* Task Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Task Campaign Title <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. Install, Rate 5-Star & Post Positive Review"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (validationErrors.title) {
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated.title;
                              return updated;
                            });
                          }
                        }}
                        onFocus={handleFocus}
                        leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                        className={`h-11 rounded-xl text-sm ${
                          validationErrors.title ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                      {validationErrors.title && (
                        <p className="text-xs text-rose-500 font-semibold">{validationErrors.title}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Category Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Task Category / Type
                        </label>
                        <Select
                          value={category}
                          onChange={(val) => setCategory(val as TaskCategory)}
                          options={[
                            { value: 'app_download', label: 'App Download & Review' },
                            { value: 'survey', label: 'Survey / Questionnaire' },
                            { value: 'video_watch', label: 'Video Watch & Share' },
                            { value: 'social_follow', label: 'Social Media Action' },
                            { value: 'referral', label: 'Referral Sign Up' },
                            { value: 'other', label: 'Other Offer' },
                          ]}
                          className="h-11 rounded-xl text-sm border-slate-200"
                        />
                      </div>

                      {/* Status Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Campaign Visibility Status
                        </label>
                        <Select
                          value={status}
                          onChange={(val) => setStatus(val as TaskStatus)}
                          options={[
                            { value: 'active', label: 'Active (Live & Ready to Enroll)' },
                            { value: 'paused', label: 'Paused (Temporarily Suspended)' },
                            { value: 'draft', label: 'Draft (In Review/Operations Only)' },
                          ]}
                          className="h-11 rounded-xl text-sm border-slate-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Campaign Expiration */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Campaign Expiration Date (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            onFocus={handleFocus}
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                          />
                          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Re-enrollment Cooldown Policy */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Re-enrollment Cooldown Period
                        </label>
                        <Select
                          value={reenrollmentOption}
                          onChange={(val) => setReenrollmentOption(val)}
                          options={[
                            { value: 'none', label: 'No Restriction (Infinite repeats)' },
                            { value: '7', label: '7 Days Cooldown' },
                            { value: '10', label: '10 Days Cooldown (Recommended)' },
                            { value: '15', label: '15 Days Cooldown' },
                            { value: '30', label: '30 Days Cooldown' },
                            { value: '45', label: '45 Days Cooldown' },
                            { value: '60', label: '60 Days Cooldown' },
                            { value: '90', label: '90 Days Cooldown' },
                            { value: 'custom', label: 'Custom Days Cooldown' },
                          ]}
                          className="h-11 rounded-xl text-sm border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Custom Cooldown Days Field */}
                    {reenrollmentOption === 'custom' && (
                      <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Custom Cooldown Days
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={customCooldownDays}
                          onChange={(e) => setCustomCooldownDays(Number(e.target.value))}
                          onFocus={handleFocus}
                          className="h-10 border-slate-200 text-sm rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 3: Rewards */}
          <div className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
            expandedSections.rewards ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div
              onClick={() => toggleSection('rewards')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.rewards ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Campaign Rewards</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Determine payout structure and agent commission splits</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.rewards ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.rewards && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 sm:p-6 border-t border-slate-50 space-y-6">
                    {/* Base Reward */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Base Member Payout (₹) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={rewardAmount}
                        onChange={(e) => {
                          setRewardAmount(Number(e.target.value));
                          if (validationErrors.rewardAmount) {
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated.rewardAmount;
                              return updated;
                            });
                          }
                        }}
                        onFocus={handleFocus}
                        leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                        className={`h-11 rounded-xl text-base font-black font-mono ${
                          validationErrors.rewardAmount ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                        }`}
                      />
                      {validationErrors.rewardAmount && (
                        <p className="text-xs text-rose-500 font-semibold">{validationErrors.rewardAmount}</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        The exact amount credited directly to the member wallet when their uploaded screenshot is approved.
                      </p>
                    </div>

                    {/* DynamicPricings / Commission Separation Grid */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Network Commission Grid Preview
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Completed Member</span>
                            <span className="text-lg font-black text-slate-800 font-mono">₹{rewardAmount || 0}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-2 block leading-relaxed">
                            Complete base reward value paid to the active sub-member.
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100/60 flex flex-col justify-between">
                          <div className="space-y-0.5 flex items-start justify-between gap-1">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-500 uppercase block tracking-wider">Team Leader</span>
                              <span className="text-lg font-black text-indigo-700 font-mono">Confidential</span>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 border-none shrink-0">
                              Confidential
                            </Badge>
                          </div>
                          <span className="text-[10px] text-indigo-600/80 mt-2 block leading-relaxed">
                            Commission overrides resolved automatically upon leader assignment.
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Sub-Team Share</span>
                            <span className="text-lg font-bold text-slate-600 font-mono">Calculated</span>
                          </div>
                          <span className="text-[10px] text-slate-500 mt-2 block leading-relaxed">
                            Proportional splits applied in accordance to specific sub-network settings.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Integrity Callout */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
                      <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800">Operational Integrity Statement</span>
                        <p className="leading-relaxed">
                          To protect agency margins and maintain operational network structures, all leader commissions and administrative overrides are held securely on the server-side. They are never exposed to or downloadable by any general platform users.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 4: Assignment */}
          <div className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
            expandedSections.assignment ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div
              onClick={() => toggleSection('assignment')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.assignment ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Team Assignment</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure campaign access: Global or whitelisted Team Leaders</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.assignment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.assignment && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 sm:p-6 border-t border-slate-50 space-y-6">
                    {/* Segmented Dual Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignmentType('all');
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated.assignment;
                            return updated;
                          });
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          assignmentType === 'all'
                            ? 'border-slate-950 bg-slate-950/5 ring-1 ring-slate-950'
                            : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Users className={`w-5 h-5 ${assignmentType === 'all' ? 'text-slate-900' : 'text-slate-400'}`} />
                          {assignmentType === 'all' && (
                            <Badge className="bg-slate-900 text-white rounded-md text-[9px] px-1.5 py-0 uppercase">
                              Active
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 block mt-2.5 text-sm">Global Assignment</span>
                        <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">
                          Accessible immediately by all active sub-teams and user networks. Recommend for standard tasks.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAssignmentType('leaders')}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          assignmentType === 'leaders'
                            ? 'border-slate-950 bg-slate-950/5 ring-1 ring-slate-950'
                            : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <UserCheck className={`w-5 h-5 ${assignmentType === 'leaders' ? 'text-slate-900' : 'text-slate-400'}`} />
                          {assignmentType === 'leaders' && (
                            <Badge className="bg-emerald-600 text-white rounded-md text-[9px] px-1.5 py-0 uppercase border-none">
                              Active
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 block mt-2.5 text-sm">Selected Team Leaders</span>
                        <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">
                          Restrict access strictly to whitelisted leaders. Ideal for higher reward payout runs.
                        </span>
                      </button>
                    </div>

                    {/* Whitelisted Leaders selection panels */}
                    {assignmentType === 'leaders' && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            Configure Team Leader Whitelist
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssignedLeaderIds([])}
                              disabled={assignedLeaderIds.length === 0}
                              className="text-xs font-semibold px-2 py-1 h-7 text-slate-500 hover:text-rose-600"
                            >
                              Clear All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const allIds = teamLeaders.map(l => l.uid);
                                setAssignedLeaderIds(allIds);
                              }}
                              className="text-xs font-semibold px-2 py-1 h-7 text-slate-800"
                            >
                              Select All
                            </Button>
                          </div>
                        </div>

                        {/* Search & Counter Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search whitelisted leaders by name, code..."
                              value={leaderSearchQuery}
                              onChange={(e) => setLeaderSearchQuery(e.target.value)}
                              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                              className="h-10 rounded-xl text-sm border-slate-200 bg-slate-50 focus:bg-white transition-all pl-10"
                            />
                            {leaderSearchQuery && (
                              <button
                                onClick={() => setLeaderSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-50 px-2.5 py-1.5 border-slate-200 h-10 flex items-center justify-center text-slate-700 rounded-xl shrink-0">
                            {selectedLeadersCount} / {teamLeaders.length} Selected
                          </Badge>
                        </div>

                        {validationErrors.assignment && (
                          <p className="text-xs text-rose-500 font-semibold">{validationErrors.assignment}</p>
                        )}

                        {/* Leaders Scroll Area */}
                        <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                          <div className="max-h-60 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                            {isLoadingLeaders ? (
                              <div className="py-8 flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                                <span className="text-xs text-slate-400 font-semibold">Fetching Leader Database...</span>
                              </div>
                            ) : filteredLeaders.length === 0 ? (
                              <div className="py-8 text-center">
                                <span className="text-xs text-slate-400 font-bold block">No Leaders Found</span>
                                <span className="text-[11px] text-slate-400 mt-1 block">Try clearing or adjusting your search filter</span>
                              </div>
                            ) : (
                              filteredLeaders.map((leader) => {
                                const isSelected = assignedLeaderIds.includes(leader.uid);
                                return (
                                  <div
                                    key={leader.uid}
                                    onClick={() => {
                                      setAssignedLeaderIds((prev) =>
                                        isSelected
                                          ? prev.filter((id) => id !== leader.uid)
                                          : [...prev, leader.uid]
                                      );
                                      if (validationErrors.assignment) {
                                        setValidationErrors(prev => {
                                          const updated = { ...prev };
                                          delete updated.assignment;
                                          return updated;
                                        });
                                      }
                                    }}
                                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all select-none ${
                                      isSelected
                                        ? 'border-slate-900 bg-white shadow-xs font-semibold'
                                        : 'border-slate-100 bg-white/75 hover:bg-white hover:border-slate-200 text-slate-600'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0 ${
                                        isSelected
                                          ? 'bg-slate-900 border-slate-950 text-white'
                                          : 'bg-slate-50 border-slate-200 text-slate-600'
                                      }`}>
                                        {leader.displayName.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate block">
                                          {leader.displayName}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate block">
                                          {leader.email} {leader.leaderCode && `• Code: ${leader.leaderCode}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                      isSelected
                                        ? 'bg-slate-900 border-slate-950 text-white'
                                        : 'bg-slate-200/50 border-slate-200'
                                    }`}>
                                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assignment Live Summary */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Award className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block">Assignment Workspace Summary</span>
                          <span className="text-slate-600 mt-1 block leading-relaxed">
                            {assignmentSummaryText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 5: Task Instructions */}
          <div className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
            expandedSections.instructions ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div
              onClick={() => toggleSection('instructions')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.instructions ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Task Instructions</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Edit short summary hook and detailed step-by-step guidelines</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.instructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.instructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 sm:p-6 border-t border-slate-50 space-y-5">
                    {/* Short Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Short Campaign Summary Hook
                      </label>
                      <Textarea
                        placeholder="Provide a quick, catchy 1-2 sentence hook explaining why members should complete this app task..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onFocus={handleFocus}
                        rows={3}
                        className="text-sm leading-relaxed rounded-xl border-slate-200"
                      />
                    </div>

                    {/* Step by Step Instructions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Step-By-Step Task Instructions
                        </label>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          One item per line (1. 2. 3.)
                        </span>
                      </div>
                      <Textarea
                        placeholder="1. Click download to fetch the app on Play Store.&#10;2. Open and register on the app.&#10;3. Search for the assigned comment and publish it.&#10;4. Upload screenshot of your comment as proof."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        onFocus={handleFocus}
                        rows={10}
                        className="text-sm leading-relaxed font-mono rounded-xl border-slate-200 p-4"
                      />
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Each numbered bullet is parsed on the mobile app and rendered as individual interactive checkable steps. Ensure guidelines are clear.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 6: Comments & Capacity */}
          <div className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
            expandedSections.comments ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
          }`}>
            <div
              onClick={() => toggleSection('comments')}
              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.comments ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Comments & Payout Slots</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Toggle comment mode strategy and configure total campaign capacity</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.comments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.comments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 sm:p-6 border-t border-slate-50 space-y-6">
                    {/* Dual Segment Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        disabled={isLockedByEnrollments}
                        onClick={() => {
                          setCommentMode('fixed');
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated.comments;
                            delete updated.hintText;
                            delete updated.manualSlots;
                            return updated;
                          });
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          commentMode === 'fixed'
                            ? 'border-slate-950 bg-slate-950/5 ring-1 ring-slate-950'
                            : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                        } ${isLockedByEnrollments ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <MessageSquare className={`w-5 h-5 ${commentMode === 'fixed' ? 'text-slate-900' : 'text-slate-400'}`} />
                          {isLockedByEnrollments && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <span className="font-bold text-slate-900 block mt-2.5 text-sm">Fixed Comments Database</span>
                        <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">
                          Provide exact comment lines. The system assigns unique lines to users. Slot capacity resolves exactly to unique comments entered.
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isLockedByEnrollments}
                        onClick={() => {
                          setCommentMode('hint');
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated.comments;
                            delete updated.hintText;
                            delete updated.manualSlots;
                            return updated;
                          });
                        }}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          commentMode === 'hint'
                            ? 'border-slate-950 bg-slate-950/5 ring-1 ring-slate-950'
                            : 'border-slate-150 bg-slate-50/50 hover:bg-slate-50'
                        } ${isLockedByEnrollments ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <PenTool className={`w-5 h-5 ${commentMode === 'hint' ? 'text-slate-900' : 'text-slate-400'}`} />
                          {isLockedByEnrollments && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <span className="font-bold text-slate-900 block mt-2.5 text-sm">Freeform Hint Engine</span>
                        <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">
                          Write guidance/rules and let users craft their own reviews. You manually define maximum payout slots for this task.
                        </span>
                      </button>
                    </div>

                    {/* Fixed Database Input strategy */}
                    {commentMode === 'fixed' ? (
                      <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Fixed Comment Database <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {rawCommentsText.trim().length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRawCommentsText(commentAnalysis.validComments.join('\n'))}
                                disabled={isLockedByEnrollments}
                                className="h-7 text-xs font-bold px-2.5 py-1 border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                Clean Serial Numbers
                              </Button>
                            )}
                            <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-50 px-2 py-1 border-slate-200">
                              {commentAnalysis.validComments.length} Unique Payout Slots
                            </Badge>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/60 leading-relaxed">
                          ✨ <strong>Auto-Formatting Enabled:</strong> Leading serial numbers (e.g. <code>1. </code>, <code>2. </code>), bullet points, and numbers are automatically ignored when saving comments.
                        </p>

                        <Textarea
                          disabled={isLockedByEnrollments}
                          placeholder="Type or paste reviews/comments here...&#10;1. I really like the zero brokerage model.&#10;2. I'm impressed with the zero brokerage model.&#10;&#10;(Serial numbers like '1.', '2.' will be automatically ignored!)"
                          value={rawCommentsText}
                          onChange={(e) => {
                            setRawCommentsText(e.target.value);
                            if (validationErrors.comments) {
                              setValidationErrors(prev => {
                                const updated = { ...prev };
                                delete updated.comments;
                                return updated;
                              });
                            }
                          }}
                          onFocus={handleFocus}
                          rows={10}
                          className={`font-mono text-xs leading-normal p-4 rounded-xl ${
                            validationErrors.comments ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                          } ${isLockedByEnrollments ? 'bg-slate-50' : ''}`}
                        />

                        {validationErrors.comments && (
                          <p className="text-xs text-rose-500 font-semibold">{validationErrors.comments}</p>
                        )}

                        {/* Duplicates Alert Banner */}
                        {commentAnalysis.hasDuplicates && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1 animate-in fade-in duration-150">
                            <span className="font-bold block">Duplicate Comments Ignored ({commentAnalysis.duplicates.length})</span>
                            <p className="text-[11px] leading-relaxed">
                              Lines with identical text have been filtered out automatically to ensure review uniqueness. Only the {commentAnalysis.validComments.length} unique values are used.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Freeform Hint strategies */
                      <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Hint Guidance / Target Keywords <span className="text-rose-500">*</span>
                          </label>
                          <Textarea
                            disabled={isLockedByEnrollments}
                            placeholder="e.g. Write a genuine 5-star review. Make sure to use positive keywords such as 'reliable', 'instant deposits', and 'super simple design' in your review."
                            value={hintText}
                            onChange={(e) => {
                              setHintText(e.target.value);
                              if (validationErrors.hintText) {
                                setValidationErrors(prev => {
                                  const updated = { ...prev };
                                  delete updated.hintText;
                                  return updated;
                                });
                              }
                            }}
                            onFocus={handleFocus}
                            rows={4}
                            className={`text-sm leading-relaxed rounded-xl ${
                              validationErrors.hintText ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                            } ${isLockedByEnrollments ? 'bg-slate-50' : ''}`}
                          />
                          {validationErrors.hintText && (
                            <p className="text-xs text-rose-500 font-semibold">{validationErrors.hintText}</p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            Instructions or ideas given to users when they are drafting their custom reviews.
                          </p>
                        </div>

                        {/* Manual Slots */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Campaign Slot Capacity <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            type="number"
                            disabled={isLockedByEnrollments}
                            min={1}
                            value={manualSlots}
                            onChange={(e) => {
                              setManualSlots(Number(e.target.value));
                              if (validationErrors.manualSlots) {
                                setValidationErrors(prev => {
                                  const updated = { ...prev };
                                  delete updated.manualSlots;
                                  return updated;
                                });
                              }
                            }}
                            onFocus={handleFocus}
                            leftIcon={<Plus className="w-4 h-4 text-slate-400" />}
                            className={`h-11 rounded-xl text-sm font-mono ${
                              validationErrors.manualSlots ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                            }`}
                          />
                          {validationErrors.manualSlots && (
                            <p className="text-xs text-rose-500 font-semibold">{validationErrors.manualSlots}</p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            The maximum total slots of submissions allowed before this task automatically expires.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 7: Live Preview (Mobile View Only, Collapsible Card) */}
          <div className="lg:hidden bg-white border border-slate-150 rounded-2xl transition-all shadow-xs overflow-hidden">
            <div
              onClick={() => toggleSection('previewMobile')}
              className="p-4 flex items-center justify-between cursor-pointer select-none bg-slate-50/20"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  expandedSections.previewMobile ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Realtime Card Preview</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Toggle live visual representation of this task</p>
                </div>
              </div>
              <div className="p-1 rounded-full text-slate-400">
                {expandedSections.previewMobile ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.previewMobile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                    <LiveTaskPreview formData={previewData} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Desktop Sticky Realtime Preview Widget */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
            <LiveTaskPreview formData={previewData} />
          </div>
        </div>
      </div>

      {/* Floating Sticky Action Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-150 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] px-4 z-40 shadow-[0_-5px_25px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/admin/tasks')}
            className="text-slate-600 hover:text-slate-900 font-bold px-4 py-2.5 h-11 rounded-xl text-sm transition-all"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatus('draft');
                    setTimeout(() => handleSubmit(), 50);
                  }}
                  disabled={isSubmitting}
                  className="border-slate-200 text-slate-700 font-bold px-4.5 py-2.5 h-11 rounded-xl text-sm hover:bg-slate-50 shadow-xxs transition-all"
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setStatus('active');
                    setTimeout(() => handleSubmit(), 50);
                  }}
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5.5 py-2.5 h-11 rounded-xl text-sm shadow-sm flex items-center gap-1.5 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Publish Offer
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 h-11 rounded-xl text-sm shadow-sm flex items-center gap-1.5 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

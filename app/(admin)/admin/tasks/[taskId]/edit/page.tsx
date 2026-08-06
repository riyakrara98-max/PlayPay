'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

import { getFirebaseDb } from '@/firebase/config';
import { TaskDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { TaskForm } from '@/components/admin/TaskForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;

  const [task, setTask] = useState<TaskDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchTask = async () => {
      try {
        const db = getFirebaseDb();
        const docRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, taskId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setTask({
            id: snap.id,
            ...(snap.data() as Omit<TaskDocument, 'id'>),
          });
        } else {
          setError(`Task with ID "${taskId}" was not found in Firestore database.`);
        }
      } catch (err: unknown) {
        console.error('[EditTaskPage Error]', err);
        const msg = err instanceof Error ? err.message : 'Error fetching task data.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  return (
    <PageContainer size="xl" className="pb-16 space-y-6">
      {/* Navigation & Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          <Link href="/admin/tasks">Back to Task Manager</Link>
        </Button>

        <SectionHeader
          title={`Edit Task: ${task?.title || 'Loading...'}`}
          subtitle={`Task ID: ${taskId} • ${
            task?.enrolledCount ? `${task.enrolledCount} active user enrollments` : 'No enrollments yet'
          }`}
        />
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-64 w-full rounded-[var(--radius-xl)]" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-xl)] space-y-3">
          <div className="flex items-center gap-3 text-rose-500 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Unable to load task for editing</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/tasks')}>
            Return to Task List
          </Button>
        </div>
      ) : task ? (
        <TaskForm initialTask={task} isEditMode={true} />
      ) : null}
    </PageContainer>
  );
}

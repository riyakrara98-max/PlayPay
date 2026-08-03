'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { TaskForm } from '@/components/admin/TaskForm';
import { Button } from '@/components/ui/button';

export default function CreateTaskPage() {
  return (
    <PageContainer size="xl" className="pb-16 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            title="Create New Offer Task"
            subtitle="Configure partner app details, comment database, slot capacity, and Cloudinary icon"
          />
        </div>
      </div>

      {/* Task Creation Form with Live Preview */}
      <TaskForm isEditMode={false} />
    </PageContainer>
  );
}

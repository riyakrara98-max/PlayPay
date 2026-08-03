import { TaskDocument } from '@/types/firestore';

export interface CommentAllocationResult {
  assignedComment: string;
  commentIndex: number | null;
}

/**
 * Atomically calculates the comment allocation based on task configuration and enrollment index.
 * - Fixed Mode: Assigns comments[enrolledCount]
 * - Hint Mode: No specific comment assigned (assignedComment = "", commentIndex = null)
 * - None / Default: assignedComment = "", commentIndex = null
 */
export function allocateComment(
  task: TaskDocument,
  currentEnrolledCount: number
): CommentAllocationResult {
  const mode = task.commentMode || (Array.isArray(task.comments) && task.comments.length > 0 ? 'fixed' : 'none');

  if (mode === 'fixed' && Array.isArray(task.comments) && task.comments.length > 0) {
    const index = currentEnrolledCount % task.comments.length;
    const assignedComment = task.comments[index] || '';
    return {
      assignedComment,
      commentIndex: index,
    };
  }

  return {
    assignedComment: '',
    commentIndex: null,
  };
}

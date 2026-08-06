const fs = require('fs');

const path = './components/tasks/TaskEmptyState.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to inject useAuthContext
if (!content.includes('useAuthContext')) {
    content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { useAuthContext } from '@/contexts/AuthContext';");
}

const targetComp = `export function TaskEmptyState({
  isFiltered = false,
  onResetFilters,
  onRefresh,
}: TaskEmptyStateProps) {
  return (`;

const replaceComp = `export function TaskEmptyState({
  isFiltered = false,
  onResetFilters,
  onRefresh,
}: TaskEmptyStateProps) {
  const { userProfile } = useAuthContext();
  const isTeamMember = userProfile?.memberType === 'team_member' && userProfile?.leaderId;

  let title = 'No live tasks available right now.';
  let description = 'Check back soon! We are adding new high-reward campaigns and earning opportunities.';

  if (isFiltered) {
    title = 'No matching tasks found';
    description = 'Try adjusting your search keywords or filters to discover more.';
  } else if (isTeamMember) {
    title = 'No Tasks Available';
    description = "Your Team Leader hasn't assigned any tasks yet.";
  }

  return (`;

content = content.replace(targetComp, replaceComp);

content = content.replace(
    `{isFiltered ? 'No matching tasks found' : 'No live tasks available right now.'}`,
    `{title}`
);

content = content.replace(
    `{isFiltered\n          ? 'Try adjusting your search keywords or filters to discover more.'\n          : 'Check back soon! We are adding new high-reward campaigns and earning opportunities.'}`,
    `{description}`
);

fs.writeFileSync(path, content);

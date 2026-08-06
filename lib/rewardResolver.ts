/**
 * Centralized reward resolution helper.
 * Resolves the effective reward for a member given the task's base reward and optional custom effectiveReward.
 */
export function resolveMemberReward(
  taskReward: number,
  effectiveReward?: number | null
): number {
  const safeBaseReward = typeof taskReward === 'number' && !isNaN(taskReward) && taskReward >= 0
    ? taskReward
    : 0;

  if (effectiveReward === null || effectiveReward === undefined) {
    return safeBaseReward;
  }

  if (typeof effectiveReward === 'number' && !isNaN(effectiveReward) && effectiveReward >= 0) {
    return effectiveReward;
  }

  return safeBaseReward;
}

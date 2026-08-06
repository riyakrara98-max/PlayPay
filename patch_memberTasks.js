const fs = require('fs');

const path = './app/actions/memberTasks.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('resolveTaskReward')) {
    content = content.replace(
        "import { isTaskAvailable } from '@/lib/taskAvailability';",
        "import { isTaskAvailable } from '@/lib/taskAvailability';\nimport { resolveTaskReward } from '@/lib/reward-resolution';"
    );
}

const targetStr = `          let resolvedReward = task.rewardAmount || 0; 
          let baseReward = task.baseReward ?? task.rewardAmount ?? 0;
          let leaderRewardAmount: number | null = null;
          
          if (assignedToLeader) {
            if (leaderReward !== null) {
              resolvedReward = leaderReward;
              leaderRewardAmount = leaderReward;
            } else if (task.baseReward !== undefined && task.baseReward !== null) {
              resolvedReward = task.baseReward;
            }
          } else {
            if (task.baseReward !== undefined && task.baseReward !== null) {
              resolvedReward = task.baseReward;
            }
          }`;

const replaceStr = `          let baseReward = task.baseReward ?? task.rewardAmount ?? 0;
          let leaderRewardAmount: number | null = null;
          
          if (assignedToLeader && leaderReward !== null) {
              leaderRewardAmount = leaderReward;
          }
          
          // Let's create a fake assignment to pass to the helper if needed
          const assignmentObj = assignedToLeader ? { leaderReward: leaderReward } as LeaderTaskAssignmentDocument : null;
          let resolvedReward = resolveTaskReward(task, assignmentObj);`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(path, content);

const fs = require('fs');

const path = './hooks/useEnrollTask.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `const storedPackageName = (tData.packageName || '').trim();
          const finalReward = resolveMemberReward(tData.rewardAmount, userProfile?.effectiveReward);

          // Construct enrollment payload
          const enrollmentPayload: Record<string, unknown> = {
            id: enrollmentId,`;

const replacementStr = `const storedPackageName = (tData.packageName || '').trim();
          
          let taskRewardBase = tData.rewardAmount;
          let leaderRewardAmount = null;
          let assignmentId = null;
          let baseReward = tData.baseReward ?? tData.rewardAmount ?? 0;
          let taskLeaderId = null;
          
          if (resolvedTask) {
             taskRewardBase = resolvedTask.rewardAmount ?? taskRewardBase;
             leaderRewardAmount = resolvedTask._resolvedLeaderRewardAmount ?? null;
             assignmentId = resolvedTask._resolvedAssignmentId ?? null;
             baseReward = resolvedTask._resolvedBaseReward ?? baseReward;
             if (assignmentId) {
               taskLeaderId = userProfile?.leaderId || null;
             }
          }

          const finalReward = resolveMemberReward(taskRewardBase, userProfile?.effectiveReward);

          // Construct enrollment payload
          const enrollmentPayload: Record<string, unknown> = {
            id: enrollmentId,
            leaderRewardAmount,
            baseReward,
            assignmentId,
            leaderId: taskLeaderId,`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content);

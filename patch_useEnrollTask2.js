const fs = require('fs');

const path = './hooks/useEnrollTask.ts';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `const enrollmentPayload: Record<string, unknown> = {
            id: enrollmentId,
            leaderRewardAmount,
            baseReward,
            assignmentId,
            leaderId: taskLeaderId,`;

const replaceStr = `const enrollmentPayload: Record<string, unknown> = {
            id: enrollmentId,
            leaderRewardAmount,
            baseReward,
            assignmentId,
            leaderId: taskLeaderId,
            rewardResolvedAt: serverTimestamp(),`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync(path, content);

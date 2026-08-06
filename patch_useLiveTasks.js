const fs = require('fs');

const path = './hooks/useLiveTasks.ts';
let content = fs.readFileSync(path, 'utf8');

// Add import for resolveTaskReward
if (!content.includes('resolveTaskReward')) {
    content = content.replace(
        "import { isTaskAvailable } from '@/lib/taskAvailability';",
        "import { isTaskAvailable } from '@/lib/taskAvailability';\nimport { resolveTaskReward } from '@/lib/reward-resolution';"
    );
}

// Global tasks branch
const targetGlobal = `const list: TaskDocument[] = snapshot.docs
              .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as TaskDocument))
              .filter((task) => isTaskAvailable(task));`;

const replaceGlobal = `const list: TaskDocument[] = snapshot.docs
              .map((docSnap) => {
                const tData = { id: docSnap.id, ...docSnap.data() } as TaskDocument;
                const safeTask = { ...tData };
                safeTask.rewardAmount = resolveTaskReward(tData, null);
                return safeTask;
              })
              .filter((task) => isTaskAvailable(task));`;

content = content.replace(targetGlobal, replaceGlobal);

// Assignments branch
const targetAssignments = `const validTaskIds: string[] = [];
              assignmentsSnap.forEach((docSnap) => {
                const data = docSnap.data() as LeaderTaskAssignmentDocument;
                // Treat missing assignmentStatus as active for backward compatibility
                const isActive = data.assignmentStatus === 'active' || (!data.assignmentStatus && data.status !== 'inactive');
                if (isActive) {
                  validTaskIds.push(data.taskId);
                }
              });`;

const replaceAssignments = `const validTaskIds: string[] = [];
              const assignmentMap: Record<string, LeaderTaskAssignmentDocument> = {};
              assignmentsSnap.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() } as LeaderTaskAssignmentDocument;
                // Treat missing assignmentStatus as active for backward compatibility
                const isActive = data.assignmentStatus === 'active' || (!data.assignmentStatus && data.status !== 'inactive');
                if (isActive) {
                  validTaskIds.push(data.taskId);
                  assignmentMap[data.taskId] = data;
                }
              });`;

content = content.replace(targetAssignments, replaceAssignments);

const targetTasksLoop = `tasksSnap.forEach((tDoc) => {
                  const tData = { id: tDoc.id, ...tDoc.data() } as TaskDocument;
                  if (isTaskAvailable(tData)) {
                    tasksList.push(tData);
                  }
                });`;

const replaceTasksLoop = `tasksSnap.forEach((tDoc) => {
                  const tData = { id: tDoc.id, ...tDoc.data() } as TaskDocument;
                  if (isTaskAvailable(tData)) {
                    const assignment = assignmentMap[tData.id];
                    const safeTask = { ...tData };
                    
                    safeTask.rewardAmount = resolveTaskReward(tData, assignment);
                    
                    delete safeTask.baseReward;
                    delete safeTask.assignedLeaderIds;
                    delete safeTask.assignmentType;
                    
                    safeTask._resolvedLeaderRewardAmount = assignment?.leaderReward ?? null;
                    safeTask._resolvedAssignmentId = assignment?.id ?? undefined;
                    safeTask._resolvedBaseReward = tData.baseReward ?? tData.rewardAmount ?? 0;
                    
                    tasksList.push(safeTask);
                  }
                });`;

content = content.replace(targetTasksLoop, replaceTasksLoop);

fs.writeFileSync(path, content);

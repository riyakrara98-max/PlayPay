'use client';

import { EnrollmentDocument, UserDocument } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';

export interface ReportItem {
  id: string;
  memberName: string;
  memberEmail: string;
  taskTitle: string;
  packageName: string;
  status: string;
  submittedAt: string;
  reward: number;
  screenshotUrl?: string;
}

export interface ReportOptions {
  dateLabel: string;
  appName: string;
  items: ReportItem[];
  generatedTime: string;
}

/**
 * Transforms raw submissions and member map into formatted report items.
 */
export function formatReportItems(
  submissions: EnrollmentDocument[],
  membersMap: Record<string, UserDocument>
): ReportItem[] {
  return submissions.map((s) => {
    const member = s.userId ? membersMap[s.userId] : undefined;
    const memberName = member?.displayName || s.userName || 'Unnamed Member';
    const memberEmail = member?.email || s.userEmail || 'N/A';
    const taskTitle = s.taskTitle || s.appName || 'App Task';
    const packageName = s.packageName || 'N/A';

    let statusLabel = 'Completed';
    if (s.paymentStatus === 'paid') statusLabel = 'Paid';
    else if (s.status === 'approved') statusLabel = 'Approved';
    else if (s.status === 'rejected') statusLabel = 'Rejected';
    else if (s.submittedAt || s.screenshotUrl || s.proofUrl) statusLabel = 'Submitted';
    else statusLabel = 'Pending';

    const rawTime = s.submittedAt || s.enrolledAt;
    const submittedAt = rawTime ? formatDate(rawTime) : 'N/A';
    const reward = s.lockedReward ?? s.reward ?? s.rewardAmount ?? 0;
    const screenshotUrl = s.screenshotUrl || s.proofUrl;

    return {
      id: s.id,
      memberName,
      memberEmail,
      taskTitle,
      packageName,
      status: statusLabel,
      submittedAt,
      reward,
      screenshotUrl,
    };
  });
}

/**
 * WhatsApp Report Formatter
 */
export function generateWhatsAppReport({ dateLabel, appName, items }: ReportOptions): string {
  const lines: string[] = [];

  lines.push(`Date:`);
  lines.push(`${dateLabel}`);
  lines.push(``);
  lines.push(`App Name:`);
  lines.push(`${appName}`);
  lines.push(``);
  lines.push(`Total Reviews:`);
  lines.push(`${items.length}`);
  lines.push(``);
  lines.push(`--------------------------------`);
  lines.push(``);

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.memberName}`);
  });

  return lines.join('\n');
}

/**
 * Download TXT File helper
 */
export function downloadTxtFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * PDF / Printable Document Trigger
 */
export function printPdfReport({ dateLabel, appName, items, generatedTime }: ReportOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rowsHtml = items
    .map(
      (item, idx) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${item.memberName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #475569;">${item.memberEmail}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.taskTitle}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.status}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${item.reward}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Team Report - ${appName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 40px; }
          .header { margin-bottom: 24px; border-bottom: 2px solid #059669; padding-bottom: 12px; }
          .title { font-size: 24px; font-weight: 800; color: #065f46; margin: 0 0 6px 0; }
          .meta-grid { display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-top: 8px; }
          .meta-item { margin-right: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
          th { background: #f1f5f9; padding: 10px 8px; text-align: left; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Team Leader Summary Report</h1>
          <div class="meta-grid">
            <div>
              <span class="meta-item"><strong>Date:</strong> ${dateLabel}</span>
              <span class="meta-item"><strong>App Name:</strong> ${appName}</span>
            </div>
            <div>
              <strong>Total Reviews:</strong> ${items.length}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 40px;">#</th>
              <th>Member Name</th>
              <th>Email</th>
              <th>Task</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: right;">Reward</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Generated Time: ${generatedTime}</span>
          <span>Page 1 of 1</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Image Contact Sheet Printable Trigger
 */
export function printImageSheet({ dateLabel, appName, items, generatedTime }: ReportOptions) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const blocksHtml = items
    .map(
      (item) => `
    <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; background: #ffffff; break-inside: avoid; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${item.memberName}</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">${item.taskTitle}</div>
        <div style="width: 100%; height: 160px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          ${
            item.screenshotUrl
              ? `<img src="${item.screenshotUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`
              : `<span style="font-size: 11px; color: #94a3b8;">No Image</span>`
          }
        </div>
      </div>
      <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 6px;">
        <span>${item.submittedAt}</span>
        <span style="font-weight: 700; color: #059669;">${item.status}</span>
      </div>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Team Image Contact Sheet - ${appName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 30px; background: #f8fafc; }
          .header { margin-bottom: 20px; background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .title { font-size: 20px; font-weight: 800; color: #065f46; margin: 0 0 4px 0; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print {
            body { background: #ffffff; margin: 15px; }
            .grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Submission Proof Contact Sheet</h1>
          <div style="font-size: 12px; color: #475569;">
            <strong>App:</strong> ${appName} | <strong>Date Range:</strong> ${dateLabel} | <strong>Total Proofs:</strong> ${items.length}
          </div>
        </div>

        <div class="grid">
          ${blocksHtml}
        </div>

        <div class="footer">
          Generated on ${generatedTime} | Team Leader System
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

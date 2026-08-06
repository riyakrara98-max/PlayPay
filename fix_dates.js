const fs = require('fs');
const glob = require('fs').readdirSync; // not glob, we can just run grep and patch
const { execSync } = require('child_process');

function fixFiles() {
  const files = execSync('grep -rl "new Date(" app/ components/ hooks/ contexts/ lib/ utils/').toString().split('\n').filter(Boolean);
  
  for (const file of files) {
    if (file === 'utils/formatters.ts') continue;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We will inject import { parseDateInput, getSafeTime, formatDate, formatDateTime } from '@/utils/formatters'
    // if we actually change something.
    let changed = false;

    // Fix .getTime()
    if (content.includes('.getTime()')) {
        content = content.replace(/new Date\(([^)]+)\)\.getTime\(\)/g, 'getSafeTime($1)');
    }

    // Fix .toLocaleDateString()
    if (content.includes('.toLocaleDateString(')) {
        content = content.replace(/new Date\(([^)]+)\)\.toLocaleDateString\(([^)]*)\)/g, 'formatDate($1)');
        content = content.replace(/new Date\(([^)]+)\)\.toLocaleDateString\(\)/g, 'formatDate($1)');
    }

    // Fix .toLocaleString()
    if (content.includes('.toLocaleString(')) {
        content = content.replace(/new Date\(([^)]+)\)\.toLocaleString\(([^)]*)\)/g, 'formatDateTime($1)');
        content = content.replace(/new Date\(([^)]+)\)\.toLocaleString\(\)/g, 'formatDateTime($1)');
    }

    // Fix .toLocaleTimeString() -> not supported in formatters. Let's ignore or use parseDateInput
    if (content.includes('.toLocaleTimeString(')) {
        content = content.replace(/new Date\(([^)]+)\)\.toLocaleTimeString\(([^)]*)\)/g, '(parseDateInput($1) || new Date()).toLocaleTimeString($2)');
    }
    
    // Fix comparison `< currentDate`
    if (content.includes('< currentDate')) {
        content = content.replace(/new Date\(([^)]+)\)\s*<\s*currentDate/g, 'getSafeTime($1) < currentDate.getTime()');
    }

    if (content.includes('new Date(isoString)')) {
        content = content.replace(/new Date\(isoString\)/g, '(parseDateInput(isoString) || new Date())');
    }
    
    if (content.includes('new Date(dateStr)')) {
        content = content.replace(/new Date\(dateStr\)/g, '(parseDateInput(dateStr) || new Date())');
    }
    
    if (content.includes('new Date(formData.expiresAt)')) {
        content = content.replace(/new Date\(formData\.expiresAt\)/g, '(parseDateInput(formData.expiresAt) || new Date())');
    }
    
    if (content.includes('new Date(approvedDateStr)')) {
        content = content.replace(/new Date\(approvedDateStr\)/g, '(parseDateInput(approvedDateStr) || new Date())');
    }
    
    if (content.includes('new Date(a.submittedAt || a.enrolledAt)')) {
        content = content.replace(/new Date\(a\.submittedAt \|\| a\.enrolledAt\)/g, '(parseDateInput(a.submittedAt || a.enrolledAt) || new Date())');
    }
    if (content.includes('new Date(b.submittedAt || b.enrolledAt)')) {
        content = content.replace(/new Date\(b\.submittedAt \|\| b\.enrolledAt\)/g, '(parseDateInput(b.submittedAt || b.enrolledAt) || new Date())');
    }

    if (content.includes('new Date(item.submittedAt || item.enrolledAt)')) {
        content = content.replace(/new Date\(item\.submittedAt \|\| item\.enrolledAt\)/g, '(parseDateInput(item.submittedAt || item.enrolledAt) || new Date())');
    }

    if (content.includes('new Date(filters.startDate)')) {
        content = content.replace(/new Date\(filters\.startDate\)/g, '(parseDateInput(filters.startDate) || new Date())');
    }
    
    if (content.includes('new Date(filters.endDate)')) {
        content = content.replace(/new Date\(filters\.endDate\)/g, '(parseDateInput(filters.endDate) || new Date())');
    }
    
    if (content.includes('new Date(task.expiresAt)')) {
        // except when followed by .getTime() which was already handled
        content = content.replace(/new Date\(task\.expiresAt\)/g, '(parseDateInput(task.expiresAt) || new Date())');
    }

    if (content !== original) {
      // Add imports
      const imports = [];
      if (content.includes('getSafeTime(')) imports.push('getSafeTime');
      if (content.includes('parseDateInput(')) imports.push('parseDateInput');
      if (content.includes('formatDate(')) imports.push('formatDate');
      if (content.includes('formatDateTime(')) imports.push('formatDateTime');
      
      if (imports.length > 0) {
          const importStr = `import { ${imports.join(', ')} } from '@/utils/formatters';\n`;
          // insert after the last import
          const lastImportIndex = content.lastIndexOf('import ');
          if (lastImportIndex !== -1) {
              const endOfLastImport = content.indexOf('\n', lastImportIndex);
              content = content.substring(0, endOfLastImport + 1) + importStr + content.substring(endOfLastImport + 1);
          } else {
              content = importStr + content;
          }
      }
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}

fixFiles();

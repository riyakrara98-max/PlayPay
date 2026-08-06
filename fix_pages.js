const fs = require('fs');

const fixFile = (path) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace("import { div } from '@/components/layout/div';", "");
    fs.writeFileSync(path, content, 'utf8');
  }
}

fixFile('app/error.tsx');
fixFile('app/not-found.tsx');

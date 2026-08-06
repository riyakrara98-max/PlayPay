const fs = require('fs');
let content = fs.readFileSync('app/layout.tsx', 'utf8');
content = content.replace('<AppProvider>{children}</AppProvider>', '{children}');
fs.writeFileSync('app/layout.tsx', content, 'utf8');

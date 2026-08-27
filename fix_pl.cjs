const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/p-3 sm:p-4 pl-5 shadow-lg/g, 'p-3 sm:p-4 pl-5 sm:pl-6 shadow-lg');
code = code.replace(/p-3 sm:p-4 pl-5 shadow-sm/g, 'p-3 sm:p-4 pl-5 sm:pl-6 shadow-sm');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

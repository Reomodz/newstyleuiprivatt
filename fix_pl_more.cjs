const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/p-3 sm:p-4\.5 pl-5\.5/g, 'p-3 sm:p-4 pl-4 sm:pl-5');
code = code.replace(/sm:gap-3\.5/g, 'sm:gap-4'); // Might as well replace this

fs.writeFileSync('src/components/MainDashboard.tsx', code);

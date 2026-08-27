const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/gap-2 sm:gap-4 lg:gap-3 sm:gap-6/g, 'gap-4 lg:gap-6');
code = code.replace(/gap-2 sm:gap-4 lg:gap-3/g, 'gap-3 lg:gap-4');
code = code.replace(/gap-3 sm:gap-6/g, 'gap-4 sm:gap-6');
code = code.replace(/gap-2 sm:gap-4/g, 'gap-3 sm:gap-4');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

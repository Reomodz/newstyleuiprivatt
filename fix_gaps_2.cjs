const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/gap-1\.5 sm:gap-4 sm:gap-2\.5 sm:p-5/g, 'gap-3 sm:gap-5');
code = code.replace(/gap-[0-9.]+ sm:gap-[0-9.]+ sm:gap-[0-9.]+ sm:p-[0-9.]+/g, 'gap-3 sm:gap-5');

// Let's also check for gap-1.5 sm:gap-1.5 sm:p-3
code = code.replace(/gap-1\.5 sm:gap-1\.5 sm:p-3/g, 'gap-3');
code = code.replace(/gap-1\.5 sm:gap-2 sm:p-3/g, 'gap-3');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

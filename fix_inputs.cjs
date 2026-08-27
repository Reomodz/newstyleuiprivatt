const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/px-3 sm:px-4 py-2 sm:py-3/g, 'px-2.5 sm:px-4 py-1.5 sm:py-3');
code = code.replace(/text-xs sm:text-sm font-mono/g, 'text-[10px] sm:text-sm font-mono');
code = code.replace(/text-xs sm:text-sm text-\[\#E2E2E4\] focus:outline-none focus:border-indigo-500 font-mono/g, 'text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono');
code = code.replace(/text-xs sm:text-sm font-semibold text-\[\#E2E2E4\]/g, 'text-[11px] sm:text-sm font-semibold text-[#E2E2E4]');

// Add scrolling class to activeProfile container if it doesn't have it (it should already be scrollable since the modal container is max-h-[85vh] overflow-y-auto now).
fs.writeFileSync('src/components/MainDashboard.tsx', code);

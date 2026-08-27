const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// The issue: "gap-2" was accidentally matched by replacing "p-2". So "gap-2" became "gap-1.5 sm:p-2".
// "gap-3" became "gap-2 sm:p-3".
// "gap-4" became "gap-3 sm:p-4".
// "gap-5" became "gap-3 sm:p-5" (or gap-4 sm:p-5).
// "gap-6" became "gap-4 sm:p-6".

// We need to reverse these specific patterns where "gap-" is followed by something and "sm:p-"
code = code.replace(/gap-1\.5 sm:p-2/g, 'gap-2');
code = code.replace(/gap-1\.5 sm:gap-1\.5 sm:p-3/g, 'gap-3');
code = code.replace(/gap-2 sm:p-3\.5/g, 'gap-3.5');
code = code.replace(/gap-2 sm:p-3/g, 'gap-3');
code = code.replace(/gap-3 sm:p-4/g, 'gap-4');
code = code.replace(/gap-4 sm:p-5/g, 'gap-5');
code = code.replace(/gap-4 sm:p-6/g, 'gap-6');

// What about sm:gap-2 sm:p-3?
code = code.replace(/sm:gap-1\.5 sm:p-2/g, 'sm:gap-2');
code = code.replace(/sm:gap-2 sm:p-3/g, 'sm:gap-3');
code = code.replace(/sm:gap-3 sm:p-4/g, 'sm:gap-4');
code = code.replace(/sm:gap-4 sm:p-5/g, 'sm:gap-5');
code = code.replace(/sm:gap-4 sm:p-6/g, 'sm:gap-6');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

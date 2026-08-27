const fs = require('fs');
let lines = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8').split('\n');

for (let i = 2290; i < 3160; i++) {
  if (lines[i]) {
    // Paddings
    lines[i] = lines[i].replace(/p-3 sm:p-5/g, 'p-2.5 sm:p-5');
    lines[i] = lines[i].replace(/p-2 sm:p-3\.5/g, 'p-1.5 sm:p-3.5');
    lines[i] = lines[i].replace(/p-2 sm:p-3/g, 'p-1.5 sm:p-3');
    lines[i] = lines[i].replace(/px-3 sm:px-5 py-1\.5 sm:py-2\.5/g, 'px-2.5 sm:px-5 py-1.5 sm:py-2.5');
    lines[i] = lines[i].replace(/px-2 sm:px-3 py-1\.5 sm:py-2/g, 'px-1.5 sm:px-3 py-1 sm:py-2');
    
    // Gaps
    lines[i] = lines[i].replace(/gap-1\.5 sm:gap-2/g, 'gap-1 sm:gap-2');
    lines[i] = lines[i].replace(/gap-2\.5 sm:gap-4/g, 'gap-2 sm:gap-4');
    lines[i] = lines[i].replace(/gap-2 sm:gap-3/g, 'gap-1.5 sm:gap-3');
    
    // Text sizes
    lines[i] = lines[i].replace(/text-sm sm:text-base/g, 'text-xs sm:text-base');
    lines[i] = lines[i].replace(/text-xs sm:text-sm/g, 'text-[10px] sm:text-sm');
    lines[i] = lines[i].replace(/text-\[11px\] sm:text-xs/g, 'text-[9px] sm:text-xs');
    lines[i] = lines[i].replace(/text-\[10px\] sm:text-xs/g, 'text-[9px] sm:text-xs');
    lines[i] = lines[i].replace(/text-\[9px\] sm:text-\[11px\]/g, 'text-[8px] sm:text-[11px]');
    lines[i] = lines[i].replace(/text-\[9px\] sm:text-\[10px\]/g, 'text-[8px] sm:text-[10px]');
    
    // Icon sizes
    lines[i] = lines[i].replace(/w-3\.5 h-3\.5 sm:w-4 sm:h-4/g, 'w-3 h-3 sm:w-4 sm:h-4');
    lines[i] = lines[i].replace(/w-4 h-4 sm:w-5 sm:h-5/g, 'w-3.5 h-3.5 sm:w-5 sm:h-5');
  }
}

fs.writeFileSync('src/components/MainDashboard.tsx', lines.join('\n'));

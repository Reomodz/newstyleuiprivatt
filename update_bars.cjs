const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

code = code.replace(/w-1\.5 bg-gradient-to-b/g, 'w-[2px] bg-gradient-to-b');
code = code.replace(/w-1 bg-gradient-to-b/g, 'w-[1px] bg-gradient-to-b');
code = code.replace(/group-hover\/pcard:w-1\.5/g, 'group-hover/pcard:w-[2px]');

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Done');

const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const oldClass = 'bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-2 sm:gap-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto';
const newClass = 'bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl p-3 sm:p-5 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto overscroll-contain';

code = code.replace(new RegExp(oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newClass);

fs.writeFileSync('src/components/MainDashboard.tsx', code);

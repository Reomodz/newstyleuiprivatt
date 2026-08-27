const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// The bad replacement:
const badStr = '<div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden"><div className="p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 overflow-y-auto">';
const originalStr = '<div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-2 sm:gap-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">';

code = code.replace(new RegExp(badStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), originalStr);

fs.writeFileSync('src/components/MainDashboard.tsx', code);

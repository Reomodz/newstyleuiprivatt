const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const regex = /<div className="bg-\[#1E1E20\] border border-\[#3A3A3E\] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-\[calc\(100dvh-1\.5rem\)\] sm:max-h-\[85dvh\] overflow-hidden">\n            <div className="(p-[a-zA-Z0-9.-]+ sm:p-[a-zA-Z0-9.-]+) flex flex-col (gap-[a-zA-Z0-9.-]+ sm:gap-[a-zA-Z0-9.-]+) overflow-y-auto overscroll-contain">/g;

code = code.replace(regex, '<div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl $1 max-w-lg w-full shadow-2xl flex flex-col $2 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto overscroll-contain">');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

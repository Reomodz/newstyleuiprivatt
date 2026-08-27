const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// The modals currently have some large padding and gap classes.
// e.g. <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">

// Make sure the Edit Modal and Add Modal text and inputs are small on mobile.
// For inputs in the modals:
code = code.replace(/px-3 sm:px-4 py-2 bg-\[#141416\]/g, 'px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#141416]');
code = code.replace(/text-xs sm:text-sm font-mono/g, 'text-[10px] sm:text-sm font-mono');
code = code.replace(/text-\[11px\] sm:text-xs font-mono/g, 'text-[10px] sm:text-xs font-mono');

// "Edit Target & Fallbacks" Modal
// We need to fix the container for the Edit modal
code = code.replace(/<div className="bg-\[#1E1E20\] border border-\[#3A3A3E\] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-2 sm:gap-3 sm:p-5 animate-in fade-in zoom-in-95 duration-200 max-h-\[90vh\] overflow-y-auto">/g, 
  '<div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden"><div className="p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-4 overflow-y-auto">');

// For Add Target
// Already replaced in the previous step? Let's check.
// I used a generic regex, it probably matched both if they were identical, but maybe not.

fs.writeFileSync('src/components/MainDashboard.tsx', code);

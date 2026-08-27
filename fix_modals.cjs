const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// We have 5 modals with similar patterns. Let's find them all.
// Pattern: 
// <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
//   <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl p-X max-w-lg w-full shadow-2xl flex flex-col gap-Y animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto overscroll-contain">
// 
// We want to turn the inner div into TWO divs:
// <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100dvh-1rem)] sm:max-h-[85dvh] overflow-hidden">
//   <div className="p-X flex flex-col gap-Y overflow-y-auto overscroll-contain pb-6">

const regex = /<div className="bg-\[#1E1E20\] border border-\[#3A3A3E\] rounded-xl sm:rounded-2xl (p-[a-zA-Z0-9.-]+ sm:p-[a-zA-Z0-9.-]+) max-w-lg w-full shadow-2xl flex flex-col (gap-[a-zA-Z0-9.-]+ sm:gap-[a-zA-Z0-9.-]+) animate-in fade-in zoom-in-95 duration-200 max-h-\[85vh\] overflow-y-auto overscroll-contain">/g;

code = code.replace(regex, (match, pClass, gapClass) => {
  return `<div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100dvh-1.5rem)] sm:max-h-[85dvh] overflow-hidden">\n            <div className="${pClass} flex flex-col ${gapClass} overflow-y-auto overscroll-contain">`;
});

// Since we opened a new div, we must close it where the modal ends.
// But how do we find the end?
// The safest way is to find the modal end. 
// Modals usually end with:
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
// Let's replace the ending of the modals.
// But there are many such endings. Let's do it manually for each modal based on their line numbers.
// Better yet, just find the precise closing tags for the modal content.

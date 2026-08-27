const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// The backdrops currently are:
// <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start">
// Let's make them min-h-screen, items-center on desktop, items-start mt-8 on mobile?
// Actually if we just use items-start, and margin-top, it solves the flex bug.

code = code.replace(/overflow-y-auto p-3 sm:p-4 flex justify-center items-start/g, 'overflow-y-auto p-3 sm:p-4 flex justify-center items-start sm:items-center');
code = code.replace(/overflow-y-auto p-2 sm:p-4 flex justify-center items-start/g, 'overflow-y-auto p-2 sm:p-4 flex justify-center items-start sm:items-center');

// Now fix the modal cards themselves
// my-auto shrink-0 max-h-[calc(100dvh-2rem)] sm:max-h-[85vh]

code = code.replace(/my-auto shrink-0 max-h-\[calc\(100dvh-2rem\)\] sm:max-h-\[85vh\]/g, 
  'mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[80dvh] sm:max-h-[85vh]');

code = code.replace(/my-auto shrink-0 max-h-\[calc\(100dvh-1rem\)\] sm:max-h-\[90vh\]/g, 
  'mt-4 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[85dvh] sm:max-h-[90vh]');

// For the clear history modal
code = code.replace(/my-auto shrink-0">/g, 
  'mt-20 sm:mt-0 mb-auto sm:my-auto shrink-0">');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

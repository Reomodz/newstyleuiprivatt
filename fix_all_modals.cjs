const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// 1. Fix the backdrops
code = code.replace(/<div className="fixed inset-0 z-50 bg-black\/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">/g, 
  '<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start">');

code = code.replace(/<div className="fixed inset-0 z-50 bg-black\/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">/g, 
  '<div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex justify-center items-start">');
  
code = code.replace(/<div className="fixed inset-0 z-50 bg-black\/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">/g, 
  '<div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start">');

// 2. Add my-auto and shrink-0 to modal containers so they center if they fit, and don't shrink
// And fix max-h to use dvh for mobile.
code = code.replace(/animate-in fade-in zoom-in-95 duration-200 max-h-\[85vh\]/g, 
  'animate-in fade-in zoom-in-95 duration-200 my-auto shrink-0 max-h-[calc(100dvh-2rem)] sm:max-h-[85vh]');

// For the JSON modal
code = code.replace(/animate-in fade-in zoom-in-95 duration-200 max-h-\[98vh\] sm:max-h-\[90vh\]/g, 
  'animate-in fade-in zoom-in-95 duration-200 my-auto shrink-0 max-h-[calc(100dvh-1rem)] sm:max-h-[90vh]');

// For the clear history modal (which didn't have a max-h)
code = code.replace(/animate-in fade-in zoom-in-95 duration-200">/g, 
  'animate-in fade-in zoom-in-95 duration-200 my-auto shrink-0">');

fs.writeFileSync('src/components/MainDashboard.tsx', code);

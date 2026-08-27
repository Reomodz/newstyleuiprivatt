const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

// Replace standard tailwind classes but only if they don't already have an sm: equivalent
// We use a regex that matches the class, ensuring it's surrounded by quotes, backticks, spaces, or newlines.

const replacements = [
  // Text sizes
  { from: /(?<!sm:)text-xs(?!\s*sm:text-)/g, to: 'text-[10px] sm:text-xs' },
  { from: /(?<!sm:)text-sm(?!\s*sm:text-)/g, to: 'text-xs sm:text-sm' },
  { from: /(?<!sm:)text-base(?!\s*sm:text-)/g, to: 'text-sm sm:text-base' },
  { from: /(?<!sm:)text-lg(?!\s*sm:text-)/g, to: 'text-base sm:text-lg' },
  { from: /(?<!sm:)text-xl(?!\s*sm:text-)/g, to: 'text-lg sm:text-xl' },
  { from: /(?<!sm:)text-2xl(?!\s*sm:text-)/g, to: 'text-xl sm:text-2xl' },
  
  // Padding
  { from: /(?<!sm:)p-3(?!\s*sm:p-)/g, to: 'p-2 sm:p-3' },
  { from: /(?<!sm:)p-4(?!\s*sm:p-)/g, to: 'p-3 sm:p-4' },
  { from: /(?<!sm:)p-5(?!\s*sm:p-)/g, to: 'p-3 sm:p-5' },
  { from: /(?<!sm:)p-6(?!\s*sm:p-)/g, to: 'p-4 sm:p-6' },
  { from: /(?<!sm:)px-4(?!\s*sm:px-)/g, to: 'px-3 sm:px-4' },
  { from: /(?<!sm:)py-4(?!\s*sm:py-)/g, to: 'py-3 sm:py-4' },
  { from: /(?<!sm:)px-5(?!\s*sm:px-)/g, to: 'px-3 sm:px-5' },
  { from: /(?<!sm:)py-5(?!\s*sm:py-)/g, to: 'py-3 sm:py-5' },
  { from: /(?<!sm:)px-6(?!\s*sm:px-)/g, to: 'px-4 sm:px-6' },
  { from: /(?<!sm:)py-6(?!\s*sm:py-)/g, to: 'py-4 sm:py-6' },
  
  // Gaps
  { from: /(?<!sm:)gap-4(?!\s*sm:gap-)/g, to: 'gap-3 sm:gap-4' },
  { from: /(?<!sm:)gap-5(?!\s*sm:gap-)/g, to: 'gap-3 sm:gap-5' },
  { from: /(?<!sm:)gap-6(?!\s*sm:gap-)/g, to: 'gap-4 sm:gap-6' },

  // Border radius
  { from: /(?<!sm:)rounded-2xl(?!\s*sm:rounded-)/g, to: 'rounded-xl sm:rounded-2xl' },
  { from: /(?<!sm:)rounded-3xl(?!\s*sm:rounded-)/g, to: 'rounded-2xl sm:rounded-3xl' },
  
  // Custom text sizes (already brackets)
  { from: /(?<!sm:)text-\[11px\](?!\s*sm:text-)/g, to: 'text-[9px] sm:text-[11px]' },
  { from: /(?<!sm:)text-\[10px\](?!\s*sm:text-)/g, to: 'text-[9px] sm:text-[10px]' },
  { from: /(?<!sm:)text-\[9px\](?!\s*sm:text-)/g, to: 'text-[8px] sm:text-[9px]' },
];

for (const {from, to} of replacements) {
  code = code.replace(from, to);
}

// Ensure we didn't break things like `text-xs sm:text-[10px] sm:text-xs` by accident
code = code.replace(/text-\[10px\] sm:text-\[10px\] sm:text-xs/g, 'text-[10px] sm:text-xs');
code = code.replace(/text-xs sm:text-xs sm:text-sm/g, 'text-xs sm:text-sm');

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Modified MainDashboard.tsx');

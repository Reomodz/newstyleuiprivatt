const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const replacements = [
  // Padding
  { from: /(?<!sm:)p-2(?!\s*sm:p-)/g, to: 'p-1.5 sm:p-2' },
  { from: /(?<!sm:)px-2(?!\s*sm:px-)/g, to: 'px-1.5 sm:px-2' },
  { from: /(?<!sm:)py-2(?!\s*sm:py-)/g, to: 'py-1.5 sm:py-2' },
  { from: /(?<!sm:)px-3(?!\s*sm:px-)/g, to: 'px-2 sm:px-3' },
  { from: /(?<!sm:)py-3(?!\s*sm:py-)/g, to: 'py-2 sm:py-3' },

  // Gaps
  { from: /(?<!sm:)gap-2(?!\s*sm:gap-)/g, to: 'gap-1.5 sm:gap-2' },
  { from: /(?<!sm:)gap-3(?!\s*sm:gap-)/g, to: 'gap-2 sm:gap-3' },

  // Rounded
  { from: /(?<!sm:)rounded-xl(?!\s*sm:rounded-)/g, to: 'rounded-lg sm:rounded-xl' },
  { from: /(?<!sm:)rounded-lg(?!\s*sm:rounded-)/g, to: 'rounded-md sm:rounded-lg' },
];

for (const {from, to} of replacements) {
  code = code.replace(from, to);
}

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Modified MainDashboard.tsx');

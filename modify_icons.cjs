const fs = require('fs');
let code = fs.readFileSync('src/components/MainDashboard.tsx', 'utf8');

const replacements = [
  { from: /(?<!sm:)w-4 h-4(?!\s*sm:w-)/g, to: 'w-3.5 h-3.5 sm:w-4 sm:h-4' },
  { from: /(?<!sm:)w-5 h-5(?!\s*sm:w-)/g, to: 'w-4 h-4 sm:w-5 sm:h-5' },
  { from: /(?<!sm:)w-6 h-6(?!\s*sm:w-)/g, to: 'w-5 h-5 sm:w-6 sm:h-6' },
  { from: /(?<!sm:)w-8 h-8(?!\s*sm:w-)/g, to: 'w-6 h-6 sm:w-8 sm:h-8' },
  { from: /(?<!sm:)w-3\.5 h-3\.5(?!\s*sm:w-)/g, to: 'w-3 h-3 sm:w-3.5 sm:h-3.5' },
];

for (const {from, to} of replacements) {
  code = code.replace(from, to);
}

fs.writeFileSync('src/components/MainDashboard.tsx', code);
console.log('Modified MainDashboard.tsx');

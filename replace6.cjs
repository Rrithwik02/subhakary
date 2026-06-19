const fs = require('fs');
let code = fs.readFileSync('src/pages/PlanWedding.tsx', 'utf8');

code = code.replace(/<\/Card>/g, '</div>');

fs.writeFileSync('src/pages/PlanWedding.tsx', code);
console.log("Updated PlanWedding.tsx");

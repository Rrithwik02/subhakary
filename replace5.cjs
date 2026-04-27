const fs = require('fs');
let code = fs.readFileSync('src/pages/Journey.tsx', 'utf8');

code = code.replace(
  '<div className="min-h-screen bg-background">\r\n      <SEOHead title="Guided Wedding Journey | Subhakary" description="Move through each wedding planning stage with Subhakary." />\r\n      <Navbar />\r\n      <main className="container max-w-5xl mx-auto px-4 py-10">',
  '<div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background pb-12 relative">\r\n      <SEOHead title="Guided Wedding Journey | Subhakary" description="Move through each wedding planning stage with Subhakary." />\r\n      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />\r\n      <Navbar />\r\n      <main className="container max-w-4xl mx-auto px-4 py-32 relative z-10">'
);

code = code.replace(
  '<Card className="mb-6">',
  '<Card className="mb-8 glass-card border-border/40 shadow-elevated bg-card/80 backdrop-blur-xl">'
);

code = code.replace(
  /<Card /g,
  '<Card '
);

code = code.replace(
  /className={locked \? "opacity-60" \: ""}/g,
  'className={locked ? "opacity-60 glass-card border-border/40" : "glass-card border-border/40 hover:border-primary/30 hover:shadow-elevated transition-all"}'
);

fs.writeFileSync('src/pages/Journey.tsx', code);
console.log("Updated Journey.tsx");

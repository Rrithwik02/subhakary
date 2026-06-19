const fs = require('fs');
let code = fs.readFileSync('src/pages/WeddingDashboard.tsx', 'utf8');

code = code.replace(
  '<div className="min-h-screen bg-background">\r\n      <SEOHead title={`${event.name} | Wedding Dashboard`} description="Manage vendors, budget and tasks for your wedding." />\r\n      <Navbar />\r\n      <main className="container mx-auto px-4 py-8 max-w-6xl">',
  '<div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">\r\n      <SEOHead title={`${event.name} | Wedding Dashboard`} description="Manage vendors, budget and tasks for your wedding." />\r\n      <Navbar />\r\n      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none" />\r\n      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl rounded-full translate-y-1/3 -translate-x-1/3 opacity-50 pointer-events-none" />\r\n      <main className="container mx-auto px-4 py-32 max-w-6xl relative z-10">'
);

// Update generic Card instances to glass-card
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">\r\n          <Card>',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">\r\n          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">'
);
code = code.replace(
  /          <Card>/g,
  '          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">'
);

// Progress hero update
code = code.replace(
  '<Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">',
  '<Card className="mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-elevated relative overflow-hidden">\r\n          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">\r\n             <Heart className="w-48 h-48" />\r\n          </div>'
);

// Next step card update
code = code.replace(
  '<Card className="mb-8 border-primary/20">',
  '<Card className="mb-8 border-primary/20 bg-background/50 backdrop-blur shadow-sm">'
);

code = code.replace(
  '<Card className="mt-6">',
  '<Card className="mt-6 glass-card shadow-elevated border-border/40">'
);

fs.writeFileSync('src/pages/WeddingDashboard.tsx', code);
console.log("Updated WeddingDashboard.tsx");

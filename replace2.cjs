const fs = require('fs');
let code = fs.readFileSync('src/pages/Providers.tsx', 'utf8');

code = code.replace(
  '<div className="min-h-screen bg-background">',
  '<div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-12">'
);

code = code.replace(
  '<section className="pt-24 md:pt-32 pb-6 md:pb-12 px-4 bg-gradient-to-b from-muted to-background">',
  '<section className="pt-24 md:pt-32 pb-6 md:pb-12 px-4 relative">\r\n        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background z-0" />'
);

code = code.replace(
  '<div className="container max-w-6xl mx-auto">',
  '<div className="container max-w-6xl mx-auto relative z-10">'
);

code = code.replace(
  '<Card className="hover-lift cursor-pointer h-full bg-card border-border/50 overflow-hidden group">',
  '<div className="hover-lift cursor-pointer h-full glass-card rounded-2xl border border-border/40 overflow-hidden group relative">\r\n                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />\r\n                      <div className="p-4 md:p-6 relative z-10">'
);

code = code.replace(
  '                      </CardContent>\r\n                    </Card>',
  '                      </div>\r\n                    </div>'
);

fs.writeFileSync('src/pages/Providers.tsx', code);
console.log("Updated Providers.tsx");

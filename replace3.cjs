const fs = require('fs');
let code = fs.readFileSync('src/pages/PlanWedding.tsx', 'utf8');

code = code.replace(
  '<div className="min-h-screen bg-background">',
  '<div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background pb-12 relative">\r\n      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />\r\n      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl rounded-full translate-y-1/2 -translate-x-1/2 opacity-50 pointer-events-none" />'
);

code = code.replace(
  '<Card>',
  '<div className="glass-card rounded-3xl overflow-hidden shadow-elevated border border-border/40 p-2 md:p-4 relative z-10 bg-card/80 backdrop-blur-xl">'
);

code = code.replace(
  '        <Progress value={progress} className="mb-6 h-2" />',
  '        <div className="max-w-md mx-auto mb-8 bg-background/50 p-1 rounded-full border border-border/50">\r\n          <Progress value={progress} className="h-2 rounded-full" />\r\n        </div>'
);

code = code.replace(
  '<CardHeader>',
  '<div className="pb-4 border-b border-border/50 mb-6">'
);

code = code.replace(
  '<CardTitle>',
  '<h2 className="font-display text-2xl font-bold mb-1">'
);

code = code.replace(
  '</CardTitle>',
  '</h2>'
);

code = code.replace(
  '<CardDescription>',
  '<p className="text-muted-foreground">'
);

code = code.replace(
  '</CardDescription>',
  '</p>'
);

code = code.replace(
  '</CardHeader>',
  '</div>'
);

code = code.replace(
  '<CardContent className="space-y-4">',
  '<div className="space-y-6">'
);

code = code.replace(
  '</CardContent>',
  '</div>'
);

code = code.replace(
  '          </main>',
  '        </div>\r\n      </main>'
);

fs.writeFileSync('src/pages/PlanWedding.tsx', code);
console.log("Updated PlanWedding.tsx");

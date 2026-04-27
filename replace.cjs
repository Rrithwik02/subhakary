const fs = require('fs');
let code = fs.readFileSync('src/pages/ProviderProfile.tsx', 'utf8');

// 1. Background gradient
code = code.replace(
  '<div className="min-h-screen bg-background">\r\n      <Navbar />\r\n\r\n      <section className="pt-20 md:pt-32 pb-12 px-3 md:px-4">\r\n        <div className="container max-w-4xl mx-auto">',
  '<div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">\r\n      <Navbar />\r\n\r\n      <section className="pt-20 md:pt-32 pb-12 px-3 md:px-4">\r\n        <div className="container max-w-4xl mx-auto">'
);

// 2. Header Card -> glass-card
code = code.replace(
  '<Card className="mb-4 md:mb-6">\r\n              <CardContent className="p-3 md:p-8">',
  '<div className="glass-card rounded-2xl mb-4 md:mb-8 overflow-hidden relative shadow-elevated border border-border/40">\r\n              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent z-0" />\r\n              <div className="p-3 md:p-8 relative z-10">'
);
code = code.replace(
  '              </CardContent>\r\n            </Card>\r\n\r\n            {/* Mobile action buttons',
  '              </div>\r\n            </div>\r\n\r\n            {/* Mobile action buttons'
);

// 3. About section -> glass-card
code = code.replace(
  '<Card>\r\n                  <CardHeader className="pb-2 p-3 md:p-6 md:pb-4">\r\n                    <CardTitle className="font-display text-base md:text-xl">About</CardTitle>\r\n                  </CardHeader>\r\n                  <CardContent className="pt-0 px-3 pb-3 md:px-6 md:pb-6">',
  '<div className="glass-card rounded-2xl overflow-hidden shadow-elevated border border-border/40 mb-6">\r\n                  <div className="pb-2 p-4 md:p-6 md:pb-4 border-b border-border/20 bg-muted/20">\r\n                    <h3 className="font-display text-lg md:text-xl font-bold flex items-center gap-2">About</h3>\r\n                  </div>\r\n                  <div className="pt-4 px-4 pb-4 md:px-6 md:pb-6">'
);
code = code.replace(
  '                  </CardContent>\r\n                </Card>\r\n\r\n                {/* Service details',
  '                  </div>\r\n                </div>\r\n\r\n                {/* Service details'
);

// 4. Service Category -> glass-card
code = code.replace(
  '<Card>\r\n                    <CardHeader className="pb-2 p-3 md:p-6 md:pb-4">\r\n                      <CardTitle className="font-display text-base md:text-xl">Service Category</CardTitle>\r\n                    </CardHeader>\r\n                    <CardContent className="pt-0 px-3 pb-3 md:px-6 md:pb-6">',
  '<div className="glass-card rounded-2xl overflow-hidden shadow-elevated border border-border/40 mb-6">\r\n                    <div className="pb-2 p-4 md:p-6 md:pb-4 border-b border-border/20 bg-muted/20">\r\n                      <h3 className="font-display text-lg md:text-xl font-bold flex items-center gap-2">Service Category</h3>\r\n                    </div>\r\n                    <div className="pt-4 px-4 pb-4 md:px-6 md:pb-6">'
);
code = code.replace(
  '                    </CardContent>\r\n                  </Card>\r\n                )}\r\n\r\n                {/* Service Packages',
  '                    </div>\r\n                  </div>\r\n                )}\r\n\r\n                {/* Service Packages'
);

// 5. Booking Sidebar
code = code.replace(
  '<Card className="sticky top-28">\r\n                  <CardHeader>\r\n                    <CardTitle className="font-display">Connect with Provider</CardTitle>\r\n                  </CardHeader>\r\n                  <CardContent className="space-y-4">',
  '<div className="sticky top-28 glass-card rounded-2xl border border-primary/20 shadow-elevated overflow-hidden">\r\n                  <div className="bg-primary/5 pb-4 p-6">\r\n                    <h3 className="font-display text-xl font-bold">Connect with Provider</h3>\r\n                  </div>\r\n                  <div className="space-y-4 p-6 pt-2">'
);
code = code.replace(
  '                    </Button>\r\n                  </CardContent>\r\n                </Card>',
  '                    </Button>\r\n                  </div>\r\n                </div>'
);

fs.writeFileSync('src/pages/ProviderProfile.tsx', code);
console.log("Updated ProviderProfile.tsx");

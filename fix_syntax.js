const fs = require('fs');

const files = [
  "apps/web/src/app/dashboard/billing/page.tsx",
  "apps/web/src/app/dashboard/native-meeting/page.tsx",
  "apps/web/src/app/dashboard/native-meeting/[id]/page.tsx",
  "apps/web/src/app/dashboard/channels/page.tsx",
  "apps/web/src/app/dashboard/external-meeting/page.tsx",
  "apps/web/src/app/dashboard/external-meeting/[id]/page.tsx",
  "apps/web/src/app/dashboard/page.tsx",
  "apps/web/src/app/dashboard/settings/page.tsx",
  "apps/web/src/app/dashboard/statistics/page.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Replace the incorrect </ > at the end of the file back to </div>
  // Wait, let's just find the last </ > and change it to </div> if it's inside another component.
  // Actually, we know that my previous script did:
  // content.lastIndexOf('</div>') and replaced it with </>.
  // So the last </ > in the file is the one we want to change back to </div>.
  const lastFragmentIndex = content.lastIndexOf('</>');
  if (lastFragmentIndex !== -1) {
      content = content.substring(0, lastFragmentIndex) + '</div>' + content.substring(lastFragmentIndex + 3);
  }
  
  // 2. Now we need to find the </div> that closes the main page component and change it to </>.
  // All the page components end with:
  //       </main>
  //     </div>
  //   );
  // }
  // OR
  //     </div>
  //   );
  // }
  
  content = content.replace(/<\/main>\n\s*<\/div>\n\s*\);/g, '</main>\n    </>\n  );');
  content = content.replace(/\{?\/\*\s*Main Content Area\s*\*\/\}?\n\s*<\/div>\n\s*\);/g, '{/* Main Content Area */}\n    </>\n  );');
  
  // Some files might not have </main>, they might just have </div>
  // Let's do a more robust regex for the component's closing </div>:
  // It's the </div> that is followed by \n  );\n}
  content = content.replace(/<\/div>(\s*\);\s*\n})/g, '</>$1');
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}

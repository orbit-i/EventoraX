import fs from 'fs';
import path from 'path';

const roots = [
  'src',
  'routes',
  'services',
  'middleware',
  'scripts',
  'README.md',
  'docker-compose.yml',
  'Dockerfile',
  '.htaccess',
  'info.md'
];

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.md', '.yml', '.yaml', '.htaccess', '.txt', '.sql'];

let totalReplacements = 0;
let modifiedFiles = 0;

function processFile(filePath) {
  try {
    const ext = path.extname(filePath);
    const base = path.basename(filePath);
    if (!extensions.includes(ext) && !['.htaccess', 'Dockerfile'].includes(base)) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Ordered replacements to avoid collisions
    content = content.replace(/EVENTRYE/g, 'EVENTRYE');
    content = content.replace(/Eventrye/g, 'Eventrye');
    content = content.replace(/Eventrye/g, 'Eventrye');
    content = content.replace(/eventrye/g, 'eventrye');
    content = content.replace(/Eventrye/g, 'Eventrye');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      const matchCount = (original.match(/eventrye|eventora/gi) || []).length;
      totalReplacements += matchCount;
      console.log(`Updated: ${filePath} (${matchCount} occurrences)`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

for (const target of roots) {
  if (fs.existsSync(target)) {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      walkDir(target);
    } else {
      processFile(target);
    }
  }
}

console.log(`\n===========================================`);
console.log(`Rebranding to Eventrye complete!`);
console.log(`Total Files Modified: ${modifiedFiles}`);
console.log(`Total Occurrences Replaced: ${totalReplacements}`);
console.log(`===========================================`);

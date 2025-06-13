const fs = require('fs');
const path = require('path');

// Function to process console statements for production
function removeConsoleStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace console.log, console.error, console.warn with empty functions in production
  const processedContent = content
    .replace(/console\.log\([^)]*\);?/g, '// console.log removed for production')
    .replace(/console\.error\([^)]*\);?/g, '// console.error removed for production')  
    .replace(/console\.warn\([^)]*\);?/g, '// console.warn removed for production');
  
  if (content !== processedContent) {
    fs.writeFileSync(filePath, processedContent);
    console.log(`Processed: ${filePath}`);
  }
}

// Function to process all TypeScript/JavaScript files
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
      removeConsoleStatements(fullPath);
    }
  });
}

// Start processing from app, components, services, hooks directories
const dirsToProcess = ['app', 'components', 'services', 'hooks'];

dirsToProcess.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Processing ${dir} directory...`);
    processDirectory(dir);
  }
});

console.log('Console statement removal complete for production build!'); 
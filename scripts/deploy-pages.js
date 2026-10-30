import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
const passLine = out.split('\n').find(l => l.startsWith('password='));
const token = passLine.replace('password=', '').trim();
const pushUrl = `https://${token}@github.com/loicalyra-maker/spoot-music.git`;

console.log('Building for GitHub Pages...');
// Ensure base is configured or relative
const distDir = path.join(process.cwd(), 'dist');

// Push dist directly to gh-pages branch
const tempDir = path.join(process.cwd(), '.gh_pages_temp');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

// Copy dist to tempDir
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => copyRecursiveSync(path.join(src, child), path.join(dest, child)));
  } else {
    fs.copyFileSync(src, dest);
  }
}
copyRecursiveSync(distDir, tempDir);

// Add .nojekyll so files like _* or assets aren't ignored by Jekyll
fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');

try {
  execSync('git init', { cwd: tempDir, stdio: 'inherit' });
  execSync('git add -A', { cwd: tempDir, stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { cwd: tempDir, stdio: 'inherit' });
  execSync('git branch -M gh-pages', { cwd: tempDir, stdio: 'inherit' });
  execSync(`git push "${pushUrl}" gh-pages --force`, { cwd: tempDir, stdio: 'inherit' });
  console.log('gh-pages branch updated!');
} catch (e) {
  console.error('Failed to push gh-pages:', e.message);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Enable Pages via API
console.log('Enabling GitHub Pages on repository...');
fetch('https://api.github.com/repos/loicalyra-maker/spoot-music/pages', {
  method: 'POST',
  headers: {
    'Authorization': 'token ' + token,
    'User-Agent': 'node',
    'Accept': 'application/vnd.github+json'
  },
  body: JSON.stringify({
    source: {
      branch: 'gh-pages',
      path: '/'
    }
  })
})
.then(r => r.json())
.then(data => {
  console.log('GitHub Pages status:', data.status || data.message || data.html_url);
})
.catch(err => console.error('Pages API error:', err));

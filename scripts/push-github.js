import { execSync } from 'child_process';

const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
const passLine = out.split('\n').find(l => l.startsWith('password='));
if (!passLine) {
  throw new Error('No GitHub token found in credential manager');
}
const token = passLine.replace('password=', '').trim();

try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Spoot Music autonomous cloud release"', { stdio: 'inherit' });
  execSync('git branch -M main', { stdio: 'inherit' });

  const pushUrl = `https://${token}@github.com/loicalyra-maker/spoot-music.git`;
  console.log('Pushing code to https://github.com/loicalyra-maker/spoot-music...');
  execSync(`git push -u "${pushUrl}" main --force`, { stdio: 'inherit' });
  console.log('Push complete!');
} catch (e) {
  console.error('Git operation failed:', e.message);
}

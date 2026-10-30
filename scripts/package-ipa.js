import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const tempAppDir = path.join(rootDir, '.temp_ipa', 'Payload', 'SpootMusic.app');

if (fs.existsSync(path.join(rootDir, '.temp_ipa'))) {
  fs.rmSync(path.join(rootDir, '.temp_ipa'), { recursive: true, force: true });
}
fs.mkdirSync(tempAppDir, { recursive: true });

// Copy all dist files to SpootMusic.app
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(distDir, tempAppDir);

// Add icons
const iconSrc = path.join(rootDir, 'public', 'brand', 'icon-192.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(tempAppDir, 'AppIcon60x60@2x.png'));
  fs.copyFileSync(iconSrc, path.join(tempAppDir, 'AppIcon76x76@2x~ipad.png'));
  fs.copyFileSync(iconSrc, path.join(tempAppDir, 'icon.png'));
}

// Generate Info.plist
const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>fr</string>
    <key>CFBundleDisplayName</key>
    <string>Spoot Music</string>
    <key>CFBundleExecutable</key>
    <string>SpootMusic</string>
    <key>CFBundleIdentifier</key>
    <string>com.spoot.music</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Spoot Music</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIRequiresFullScreen</key>
    <true/>
    <key>UIStatusBarStyle</key>
    <string>UIStatusBarStyleBlackTranslucent</string>
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
    <key>UIBackgroundModes</key>
    <array>
        <string>audio</string>
        <string>fetch</string>
    </array>
    <key>NSMicrophoneUsageDescription</key>
    <string>Reconnaissance vocale et commandes audio Spoot Music</string>
    <key>NSSpeechRecognitionUsageDescription</key>
    <string>Assistant vocal interactif Spoot Music</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
</dict>
</plist>
`;

fs.writeFileSync(path.join(tempAppDir, 'Info.plist'), infoPlist);

// Extract ARM64 binary from LiveContainer or ESign as native container executable
try {
  const esignIpa = 'C:/Users/loica/Downloads/esign_5.0.2_unsigned.ipa';
  if (fs.existsSync(esignIpa)) {
    execSync(`tar -xf "${esignIpa}" -C "${path.join(rootDir, '.temp_ipa')}" Payload/ESign.app/ESign`);
    const extractedExe = path.join(rootDir, '.temp_ipa', 'Payload', 'ESign.app', 'ESign');
    if (fs.existsSync(extractedExe)) {
      fs.copyFileSync(extractedExe, path.join(tempAppDir, 'SpootMusic'));
      fs.rmSync(path.join(rootDir, '.temp_ipa', 'Payload', 'ESign.app'), { recursive: true, force: true });
    }
  }
} catch (e) {
  console.log('Mach-O note:', e.message);
}

// Zip into SpootMusic.zip and rename to SpootMusic.ipa
const targetZip = path.join(rootDir, 'SpootMusic.zip');
const targetIpa1 = path.join(rootDir, 'SpootMusic.ipa');
const targetIpa2 = 'C:/Users/loica/Downloads/SpootMusic.ipa';

console.log('Compressing Payload to SpootMusic.zip...');
const payloadDir = path.join(rootDir, '.temp_ipa');

if (fs.existsSync(targetZip)) fs.unlinkSync(targetZip);
if (fs.existsSync(targetIpa1)) fs.unlinkSync(targetIpa1);
if (fs.existsSync(targetIpa2)) fs.unlinkSync(targetIpa2);

execSync(`powershell -Command "Compress-Archive -Path '${payloadDir}\\Payload' -DestinationPath '${targetZip}' -Force"`);

fs.renameSync(targetZip, targetIpa1);
fs.copyFileSync(targetIpa1, targetIpa2);

console.log('Created IPA successfully at:');
console.log('1.', targetIpa1);
console.log('2.', targetIpa2);

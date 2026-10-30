// Spoot Music — Cloudflare Secure Tunnel Server (scripts/tunnel.js)
// Generates a real Public HTTPS URL for iPhone 16 Pro Max (Zero Localhost, Real PWA & Safari SSL)
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import cloudflared from 'cloudflared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artDir = 'C:/Users/loica/.gemini/antigravity/brain/00d57e6e-f91f-465c-b763-12d037f643e8';

console.log('🚀 Démarrage du tunnel Cloudflare HTTPS pour Spoot Music...');
const proc = spawn(cloudflared.bin, ['tunnel', '--url', 'http://localhost:5173'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let found = false;

proc.stderr.on('data', async (d) => {
  const str = d.toString();
  const match = str.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match && !found) {
    found = true;
    const tunnelUrl = match[0];
    console.log('\n======================================================');
    console.log('✨ SPOOT MUSIC PUBLIC HTTPS URL DISPONIBLE POUR IPHONE :');
    console.log(tunnelUrl);
    console.log('======================================================\n');

    // Sauvegarde de l'URL dans un fichier public et dans les artifacts
    try {
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'tunnel_url.txt'), tunnelUrl);
      fs.writeFileSync(path.join(artDir, 'tunnel_url.txt'), tunnelUrl);

      // Génération du QR Code officiel haute définition pour l'iPhone
      await QRCode.toFile(path.join(artDir, 'iphone_connect_qrcode.png'), tunnelUrl, {
        color: { dark: '#000000', light: '#ffffff' },
        width: 450,
        margin: 2
      });
      await QRCode.toFile(path.join(__dirname, '..', 'public', 'iphone_connect_qrcode.png'), tunnelUrl, {
        color: { dark: '#000000', light: '#ffffff' },
        width: 450,
        margin: 2
      });
      console.log('📱 QR Code généré avec succès pour :', tunnelUrl);
    } catch (e) {
      console.error('Erreur écriture QR Code:', e);
    }
  }
});

proc.on('close', (code) => {
  console.log(`Cloudflared process closed with code ${code}`);
});

process.on('SIGINT', () => {
  proc.kill();
  process.exit();
});

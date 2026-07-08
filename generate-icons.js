import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

// Native fetch is available in Node 22
async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  console.log(`Downloading: ${url} -> ${destPath}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
  console.log(`Saved: ${destPath}`);
}

async function main() {
  const logoUrl = 'https://i.postimg.cc/43jrNgQY/Chat-GPT-Image-1-de-jul-de-2026-16-01-26.png';
  
  // 1. Create directory structures
  const bgDir = 'public/bg';
  const fontsDir = 'public/fonts';
  if (!fs.existsSync(bgDir)) fs.mkdirSync(bgDir, { recursive: true });
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

  // 2. Generate icons with Jimp
  try {
    console.log('Reading logo from URL:', logoUrl);
    const logo = await Jimp.read(logoUrl);
    
    console.log('Creating black background of 512x512...');
    const bg512 = new Jimp({ width: 512, height: 512, color: 0x000000FF });
    
    const targetWidth = 410;
    const targetHeight = 410;
    logo.contain({ w: targetWidth, h: targetHeight });
    
    const x = (512 - targetWidth) / 2;
    const y = (512 - targetHeight) / 2;
    bg512.composite(logo, x, y);
    
    await bg512.write('public/icon-512.png');
    console.log('Saved public/icon-512.png successfully!');
    
    const bg192 = bg512.clone().resize({ w: 192, h: 192 });
    await bg192.write('public/icon-192.png');
    console.log('Saved public/icon-192.png successfully!');
    
    const bg180 = bg512.clone().resize({ w: 180, h: 180 });
    await bg180.write('public/apple-touch-icon.png');
    console.log('Saved public/apple-touch-icon.png successfully!');
    
    // Also save a copy of logo to public
    await logo.write('public/logo-opera.png');
    console.log('Saved public/logo-opera.png successfully!');
  } catch (err) {
    console.error('Error with Jimp icon generation:', err);
  }

  // 3. Download Background Images for offline usage
  const bgImages = {
    'pesadas_walletFront.jpg': 'https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg',
    'pesadas_walletBack.jpg': 'https://i.postimg.cc/rstdJnKv/Whats-App-Image-2026-06-26-at-11-02-19-(1).jpg',
    'pesadas_certFront.jpg': 'https://i.postimg.cc/5yjSFdtt/Whats-App-Image-2026-07-01-at-14-24-26.jpg',
    'pesadas_certBack.jpg': 'https://i.postimg.cc/7LYnV4wb/Whats-App-Image-2026-06-26-at-11-02-20.jpg',
    
    'agricolas_walletFront.jpg': 'https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg',
    'agricolas_walletBack.jpg': 'https://i.postimg.cc/zBFckr5w/Whats-App-Image-2026-07-01-at-14-33-36.jpg',
    'agricolas_certFront.jpg': 'https://i.postimg.cc/kXXkfB2t/Whats-App-Image-2026-07-01-at-14-33-37-(1).jpg',
    'agricolas_certBack.jpg': 'https://i.postimg.cc/zfWMVhcC/Whats-App-Image-2026-07-01-at-14-33-37.jpg',
    
    'munck_walletFront.jpg': 'https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg',
    'munck_walletBack.jpg': 'https://i.postimg.cc/gkQN8JR4/Whats-App-Image-2026-07-01-at-15-03-20-(2).jpg',
    'munck_certFront.jpg': 'https://i.postimg.cc/pr1k0VSG/Whats-App-Image-2026-07-01-at-15-03-20-(1).jpg',
    'munck_certBack.jpg': 'https://i.postimg.cc/d08HqYhz/Whats-App-Image-2026-07-01-at-15-03-20.jpg',

    'empilhadeira_walletFront.jpg': 'https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg',
    'empilhadeira_walletBack.jpg': 'https://i.postimg.cc/wvLDhJy3/Whats-App-Image-2026-07-01-at-17-29-11.jpg',
    'empilhadeira_certFront.jpg': 'https://i.postimg.cc/RZp19vxx/Whats-App-Image-2026-07-01-at-17-29-11-(1).jpg',
    'empilhadeira_certBack.jpg': 'https://i.postimg.cc/PJbzkZTF/Whats-App-Image-2026-07-01-at-17-29-12.jpg',

    'florestais_walletFront.jpg': 'https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg',
    'florestais_walletBack.jpg': 'https://i.postimg.cc/xCDzTCxQ/Whats-App-Image-2026-07-01-at-17-37-38.jpg',
    'florestais_certFront.jpg': 'https://i.postimg.cc/Qdz7wScF/Whats-App-Image-2026-07-01-at-17-37-39.jpg',
    'florestais_certBack.jpg': 'https://i.postimg.cc/tCXFxsXH/Whats-App-Image-2026-07-01-at-17-37-39-(1).jpg'
  };

  console.log('Downloading background images...');
  for (const [filename, url] of Object.entries(bgImages)) {
    try {
      await downloadFile(url, path.join(bgDir, filename));
    } catch (e) {
      console.error(`Failed to download background ${filename}:`, e);
    }
  }

  // 4. Download Google Fonts for offline usage
  console.log('Downloading Google Fonts...');
  const fontsCssUrl = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap';
  
  try {
    const res = await fetch(fontsCssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch Google Fonts CSS: ${res.statusText}`);
    }
    
    let cssText = await res.text();
    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^\)]+)\)/g;
    let match;
    const fontUrls = [];
    
    while ((match = urlRegex.exec(cssText)) !== null) {
      fontUrls.push(match[1]);
    }
    
    console.log(`Found ${fontUrls.length} font files to download.`);
    
    // De-duplicate font URLs
    const uniqueFontUrls = [...new Set(fontUrls)];
    
    for (let i = 0; i < uniqueFontUrls.length; i++) {
      const url = uniqueFontUrls[i];
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      // Get the last segments of pathname to name the font file uniquely
      const cleanName = pathname.replace(/\//g, '_');
      const fontLocalPath = path.join(fontsDir, cleanName);
      
      try {
        await downloadFile(url, fontLocalPath);
        // Replace in CSS file (use relative route since fonts.css will be loaded in public/fonts/)
        cssText = cssText.replaceAll(url, `./${cleanName}`);
      } catch (err) {
        console.error(`Error downloading font ${url}:`, err);
      }
    }
    
    fs.writeFileSync(path.join(fontsDir, 'fonts.css'), cssText);
    console.log('Saved public/fonts/fonts.css successfully!');
  } catch (err) {
    console.error('Error fetching Google Fonts:', err);
  }
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

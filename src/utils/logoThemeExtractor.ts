export interface ExtractedPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutralBg: string;
  lightAccent: string;
  textDark: string;
}

export const DEFAULT_PALETTE: ExtractedPalette = {
  primary: "#0f5a47",       // Deep professional emerald/green
  secondary: "#1e293b",     // Elegant corporate slate
  accent: "#d97706",        // Warm amber/gold highlight
  neutralBg: "#f8fafc",     // Soft white neutral background
  lightAccent: "#f1f5f9",   // Light slate/gray
  textDark: "#0f172a"
};

// Convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export async function extractPaletteFromLogo(imageUrl: string = "/image.png"): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    if (imageUrl && !imageUrl.startsWith("/")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }
        ctx.drawImage(img, 0, 0, 32, 32);
        const imgData = ctx.getImageData(0, 0, 32, 32).data;

        const counts: { [key: string]: number } = {};
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip low alpha (transparent) or extremely dark / light background pixels
          if (a < 180) continue;
          
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 240 || brightness < 20) continue;

          // Bucket slightly to group similar tones
          const bin = 24;
          const br = Math.round(r / bin) * bin;
          const bg = Math.round(g / bin) * bin;
          const bb = Math.round(b / bin) * bin;
          const key = `${br},${bg},${bb}`;
          counts[key] = (counts[key] || 0) + 1;
        }

        const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

        if (sorted.length === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        // 1. Dominant color (Primary)
        const [r1, g1, b1] = sorted[0].split(",").map(Number);
        const primary = rgbToHex(r1, g1, b1);

        // 2. Complementary / Secondary color
        let secondary = DEFAULT_PALETTE.secondary;
        for (let i = 1; i < sorted.length; i++) {
          const [r2, g2, b2] = sorted[i].split(",").map(Number);
          const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
          if (diff > 100) {
            secondary = rgbToHex(r2, g2, b2);
            break;
          }
        }

        // 3. Accent (High contrast / Vibrant)
        let accent = DEFAULT_PALETTE.accent;
        for (let i = 1; i < sorted.length; i++) {
          const [r2, g2, b2] = sorted[i].split(",").map(Number);
          const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
          const isVibrant = Math.max(r2, g2, b2) - Math.min(r2, g2, b2) > 50;
          if (isVibrant && diff > 140) {
            accent = rgbToHex(r2, g2, b2);
            break;
          }
        }

        // Create light/desaturated theme variations using HSL
        const hsl = rgbToHsl(r1, g1, b1);
        const neutralBg = `hsl(${hsl.h}, ${Math.min(hsl.s, 12)}%, 98.5%)`;
        const lightAccent = `hsl(${hsl.h}, ${Math.min(hsl.s, 24)}%, 94%)`;

        resolve({
          primary,
          secondary,
          accent,
          neutralBg,
          lightAccent,
          textDark: "#0f172a"
        });
      } catch (err) {
        console.warn("CORS or drawing issue extracting palette, using defaults:", err);
        resolve(DEFAULT_PALETTE);
      }
    };
    img.onerror = () => {
      console.warn("Could not load image for extraction, using fallback palette");
      resolve(DEFAULT_PALETTE);
    };
    img.src = imageUrl;
  });
}

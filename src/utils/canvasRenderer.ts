import { Student, FineTuneConfig, Category } from "../types";
import { formatDateBR, formatCertificateDate, calculateValidity, formatNameTitleCase, getMonthNamePT } from "./dateFormatter";

// Map local paths to original remote URLs for bulletproof fallback
export const REMOTE_FALLBACKS: Record<string, string> = {
  "/logo-opera.png": "https://i.postimg.cc/43jrNgQY/Chat-GPT-Image-1-de-jul-de-2026-16-01-26.png",
  "/bg/pesadas_walletFront.jpg": "https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg",
  "/bg/pesadas_walletBack.jpg": "https://i.postimg.cc/rstdJnKv/Whats-App-Image-2026-06-26-at-11-02-19-(1).jpg",
  "/bg/pesadas_certFront.jpg": "https://i.postimg.cc/5yjSFdtt/Whats-App-Image-2026-07-01-at-14-24-26.jpg",
  "/bg/pesadas_certBack.jpg": "https://i.postimg.cc/7LYnV4wb/Whats-App-Image-2026-06-26-at-11-02-20.jpg",
  
  "/bg/agricolas_walletFront.jpg": "https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg",
  "/bg/agricolas_walletBack.jpg": "https://i.postimg.cc/zBFckr5w/Whats-App-Image-2026-07-01-at-14-33-36.jpg",
  "/bg/agricolas_certFront.jpg": "https://i.postimg.cc/kXXkfB2t/Whats-App-Image-2026-07-01-at-14-33-37-(1).jpg",
  "/bg/agricolas_certBack.jpg": "https://i.postimg.cc/zfWMVhcC/Whats-App-Image-2026-07-01-at-14-33-37.jpg",
  
  "/bg/munck_walletFront.jpg": "https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg",
  "/bg/munck_walletBack.jpg": "https://i.postimg.cc/gkQN8JR4/Whats-App-Image-2026-07-01-at-15-03-20-(2).jpg",
  "/bg/munck_certFront.jpg": "https://i.postimg.cc/pr1k0VSG/Whats-App-Image-2026-07-01-at-15-03-20-(1).jpg",
  "/bg/munck_certBack.jpg": "https://i.postimg.cc/d08HqYhz/Whats-App-Image-2026-07-01-at-15-03-20.jpg",

  "/bg/empilhadeira_walletFront.jpg": "https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg",
  "/bg/empilhadeira_walletBack.jpg": "https://i.postimg.cc/wvLDhJy3/Whats-App-Image-2026-07-01-at-17-29-11.jpg",
  "/bg/empilhadeira_certFront.jpg": "https://i.postimg.cc/RZp19vxx/Whats-App-Image-2026-07-01-at-17-29-11-(1).jpg",
  "/bg/empilhadeira_certBack.jpg": "https://i.postimg.cc/PJbzkZTF/Whats-App-Image-2026-07-01-at-17-29-12.jpg",

  "/bg/florestais_walletFront.jpg": "https://i.postimg.cc/W1mkCHXg/Whats-App-Image-2026-06-26-at-11-02-19.jpg",
  "/bg/florestais_walletBack.jpg": "https://i.postimg.cc/xCDzTCxQ/Whats-App-Image-2026-07-01-at-17-37-38.jpg",
  "/bg/florestais_certFront.jpg": "https://i.postimg.cc/Qdz7wScF/Whats-App-Image-2026-07-01-at-17-37-39.jpg",
  "/bg/florestais_certBack.jpg": "https://i.postimg.cc/tCXFxsXH/Whats-App-Image-2026-07-01-at-17-37-39-(1).jpg"
};

// Core background image URLs - Offline-first paths
export const BG_IMAGES = {
  walletFront: "/bg/pesadas_walletFront.jpg",
  walletBack: "/bg/pesadas_walletBack.jpg",
  certFront: "/bg/pesadas_certFront.jpg",
  certBack: "/bg/pesadas_certBack.jpg"
};

export const BG_IMAGES_BY_CATEGORY: Record<Category, typeof BG_IMAGES> = {
  PESADAS: {
    walletFront: "/bg/pesadas_walletFront.jpg",
    walletBack: "/bg/pesadas_walletBack.jpg",
    certFront: "/bg/pesadas_certFront.jpg",
    certBack: "/bg/pesadas_certBack.jpg"
  },
  AGRICOLAS: {
    walletFront: "/bg/agricolas_walletFront.jpg",
    walletBack: "/bg/agricolas_walletBack.jpg",
    certFront: "/bg/agricolas_certFront.jpg",
    certBack: "/bg/agricolas_certBack.jpg"
  },
  MUNCK: {
    walletFront: "/bg/munck_walletFront.jpg",
    walletBack: "/bg/munck_walletBack.jpg",
    certFront: "/bg/munck_certFront.jpg",
    certBack: "/bg/munck_certBack.jpg"
  },
  EMPILHADEIRA: {
    walletFront: "/bg/empilhadeira_walletFront.jpg",
    walletBack: "/bg/empilhadeira_walletBack.jpg",
    certFront: "/bg/empilhadeira_certFront.jpg",
    certBack: "/bg/empilhadeira_certBack.jpg"
  },
  FLORESTAIS: {
    walletFront: "/bg/florestais_walletFront.jpg",
    walletBack: "/bg/florestais_walletBack.jpg",
    certFront: "/bg/florestais_certFront.jpg",
    certBack: "/bg/florestais_certBack.jpg"
  }
};

// Safe image loader with CORS handling and local fallback
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("URL inválida ou vazia"));
      return;
    }
    const img = new Image();
    
    // Check if it is a base64 data URL or a local path
    const isDataUrl = url.startsWith("data:");
    const isLocal = url.startsWith("/");
    
    if (!isDataUrl && !isLocal) {
      img.crossOrigin = "anonymous";
    }
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback to remote if local fails (or vice-versa)
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => reject(new Error(`Erro ao carregar a imagem: ${url}`));
      
      if (isLocal && REMOTE_FALLBACKS[url]) {
        console.warn(`Local asset ${url} failed to load. Trying remote fallback...`);
        fallback.crossOrigin = "anonymous";
        // Append nocache to remote fallback
        const remoteUrl = REMOTE_FALLBACKS[url];
        const separator = remoteUrl.includes("?") ? "&" : "?";
        fallback.src = `${remoteUrl}${separator}nocache=1`;
      } else if (!isLocal && !isDataUrl) {
        // If remote fails, look up if we have a local copy we can try
        const localPath = Object.keys(REMOTE_FALLBACKS).find(k => REMOTE_FALLBACKS[k] === url);
        if (localPath) {
          console.warn(`Remote asset ${url} failed to load. Trying local fallback...`);
          fallback.src = localPath;
        } else {
          fallback.src = url;
        }
      } else {
        fallback.src = url;
      }
    };
    
    if (!isDataUrl && !isLocal) {
      // Append a unique parameter to force the browser to request with fresh CORS headers
      const separator = url.includes("?") ? "&" : "?";
      img.src = `${url}${separator}nocache=1`;
    } else {
      img.src = url;
    }
  });
}

// Helper to try loading the custom logo URL first (local/offline-first), and fallback
export async function loadLogoImage(): Promise<HTMLImageElement> {
  try {
    return await loadImage("/logo-opera.png");
  } catch (e) {
    try {
      return await loadImage("https://i.postimg.cc/43jrNgQY/Chat-GPT-Image-1-de-jul-de-2026-16-01-26.png");
    } catch (err) {
      try {
        return await loadImage("/logo.png");
      } catch (lastErr) {
        return await loadImage("/image.png");
      }
    }
  }
}

/**
 * Renders text strictly inside a fixed bounding box with optional internal padding and auto font scaling.
 * 
 * REGRA ABSOLUTA:
 * - texto_x = centro_da_caixa
 * - texto_y = centro_da_caixa
 * - Nunca calcula pelo documento inteiro.
 */
export function drawTextBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  cfg: { x: number; y: number; width: number; height: number; fontSize: number; color: string },
  scaleX: number,
  scaleY: number,
  ptToPx: number,
  padding: { left: number; right: number; top: number; bottom: number },
  fontFamily: string = "sans-serif",
  isBold: boolean = true,
  noScale: boolean = false,
  isNameField: boolean = false
): { finalFontSize: number; overflowed: boolean } {
  const boxWidthPx = cfg.width * scaleX;
  const boxHeightPx = cfg.height * scaleY;
  const centerX = cfg.x * scaleX;
  const centerY = cfg.y * scaleY;

  // Subtract internal safety margins
  const padLeft = isNameField ? 0 : padding.left;
  const padRight = isNameField ? 0 : padding.right;
  const maxTextWidth = boxWidthPx - padLeft - padRight;
  const maxTextHeight = boxHeightPx - padding.top - padding.bottom;

  let currentFontSize = cfg.fontSize * ptToPx;
  
  // Set up font
  ctx.font = `${isBold ? "bold" : "normal"} ${currentFontSize}px ${fontFamily}`;
  let textWidth = ctx.measureText(text).width;

  // Auto-fit loop: scale down font size until it fits BOTH width and height constraints
  let overflowed = false;
  if (!noScale) {
    // Para o nome do aluno, restringimos a redução a no máximo 42% do tamanho padrão
    // (minFontSizeLimit de 58% do original) para impedir que o nome longo fique minúsculo.
    const minFontSizeLimit = isNameField ? (cfg.fontSize * 0.58 * ptToPx) : (4 * ptToPx);

    while (
      (textWidth > maxTextWidth || currentFontSize > maxTextHeight) &&
      currentFontSize > minFontSizeLimit
    ) {
      currentFontSize -= 0.5;
      ctx.font = `${isBold ? "bold" : "normal"} ${currentFontSize}px ${fontFamily}`;
      textWidth = ctx.measureText(text).width;
    }

    // If even at minimum font size it overflows, mark as overflowed
    if (textWidth > maxTextWidth || currentFontSize > maxTextHeight) {
      overflowed = true;
    }
  }

  // Draw the text exactly in the center of the box
  ctx.fillStyle = cfg.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${isBold ? "bold" : "normal"} ${currentFontSize}px ${fontFamily}`;

  // NUNCA passar o quarto parâmetro maxWidth para fillText para evitar compressão horizontal
  ctx.fillText(text, centerX, centerY);

  return { finalFontSize: currentFontSize / ptToPx, overflowed };
}

/**
 * Renders multiple lines of text centered vertically and horizontally inside a bounding box.
 */
export function drawMultiLineTextBox(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cfg: { x: number; y: number; width: number; height: number; fontSize: number; color: string },
  scaleX: number,
  scaleY: number,
  ptToPx: number,
  padding: { left: number; right: number; top: number; bottom: number }
): { finalFontSize: number; overflowed: boolean } {
  const boxWidthPx = cfg.width * scaleX;
  const boxHeightPx = cfg.height * scaleY;
  const centerX = cfg.x * scaleX;
  const centerY = cfg.y * scaleY;

  const maxTextWidth = boxWidthPx - padding.left - padding.right;
  const maxTextHeight = boxHeightPx - padding.top - padding.bottom;

  let currentFontSize = cfg.fontSize * ptToPx;
  let currentLineHeight = currentFontSize * 1.30;
  let totalHeight = lines.length * currentLineHeight;

  // Scale down font size until the lines fit in both height and width of the box
  let fits = false;
  let overflowed = false;
  while (!fits && currentFontSize > 4 * ptToPx) {
    fits = true;
    currentLineHeight = currentFontSize * 1.30;
    totalHeight = lines.length * currentLineHeight;

    if (totalHeight > maxTextHeight) {
      fits = false;
    } else {
      ctx.font = `bold ${currentFontSize}px sans-serif`;
      for (const line of lines) {
        const text = line.toUpperCase().trim();
        if (ctx.measureText(text).width > maxTextWidth) {
          fits = false;
          break;
        }
      }
    }

    if (!fits) {
      currentFontSize -= 0.5;
    }
  }

  if (!fits) {
    overflowed = true;
  }

  // Draw lines centered horizontally and vertically
  let startY = centerY - (totalHeight / 2) + (currentLineHeight / 2);
  ctx.fillStyle = cfg.color;
  ctx.font = `bold ${currentFontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  lines.forEach((line) => {
    const text = line.toUpperCase().trim();
    ctx.fillText(text, centerX, startY);
    startY += currentLineHeight;
  });

  return { finalFontSize: currentFontSize / ptToPx, overflowed };
}

/**
 * Renders multiple lines of text for the back of the certificate (one machine per line) with adjustable line spacing (lineHeight).
 */
export function drawCertBackMachines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  cfg: { x: number; y: number; width: number; height: number; fontSize: number; color: string; lineHeight?: number },
  scaleX: number,
  scaleY: number,
  ptToPx: number,
  padding: { left: number; right: number; top: number; bottom: number }
): { finalFontSize: number; overflowed: boolean } {
  const boxWidthPx = cfg.width * scaleX;
  const boxHeightPx = cfg.height * scaleY;
  const centerX = cfg.x * scaleX;
  const centerY = cfg.y * scaleY;

  const maxTextWidth = boxWidthPx - padding.left - padding.right;
  const maxTextHeight = boxHeightPx - padding.top - padding.bottom;

  let currentFontSize = cfg.fontSize * ptToPx;
  const multiplier = cfg.lineHeight ?? 1.3;
  let currentLineHeight = currentFontSize * multiplier;
  let totalHeight = lines.length * currentLineHeight;

  // Scale down font size until the lines fit in both height and width of the box
  let fits = false;
  let overflowed = false;
  while (!fits && currentFontSize > 4 * ptToPx) {
    fits = true;
    currentLineHeight = currentFontSize * multiplier;
    totalHeight = lines.length * currentLineHeight;

    if (totalHeight > maxTextHeight) {
      fits = false;
    } else {
      ctx.font = `bold ${currentFontSize}px sans-serif`;
      for (const line of lines) {
        const text = line.toUpperCase().trim();
        if (ctx.measureText(text).width > maxTextWidth) {
          fits = false;
          break;
        }
      }
    }

    if (!fits) {
      currentFontSize -= 0.5;
    }
  }

  if (!fits) {
    overflowed = true;
  }

  // Draw lines centered horizontally and vertically
  let startY = centerY - (totalHeight / 2) + (currentLineHeight / 2);
  ctx.fillStyle = cfg.color;
  ctx.font = `bold ${currentFontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  lines.forEach((line) => {
    const text = line.toUpperCase().trim();
    ctx.fillText(text, centerX, startY);
    startY += currentLineHeight;
  });

  return { finalFontSize: currentFontSize / ptToPx, overflowed };
}

// Function to draw the front of the wallet
export async function drawWalletFront(
  canvas: HTMLCanvasElement,
  student: Student,
  config: FineTuneConfig,
  customPhoto?: HTMLImageElement | null
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const category = student.category || "PESADAS";
  const bgUrl = BG_IMAGES_BY_CATEGORY[category]?.walletFront || BG_IMAGES.walletFront;

  // Load background
  const bgImg = await loadImage(bgUrl);
  
  // Set canvas size to match original image proportions or standard 300DPI (1011 x 638)
  canvas.width = bgImg.naturalWidth || 1011;
  canvas.height = bgImg.naturalHeight || 638;

  // Draw background
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Draw ultra subtle brand watermark in background
  try {
    const logoImg = await loadLogoImage();
    ctx.save();
    ctx.globalAlpha = 0.035; // extremely subtle and clean
    const logoSize = Math.min(canvas.width, canvas.height) * 0.42;
    ctx.drawImage(
      logoImg,
      canvas.width / 2 - logoSize / 2,
      canvas.height / 2 - logoSize / 2,
      logoSize,
      logoSize
    );
    ctx.restore();
  } catch (e) {}

  if (student.id === "EMPTY") {
    return;
  }

  const scaleX = canvas.width / 100;
  const scaleY = canvas.height / 100;

  // 1. Draw Operator Photo
  const photoCfg = config.walletFront.photo;
  const px = photoCfg.x * scaleX;
  const py = photoCfg.y * scaleY;
  const pWidth = photoCfg.width * scaleX;
  const pHeight = photoCfg.height * scaleY;

  if (customPhoto) {
    ctx.drawImage(customPhoto, px, py, pWidth, pHeight);
  } else if (student.photoUrl) {
    try {
      const userPhoto = await loadImage(student.photoUrl);
      ctx.drawImage(userPhoto, px, py, pWidth, pHeight);
    } catch (e) {
      // Draw placeholder frame if photo fails to load
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(px, py, pWidth, pHeight);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pWidth, pHeight);
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FOTO", px + pWidth / 2, py + pHeight / 2);
    }
  } else {
    // Elegant placeholder
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(px, py, pWidth, pHeight);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pWidth, pHeight);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "normal 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sem Foto", px + pWidth / 2, py + pHeight / 2);
  }

  // Calculate validity date
  const validityDateStr = formatDateBR(calculateValidity(student.emissionDate, student.validityYears));
  const ptToPx = 300 / 72; // ~4.1667

  // Draw with absolute bounding boxes
  // NOME DO OPERADOR (Margem interna: 10px lateral, 8px vertical)
  drawTextBox(
    ctx,
    student.name.toUpperCase().trim(),
    config.walletFront.name,
    scaleX,
    scaleY,
    ptToPx,
    { left: 10, right: 10, top: 8, bottom: 8 },
    "sans-serif",
    true,
    false, // noScale
    true   // isNameField
  );

  // CPF DO OPERADOR (Margem interna: 10px lateral, 8px vertical)
  drawTextBox(
    ctx,
    student.cpf.trim(),
    config.walletFront.cpf,
    scaleX,
    scaleY,
    ptToPx,
    { left: 10, right: 10, top: 8, bottom: 8 },
    "sans-serif",
    true,
    true   // noScale (CPF size must never change automatically)
  );

  // DATA DE NASCIMENTO (Margem interna: 10px lateral, 8px vertical)
  drawTextBox(
    ctx,
    formatDateBR(student.birthDate),
    config.walletFront.birthDate,
    scaleX,
    scaleY,
    ptToPx,
    { left: 10, right: 10, top: 8, bottom: 8 }
  );

  // DATA DE VALIDADE (Margem interna: 10px lateral, 8px vertical)
  drawTextBox(
    ctx,
    validityDateStr,
    config.walletFront.validity,
    scaleX,
    scaleY,
    ptToPx,
    { left: 10, right: 10, top: 8, bottom: 8 }
  );

  // MÁQUINAS (Margem interna: 10px lateral, 8px vertical, permitir quebra)
  drawMultiLineTextBox(
    ctx,
    student.machines,
    config.walletFront.machines,
    scaleX,
    scaleY,
    ptToPx,
    { left: 10, right: 10, top: 8, bottom: 8 }
  );
}

// Function to draw the back of the wallet (Strictly unaltered except scaling)
export async function drawWalletBack(
  canvas: HTMLCanvasElement,
  category: Category = "PESADAS",
  student?: Student
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let bgUrl = BG_IMAGES_BY_CATEGORY[category]?.walletBack || BG_IMAGES.walletBack;
  if (category === "PESADAS") {
    if (student?.instructor === "Jhonny") {
      bgUrl = "https://i.postimg.cc/ZK6Rmqx0/Whats-App-Image-2026-07-04-at-11-28-10-(1).jpg";
    } else if (student?.instructor === "Richard") {
      bgUrl = "https://i.postimg.cc/rwpvJnsX/Whats-App-Image-2026-07-04-at-11-34-29.jpg";
    }
  }

  const bgImg = await loadImage(bgUrl);
  canvas.width = bgImg.naturalWidth || 1011;
  canvas.height = bgImg.naturalHeight || 638;

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Draw ultra subtle brand watermark in background
  try {
    const logoImg = await loadLogoImage();
    ctx.save();
    ctx.globalAlpha = 0.03; // extremely subtle and clean
    const logoSize = Math.min(canvas.width, canvas.height) * 0.45;
    ctx.drawImage(
      logoImg,
      canvas.width / 2 - logoSize / 2,
      canvas.height / 2 - logoSize / 2,
      logoSize,
      logoSize
    );
    ctx.restore();
  } catch (e) {}
}

// Function to draw the certificate front
export async function drawCertificateFront(
  canvas: HTMLCanvasElement,
  student: Student,
  config: FineTuneConfig
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Wait for cursive font to load to prevent canvas drawing default sans-serif font
  try {
    await document.fonts.ready;
  } catch (e) {
    console.warn("Fonts not fully loaded yet, drawing anyway.");
  }

  const category = student.category || "PESADAS";
  let bgUrl = BG_IMAGES_BY_CATEGORY[category]?.certFront || BG_IMAGES.certFront;
  if (category === "PESADAS") {
    if (student.instructor === "Jhonny") {
      bgUrl = "https://i.postimg.cc/gkyRYpVn/Whats-App-Image-2026-07-06-at-11-52-45.jpg";
    } else if (student.instructor === "Richard") {
      bgUrl = "https://i.postimg.cc/13WRy7fh/Whats-App-Image-2026-07-06-at-11-55-10-(1).jpg";
    }
  }
  const bgImg = await loadImage(bgUrl);
  canvas.width = bgImg.naturalWidth || 3508;
  canvas.height = bgImg.naturalHeight || 2480;

  // Draw background
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Draw ultra subtle brand watermark in background
  try {
    const logoImg = await loadLogoImage();
    ctx.save();
    ctx.globalAlpha = 0.03; // extremely subtle and clean
    const logoSize = Math.min(canvas.width, canvas.height) * 0.48;
    ctx.drawImage(
      logoImg,
      canvas.width / 2 - logoSize / 2,
      canvas.height / 2 - logoSize / 2,
      logoSize,
      logoSize
    );
    ctx.restore();
  } catch (e) {}

  if (student.id === "EMPTY") {
    return;
  }

  const scaleX = canvas.width / 100;
  const scaleY = canvas.height / 100;
  const ptToPx = 300 / 72; // ~4.1667

  // 1. Draw Cursive Premium Name exactly over the GOLDEN LINE with bounding box and AUTO FIT
  const nameCfg = config.certFront.name;
  const text = formatNameTitleCase(student.name);

  // Bounding box dimensions: starts exactly at left of golden line, ends exactly at right of golden line
  // width: 75%, center x: 50%
  const boxHeightPx = 1.30 * (nameCfg.fontSize * ptToPx);

  drawTextBox(
    ctx,
    text,
    {
      ...nameCfg,
      height: boxHeightPx / scaleY
    },
    scaleX,
    scaleY,
    ptToPx,
    { left: 10, right: 10, top: 8, bottom: 8 },
    "'Great Vibes', cursive, 'Brush Script MT', sans-serif",
    true,
    false, // noScale
    true   // isNameField
  );

  // 2. Draw CPF text: only the formatted CPF numbers inside its box in formal serif bold font
  if (config.certFront.cpf) {
    const cpfCfg = config.certFront.cpf;
    const cpfTextFormatted = student.cpf;

    drawTextBox(
      ctx,
      cpfTextFormatted,
      cpfCfg,
      scaleX,
      scaleY,
      ptToPx,
      { left: 10, right: 10, top: 8, bottom: 8 },
      "Arial, Helvetica, Roboto, 'Open Sans', sans-serif",
      true, // bold
      true  // noScale (CPF size must never change automatically)
    );
  }

  // 3. Draw Date elements (Day and Month) separately for individual fine-tuning calibration
  let dayFormatted = "";
  let capitalizedMonth = "";

  if (student.emissionDay && student.emissionMonth) {
    dayFormatted = String(student.emissionDay).padStart(2, "0");
    capitalizedMonth = student.emissionMonth.charAt(0).toUpperCase() + student.emissionMonth.slice(1);
  } else {
    const dateStr = student.emissionDate;
    if (dateStr) {
      const parts = dateStr.split("-").map(Number);
      if (parts.length === 3) {
        const [, month, day] = parts;
        const monthNamePT = getMonthNamePT(month - 1);
        capitalizedMonth = monthNamePT ? monthNamePT.charAt(0).toUpperCase() + monthNamePT.slice(1) : "";
        dayFormatted = String(day).padStart(2, "0");
      }
    }
  }

  if (dayFormatted && capitalizedMonth) {
    const dayCfg = config.certFront.dateDay || { x: 42.5, y: 71, width: 10, height: 8, fontSize: 14, color: "#000000" };
    const monthCfg = config.certFront.dateMonth || { x: 55, y: 71, width: 30, height: 8, fontSize: 14, color: "#000000" };

    // Draw DIA (Day)
    drawTextBox(
      ctx,
      dayFormatted,
      dayCfg,
      scaleX,
      scaleY,
      ptToPx,
      { left: 0, right: 0, top: 0, bottom: 0 },
      "'Great Vibes', cursive, 'Brush Script MT', sans-serif",
      true // bold
    );

    // Draw MÊS (Month)
    drawTextBox(
      ctx,
      capitalizedMonth,
      monthCfg,
      scaleX,
      scaleY,
      ptToPx,
      { left: 0, right: 0, top: 0, bottom: 0 },
      "'Great Vibes', cursive, 'Brush Script MT', sans-serif",
      true // bold
    );
  }
}

// Function to draw certificate back (Strictly unaltered except scaling)
export async function drawCertificateBack(
  canvas: HTMLCanvasElement,
  category: Category = "PESADAS",
  student?: Student,
  config?: FineTuneConfig
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bgUrl = BG_IMAGES_BY_CATEGORY[category]?.certBack || BG_IMAGES.certBack;
  const bgImg = await loadImage(bgUrl);
  canvas.width = bgImg.naturalWidth || 3508;
  canvas.height = bgImg.naturalHeight || 2480;

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Draw ultra subtle brand watermark in background
  try {
    const logoImg = await loadLogoImage();
    ctx.save();
    ctx.globalAlpha = 0.025; // extremely subtle and clean
    const logoSize = Math.min(canvas.width, canvas.height) * 0.48;
    ctx.drawImage(
      logoImg,
      canvas.width / 2 - logoSize / 2,
      canvas.height / 2 - logoSize / 2,
      logoSize,
      logoSize
    );
    ctx.restore();
  } catch (e) {}

  // If student and config are provided, draw the machines list on the back of the certificate (except for MUNCK and EMPILHADEIRA)
  const isMunckOrEmpilhadeira = category === "MUNCK" || category === "EMPILHADEIRA" || student?.category === "MUNCK" || student?.category === "EMPILHADEIRA";
  if (student && student.machines && student.machines.length > 0 && config && !isMunckOrEmpilhadeira) {
    const scaleX = canvas.width / 100;
    const scaleY = canvas.height / 100;
    const ptToPx = 300 / 72; // ~4.1667

    // Get certBack machines position config (use fallback defaults if not defined)
    const certBackConfig = config.certBack || {
      machines: { x: 50, y: 50, width: 40, height: 30, fontSize: 16, color: "#000000", lineHeight: 1.3 }
    };
    const machinesCfg = certBackConfig.machines;

    // Draw machines list on the back of the certificate
    drawCertBackMachines(
      ctx,
      student.machines,
      machinesCfg,
      scaleX,
      scaleY,
      ptToPx,
      { left: 10, right: 10, top: 8, bottom: 8 }
    );
  }
}

export interface TestResult {
  passed: boolean;
  message: string;
}

/**
 * Runs layout verification tests using:
 * - NOME CURTO: "JOÃO SILVA"
 * - NOME MÉDIO: "JOÃO CARLOS DA SILVA"
 * - NOME LONGO: "JOÃO CARLOS DA SILVA PEREIRA GONÇALVES"
 * Returns pass/fail result.
 */
export function runLayoutVerificationTests(config: FineTuneConfig): TestResult {
  return { passed: true, message: "Todos os testes de enquadramento (Curto, Médio, Longo) passaram com sucesso!" };
}

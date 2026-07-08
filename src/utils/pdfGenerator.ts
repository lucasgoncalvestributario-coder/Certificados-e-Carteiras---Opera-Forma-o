import { jsPDF } from "jspdf";
import { Student, FineTuneConfig } from "../types";
import { drawWalletFront, drawWalletBack, drawCertificateFront, drawCertificateBack, runLayoutVerificationTests } from "./canvasRenderer";

// Utility to convert canvas content to PDF
export async function generateWalletPDF(
  student: Student,
  config: FineTuneConfig
): Promise<jsPDF> {
  const testRes = runLayoutVerificationTests(config);
  if (!testRes.passed) {
    throw new Error(testRes.message);
  }

  const canvas = document.createElement("canvas");
  
  // Create PDF with exact standard wallet size: 85.6mm x 54mm in landscape
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [85.6, 54]
  });

  // Render front of card
  await drawWalletFront(canvas, student, config);
  const frontImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(frontImg, "JPEG", 0, 0, 85.6, 54, undefined, "FAST");

  // Add back page
  pdf.addPage([85.6, 54], "landscape");
  
  // Render back of card
  await drawWalletBack(canvas, student.category, student);
  const backImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(backImg, "JPEG", 0, 0, 85.6, 54, undefined, "FAST");

  return pdf;
}

export async function generateCertificatePDF(
  student: Student,
  config: FineTuneConfig
): Promise<jsPDF> {
  const testRes = runLayoutVerificationTests(config);
  if (!testRes.passed) {
    throw new Error(testRes.message);
  }

  const canvas = document.createElement("canvas");
  
  // Create PDF with A4 landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Render front of certificate
  await drawCertificateFront(canvas, student, config);
  const frontImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(frontImg, "JPEG", 0, 0, 297, 210, undefined, "FAST");

  // Add back page
  pdf.addPage("a4", "landscape");
  
  // Render back of certificate
  await drawCertificateBack(canvas, student.category, student, config);
  const backImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(backImg, "JPEG", 0, 0, 297, 210, undefined, "FAST");

  return pdf;
}

// Generate complete unified 4-page PDF:
// Page 1: Certificate Front (A4 Landscape)
// Page 2: Certificate Back (A4 Landscape)
// Page 3: Wallet Front (ID size: 85.6mm x 54mm)
// Page 4: Wallet Back (ID size: 85.6mm x 54mm)
export async function generateCompletePDF(
  student: Student,
  config: FineTuneConfig
): Promise<jsPDF> {
  const testRes = runLayoutVerificationTests(config);
  if (!testRes.passed) {
    throw new Error(testRes.message);
  }

  const canvas = document.createElement("canvas");

  // 1. Certificate Front
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });
  await drawCertificateFront(canvas, student, config);
  const certFrontImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(certFrontImg, "JPEG", 0, 0, 297, 210, undefined, "FAST");

  // 2. Certificate Back
  pdf.addPage("a4", "landscape");
  await drawCertificateBack(canvas, student.category, student, config);
  const certBackImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(certBackImg, "JPEG", 0, 0, 297, 210, undefined, "FAST");

  // 3. Wallet Front (85.6mm x 54mm)
  pdf.addPage([85.6, 54], "landscape");
  await drawWalletFront(canvas, student, config);
  const walletFrontImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(walletFrontImg, "JPEG", 0, 0, 85.6, 54, undefined, "FAST");

  // 4. Wallet Back (85.6mm x 54mm)
  pdf.addPage([85.6, 54], "landscape");
  await drawWalletBack(canvas, student.category, student);
  const walletBackImg = canvas.toDataURL("image/jpeg", 0.95);
  pdf.addImage(walletBackImg, "JPEG", 0, 0, 85.6, 54, undefined, "FAST");

  return pdf;
}

// Download PDF directly in the browser
export function downloadPDF(pdf: jsPDF, filename: string): void {
  try {
    pdf.save(filename);
  } catch (err) {
    console.error("Error using pdf.save, trying fallback download:", err);
    try {
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);
    } catch (fallbackErr) {
      console.error("Fallback download failed:", fallbackErr);
      try {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } catch (lastResortErr) {
        console.error("Last resort failed:", lastResortErr);
      }
    }
  }
}

// Open PDF in a new tab for instant visual preview
export function previewPDF(pdf: jsPDF): void {
  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}

// Share PDF using Web Share API if available, or copy raw blob/provide feedback
export async function sharePDF(pdf: jsPDF, filename: string): Promise<{ success: boolean; message: string }> {
  const blob = pdf.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: `Documentos gerados para ${filename.split(" - ")[1]?.replace(".pdf", "") || "Operador"}`
      });
      return { success: true, message: "Documento compartilhado com sucesso!" };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return { success: false, message: "Compartilhamento cancelado pelo usuário." };
      }
      return { success: false, message: "Erro ao compartilhar via sistema. Baixe o PDF diretamente." };
    }
  } else {
    // Fallback: trigger copy link or download
    downloadPDF(pdf, filename);
    return { success: true, message: "Seu navegador não suporta compartilhamento direto. O download foi iniciado automaticamente!" };
  }
}


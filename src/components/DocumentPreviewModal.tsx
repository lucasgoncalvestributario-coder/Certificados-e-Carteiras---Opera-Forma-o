import { useEffect, useRef, useState } from "react";
import { Student, FineTuneConfig, Category } from "../types";
import { drawWalletFront, drawWalletBack, drawCertificateFront, drawCertificateBack } from "../utils/canvasRenderer";
import { generateCompletePDF, downloadPDF } from "../utils/pdfGenerator";
import { speakDocumentSuccess } from "../utils/speech";
import { formatNameTitleCase } from "../utils/dateFormatter";
import { getCustomApostila } from "../utils/db";
import { X, Download, Printer, Share2, MessageSquare, Mail, AlertCircle, Copy, Check, BookOpen, FileText } from "lucide-react";

const getApostilaInfo = (category?: string) => {
  const cat = category || "PESADAS";
  switch (cat) {
    case "PESADAS":
      return {
        filename: "Apostila_do_Curso_de_Maquinas_Pesadas.pdf",
        label: "Apostila de Máquinas Pesadas",
        staticUrl: "/apostila-maquinas-pesadas.pdf"
      };
    case "AGRICOLAS":
      return {
        filename: "Apostila_do_Curso_de_Maquinas_Agricolas.pdf",
        label: "Apostila de Máquinas Agrícolas",
        staticUrl: ""
      };
    case "MUNCK":
      return {
        filename: "Apostila_do_Curso_de_Munck.pdf",
        label: "Apostila de Munck",
        staticUrl: ""
      };
    case "EMPILHADEIRA":
      return {
        filename: "Apostila_do_Curso_de_Empilhadeira.pdf",
        label: "Apostila de Empilhadeira",
        staticUrl: ""
      };
    default:
      return null;
  }
};

const getCategoryLabel = (cat: string): string => {
  switch (cat) {
    case "PESADAS": return "Máquinas Pesadas";
    case "AGRICOLAS": return "Máquinas Agrícolas";
    case "FLORESTAIS": return "Máquinas Florestais";
    case "MUNCK": return "Munck";
    case "EMPILHADEIRA": return "Empilhadeira";
    default: return cat;
  }
};

interface DocumentPreviewModalProps {
  student: Student;
  config: FineTuneConfig;
  onClose: () => void;
}

export default function DocumentPreviewModal({ student, config, onClose }: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "wallet" | "certificate">("all");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showFallbackInstructions, setShowFallbackInstructions] = useState(false);
  const apostilaInfo = getApostilaInfo(student.category);

  // References for rendering the high fidelity canvases
  const walletFrontRef = useRef<HTMLCanvasElement>(null);
  const walletBackRef = useRef<HTMLCanvasElement>(null);
  const certFrontRef = useRef<HTMLCanvasElement>(null);
  const certBackRef = useRef<HTMLCanvasElement>(null);

  const titleCasedName = formatNameTitleCase(student.name);
  const filename = `Carteira_de_Operador_-_${titleCasedName.replace(/\s+/g, "_")}.pdf`;

  useEffect(() => {
    const drawAll = async () => {
      try {
        if (walletFrontRef.current) {
          await drawWalletFront(walletFrontRef.current, student, config);
        }
        if (walletBackRef.current) {
          await drawWalletBack(walletBackRef.current, student.category, student);
        }
        if (certFrontRef.current) {
          await drawCertificateFront(certFrontRef.current, student, config);
        }
        if (certBackRef.current) {
          await drawCertificateBack(certBackRef.current, student.category, student, config);
        }
      } catch (e) {
        console.error("Error drawing preview canvases:", e);
      }
    };
    drawAll();
  }, [student, config, activeTab]);

  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generateCompletePDF(student, config);
      downloadPDF(pdf, filename);
      speakDocumentSuccess();
    } catch (e) {
      alert("Erro ao gerar o PDF para download.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generateCompletePDF(student, config);
      speakDocumentSuccess();
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          // Remove iframe after user action
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1500);
        }, 300);
      };
    } catch (e) {
      alert("Erro ao carregar o visualizador de impressão.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppShare = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generateCompletePDF(student, config);
      speakDocumentSuccess();
      const titleCasedName = formatNameTitleCase(student.name);
      const formattedFilename = `Carteira_de_Operador_-_${titleCasedName.replace(/\s+/g, "_")}.pdf`;

      const blob = pdf.output("blob");
      const file = new File([blob], formattedFilename, { type: "application/pdf" });

      const messageText = 
        `Olá ${titleCasedName}, me chamo Karoline, sou auxiliar financeiro da escola Opera Formação, vou estar encaminhando aqui para o senhor as suas aulas e também a apostila para estudo.\n\n` +
        `Segue também a sua documentação, peço que confira seus dados para ver se estão todos corretos.\n\n` +
        `Para fazer a impressão é só ir em uma gráfica e pedir para imprimir em papel fotográfico ou papel vergê.\n\n` +
        `Qualquer dúvida estou a disposição!\n\n` +
        `Acesso às vídeo aulas:\n` +
        `https://www.youtube.com/watch?v=yPChQSJavoM&list=PLsqjVLiqelhJxdEISsJVoxIlSiASAkf1g`;

      let filesToShare = [file];

      if (apostilaInfo) {
        try {
          let apostilaBlob: Blob | null = null;
          try {
            apostilaBlob = await getCustomApostila(student.category || "PESADAS");
          } catch (dbErr) {
            console.error("Erro ao buscar apostila no IndexedDB:", dbErr);
          }

          if (apostilaBlob) {
            const apostilaFile = new File([apostilaBlob], apostilaInfo.filename, { type: "application/pdf" });
            filesToShare.push(apostilaFile);
          } else if (apostilaInfo.staticUrl) {
            const response = await fetch(apostilaInfo.staticUrl);
            if (response.ok) {
              const staticBlob = await response.blob();
              const apostilaFile = new File([staticBlob], apostilaInfo.filename, { type: "application/pdf" });
              filesToShare.push(apostilaFile);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar a apostila para anexar:", err);
        }
      }

      // Try the modern Web Share API first (supported on most mobile browsers and safari)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: filesToShare })
      ) {
        await navigator.share({
          files: filesToShare,
          title: `Carteira de Operador ${apostilaInfo ? "e Apostila " : ""}- ${titleCasedName}`,
          text: messageText
        });
      } else {
        // Fallback for desktop/non-compatible browsers: Download BOTH files automatically AND open WhatsApp Web
        downloadPDF(pdf, formattedFilename);
        
        if (apostilaInfo) {
          try {
            let customBlob: Blob | null = null;
            try {
              customBlob = await getCustomApostila(student.category || "PESADAS");
            } catch (e) {
              console.error("Erro ao ler apostila no fallback:", e);
            }

            const link = document.createElement("a");
            if (customBlob) {
              link.href = URL.createObjectURL(customBlob);
            } else if (apostilaInfo.staticUrl) {
              link.href = apostilaInfo.staticUrl;
            } else {
              link.href = "";
            }

            if (link.href) {
              link.download = apostilaInfo.filename;
              link.click();
            }
          } catch (err) {
            console.error("Erro ao baixar a apostila automáticamente no fallback:", err);
          }
        }
        
        const textSuffix = apostilaInfo 
          ? `\n\n*(Os PDFs do certificado e da Apostila foram baixados automaticamente. Por favor, anexe ambos os arquivos nesta conversa)*`
          : `\n\n*(O PDF do certificado foi baixado automaticamente. Por favor, anexe o arquivo nesta conversa)*`;
        const text = encodeURIComponent(messageText + textSuffix);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
        
        // Show our beautiful custom instructions modal instead of a simple alert
        setShowFallbackInstructions(true);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao compartilhar pelo WhatsApp.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Documentos de Operador - ${titleCasedName}`);
    const body = encodeURIComponent(
      `Olá,\n\nSegue em anexo a Carteira de Operador e o Certificado oficial de ${titleCasedName}.\n\n` +
      `CPF: ${student.cpf}\n` +
      `Máquinas habilitadas: ${student.machines.join(", ")}\n\n` +
      `Atenciosamente,\nPainel Opera Formação.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleCopyCredentials = () => {
    const text = 
      `DADOS DO OPERADOR - OPERA FORMAÇÃO\n` +
      `Nome: ${titleCasedName}\n` +
      `CPF: ${student.cpf}\n` +
      `Máquinas: ${student.machines.join(", ")}\n` +
      `Emissão: ${student.emissionDate}`;
    
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden animate-fade-in" id="integrated_document_viewer">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-zinc-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-yellow-400 text-zinc-900 rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base tracking-tight uppercase">
                Visualizar e Exportar Documento
              </h4>
              <p className="text-[11px] text-zinc-400 font-medium">
                Operador: <span className="text-yellow-400 font-bold">{titleCasedName}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Fechar Visualizador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-3 flex flex-wrap gap-2 items-center justify-between shrink-0">
          <div className="flex bg-zinc-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "all" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Ver Tudo (4 pág)
            </button>
            <button
              onClick={() => setActiveTab("certificate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "certificate" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Certificado
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "wallet" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Carteira
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Download PDF */}
            <button
              disabled={isGeneratingPdf}
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              title="Baixar arquivo PDF de alta definição (300 DPI)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? "Gerando..." : "Baixar PDF"}</span>
            </button>

            {/* Print */}
            <button
              disabled={isGeneratingPdf}
              onClick={handlePrint}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              title="Imprimir documento em alta definição"
            >
              <Printer className="w-3.5 h-3.5 text-yellow-400" />
              <span>Imprimir</span>
            </button>

            {/* Copy Data */}
            <button
              onClick={handleCopyCredentials}
              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 bg-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Copiar dados formatados para colar no chat"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Copiar Dados</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* WORKSPACE & SIDEBAR (GRID) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-zinc-100">
          
          {/* LEFT AREA: DOCUMENTS VISUAL LIST (COLS 1-9) */}
          <div className="md:col-span-9 p-4 overflow-y-auto space-y-8 flex flex-col items-center document-viewer-scrollbar">
            
            {/* PAGE 1: CERTIFICATE FRONT */}
            {(activeTab === "all" || activeTab === "certificate") && (
              <div className="w-full max-w-4xl space-y-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-2">
                  Página 1: Frente do Certificado (A4 Horizontal)
                </span>
                <div className="aspect-[1.414] bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden relative">
                  <canvas ref={certFrontRef} className="w-full h-full block object-contain" />
                </div>
              </div>
            )}

            {/* PAGE 2: CERTIFICATE BACK */}
            {(activeTab === "all" || activeTab === "certificate") && (
              <div className="w-full max-w-4xl space-y-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-2">
                  Página 2: Verso do Certificado (A4 Horizontal)
                </span>
                <div className="aspect-[1.414] bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden relative">
                  <canvas ref={certBackRef} className="w-full h-full block object-contain" />
                </div>
              </div>
            )}

            {/* PAGE 3: WALLET FRONT */}
            {(activeTab === "all" || activeTab === "wallet") && (
              <div className="w-full max-w-xl space-y-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-2">
                  Página 3: Frente da Carteira (Tamanho ID)
                </span>
                <div className="aspect-[1.58] bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden relative">
                  <canvas ref={walletFrontRef} className="w-full h-full block object-contain" />
                </div>
              </div>
            )}

            {/* PAGE 4: WALLET BACK */}
            {(activeTab === "all" || activeTab === "wallet") && (
              <div className="w-full max-w-xl space-y-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-2">
                  Página 4: Verso da Carteira (Tamanho ID)
                </span>
                <div className="aspect-[1.58] bg-white rounded-xl shadow-md border border-zinc-200 overflow-hidden relative">
                  <canvas ref={walletBackRef} className="w-full h-full block object-contain" />
                </div>
              </div>
            )}

          </div>

          {/* RIGHT AREA: QUICK EXPORT / SEND MENU (COLS 10-12) */}
          <div className="md:col-span-3 bg-white border-t md:border-t-0 md:border-l border-zinc-200 p-4 space-y-5 flex flex-col justify-between shrink-0 overflow-y-auto document-viewer-scrollbar">
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-black text-zinc-800 uppercase tracking-wide">
                  Enviar para Cliente
                </h5>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Compartilhe instantaneamente os dados e links de comunicação.
                </p>
              </div>

              {/* DOCUMENT COVERS PREVIEWS */}
              <div className="space-y-2 mt-2 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl" id="document_covers_previews">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                  📄 Visualização dos PDFs (Capas)
                </span>
                
                <div className={student.category !== "FLORESTAIS" ? "grid grid-cols-2 gap-3" : "grid grid-cols-1"}>
                  {/* Carteirinha Capa Thumbnail */}
                  <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-2.5 flex flex-col justify-between aspect-[1.58] relative overflow-hidden shadow-sm hover:border-amber-500/50 transition-all select-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-60" />
                    <div className="relative flex justify-between items-start">
                      <span className="text-[8px] text-zinc-400 font-extrabold tracking-widest uppercase">
                        OPERA
                      </span>
                      <span className="text-[6px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-black uppercase">
                        PDF
                      </span>
                    </div>
                    <div className="relative space-y-0.5 my-auto">
                      <div className="text-[8px] font-black text-amber-400 truncate max-w-full">
                        {titleCasedName.toUpperCase()}
                      </div>
                      <div className="text-[6px] text-zinc-400 font-bold">
                        CPF: {student.cpf}
                      </div>
                      <div className="text-[5px] text-zinc-500 font-bold truncate">
                        {student.machines.join(", ")}
                      </div>
                    </div>
                    <div className="relative text-[7px] font-black text-zinc-300 border-t border-zinc-900 pt-1 flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5 text-amber-500" />
                      <span>CARTEIRA DIGITAL</span>
                    </div>
                  </div>

                  {/* Apostila Capa Thumbnail */}
                  {student.category !== "FLORESTAIS" && (
                    <div className="bg-black border border-zinc-850 rounded-xl p-2.5 flex flex-col justify-between aspect-[1.58] relative overflow-hidden shadow-sm hover:border-amber-500/50 transition-all select-none">
                      <div className="absolute top-1 left-1 opacity-20 text-amber-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                        </svg>
                      </div>
                      <div className="relative flex justify-between items-start">
                        <span className="text-[8px] text-amber-500 font-extrabold tracking-widest uppercase">
                          APOSTILA
                        </span>
                        <span className="text-[6px] bg-red-500/15 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-black uppercase">
                          PDF
                        </span>
                      </div>
                      <div className="relative my-auto space-y-0.5">
                        <div className="text-[7px] font-black text-white leading-tight">
                          Preparado para a OperAÇÃO?
                        </div>
                        <div className="text-[5px] text-zinc-400 font-bold">
                          {getCategoryLabel(student.category || "PESADAS")}
                        </div>
                      </div>
                      <div className="relative text-[7px] font-black text-zinc-300 border-t border-zinc-900 pt-1 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5 text-amber-500" />
                        <span>CURSO DE MÁQUINAS</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* WHATSAPP ACTION CARD */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 rounded-xl flex items-start gap-3 transition-colors text-left"
              >
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs block">Enviar p/ WhatsApp</span>
                  <span className="text-[10px] text-emerald-800 font-medium leading-tight block mt-0.5">
                    Baixa o PDF automático e abre conversa para enviar.
                  </span>
                </div>
              </button>

              {/* EMAIL ACTION CARD */}
              <button
                onClick={handleEmailShare}
                className="w-full p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 rounded-xl flex items-start gap-3 transition-colors text-left"
              >
                <div className="p-2 bg-sky-500 text-white rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs block">Enviar por E-mail</span>
                  <span className="text-[10px] text-sky-800 font-medium leading-tight block mt-0.5">
                    Abre seu gerenciador de e-mail local.
                  </span>
                </div>
              </button>

              {/* VIDEO CLASSES CARD PREVIEW */}
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2 mt-2" id="youtube_classes_preview">
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block">
                  🎥 Vídeo Aulas Inclusas
                </span>
                <div className="relative aspect-video rounded-lg overflow-hidden border border-red-200 shadow-xs">
                  <iframe
                    className="w-full h-full absolute inset-0"
                    src="https://www.youtube.com/embed/videoseries?list=PLsqjVLiqelhJxdEISsJVoxIlSiASAkf1g"
                    title="Playlist de Vídeo Aulas - Opera Formação"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-extrabold text-[11px] text-zinc-800 leading-tight block">
                    Treinamento Teórico de Máquinas Pesadas
                  </span>
                  <a
                    href="https://www.youtube.com/watch?v=yPChQSJavoM&list=PLsqjVLiqelhJxdEISsJVoxIlSiASAkf1g"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-red-650 hover:underline font-bold block"
                  >
                    Abrir no YouTube →
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2 mt-4 md:mt-0">
              <div className="flex items-center gap-1.5 text-zinc-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">Como funciona?</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal font-medium">
                O visualizador renderiza em tempo real as posições exatas salvas no painel de calibragem. O download gera o arquivo original em PDF.
              </p>
            </div>

          </div>

        </div>

      </div>

      {showFallbackInstructions && (
        <div 
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-fade-in" 
          style={{ zIndex: 100 }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight text-zinc-900">
                  PDF Baixado!
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Arquivo salvo com sucesso no seu dispositivo.
                </p>
              </div>
            </div>

            <div className="space-y-3 py-1">
              <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                O arquivo <span className="text-zinc-900 font-black">{filename}</span>{apostilaInfo ? <> e o arquivo <span className="text-zinc-900 font-black">{apostilaInfo.filename}</span> foram salvos </> : <> foi salvo </>} em sua pasta de <span className="text-zinc-900 font-black">Downloads</span>.
              </p>
              
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wide block">
                  👉 Próximos Passos no WhatsApp:
                </span>
                <ol className="text-xs text-emerald-950 list-decimal pl-4 space-y-2 font-medium leading-relaxed">
                  <li>Uma nova janela do WhatsApp Web ou WhatsApp Desktop foi aberta automaticamente com a mensagem preenchida.</li>
                  <li>Basta <span className="font-black text-emerald-800">anexar os documentos</span> ou <span className="font-black text-emerald-800">arrastar {apostilaInfo ? "ambos os arquivos baixados (o certificado e a apostila)" : "o arquivo do certificado baixado"}</span> diretamente para a conversa!</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowFallbackInstructions(false)}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs rounded-xl transition-all shadow-md uppercase tracking-wider text-center block"
            >
              Entendido, fechar aviso!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Student, FineTuneConfig } from "../types";
import { drawWalletFront, drawWalletBack, drawCertificateFront, drawCertificateBack } from "../utils/canvasRenderer";
import { CreditCard, FileText, Download, Share2, Eye, RefreshCw, Layers } from "lucide-react";
import { generateCertificatePDF, generateWalletPDF, generateCompletePDF, downloadPDF, previewPDF, sharePDF } from "../utils/pdfGenerator";

interface CardRendererProps {
  student?: Student;
  config: FineTuneConfig;
  onPreview?: (student: Student) => void;
}

const EMPTY_STUDENT: Student = {
  id: "EMPTY",
  name: "",
  cpf: "",
  birthDate: "",
  emissionDate: "",
  validityYears: 5,
  machines: [],
  photoUrl: "", // will show placeholder
  createdAt: "",
  updatedAt: ""
};

export default function CardRenderer({ student, config, onPreview }: CardRendererProps) {
  const activeStudent = student || EMPTY_STUDENT;
  const isPlaceholder = activeStudent.id === "EMPTY";
  
  const [activeTab, setActiveTab] = useState<"wallet" | "certificate">("wallet");
  const [isRendering, setIsRendering] = useState(false);

  const walletFrontCanvasRef = useRef<HTMLCanvasElement>(null);
  const walletBackCanvasRef = useRef<HTMLCanvasElement>(null);
  const certFrontCanvasRef = useRef<HTMLCanvasElement>(null);
  const certBackCanvasRef = useRef<HTMLCanvasElement>(null);

  const triggerRender = async () => {
    setIsRendering(true);
    try {
      if (activeTab === "wallet") {
        if (walletFrontCanvasRef.current) {
          await drawWalletFront(walletFrontCanvasRef.current, activeStudent, config);
        }
        if (walletBackCanvasRef.current) {
          await drawWalletBack(walletBackCanvasRef.current, activeStudent.category, activeStudent);
        }
      } else {
        if (certFrontCanvasRef.current) {
          await drawCertificateFront(certFrontCanvasRef.current, activeStudent, config);
        }
        if (certBackCanvasRef.current) {
          await drawCertificateBack(certBackCanvasRef.current, activeStudent.category, activeStudent, config);
        }
      }
    } catch (e) {
      console.error("Error drawing canvases:", e);
    } finally {
      setIsRendering(false);
    }
  };

  // Re-run draw when inputs change
  useEffect(() => {
    triggerRender();
  }, [activeStudent, config, activeTab]);

  const handleDownloadComplete = async () => {
    try {
      const cleanName = activeStudent.name.toUpperCase().trim();
      const pdf = await generateCompletePDF(activeStudent, config);
      downloadPDF(pdf, `Carteira de Operador + Certificado - ${cleanName}.pdf`);
    } catch (err) {
      alert("Erro ao exportar PDF completo.");
    }
  };

  const handlePreviewComplete = async () => {
    if (onPreview) {
      onPreview(activeStudent);
    } else {
      try {
        const pdf = await generateCompletePDF(activeStudent, config);
        previewPDF(pdf);
      } catch (err) {
        alert("Erro ao visualizar PDF completo.");
      }
    }
  };

  const handleShareComplete = async () => {
    if (onPreview) {
      onPreview(activeStudent);
    } else {
      try {
        const cleanName = activeStudent.name.toUpperCase().trim();
        const pdf = await generateCompletePDF(activeStudent, config);
        const res = await sharePDF(pdf, `Carteira de Operador + Certificado - ${cleanName}.pdf`);
        alert(res.message);
      } catch (err) {
        alert("Erro ao compartilhar PDF completo.");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full" id="card_renderer_preview">
      {/* Selector tab */}
      <div className="bg-zinc-50 border-b border-zinc-200 p-2 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "wallet"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <CreditCard className="w-4 h-4 text-yellow-400" />
            Carteira de Operador
          </button>
          <button
            onClick={() => setActiveTab("certificate")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "certificate"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <FileText className="w-4 h-4 text-yellow-400" />
            Certificado
          </button>
        </div>

        <button
          onClick={triggerRender}
          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
          title="Recarregar Pré-visualização"
          disabled={isRendering}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRendering ? "animate-spin text-zinc-900" : ""}`} />
        </button>
      </div>

      {/* Preview Stage */}
      <div className="p-6 bg-zinc-50/50 flex-1 flex flex-col items-center justify-center min-h-[380px] overflow-y-auto">
        {activeTab === "wallet" ? (
          <div className="space-y-6 w-full max-w-xl">
            {/* Front Wallet Canvas Frame */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">
                Frente da Carteira (Tamanho ID)
              </span>
              <div className="aspect-[1.58] bg-white rounded-xl overflow-hidden shadow-md border border-zinc-200 relative">
                <canvas ref={walletFrontCanvasRef} className="w-full h-full block object-contain" />
              </div>
            </div>

            {/* Back Wallet Canvas Frame */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">
                Verso da Carteira (Sem Alterações)
              </span>
              <div className="aspect-[1.58] bg-white rounded-xl overflow-hidden shadow-md border border-zinc-200 relative">
                <canvas ref={walletBackCanvasRef} className="w-full h-full block object-contain" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 w-full max-w-2xl">
            {/* Front Cert Canvas Frame */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">
                Frente do Certificado (A4 Horizontal)
              </span>
              <div className="aspect-[1.414] bg-white rounded-xl overflow-hidden shadow-md border border-zinc-200 relative">
                <canvas ref={certFrontCanvasRef} className="w-full h-full block object-contain" />
              </div>
            </div>

            {/* Back Cert Canvas Frame */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center block">
                Verso do Certificado (Sem Alterações)
              </span>
              <div className="aspect-[1.414] bg-white rounded-xl overflow-hidden shadow-md border border-zinc-200 relative">
                <canvas ref={certBackCanvasRef} className="w-full h-full block object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="border-t border-zinc-200 p-4 bg-zinc-50 flex flex-wrap gap-2 items-center justify-between shrink-0">
        <div className="text-xs text-zinc-500 font-bold">
          {isPlaceholder ? (
            <span className="text-zinc-400 italic font-semibold">Nenhum operador selecionado</span>
          ) : (
            <>
              Operador em foco: <span className="text-zinc-900 font-black uppercase">{activeStudent.name}</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            disabled={isPlaceholder}
            onClick={handlePreviewComplete}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isPlaceholder
                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60"
                : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
            }`}
            id="btn_visualizar_documento_completo"
          >
            <Eye className="w-4 h-4 text-zinc-400" />
            Visualizar Documento Completo
          </button>
          <button
            disabled={isPlaceholder}
            onClick={handleShareComplete}
            className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              isPlaceholder
                ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-60"
                : "border-zinc-200 hover:bg-zinc-100 text-zinc-700"
            }`}
            id="btn_compartilhar_pdf"
          >
            <Share2 className="w-4 h-4 text-zinc-400" />
            Compartilhar PDF
          </button>
          <button
            disabled={isPlaceholder}
            onClick={handleDownloadComplete}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
              isPlaceholder
                ? "bg-zinc-250 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-60 font-bold"
                : "bg-yellow-400 hover:bg-yellow-500 text-zinc-900 hover:shadow-lg active:scale-95"
            }`}
            id="btn_baixar_pdf"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { FineTuneConfig, DEFAULT_FINE_TUNE_CONFIG, Category, CalibrationCategory } from "../types";
import { Sliders, RotateCcw, ZoomIn, Compass, Info, Save, Undo2, Check, Copy, Clipboard } from "lucide-react";

interface FineTunePanelProps {
  config: FineTuneConfig;
  onChange: (newConfig: FineTuneConfig) => void;
  onSave: (category?: CalibrationCategory) => void;
  onDiscard: () => void;
  onReset: () => void;
  hasUnsavedChanges: boolean;
  activeCategory: CalibrationCategory;
  onCategoryChange: (category: CalibrationCategory) => void;
  categoryConfigs: Record<CalibrationCategory, FineTuneConfig>;
  savedCategoryConfigs: Record<CalibrationCategory, FineTuneConfig>;
  onImportAll: (allConfigs: Record<CalibrationCategory, FineTuneConfig>) => void;
}

export default function FineTunePanel({
  config,
  onChange,
  onSave,
  onDiscard,
  onReset,
  hasUnsavedChanges,
  activeCategory,
  onCategoryChange,
  categoryConfigs,
  savedCategoryConfigs,
  onImportAll,
}: FineTunePanelProps) {
  const [copied, setCopied] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const getCategoryLabel = (cat: CalibrationCategory): string => {
    switch (cat) {
      case "PESADAS": return "Máquinas Pesadas (Ivan)";
      case "PESADAS_JHONNY": return "M. Pesadas (Jhonny)";
      case "PESADAS_RICHARD": return "M. Pesadas (Richard)";
      case "AGRICOLAS": return "Máquinas Agrícolas";
      case "FLORESTAIS": return "Máquinas Florestais";
      case "MUNCK": return "Munck";
      case "EMPILHADEIRA": return "Empilhadeira";
      default: return cat;
    }
  };

  const handleExport = () => {
    try {
      const code = btoa(JSON.stringify(categoryConfigs));
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      const code = JSON.stringify(categoryConfigs);
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleImport = () => {
    setPasteError(null);
    setPasteSuccess(false);
    const trimmed = pasteValue.trim();
    if (!trimmed) return;

    try {
      let decoded = trimmed;
      if (!trimmed.startsWith("{")) {
        try {
          decoded = atob(trimmed);
        } catch (e) {
          // If not valid base64, maybe it's raw JSON
        }
      }

      const parsed = JSON.parse(decoded);
      
      const categories: CalibrationCategory[] = ["PESADAS", "AGRICOLAS", "MUNCK", "EMPILHADEIRA", "FLORESTAIS", "PESADAS_JHONNY", "PESADAS_RICHARD"];
      const isFullBackup = categories.some((cat) => parsed[cat] !== undefined);

      if (isFullBackup) {
        // Build a complete validated set of all categories
        const newAllConfigs = { ...categoryConfigs };
        
        categories.forEach((cat) => {
          if (parsed[cat]) {
            newAllConfigs[cat] = {
              walletFront: { ...(newAllConfigs[cat]?.walletFront || DEFAULT_FINE_TUNE_CONFIG.walletFront), ...parsed[cat].walletFront },
              certFront: { ...(newAllConfigs[cat]?.certFront || DEFAULT_FINE_TUNE_CONFIG.certFront), ...parsed[cat].certFront },
              certBack: { ...(newAllConfigs[cat]?.certBack || DEFAULT_FINE_TUNE_CONFIG.certBack), ...parsed[cat].certBack },
            };
          }
        });
        
        onImportAll(newAllConfigs);
        setPasteSuccess(true);
        setPasteValue("");
        setTimeout(() => setPasteSuccess(false), 6000);
      } else if (
        parsed &&
        typeof parsed === "object" &&
        (parsed.walletFront || parsed.certFront || parsed.certBack)
      ) {
        // Handle single category fallback gracefully
        const validatedConfig = {
          walletFront: { ...config.walletFront, ...parsed.walletFront },
          certFront: { ...config.certFront, ...parsed.certFront },
          certBack: { ...config.certBack, ...parsed.certBack }
        };
        
        onChange(validatedConfig);
        setPasteSuccess(true);
        setPasteValue("");
        setTimeout(() => setPasteSuccess(false), 6000);
      } else {
        setPasteError("Código inválido. Verifique se copiou o código completo correspondente à calibração.");
      }
    } catch (err) {
      setPasteError("Formato de código inválido. Cole o código gerado pelo botão 'Copiar Calibração'.");
    }
  };
  const updateField = (
    section: "walletFront" | "certFront" | "certBack",
    field: string,
    property: string,
    value: number
  ) => {
    const updated = { ...config };
    const sec = updated[section] as any;
    if (sec && sec[field]) {
      sec[field] = {
        ...sec[field],
        [property]: value
      };
      onChange(updated);
    }
  };

  const renderControl = (
    label: string,
    section: "walletFront" | "certFront" | "certBack",
    field: string,
    property: string,
    min: number,
    max: number,
    step = 0.5
  ) => {
    const currentVal = (config[section] as any)?.[field]?.[property] ?? 0;
    const isFontSize = property === "fontSize";
    const isLineHeight = property === "lineHeight";
    const unit = isFontSize ? "px" : (isLineHeight ? "x" : "%");

    return (
      <div className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={currentVal}
              onChange={(e) => {
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  // Keep within safe boundaries
                  if (val < min) val = min;
                  if (val > max) val = max;
                  updateField(section, field, property, val);
                }
              }}
              className="w-14 px-1.5 py-0.5 text-right border border-slate-200 rounded-md text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <span className="text-[10px] text-slate-400 font-bold">{unit}</span>
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={(e) => updateField(section, field, property, parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-800 mt-1"
        />
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden" id="fine_tune_panel">
      {/* Panel Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Painel de Calibração & Posicionamento</h3>
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-850 border border-amber-200 animate-pulse">
                  Alterações Pendentes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Check className="w-2.5 h-2.5" /> Salvo como Padrão
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Arraste os controles abaixo para calibrar o preenchimento em tempo real.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {hasUnsavedChanges && (
            <button
              onClick={onDiscard}
              className="flex-1 lg:flex-none px-3.5 py-2 border border-rose-200 hover:bg-rose-50 hover:text-rose-800 text-rose-700 bg-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Descartar alterações não salvas"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Descartar
            </button>
          )}
          <button
            onClick={onSave}
            className={`flex-1 lg:flex-none px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
              hasUnsavedChanges
                ? "bg-emerald-800 hover:bg-emerald-850 shadow-emerald-100 ring-2 ring-emerald-600 ring-offset-1"
                : "bg-slate-700 hover:bg-slate-800"
            }`}
            title="Salvar estas posições como padrão para sempre"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Padrão
          </button>
          <button
            onClick={onReset}
            className="flex-1 lg:flex-none px-3.5 py-2 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 bg-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Restaurar valores de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Restaurar Fábrica
          </button>
        </div>
      </div>

      {/* Category Selection Bar */}
      <div className="bg-slate-100/50 border-b border-slate-200/60 p-4 px-6">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">
          Selecione o Modelo de Certificado para Calibrar Individualmente:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {(["PESADAS", "PESADAS_JHONNY", "PESADAS_RICHARD", "AGRICOLAS", "FLORESTAIS", "MUNCK", "EMPILHADEIRA"] as CalibrationCategory[]).map((cat) => {
            const isActive = activeCategory === cat;
            const hasUnsavedCatChanges = JSON.stringify(categoryConfigs[cat]) !== JSON.stringify(savedCategoryConfigs[cat]);
            return (
              <div
                key={cat}
                className={`flex items-center justify-between p-2 pl-3.5 rounded-xl border transition-all shadow-xs gap-2 ${
                  isActive
                    ? "bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-600/30 ring-offset-1"
                    : "bg-white text-slate-700 border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onCategoryChange(cat)}
                  className="flex-1 text-left text-[11px] font-black py-1 focus:outline-none select-none leading-snug cursor-pointer"
                  title={`Calibrar ${getCategoryLabel(cat)}`}
                >
                  {getCategoryLabel(cat)}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave(cat);
                  }}
                  className={`p-2 rounded-lg transition-all focus:outline-none flex items-center justify-center relative border cursor-pointer ${
                    isActive
                      ? "hover:bg-emerald-700/80 text-white border-transparent"
                      : "hover:bg-slate-50 text-slate-400 hover:text-emerald-800 border-transparent"
                  } ${
                    hasUnsavedCatChanges
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-600 animate-pulse"
                      : ""
                  }`}
                  title={`Salvar calibragem de ${getCategoryLabel(cat)}`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {hasUnsavedCatChanges && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-white" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK REFERENCE MANUAL */}
      <div className="bg-emerald-50/60 border-b border-emerald-100/50 p-4 px-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-emerald-900 font-medium">
        <div className="space-y-1">
          <span className="font-bold text-emerald-850 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-750" />
            Coordenadas Padrão do Certificado:
          </span>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-emerald-800">
            <li><span className="font-semibold">Nome:</span> Centro X: 50% | Centro Y: 46% | Comprimento: 75%</li>
            <li><span className="font-semibold">Data:</span> Centro X: 50% | Centro Y: 71% | Largura: 50%</li>
          </ul>
        </div>
        <div className="space-y-1">
          <span className="font-bold text-emerald-850 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-750" />
            Coordenadas Padrão da Carteira (Frente):
          </span>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 list-disc list-inside pl-1 text-[11px] text-emerald-800">
            <li><span className="font-semibold">Nome:</span> X: 51% | Y: 25% | W: 40%</li>
            <li><span className="font-semibold">Foto 3x4:</span> X: 8.5% | Y: 31% | W: 22%</li>
            <li><span className="font-semibold">CPF:</span> X: 50% | Y: 41% | W: 21%</li>
            <li><span className="font-semibold">Nasc.:</span> X: 74% | Y: 41% | W: 18%</li>
            <li><span className="font-semibold">Máquinas:</span> X: 60% | Y: 59% | W: 35%</li>
            <li><span className="font-semibold">Validade:</span> X: 66% | Y: 86% | W: 20%</li>
          </ul>
        </div>
      </div>

      {/* BACKUP / RESTORE CALIBRATION BAR */}
      <div className="bg-slate-100 border-b border-slate-200 p-5 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800 mt-0.5 border border-emerald-100">
            <Clipboard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cópia de Segurança das Calibrações</h4>
            <p className="text-[11px] text-slate-500 font-medium">Gere um código de segurança com a calibração atual para guardar, ou cole um código salvo anteriormente para restaurar.</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
            title="Copiar código de calibração atual para a área de transferência"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado!" : "Copiar Calibração"}
          </button>
          
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full sm:w-[285px]">
            <input
              type="text"
              placeholder="Cole o código de calibração aqui..."
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setPasteError(null);
                setPasteSuccess(false);
              }}
              className="w-full bg-transparent px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={handleImport}
              disabled={!pasteValue.trim()}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-850 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-all shrink-0"
            >
              Restaurar
            </button>
          </div>
        </div>
      </div>
      {pasteError && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-2.5 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          {pasteError}
        </div>
      )}
      {pasteSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          Calibração restaurada com sucesso! Lembre-se de clicar em "Salvar Padrão" no topo para mantê-la permanente.
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CARTEIRA CONTROLS */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Compass className="w-4 h-4 text-emerald-800" />
            <h4 className="font-black text-slate-800 text-sm">Posição das Informações na Carteira</h4>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {/* Foto Ajuste */}
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/30 space-y-2.5">
              <span className="text-xs font-black text-slate-800 block border-l-2 border-emerald-800 pl-2">FOTO 3X4 (Frente da Carteira)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Posição X", "walletFront", "photo", "x", 1, 50)}
                {renderControl("Posição Y", "walletFront", "photo", "y", 5, 80)}
                {renderControl("Largura (W)", "walletFront", "photo", "width", 10, 40)}
                {renderControl("Altura (H)", "walletFront", "photo", "height", 15, 55)}
              </div>
            </div>

            {/* Nome Completo */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">NOME DO OPERADOR (Frente)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "walletFront", "name", "x", 10, 90)}
                {renderControl("Centro Y", "walletFront", "name", "y", 10, 90)}
                {renderControl("Largura (W)", "walletFront", "name", "width", 10, 80)}
                {renderControl("Altura (H)", "walletFront", "name", "height", 5, 30)}
                <div className="col-span-2">
                  {renderControl("Fonte Padrão", "walletFront", "name", "fontSize", 8, 22, 0.5)}
                </div>
              </div>
            </div>

            {/* CPF */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">CPF DO OPERADOR</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "walletFront", "cpf", "x", 10, 90)}
                {renderControl("Centro Y", "walletFront", "cpf", "y", 10, 90)}
                {renderControl("Largura (W)", "walletFront", "cpf", "width", 5, 40)}
                {renderControl("Altura (H)", "walletFront", "cpf", "height", 3, 20)}
                <div className="col-span-2">
                  {renderControl("Fonte Padrão", "walletFront", "cpf", "fontSize", 8, 20, 0.5)}
                </div>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">DATA DE NASCIMENTO</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "walletFront", "birthDate", "x", 10, 90)}
                {renderControl("Centro Y", "walletFront", "birthDate", "y", 10, 90)}
                {renderControl("Largura (W)", "walletFront", "birthDate", "width", 5, 40)}
                {renderControl("Altura (H)", "walletFront", "birthDate", "height", 3, 20)}
                <div className="col-span-2">
                  {renderControl("Fonte Padrão", "walletFront", "birthDate", "fontSize", 8, 20, 0.5)}
                </div>
              </div>
            </div>

            {/* Lista de Maquinas */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">MÁQUINAS HABILITADAS (Caixa Retangular)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "walletFront", "machines", "x", 30, 95)}
                {renderControl("Centro Y", "walletFront", "machines", "y", 10, 90)}
                {renderControl("Largura (W)", "walletFront", "machines", "width", 10, 80)}
                {renderControl("Altura (H)", "walletFront", "machines", "height", 5, 45)}
                <div className="col-span-2">
                  {renderControl("Fonte Máxima", "walletFront", "machines", "fontSize", 7, 18, 0.5)}
                </div>
              </div>
            </div>

            {/* Validade */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">DATA DE VALIDADE</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "walletFront", "validity", "x", 10, 90)}
                {renderControl("Centro Y", "walletFront", "validity", "y", 10, 99)}
                {renderControl("Largura (W)", "walletFront", "validity", "width", 5, 80)}
                {renderControl("Altura (H)", "walletFront", "validity", "height", 3, 20)}
                <div className="col-span-2">
                  {renderControl("Fonte Padrão", "walletFront", "validity", "fontSize", 8, 20, 0.5)}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CERTIFICADO CONTROLS */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <ZoomIn className="w-4 h-4 text-emerald-800" />
            <h4 className="font-black text-slate-800 text-sm">Posição das Informações no Certificado</h4>
          </div>

          <div className="space-y-4">
            {/* Nome do Aluno */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">NOME DO OPERADOR (Centralizado sobre a linha amarela)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "certFront", "name", "x", 10, 90)}
                {renderControl("Centro Y", "certFront", "name", "y", 20, 80)}
                <div className="col-span-2">
                  {renderControl("Comprimento da Caixa (Largura Máxima)", "certFront", "name", "width", 30, 95)}
                </div>
                <div className="col-span-2">
                  {renderControl("Tamanho Fonte Padrão", "certFront", "name", "fontSize", 15, 80, 1)}
                </div>
              </div>
            </div>

            {/* CPF do Aluno */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2">CPF DO OPERADOR (Somente os números)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "certFront", "cpf", "x", 10, 90)}
                {renderControl("Centro Y", "certFront", "cpf", "y", 10, 90)}
                {renderControl("Largura (W)", "certFront", "cpf", "width", 10, 90)}
                <div className="col-span-2">
                  {renderControl("Tamanho Fonte Padrão", "certFront", "cpf", "fontSize", 8, 50, 0.5)}
                </div>
              </div>
            </div>

            {/* Dia de Emissão do Certificado */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2 font-sans">DIA DE EMISSÃO (Certificado)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X (Dia)", "certFront", "dateDay", "x", 10, 95)}
                {renderControl("Centro Y (Dia)", "certFront", "dateDay", "y", 10, 95)}
                {renderControl("Largura (W)", "certFront", "dateDay", "width", 5, 90)}
                {renderControl("Altura (H)", "certFront", "dateDay", "height", 3, 20)}
                <div className="col-span-2">
                  {renderControl("Tamanho Fonte (Dia)", "certFront", "dateDay", "fontSize", 8, 50, 0.5)}
                </div>
              </div>
            </div>

            {/* Mês de Emissão do Certificado */}
            <div className="bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/50 space-y-2.5">
              <span className="text-xs font-black text-slate-750 block border-l-2 border-emerald-800 pl-2 font-sans">MÊS DE EMISSÃO (Certificado)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X (Mês)", "certFront", "dateMonth", "x", 10, 95)}
                {renderControl("Centro Y (Mês)", "certFront", "dateMonth", "y", 10, 95)}
                {renderControl("Largura (W)", "certFront", "dateMonth", "width", 5, 90)}
                {renderControl("Altura (H)", "certFront", "dateMonth", "height", 3, 20)}
                <div className="col-span-2">
                  {renderControl("Tamanho Fonte (Mês)", "certFront", "dateMonth", "fontSize", 8, 50, 0.5)}
                </div>
              </div>
            </div>

            {/* Máquinas Utilizadas (Verso do Certificado) */}
            <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200/30 space-y-2.5">
              <span className="text-xs font-black text-slate-800 block border-l-2 border-emerald-800 pl-2 font-sans">MÁQUINAS UTILIZADAS (Verso do Certificado)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {renderControl("Centro X", "certBack", "machines", "x", 10, 95)}
                {renderControl("Centro Y", "certBack", "machines", "y", 10, 95)}
                {renderControl("Largura (W)", "certBack", "machines", "width", 10, 95)}
                {renderControl("Altura (H)", "certBack", "machines", "height", 5, 60)}
                <div className="col-span-2">
                  {renderControl("Tamanho Fonte Padrão", "certBack", "machines", "fontSize", 8, 50, 0.5)}
                </div>
                <div className="col-span-2">
                  {renderControl("Espaçamento de Linha", "certBack", "machines", "lineHeight", 0.5, 3.5, 0.1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

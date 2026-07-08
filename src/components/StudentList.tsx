import React, { useState } from "react";
import { Student, FineTuneConfig, Category, CalibrationCategory } from "../types";
import { formatDateBR, calculateValidity } from "../utils/dateFormatter";
import { Search, Edit2, Trash2, FileText, CreditCard, ShieldAlert, Share2, Eye, Download, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateCompletePDF, downloadPDF, previewPDF, sharePDF } from "../utils/pdfGenerator";
import { speakDocumentSuccess } from "../utils/speech";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  fineTuneConfig: FineTuneConfig | Record<CalibrationCategory, FineTuneConfig>;
  onSearch: (query: string) => void;
  searchQuery: string;
  onPreview: (student: Student) => void;
  selectedStudentId?: string;
  onSelect?: (student: Student) => void;
}

export default function StudentList({
  students,
  onEdit,
  onDelete,
  fineTuneConfig,
  onSearch,
  searchQuery,
  onPreview,
  selectedStudentId,
  onSelect
}: StudentListProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleWhatsAppClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!student.whatsApp) {
      alert("Nenhum número de WhatsApp cadastrado para este operador.");
      return;
    }

    const cleanNumber = student.whatsApp.replace(/\D/g, "");
    if (!cleanNumber) {
      alert("O número de WhatsApp cadastrado é inválido.");
      return;
    }

    let formattedNumber = cleanNumber;
    if (formattedNumber.length === 10 || formattedNumber.length === 11) {
      formattedNumber = "55" + formattedNumber;
    }

    const expiryStr = calculateValidity(student.emissionDate, student.validityYears);
    let message = "";

    const nameParts = student.name.trim().split(" ");
    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();

    if (expiryStr) {
      const [expYear, expMonth, expDay] = expiryStr.split("-").map(Number);
      const expiryDate = new Date(expYear, expMonth - 1, expDay);
      expiryDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        message = `Olá, ${firstName}! Tudo bem?\n\nVerificamos que sua carteira/certificado de operador vencerá em aproximadamente ${diffDays} ${diffDays === 1 ? "dia" : "dias"}.\n\nPara evitar ficar com a documentação vencida e continuar apto para trabalhar, já podemos realizar sua renovação.\n\nCaso tenha interesse, me responda por aqui que passo todas as informações.`;
      } else if (diffDays === 0) {
        message = `Olá, ${firstName}! Tudo bem?\n\nSua carteira/certificado vence hoje.\n\nSe desejar, já podemos providenciar sua renovação para manter sua documentação sempre em dia.\n\nEstou à disposição!`;
      } else {
        message = `Olá, ${firstName}! Tudo bem?\n\nVerificamos que sua carteira/certificado já está vencida.\n\nCaso tenha interesse em renovar sua documentação, me responda por aqui que terei prazer em ajudar.`;
      }
    } else {
      message = `Olá, ${firstName}! Tudo bem?\n\nVerificamos que sua carteira/certificado já está vencida.\n\nCaso tenha interesse em renovar sua documentação, me responda por aqui que terei prazer em ajudar.`;
    }

    const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleGenerateDoc = async (student: Student, action: "preview" | "download" | "share") => {
    if (action === "preview" || action === "share") {
      onPreview(student);
      return;
    }

    setProcessingId(student.id);
    try {
      let pdf;
      const cleanName = student.name.toUpperCase().trim();
      const filename = `Carteira de Operador + Certificado - ${cleanName}.pdf`;

      let configKey: CalibrationCategory = student.category || "PESADAS";
      if (student.category === "PESADAS") {
        if (student.instructor === "Jhonny") {
          configKey = "PESADAS_JHONNY";
        } else if (student.instructor === "Richard") {
          configKey = "PESADAS_RICHARD";
        }
      }
      const studentConfig = (fineTuneConfig as any).walletFront
        ? (fineTuneConfig as FineTuneConfig)
        : ((fineTuneConfig as Record<CalibrationCategory, FineTuneConfig>)[configKey] || (fineTuneConfig as any));
      pdf = await generateCompletePDF(student, studentConfig);

      if (action === "download") {
        downloadPDF(pdf, filename);
        speakDocumentSuccess();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Ocorreu um erro ao gerar o documento completo.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4" id="student_list_section">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Pesquisar por Nome ou CPF..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-medium text-zinc-800 text-sm placeholder-zinc-400"
          />
        </div>
        <div className="text-xs text-zinc-500 font-bold tracking-tight">
          Exibindo <span className="text-zinc-900 font-black bg-zinc-100 px-2 py-1 rounded">{students.length} OPERADORES</span>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-zinc-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-zinc-900 tracking-tight">Confirmar Exclusão</h4>
            </div>
            <p className="text-sm text-zinc-650 leading-relaxed font-medium">
              Tem certeza que deseja excluir permanentemente este operador e seu histórico de emissões? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-700 text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-bold transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main List Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-400 border border-zinc-200">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-700">Nenhum operador encontrado</h4>
              <p className="text-sm text-zinc-500 mt-1">Cadastre um novo operador ou ajuste os termos de busca.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                  <th className="py-4 px-6">Operador</th>
                  <th className="py-4 px-6">CPF / Nascimento</th>
                  <th className="py-4 px-6">Máquinas Habilitadas</th>
                  <th className="py-4 px-6 text-center">Emissão / Validade</th>
                  <th className="py-4 px-6 text-right">Documentos e Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {students.map((student) => {
                  const isSelected = selectedStudentId === student.id;

                  // Calculate validity status
                  const expiryStr = calculateValidity(student.emissionDate, student.validityYears);
                  let statusLabel = "Ativa";
                  let statusBadgeClass = "bg-emerald-50 border-emerald-200 text-emerald-700";
                  let statusTooltip = `Válida até ${formatDateBR(expiryStr)}`;
                  let StatusIcon = CheckCircle2;

                  if (expiryStr) {
                    const [expYear, expMonth, expDay] = expiryStr.split("-").map(Number);
                    const expiryDate = new Date(expYear, expMonth - 1, expDay);
                    expiryDate.setHours(0, 0, 0, 0);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const diffTime = expiryDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                      statusLabel = "Vencida";
                      statusBadgeClass = "bg-rose-50 border-rose-200 text-rose-700";
                      statusTooltip = `Venceu em ${formatDateBR(expiryStr)}`;
                      StatusIcon = AlertCircle;
                    } else if (diffDays <= 30) {
                      statusLabel = diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
                      statusBadgeClass = "bg-amber-50 border-amber-200 text-amber-700";
                      statusTooltip = `Vencimento em ${formatDateBR(expiryStr)}`;
                      StatusIcon = Clock;
                    }
                  }

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelect?.(student)}
                      className={`transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-yellow-50/50 hover:bg-yellow-100/50 border-l-4 border-yellow-400"
                          : "hover:bg-zinc-50 border-l-4 border-transparent"
                      }`}
                    >
                      {/* Operator Main details */}
                      <td className="py-4 px-6 relative">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-13 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-zinc-400">
                                3X4
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-zinc-900 uppercase tracking-tight">
                                {student.name}
                              </span>
                              {student.whatsApp && (
                                <button
                                  type="button"
                                  onClick={(e) => handleWhatsAppClick(student, e)}
                                  className="inline-flex items-center justify-center p-1 bg-emerald-500 hover:bg-emerald-600 hover:scale-110 active:scale-95 text-white rounded-full transition-all shadow-sm shrink-0"
                                  title={`Enviar mensagem de renovação via WhatsApp (${student.whatsApp})`}
                                >
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.115 1.01 11.491 1.01c-5.44 0-9.866 4.372-9.87 9.802 0 1.688.45 3.333 1.305 4.76L1.9 21.053l5.645-1.47c1.378.76 2.871 1.159 4.363 1.162zM17.15 14.65c-.297-.15-1.758-.868-2.031-.967-.273-.099-.472-.15-.672.15-.199.299-.773.967-.948 1.167-.174.199-.347.225-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2-.001-.523.074-.797.373-.273.299-1.045 1.02-1.045 2.487s1.07 2.922 1.22 3.121c.15.198 2.105 3.213 5.099 4.506.712.308 1.268.492 1.703.63.715.227 1.365.195 1.88.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  </svg>
                                </button>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${statusBadgeClass}`}
                                title={statusTooltip}
                              >
                                <StatusIcon className="w-3 h-3 shrink-0" />
                                {statusLabel}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-zinc-400 font-mono">
                                ID: {student.id}
                              </span>
                              <span className={`px-1.5 py-0.2 bg-zinc-50 border rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                student.category === "AGRICOLAS"
                                  ? "bg-green-50 border-green-200 text-green-700"
                                  : student.category === "MUNCK"
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : student.category === "EMPILHADEIRA"
                                  ? "bg-orange-50 border-orange-200 text-orange-700"
                                  : student.category === "FLORESTAIS"
                                  ? "bg-teal-50 border-teal-200 text-teal-700"
                                  : "bg-amber-50 border-amber-200 text-amber-700"
                              }`}>
                                {student.category === "AGRICOLAS" 
                                  ? "Agrícola" 
                                  : student.category === "MUNCK" 
                                  ? "Munck" 
                                  : student.category === "EMPILHADEIRA"
                                  ? "Empilhadeira"
                                  : student.category === "FLORESTAIS"
                                  ? "M. Florestais"
                                  : "Pesadas"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CPF / Birthdate */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-zinc-800 font-mono">{student.cpf}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">Nasc: {formatDateBR(student.birthDate)}</div>
                      </td>

                      {/* Machines List */}
                      <td className="py-4 px-6 max-w-[240px]">
                        <div className="flex flex-wrap gap-1">
                          {student.machines.slice(0, 3).map((machine) => (
                            <span
                              key={machine}
                              className="inline-block px-2 py-0.5 bg-zinc-100 text-[10px] font-black text-zinc-650 rounded uppercase tracking-wider"
                              title={machine}
                            >
                              {machine.split(" ")[0]} {/* show first word to fit */}
                            </span>
                          ))}
                          {student.machines.length > 3 && (
                            <span className="inline-block px-1.5 py-0.5 bg-brand-light-accent text-[10px] font-bold text-brand-primary rounded">
                              +{student.machines.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 text-center">
                        <div className="text-xs text-zinc-700 font-medium italic">
                          {formatDateBR(student.emissionDate)}
                        </div>
                        <div className="text-[10px] font-black text-white mt-1.5 bg-brand-primary px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider">
                          VAL: {student.validityYears} {student.validityYears === 1 ? "ANO" : "ANOS"}
                        </div>
                      </td>

                      {/* Document Exports & Actions */}
                      <td className="py-4 px-6 text-right space-y-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="inline-flex rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm" id={`group_actions_${student.id}`}>
                            <button
                              disabled={processingId !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateDoc(student, "preview");
                              }}
                              className="p-2 hover:bg-zinc-100 text-zinc-600 border-r border-zinc-100 transition-colors flex items-center gap-1 text-xs font-bold"
                              title="Visualizar Documento Completo"
                              id={`btn_preview_${student.id}`}
                            >
                              <Eye className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Visualizar</span>
                            </button>
                            <button
                              disabled={processingId !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateDoc(student, "download");
                              }}
                              className="p-2 hover:bg-brand-accent hover:text-white text-zinc-800 border-r border-zinc-100 font-black text-xs flex items-center gap-1 transition-colors"
                              title="Baixar Documento Completo"
                              id={`btn_download_${student.id}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar PDF</span>
                            </button>
                            <button
                              disabled={processingId !== null}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateDoc(student, "share");
                              }}
                              className="p-2 hover:bg-zinc-100 text-zinc-600 transition-colors flex items-center gap-1 text-xs font-bold"
                              title="Compartilhar Documento Completo"
                              id={`btn_share_${student.id}`}
                            >
                              <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Compartilhar</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(student);
                            }}
                            className="text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Editar Cadastro"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(student.id);
                            }}
                            className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>

                        {processingId === student.id && (
                          <div className="text-[10px] text-zinc-900 animate-pulse font-black uppercase tracking-wider">
                            Gerando Documentos...
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

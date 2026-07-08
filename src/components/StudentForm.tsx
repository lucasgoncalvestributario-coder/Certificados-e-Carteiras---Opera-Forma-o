import React, { useState, useEffect, useRef } from "react";
import { Student, Category } from "../types";
import { formatCPF, formatDateBR } from "../utils/dateFormatter";
import { Upload, X, ShieldCheck, Cpu, Calendar, Plus, User, FileText, Phone } from "lucide-react";
import ImageCropperModal from "./ImageCropperModal";

interface StudentFormProps {
  student?: Student;
  onSave: (student: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  onCancel: () => void;
}

const MACHINES_BY_CATEGORY: Record<Category, string[]> = {
  PESADAS: [
    "ESCAVADEIRA HIDRÁULICA",
    "RETROESCAVADEIRA",
    "PÁ CARREGADEIRA",
    "EMPILHADEIRA",
    "MOTONIVELADORA",
    "MINI ESCAVADEIRA",
    "MINI CARREGADEIRA",
    "ROLO COMPACTADOR"
  ],
  AGRICOLAS: [
    "TRATOR PNEU",
    "PULVERIZADOR",
    "COLHEITADEIRA"
  ],
  MUNCK: [
    "CAMINHÃO MUNCK"
  ],
  EMPILHADEIRA: [
    "EMPILHADEIRA"
  ],
  FLORESTAIS: [
    "SKIDDER",
    "HARVESTER",
    "FORWARDER"
  ]
};

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function parseEmissionDate(dateStr: string) {
  if (!dateStr) {
    const today = new Date();
    return {
      day: String(today.getDate()).padStart(2, "0"),
      month: MONTHS_PT[today.getMonth()],
      year: String(today.getFullYear())
    };
  }
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return {
      day: String(d).padStart(2, "0"),
      month: MONTHS_PT[m - 1] || MONTHS_PT[0],
      year: String(y)
    };
  }
  const today = new Date();
  return {
    day: String(today.getDate()).padStart(2, "0"),
    month: MONTHS_PT[today.getMonth()],
    year: String(today.getFullYear())
  };
}

export default function StudentForm({ student, onSave, onCancel }: StudentFormProps) {
  const [name, setName] = useState(student?.name || "");
  const [cpf, setCpf] = useState(student?.cpf || "");
  const [birthDate, setBirthDate] = useState(student?.birthDate || "");
  
  // Parse initial emission date parts
  const initialParts = parseEmissionDate(student?.emissionDate || new Date().toISOString().split("T")[0]);
  const [emissionDay, setEmissionDay] = useState(student?.emissionDay || initialParts.day);
  const [emissionMonth, setEmissionMonth] = useState(student?.emissionMonth || initialParts.month);
  const [emissionYear, setEmissionYear] = useState(initialParts.year);

  const [validityYears, setValidityYears] = useState<number>(student?.validityYears || 1);
  const [category, setCategory] = useState<Category>(student?.category || "PESADAS");
  const [instructor, setInstructor] = useState<"Ivan" | "Jhonny" | "Richard">(student?.instructor || "Ivan");
  const [machines, setMachines] = useState<string[]>(student?.machines || []);
  const [customMachine, setCustomMachine] = useState("");
  const [photoUrl, setPhotoUrl] = useState(student?.photoUrl || "");
  const [whatsApp, setWhatsApp] = useState(student?.whatsApp || "");
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if student changes
  useEffect(() => {
    if (student) {
      setName(student.name);
      setCpf(student.cpf);
      setBirthDate(student.birthDate);
      
      const parsed = parseEmissionDate(student.emissionDate);
      setEmissionDay(student.emissionDay || parsed.day);
      setEmissionMonth(student.emissionMonth || parsed.month);
      setEmissionYear(parsed.year);

      setValidityYears(student.validityYears);
      const cat = student.category || "PESADAS";
      setCategory(cat);
      setInstructor(student.instructor || "Ivan");
      
      if (cat === "AGRICOLAS") {
        const allowed = ["TRATOR PNEU", "PULVERIZADOR", "COLHEITADEIRA"];
        const filtered = student.machines.filter(m => allowed.includes(m));
        setMachines(filtered.length > 0 ? filtered : ["TRATOR PNEU"]);
      } else if (cat === "MUNCK") {
        setMachines(["CAMINHÃO MUNCK"]);
      } else if (cat === "EMPILHADEIRA") {
        setMachines(["EMPILHADEIRA"]);
      } else if (cat === "FLORESTAIS") {
        const allowed = ["SKIDDER", "HARVESTER", "FORWARDER"];
        const filtered = student.machines.filter(m => allowed.includes(m));
        setMachines(filtered.length > 0 ? filtered : ["SKIDDER"]);
      } else {
        setMachines(student.machines);
      }
      setPhotoUrl(student.photoUrl);
      setWhatsApp(student.whatsApp || "");
    }
  }, [student]);

  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    if (newCat === "MUNCK") {
      setMachines(["CAMINHÃO MUNCK"]);
    } else if (newCat === "AGRICOLAS") {
      const allowed = ["TRATOR PNEU", "PULVERIZADOR", "COLHEITADEIRA"];
      const filtered = machines.filter(m => allowed.includes(m));
      setMachines(filtered.length > 0 ? filtered : ["TRATOR PNEU"]);
    } else if (newCat === "EMPILHADEIRA") {
      setMachines(["EMPILHADEIRA"]);
    } else if (newCat === "FLORESTAIS") {
      const allowed = ["SKIDDER", "HARVESTER", "FORWARDER"];
      const filtered = machines.filter(m => allowed.includes(m));
      setMachines(filtered.length > 0 ? filtered : ["SKIDDER"]);
    } else if (newCat === "PESADAS") {
      // filter out agricultural and munck and others
      const filtered = machines.filter(m => 
        m !== "CAMINHÃO MUNCK" && 
        m !== "TRATOR PNEU" && 
        m !== "PULVERIZADOR" && 
        m !== "COLHEITADEIRA" &&
        m !== "EMPILHADEIRA" &&
        m !== "SKIDDER" &&
        m !== "HARVESTER" &&
        m !== "FORWARDER"
      );
      setMachines(filtered.length > 0 ? filtered : ["ESCAVADEIRA HIDRÁULICA"]);
    }
  };

  // Handle CPF Input
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCpf(formatCPF(rawVal));
  };

  // Handle WhatsApp Input
  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length > 6) {
      setWhatsApp(`(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`);
    } else if (val.length > 2) {
      setWhatsApp(`(${val.slice(0, 2)}) ${val.slice(2)}`);
    } else if (val.length > 0) {
      setWhatsApp(`(${val.slice(0, 2)}`);
    } else {
      setWhatsApp("");
    }
  };

  // Convert uploaded file to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Apenas arquivos de imagem são permitidos (JPG, PNG, JPEG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("A imagem deve ter no máximo 2MB.");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setTempImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle file uploads (Click)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Add a machine to the active list
  const toggleMachine = (machine: string) => {
    const trimmed = machine.trim().toUpperCase();
    if (!trimmed) return;
    
    if (machines.includes(trimmed)) {
      setMachines(machines.filter((m) => m !== trimmed));
    } else {
      setMachines([...machines, trimmed]);
    }
  };

  // Add custom machine typing
  const handleAddCustomMachine = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customMachine.trim().toUpperCase();
    if (!trimmed) return;

    if (!machines.includes(trimmed)) {
      setMachines([...machines, trimmed]);
    }
    setCustomMachine("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrorMsg("Por favor, insira o nome completo.");
      return;
    }
    if (!cpf.trim() || cpf.length < 14) {
      setErrorMsg("Por favor, insira um CPF válido (000.000.000-00).");
      return;
    }
    if (!birthDate) {
      setErrorMsg("Por favor, insira a data de nascimento.");
      return;
    }
    if (machines.length === 0) {
      setErrorMsg("Selecione pelo menos uma máquina habilitada.");
      return;
    }

    setErrorMsg("");

    const monthIdx = MONTHS_PT.indexOf(emissionMonth);
    const monthNum = monthIdx !== -1 ? monthIdx + 1 : 1;
    const monthStr = String(monthNum).padStart(2, "0");
    const dayStr = String(Number(emissionDay) || 1).padStart(2, "0");
    const reconstructedEmissionDate = `${emissionYear}-${monthStr}-${dayStr}`;

    onSave({
      id: student?.id,
      name: name.trim(),
      cpf: cpf.trim(),
      birthDate,
      emissionDate: reconstructedEmissionDate,
      validityYears,
      category,
      instructor: category === "PESADAS" ? instructor : undefined,
      whatsApp: whatsApp.trim(),
      machines,
      photoUrl,
      emissionDay,
      emissionMonth
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden" id="student_form_container">
      <div className="bg-brand-primary px-6 py-4 flex items-center justify-between border-b border-zinc-200">
        <h3 className="text-white font-black text-sm flex items-center gap-2 uppercase tracking-wide">
          <ShieldCheck className="w-5 h-5 text-brand-accent" />
          {student ? "Editar Operador" : "Cadastrar Novo Operador"}
        </h3>
        <button
          onClick={onCancel}
          className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PHOTO UPLOADER (Col 1) */}
          <div className="md:col-span-1 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Foto do Operador (Obrigatória para Carteira)
            </label>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-[240px] relative overflow-hidden ${
                isDragActive
                  ? "border-brand-accent bg-zinc-50"
                  : photoUrl
                  ? "border-zinc-200 bg-zinc-50"
                  : "border-zinc-300 hover:border-brand-accent hover:bg-zinc-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 text-xs">
                    <Upload className="w-8 h-8 text-white" />
                    <span>Alterar Foto</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoUrl("");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md hover:scale-105 transition-transform"
                    title="Remover Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center space-y-2 p-2">
                  <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-200">
                    <Upload className="w-6 h-6 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-700">Arraste a foto aqui</p>
                    <p className="text-xs text-zinc-500 mt-1">Ou clique para buscar</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium">Proporção 3x4 (vertical) recomendada</p>
                </div>
              )}
            </div>
          </div>

          {/* PERSONAL DATA (Col 2 & 3) */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="NOME COMPLETO DO OPERADOR"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-semibold text-zinc-800 placeholder-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> CPF
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-semibold text-zinc-800 placeholder-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data de Nascimento
                </label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-semibold text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-green-600" /> WhatsApp (Uso Interno)
                </label>
                <input
                  type="text"
                  value={whatsApp}
                  onChange={handleWhatsAppChange}
                  placeholder="(00) 90000-0000"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-semibold text-zinc-800 placeholder-zinc-400"
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Dia (Emissão)
                  </label>
                  <select
                    value={emissionDay}
                    onChange={(e) => setEmissionDay(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-bold text-zinc-800 text-sm"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    Mês (Emissão)
                  </label>
                  <select
                    value={emissionMonth}
                    onChange={(e) => setEmissionMonth(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-bold text-zinc-800 text-sm"
                  >
                    {MONTHS_PT.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    Ano (Emissão)
                  </label>
                  <select
                    value={emissionYear}
                    onChange={(e) => setEmissionYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-bold text-zinc-800 text-sm"
                  >
                    {Array.from({ length: 20 }, (_, i) => String(2020 + i)).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                  Validade da Carteira
                </label>
                <select
                  value={validityYears}
                  onChange={(e) => setValidityYears(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-bold text-zinc-800 text-sm"
                >
                  <option value={1}>1 ano</option>
                  <option value={2}>2 anos</option>
                  <option value={3}>3 anos</option>
                  <option value={4}>4 anos</option>
                  <option value={5}>5 anos</option>
                </select>
              </div>

              {category === "PESADAS" && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Instrutor Responsável
                  </label>
                  <select
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value as "Ivan" | "Jhonny" | "Richard")}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all font-bold text-zinc-800 text-sm"
                  >
                    <option value="Ivan">Ivan</option>
                    <option value="Jhonny">Jhonny</option>
                    <option value="Richard">Richard</option>
                  </select>
                </div>
              )}

              <div className="sm:col-span-2 border-t border-zinc-100 pt-4 mt-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Categoria do Treinamento (Modelo Visual)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                    category === "PESADAS"
                      ? "bg-yellow-400/10 border-yellow-450 text-zinc-900 ring-1 ring-yellow-400 shadow-sm"
                      : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100"
                  }`}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === "PESADAS"}
                      onChange={() => handleCategoryChange("PESADAS")}
                      className="hidden"
                    />
                    <span className="font-extrabold uppercase text-xs">Máquinas Pesadas</span>
                    <span className="text-[9px] text-zinc-400 mt-1 font-medium leading-tight">Frente Nova de Certificado</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                    category === "AGRICOLAS"
                      ? "bg-yellow-400/10 border-yellow-450 text-zinc-900 ring-1 ring-yellow-400 shadow-sm"
                      : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100"
                  }`}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === "AGRICOLAS"}
                      onChange={() => handleCategoryChange("AGRICOLAS")}
                      className="hidden"
                    />
                    <span className="font-extrabold uppercase text-xs">Máquinas Agrícolas</span>
                    <span className="text-[9px] text-zinc-400 mt-1 font-medium leading-tight">Identidade Visual Agrícola</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                    category === "MUNCK"
                      ? "bg-yellow-400/10 border-yellow-450 text-zinc-900 ring-1 ring-yellow-400 shadow-sm"
                      : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100"
                  }`}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === "MUNCK"}
                      onChange={() => handleCategoryChange("MUNCK")}
                      className="hidden"
                    />
                    <span className="font-extrabold uppercase text-xs">Caminhão Munck</span>
                    <span className="text-[9px] text-zinc-400 mt-1 font-medium leading-tight">Identidade Visual Munck</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                    category === "EMPILHADEIRA"
                      ? "bg-yellow-400/10 border-yellow-450 text-zinc-900 ring-1 ring-yellow-400 shadow-sm"
                      : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100"
                  }`}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === "EMPILHADEIRA"}
                      onChange={() => handleCategoryChange("EMPILHADEIRA")}
                      className="hidden"
                    />
                    <span className="font-extrabold uppercase text-xs">Empilhadeira</span>
                    <span className="text-[9px] text-zinc-400 mt-1 font-medium leading-tight">Identidade Visual Empilhadeira</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all text-center ${
                    category === "FLORESTAIS"
                      ? "bg-yellow-400/10 border-yellow-450 text-zinc-900 ring-1 ring-yellow-400 shadow-sm"
                      : "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100"
                  }`}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === "FLORESTAIS"}
                      onChange={() => handleCategoryChange("FLORESTAIS")}
                      className="hidden"
                    />
                    <span className="font-extrabold uppercase text-xs">M. Florestais</span>
                    <span className="text-[9px] text-zinc-400 mt-1 font-medium leading-tight">Identidade Visual Florestais</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MACHINES SELECTION */}
        <div className="border-t border-zinc-200 pt-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> Máquinas Habilitadas ({machines.length} selecionadas)
            </label>
            <p className="text-xs text-zinc-400 font-medium">Clique nas máquinas abaixo para habilitar o operador ou adicione uma customizada.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MACHINES_BY_CATEGORY[category].map((machine) => {
              const isSelected = machines.includes(machine);
              return (
                <button
                  type="button"
                  key={machine}
                  onClick={() => toggleMachine(machine)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-sm"
                      : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-655"
                  }`}
                >
                  {machine}
                </button>
              );
            })}
          </div>

          {category === "PESADAS" && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customMachine}
                onChange={(e) => setCustomMachine(e.target.value)}
                placeholder="OUTRA MÁQUINA (EX: PÁ CARREGADEIRA)"
                className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all text-xs font-semibold text-zinc-800 placeholder-zinc-400"
              />
              <button
                type="button"
                onClick={handleAddCustomMachine}
                className="px-4 py-2 bg-brand-primary hover:opacity-90 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-brand-accent" /> Adicionar
              </button>
            </div>
          )}

          {machines.length > 0 && (
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200">
              <span className="text-[10px] uppercase tracking-wider font-black text-zinc-400 block mb-2">
                Máquinas na Carteira (Visualizar Ordem):
              </span>
              <div className="flex flex-wrap gap-2">
                {machines.map((m, index) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-xs font-bold text-zinc-700"
                  >
                    <span className="text-zinc-900 font-extrabold">{index + 1}.</span> {m}
                    <button
                      type="button"
                      onClick={() => toggleMachine(m)}
                      className="text-zinc-400 hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-zinc-200 hover:bg-zinc-100 rounded-xl text-zinc-600 text-sm font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-brand-accent hover:opacity-90 text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center gap-1 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            Salvar Registro
          </button>
        </div>
      </form>

      {tempImage && (
        <ImageCropperModal
          imageSrc={tempImage}
          onCrop={(cropped) => {
            setPhotoUrl(cropped);
            setTempImage(null);
          }}
          onClose={() => setTempImage(null)}
        />
      )}
    </div>
  );
}

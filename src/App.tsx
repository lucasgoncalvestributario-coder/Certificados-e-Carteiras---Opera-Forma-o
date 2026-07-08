import React, { useState, useEffect, useRef, useMemo } from "react";
import { Student, FineTuneConfig, DEFAULT_FINE_TUNE_CONFIG, Category, CalibrationCategory } from "./types";

const loadCategoryConfigs = (): Record<CalibrationCategory, FineTuneConfig> => {
  const saved = localStorage.getItem("opera_formacao_category_fine_tune_configs");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const categories: CalibrationCategory[] = ["PESADAS", "AGRICOLAS", "MUNCK", "EMPILHADEIRA", "FLORESTAIS", "PESADAS_JHONNY", "PESADAS_RICHARD"];
      const validated: Partial<Record<CalibrationCategory, FineTuneConfig>> = {};
      categories.forEach((cat) => {
        if (parsed[cat]) {
          validated[cat] = {
            walletFront: { ...DEFAULT_FINE_TUNE_CONFIG.walletFront, ...parsed[cat].walletFront },
            certFront: { ...DEFAULT_FINE_TUNE_CONFIG.certFront, ...parsed[cat].certFront },
            certBack: { ...DEFAULT_FINE_TUNE_CONFIG.certBack, ...parsed[cat].certBack },
          };
        } else {
          if (cat === "PESADAS_JHONNY" || cat === "PESADAS_RICHARD") {
            const pesadas = parsed["PESADAS"] || DEFAULT_FINE_TUNE_CONFIG;
            validated[cat] = {
              walletFront: { ...DEFAULT_FINE_TUNE_CONFIG.walletFront, ...pesadas.walletFront },
              certFront: { ...DEFAULT_FINE_TUNE_CONFIG.certFront, ...pesadas.certFront },
              certBack: { ...DEFAULT_FINE_TUNE_CONFIG.certBack, ...pesadas.certBack },
            };
          } else {
            validated[cat] = { ...DEFAULT_FINE_TUNE_CONFIG };
          }
        }
      });
      return validated as Record<CalibrationCategory, FineTuneConfig>;
    } catch (e) {
      console.error("Error parsing category configs", e);
    }
  }

  // Backwards compatibility
  const oldSaved = localStorage.getItem("opera_formacao_fine_tune_config");
  if (oldSaved) {
    try {
      const parsed = JSON.parse(oldSaved);
      if (parsed?.walletFront?.name?.width && parsed?.certFront?.name?.width) {
        const baseConfig: FineTuneConfig = {
          walletFront: { ...DEFAULT_FINE_TUNE_CONFIG.walletFront, ...parsed.walletFront },
          certFront: { ...DEFAULT_FINE_TUNE_CONFIG.certFront, ...parsed.certFront },
          certBack: { ...DEFAULT_FINE_TUNE_CONFIG.certBack, ...parsed.certBack || DEFAULT_FINE_TUNE_CONFIG.certBack },
        };
        return {
          PESADAS: { ...baseConfig },
          PESADAS_JHONNY: { ...baseConfig },
          PESADAS_RICHARD: { ...baseConfig },
          AGRICOLAS: { ...baseConfig },
          MUNCK: { ...baseConfig },
          EMPILHADEIRA: { ...baseConfig },
          FLORESTAIS: { ...baseConfig },
        };
      }
    } catch (e) {}
  }

  return {
    PESADAS: { ...DEFAULT_FINE_TUNE_CONFIG },
    PESADAS_JHONNY: { ...DEFAULT_FINE_TUNE_CONFIG },
    PESADAS_RICHARD: { ...DEFAULT_FINE_TUNE_CONFIG },
    AGRICOLAS: { ...DEFAULT_FINE_TUNE_CONFIG },
    MUNCK: { ...DEFAULT_FINE_TUNE_CONFIG },
    EMPILHADEIRA: { ...DEFAULT_FINE_TUNE_CONFIG },
    FLORESTAIS: { ...DEFAULT_FINE_TUNE_CONFIG },
  };
};

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
import {
  getStudents,
  saveStudent,
  deleteStudent,
  searchStudents,
  exportDatabase,
  importDatabase,
  saveCustomApostila,
  getCustomApostila,
  deleteCustomApostila,
} from "./utils/db";
import { calculateValidity } from "./utils/dateFormatter";
import StudentForm from "./components/StudentForm";
import StudentList from "./components/StudentList";
import FineTunePanel from "./components/FineTunePanel";
import CardRenderer from "./components/CardRenderer";
import DocumentPreviewModal from "./components/DocumentPreviewModal";
import { extractPaletteFromLogo, DEFAULT_PALETTE, ExtractedPalette } from "./utils/logoThemeExtractor";
import {
  ShieldCheck,
  PlusCircle,
  Search,
  Database,
  FileDown,
  FileUp,
  History,
  Sliders,
  HelpCircle,
  HardHat,
  Cpu,
  BookmarkCheck,
  Users,
  AlertTriangle,
  LayoutDashboard,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  Wifi,
  WifiOff,
  BookOpen,
  Sparkles,
  Volume2,
  X
} from "lucide-react";

// Unicode safe Base64 encoding/decoding for sharing links
function encodePayload(payload: any): string {
  const jsonStr = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(jsonStr);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

function decodePayload(base64: string): any {
  try {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro ao decodificar dados compartilhados:", error);
    return null;
  }
}

// Function to recover the session state if the user closed/left and returned within 30 minutes
const getInitialSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("opera_formacao_session_state");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.timestamp) {
        const diffMinutes = (Date.now() - parsed.timestamp) / (1000 * 60);
        if (diffMinutes <= 30) { // 30 minutes threshold
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Error reading initial session:", e);
  }
  return null;
};

const initialSession = getInitialSession();

export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState(() => initialSession?.searchQuery || "");
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(() => initialSession?.editingStudent || undefined);
  const [showForm, setShowForm] = useState(() => initialSession?.showForm || false);
  const [showFineTune, setShowFineTune] = useState(() => initialSession?.showFineTune || false);
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<Student | undefined>(() => initialSession?.selectedPreviewStudent || undefined);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewModalStudent, setPreviewModalStudent] = useState<Student | undefined>(() => initialSession?.previewModalStudent || undefined);
  const [showApostilasModal, setShowApostilasModal] = useState(false);
  const [apostilasStatus, setApostilasStatus] = useState<Record<string, boolean>>({
    PESADAS: false,
    AGRICOLAS: false,
    MUNCK: false,
    EMPILHADEIRA: false,
  });

  const checkApostilasStatus = async () => {
    const status: Record<string, boolean> = {
      PESADAS: false,
      AGRICOLAS: false,
      MUNCK: false,
      EMPILHADEIRA: false,
    };
    for (const cat of ["PESADAS", "AGRICOLAS", "MUNCK", "EMPILHADEIRA"]) {
      try {
        const file = await getCustomApostila(cat as Category);
        status[cat] = !!file;
      } catch (e) {
        console.error(e);
      }
    }
    setApostilasStatus(status);
  };

  useEffect(() => {
    checkApostilasStatus();
  }, []);

  // Share & Access Control States
  const [shareParam, setShareParam] = useState<string | null>(null);
  const [isVerifyingShare, setIsVerifyingShare] = useState(false);
  const [sharePayload, setSharePayload] = useState<any | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(() => !!initialSession);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Bem vinda novamente Karol, vamos ao trabalho!");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Logo color extraction state
  const [brandPalette, setBrandPalette] = useState<ExtractedPalette>(DEFAULT_PALETTE);
  const [showSplash, setShowSplash] = useState(() => !initialSession);
  const [splashVisible, setSplashVisible] = useState(() => !initialSession);
  const [currentTab, setCurrentTab] = useState<"dashboard" | "form" | "history" | "finetune">(() => initialSession?.currentTab || "dashboard");

  // Active Category being calibrated
  const [activeCalibrationCategory, setActiveCalibrationCategory] = useState<CalibrationCategory>(() => initialSession?.activeCalibrationCategory || "PESADAS");

  // Save session state to localStorage on state changes to allow instant restore on return
  useEffect(() => {
    const sessionState = {
      timestamp: Date.now(),
      currentTab,
      activeCalibrationCategory,
      searchQuery,
      editingStudent,
      showForm,
      showFineTune,
      selectedPreviewStudent,
      previewModalStudent,
    };
    localStorage.setItem("opera_formacao_session_state", JSON.stringify(sessionState));
  }, [
    currentTab,
    activeCalibrationCategory,
    searchQuery,
    editingStudent,
    showForm,
    showFineTune,
    selectedPreviewStudent,
    previewModalStudent,
  ]);

  // Load category-specific fine-tune configs
  const [categoryConfigs, setCategoryConfigs] = useState<Record<CalibrationCategory, FineTuneConfig>>(() => {
    return loadCategoryConfigs();
  });

  // Track the saved version of the fine tune configs to detect changes
  const [savedCategoryConfigs, setSavedCategoryConfigs] = useState<Record<CalibrationCategory, FineTuneConfig>>(() => {
    return loadCategoryConfigs();
  });

  // Helper to import a single/shared config across all categories
  const importSharedConfig = (sharedConfig: FineTuneConfig) => {
    const newConfigs: Record<CalibrationCategory, FineTuneConfig> = {
      PESADAS: { ...sharedConfig },
      PESADAS_JHONNY: { ...sharedConfig },
      PESADAS_RICHARD: { ...sharedConfig },
      AGRICOLAS: { ...sharedConfig },
      MUNCK: { ...sharedConfig },
      EMPILHADEIRA: { ...sharedConfig },
      FLORESTAIS: { ...sharedConfig },
    };
    setCategoryConfigs(newConfigs);
    setSavedCategoryConfigs(newConfigs);
    localStorage.setItem("opera_formacao_category_fine_tune_configs", JSON.stringify(newConfigs));
  };

  // Compute the current active fine-tune config dynamically
  const fineTuneConfig = useMemo(() => {
    if (currentTab === "finetune") {
      return categoryConfigs[activeCalibrationCategory];
    }
    let studentKey: CalibrationCategory = selectedPreviewStudent?.category || "PESADAS";
    if (selectedPreviewStudent?.category === "PESADAS") {
      if (selectedPreviewStudent.instructor === "Jhonny") {
        studentKey = "PESADAS_JHONNY";
      } else if (selectedPreviewStudent.instructor === "Richard") {
        studentKey = "PESADAS_RICHARD";
      }
    }
    return categoryConfigs[studentKey];
  }, [categoryConfigs, activeCalibrationCategory, selectedPreviewStudent, currentTab]);

  // Compute the current saved fine-tune config dynamically
  const savedFineTuneConfig = useMemo(() => {
    if (currentTab === "finetune") {
      return savedCategoryConfigs[activeCalibrationCategory];
    }
    let studentKey: CalibrationCategory = selectedPreviewStudent?.category || "PESADAS";
    if (selectedPreviewStudent?.category === "PESADAS") {
      if (selectedPreviewStudent.instructor === "Jhonny") {
        studentKey = "PESADAS_JHONNY";
      } else if (selectedPreviewStudent.instructor === "Richard") {
        studentKey = "PESADAS_RICHARD";
      }
    }
    return savedCategoryConfigs[studentKey];
  }, [savedCategoryConfigs, activeCalibrationCategory, selectedPreviewStudent, currentTab]);

  // Compute student used for live preview in the side panel
  const previewStudent = useMemo(() => {
    if (currentTab === "finetune") {
      const baseStudent = selectedPreviewStudent || students[0] || {
        id: "MOCK_STUDENT",
        name: "NOME DO OPERADOR EXEMPLO",
        cpf: "123.456.789-00",
        birthDate: "1990-05-15",
        emissionDate: new Date().toISOString().split("T")[0],
        validityYears: 5,
        category: "PESADAS",
        machines: ["ESCAVADEIRA", "RETROESCAVADEIRA", "PÁ CARREGADEIRA"],
        photoUrl: "",
        createdAt: "",
        updatedAt: ""
      };
      const mappedCategory = (activeCalibrationCategory === "PESADAS_JHONNY" || activeCalibrationCategory === "PESADAS_RICHARD") ? "PESADAS" : activeCalibrationCategory as Category;
      const mappedInstructor = activeCalibrationCategory === "PESADAS_JHONNY" ? "Jhonny" : (activeCalibrationCategory === "PESADAS_RICHARD" ? "Richard" : "Ivan");
      return {
        ...baseStudent,
        category: mappedCategory,
        instructor: mappedInstructor
      };
    }
    return selectedPreviewStudent;
  }, [currentTab, selectedPreviewStudent, students, activeCalibrationCategory]);

  // Load student directory & set default preview
  const loadDirectory = () => {
    const list = searchStudents(searchQuery);
    setStudents(list);
  };

  useEffect(() => {
    loadDirectory();
  }, [searchQuery]);

  // Check for shared database links on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let shareCode = params.get("share");
      
      if (!shareCode && window.location.hash) {
        // Try to find share= inside the hash
        const hashMatch = window.location.hash.match(/share=([^&]+)/);
        if (hashMatch) {
          shareCode = hashMatch[1];
        }
      }
      
      if (shareCode) {
        const decoded = decodePayload(shareCode);
        if (decoded && decoded.email) {
          setShareParam(shareCode);
          setSharePayload(decoded);
          
          // Auto-verify if this browser has already authorized this email
          const savedEmail = localStorage.getItem("opera_formacao_authorized_user_email");
          if (savedEmail && savedEmail.trim().toLowerCase() === decoded.email.trim().toLowerCase()) {
            if (decoded.students) {
              localStorage.setItem("opera_formacao_students_db", JSON.stringify(decoded.students));
              if (decoded.config) {
                localStorage.setItem("opera_formacao_fine_tune_config", JSON.stringify(decoded.config));
                importSharedConfig(decoded.config);
              }
              loadDirectory();
            }
            // Remove parameter from URL for cleanliness
            window.history.replaceState({}, document.title, window.location.pathname);
            setShareParam(null);
            setIsVerifyingShare(false);
          } else {
            setIsVerifyingShare(true);
          }
        }
      }
    } catch (err) {
      console.error("Erro no processamento do compartilhamento:", err);
    }
  }, []);

  const handleConfirmShareEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharePayload) return;

    const enteredEmail = verificationEmail.trim().toLowerCase();
    const targetEmail = sharePayload.email.trim().toLowerCase();

    if (enteredEmail === targetEmail) {
      setVerificationSuccess(true);
      setVerificationError(null);

      // Successfully authorized! Store user's email in local storage
      localStorage.setItem("opera_formacao_authorized_user_email", enteredEmail);

      // Save shared students list to local storage
      if (sharePayload.students) {
        localStorage.setItem("opera_formacao_students_db", JSON.stringify(sharePayload.students));
      }
      
      // Save shared fine tune config to local storage if present
      if (sharePayload.config) {
        localStorage.setItem("opera_formacao_fine_tune_config", JSON.stringify(sharePayload.config));
        importSharedConfig(sharePayload.config);
      }

      setTimeout(() => {
        // Refresh local student directory in state
        loadDirectory();
        
        // Clear share parameter from URL for cleanliness
        window.history.replaceState({}, document.title, window.location.pathname);
        setShareParam(null);
        setIsVerifyingShare(false);
        setVerificationSuccess(false);
        setVerificationEmail("");
      }, 2000);
    } else {
      setVerificationError("Este e-mail não possui autorização de acesso para este link de compartilhamento. Verifique se o digitou corretamente ou solicite um novo link.");
    }
  };

  const handleGenerateShareLink = () => {
    if (!shareEmail.trim()) {
      alert("Por favor, digite um e-mail válido para compartilhar.");
      return;
    }

    const payload = {
      email: shareEmail.trim().toLowerCase(),
      students: getStudents(),
      config: fineTuneConfig,
      ts: Date.now()
    };

    try {
      const encoded = encodePayload(payload);
      let origin = window.location.origin;
      if (origin.includes("ais-dev-")) {
        origin = origin.replace("ais-dev-", "ais-pre-");
      } else if (origin.includes("-dev-")) {
        origin = origin.replace("-dev-", "-pre-");
      }
      const shareUrl = `${origin}${window.location.pathname}#share=${encoded}`;
      setGeneratedLink(shareUrl);
    } catch (e) {
      console.error("Erro ao gerar link de compartilhamento:", e);
      alert("Erro ao gerar link de compartilhamento.");
    }
  };

  const [logoUrl, setLogoUrl] = useState<string>("/logo-opera.png");

  // Active logo error callback to globally transition to high-availability CDN fallback
  const handleLogoErrorGlobal = () => {
    const fallbackUrl = "https://i.postimg.cc/43jrNgQY/Chat-GPT-Image-1-de-jul-de-2026-16-01-26.png";
    if (logoUrl !== fallbackUrl) {
      console.warn("Logo failed to load natively; triggering global high-availability CDN fallback");
      setLogoUrl(fallbackUrl);
    }
  };

  // Eagerly verify if local logo loads or pre-emptively fallback
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Local loads fine
    };
    img.onerror = () => {
      handleLogoErrorGlobal();
    };
    img.src = "/logo-opera.png";
  }, []);

  // Extract logo theme colors on mount and control splash screen
  useEffect(() => {
    async function loadTheme() {
      try {
        const palette = await extractPaletteFromLogo(logoUrl);
        setBrandPalette(palette);
        
        // Apply to CSS document level
        const root = document.documentElement;
        root.style.setProperty("--brand-primary", palette.primary);
        root.style.setProperty("--brand-secondary", palette.secondary);
        root.style.setProperty("--brand-accent", palette.accent);
        root.style.setProperty("--brand-neutral-bg", palette.neutralBg);
        root.style.setProperty("--brand-light-accent", palette.lightAccent);
        root.style.setProperty("--brand-text-dark", palette.textDark);
      } catch (e) {
        console.error("Erro no processamento da logo corporativa", e);
      }
    }
    
    loadTheme();
  }, [logoUrl]);

  useEffect(() => {
    // Elegant splash screen visibility timing
    const splashTimer = setTimeout(() => {
      setSplashVisible(false);
      const unmountTimer = setTimeout(() => {
        setShowSplash(false);
      }, 700);
      return () => clearTimeout(unmountTimer);
    }, 2200);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!showSplash && !welcomeShown) {
      setWelcomeShown(true);
      setShowWelcomeToast(true);

      const allStudents = getStudents();
      let expiredCount = 0;
      let expiringSoonCount = 0;

      allStudents.forEach((student) => {
        const expiryStr = calculateValidity(student.emissionDate, student.validityYears);
        if (expiryStr) {
          const [expYear, expMonth, expDay] = expiryStr.split("-").map(Number);
          const expiryDate = new Date(expYear, expMonth - 1, expDay);
          expiryDate.setHours(0, 0, 0, 0);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            expiredCount++;
          } else if (diffDays <= 30) {
            expiringSoonCount++;
          }
        }
      });

      let alertText = "";
      if (expiredCount > 0 && expiringSoonCount > 0) {
        alertText = `Atenção: temos ${expiredCount} ${expiredCount === 1 ? "documento vencido" : "documentos vencidos"} e ${expiringSoonCount} ${expiringSoonCount === 1 ? "próximo" : "próximos"} do vencimento.`;
      } else if (expiredCount > 0) {
        alertText = `Atenção: temos ${expiredCount} ${expiredCount === 1 ? "documento vencido" : "documentos vencidos"}.`;
      } else if (expiringSoonCount > 0) {
        alertText = `Atenção: temos ${expiringSoonCount} ${expiringSoonCount === 1 ? "documento próximo" : "documentos próximos"} do vencimento.`;
      } else {
        alertText = "Nenhuma documentação está perto de vencer no momento. Tudo em dia!";
      }

      const generatedMessage = `Bem vinda novamente Karol, vamos ao trabalho! ${alertText}`;
      setWelcomeMessage(generatedMessage);

      let spoken = false;

      const speakWelcome = (msg: string) => {
        if (spoken) return;
        if ("speechSynthesis" in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.lang = "pt-BR";
            utterance.rate = 0.95;
            utterance.pitch = 1.05;

            const voices = window.speechSynthesis.getVoices();
            const ptVoice = voices.find(v => v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
            if (ptVoice) {
              utterance.voice = ptVoice;
            }

            window.speechSynthesis.speak(utterance);
            spoken = true;
          } catch (e) {
            console.error("Speech Synthesis blocked or failed:", e);
          }
        }
      };

      // Try speaking immediately
      speakWelcome(generatedMessage);

      // Fallback: speak on first user gesture (highly reliable in all browsers)
      const speakOnFirstInteraction = () => {
        speakWelcome(generatedMessage);
        document.removeEventListener("click", speakOnFirstInteraction);
        document.removeEventListener("keydown", speakOnFirstInteraction);
      };

      document.addEventListener("click", speakOnFirstInteraction);
      document.addEventListener("keydown", speakOnFirstInteraction);

      // Auto-hide the visual toast after 10 seconds
      const timer = setTimeout(() => {
        setShowWelcomeToast(false);
      }, 10000);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", speakOnFirstInteraction);
        document.removeEventListener("keydown", speakOnFirstInteraction);
      };
    }
  }, [showSplash, welcomeShown]);

  const handleFineTuneChange = (newConfig: FineTuneConfig) => {
    setCategoryConfigs((prev) => ({
      ...prev,
      [activeCalibrationCategory]: newConfig,
    }));
  };

  const handleSaveFineTune = (targetCategory?: CalibrationCategory) => {
    const catToSave = targetCategory || activeCalibrationCategory;
    const currentSavedDict = loadCategoryConfigs();
    const newSavedDict = {
      ...currentSavedDict,
      [catToSave]: categoryConfigs[catToSave]
    };
    localStorage.setItem("opera_formacao_category_fine_tune_configs", JSON.stringify(newSavedDict));
    
    // Also save to old key for backwards-compatibility
    localStorage.setItem("opera_formacao_fine_tune_config", JSON.stringify(categoryConfigs[catToSave]));

    setSavedCategoryConfigs(newSavedDict);
    alert(`Posições de calibragem salvas com sucesso para o curso: ${getCategoryLabel(catToSave)}!`);
  };

  const handleDiscardFineTune = () => {
    if (confirm(`Deseja descartar as alterações não salvas e voltar ao último padrão salvo para ${getCategoryLabel(activeCalibrationCategory)}?`)) {
      setCategoryConfigs((prev) => ({
        ...prev,
        [activeCalibrationCategory]: savedCategoryConfigs[activeCalibrationCategory]
      }));
    }
  };

  const handleResetFineTune = () => {
    if (confirm(`Deseja restaurar as configurações originais de fábrica para ${getCategoryLabel(activeCalibrationCategory)}?`)) {
      setCategoryConfigs((prev) => ({
        ...prev,
        [activeCalibrationCategory]: { ...DEFAULT_FINE_TUNE_CONFIG }
      }));
    }
  };

  const handleImportAllFineTune = (allConfigs: Record<CalibrationCategory, FineTuneConfig>) => {
    setCategoryConfigs(allConfigs);
    setSavedCategoryConfigs(allConfigs);
    localStorage.setItem("opera_formacao_category_fine_tune_configs", JSON.stringify(allConfigs));
    if (allConfigs[activeCalibrationCategory]) {
      localStorage.setItem("opera_formacao_fine_tune_config", JSON.stringify(allConfigs[activeCalibrationCategory]));
    }
    alert("Todas as calibrações de segurança foram importadas e salvas com sucesso!");
  };

  const handleSaveStudent = (formData: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const saved = saveStudent(formData);
    loadDirectory();
    setSelectedPreviewStudent(saved);
    setShowForm(false);
    setEditingStudent(undefined);
    setCurrentTab("history"); // Take operator straight to the history list to see their card!
  };

  const handleDeleteStudent = (id: string) => {
    deleteStudent(id);
    loadDirectory();
    if (selectedPreviewStudent?.id === id) {
      setSelectedPreviewStudent(undefined);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
    setCurrentTab("form");
  };

  const handleNewCertificate = () => {
    setEditingStudent(undefined);
    setShowForm(true);
    setCurrentTab("form");
  };

  const handleFocusSearch = () => {
    setSearchQuery("");
    setCurrentTab("history");
  };

  const handleScrollToHistory = () => {
    setCurrentTab("history");
  };

  const handleExportBackup = () => {
    const dataStr = exportDatabase();
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `Backup_Opera_Formacao_${new Date().toISOString().split("T")[0]}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          const res = importDatabase(result);
          if (res.success) {
            setImportStatus({ type: "success", text: `${res.count} registros importados de forma bem sucedida!` });
            loadDirectory();
            setCurrentTab("history");
          } else {
            setImportStatus({ type: "error", text: res.error || "Erro ao importar backup." });
          }
          setTimeout(() => setImportStatus(null), 5000);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUploadApostila = async (category: Category, file: File) => {
    try {
      await saveCustomApostila(category, file);
      setImportStatus({ 
        type: "success", 
        text: `Apostila personalizada de ${getCategoryLabel(category)} salva com sucesso!` 
      });
      checkApostilasStatus();
    } catch (err) {
      console.error("Erro ao salvar apostila:", err);
      setImportStatus({ 
        type: "error", 
        text: `Erro ao salvar a apostila de ${getCategoryLabel(category)} no navegador.` 
      });
    }
    setTimeout(() => setImportStatus(null), 6000);
  };

  const handleRemoveApostila = async (category: Category) => {
    try {
      await deleteCustomApostila(category);
      setImportStatus({ 
        type: "success", 
        text: `Apostila personalizada de ${getCategoryLabel(category)} removida. Usando o padrão.` 
      });
      checkApostilasStatus();
    } catch (err) {
      console.error("Erro ao remover apostila:", err);
      setImportStatus({ 
        type: "error", 
        text: `Erro ao remover a apostila personalizada de ${getCategoryLabel(category)}.` 
      });
    }
    setTimeout(() => setImportStatus(null), 5000);
  };


  // Calculate stats
  const totalOperators = students.length;
  const uniqueMachines = Array.from(new Set(students.flatMap(s => s.machines))).length;
  const activeEmissions = students.filter(s => {
    const expDate = new Date(s.emissionDate);
    expDate.setFullYear(expDate.getFullYear() + s.validityYears);
    return expDate.getTime() > Date.now();
  }).length;

  if (isVerifyingShare && sharePayload) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 relative overflow-hidden" id="share_verification_screen">
        {/* Glowing backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_65%)] opacity-20 animate-pulse pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--brand-accent)_0%,_transparent_70%)] opacity-15 pointer-events-none" />
        
        <div className="relative max-w-md w-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-fade-in-up">
          
          {/* Logo container */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 flex items-center justify-center">
              <img src={logoUrl} alt="Logo" onError={handleLogoErrorGlobal} className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
              Acesso Restrito & Seguro
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Sincronização de Banco de Dados</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Este link de acesso foi compartilhado de forma segura pelo Administrador. Para autenticar seu dispositivo e importar os dados do sistema, insira o e-mail autorizado.
            </p>
          </div>

          <form onSubmit={handleConfirmShareEmail} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label htmlFor="auth_email" className="text-xs font-bold text-zinc-400 block">
                E-mail Autorizado
              </label>
              <input
                id="auth_email"
                type="email"
                required
                placeholder="exemplo@operaformacao.com.br"
                value={verificationEmail}
                onChange={(e) => {
                  setVerificationEmail(e.target.value);
                  setVerificationError(null);
                }}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white placeholder-zinc-600 transition-all font-medium"
              />
            </div>

            {verificationError && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {verificationSuccess ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-2 text-center animate-pulse">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span>Acesso Autorizado! Carregando dados...</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg hover:scale-101 active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ backgroundColor: brandPalette.accent }}
              >
                <ShieldCheck className="w-4 h-4" />
                Confirmar e Sincronizar
              </button>
            )}
          </form>

          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
            Segurança de Ponta a Ponta
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-neutral-bg flex flex-col pb-24 relative overflow-hidden" id="opera_formacao_app">
      
      {/* 1. BRAND SPLASH SCREEN */}
      {showSplash && (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 bg-zinc-950 ${
          splashVisible ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
        }`}>
          {/* Subtle branding decorative radial glows inside splash */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_65%)] opacity-20 animate-pulse pointer-events-none" />
          <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_bottom,_var(--brand-accent)_0%,_transparent_50%)] opacity-10 pointer-events-none" />
          
          <div className="relative flex flex-col items-center text-center p-6 max-w-lg space-y-6 animate-fade-in-up">
            {/* Beautiful, high-end framed square containing the logo, scaled up */}
            <div className="relative flex items-center justify-center w-80 h-80 sm:w-[380px] sm:h-[380px] rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden group">
              {/* Double glowing border halos behind the square */}
              <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_70%)] opacity-35 pointer-events-none animate-pulse-slow" />
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-brand-primary/15 rounded-full blur-3xl pointer-events-none" />
              
              {/* Golden/Accent corner highlights */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2" style={{ borderColor: brandPalette.accent }} />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2" style={{ borderColor: brandPalette.accent }} />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2" style={{ borderColor: brandPalette.accent }} />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2" style={{ borderColor: brandPalette.accent }} />
              
              {/* The logo inside, taking up almost 100% of the square container */}
              <img 
                src={logoUrl} 
                alt="Opera Formação" 
                onError={handleLogoErrorGlobal}
                className="w-[94%] h-[94%] object-contain animate-bounce-slow relative z-10 p-4 transition-transform duration-500 hover:scale-[1.03]" 
              />
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-2xl font-extrabold tracking-widest text-white uppercase">
                <span className="text-[10px] font-black tracking-[0.35em] block mb-1" style={{ color: brandPalette.accent }}>SISTEMA OFICIAL</span>
                OPERA FORMAÇÃO
              </h1>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                Emissão & Gestão de Carteiras de Operador
              </p>
            </div>
            
            {/* Elegant horizontal loading bar */}
            <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full rounded-full animate-loading-bar" style={{ backgroundColor: brandPalette.accent }} />
            </div>
            
            <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
              Conexão Segura Estabelecida
            </div>
          </div>
        </div>
      )}

      {/* Decorative Vector Lines inspired by the brand (Obj: Linhas/curvas da marca discretas) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,_var(--brand-light-accent)_0%,_transparent_70%)] opacity-80 pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_bottom_left,_var(--brand-light-accent)_0%,_transparent_75%)] opacity-60 pointer-events-none -z-10" />
      
      {/* Decorative Brand Grid Vector Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] stroke-brand-primary pointer-events-none -z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 2. CORPORATE HEADER (Barra superior) */}
      <header className="bg-zinc-950 border-b border-zinc-900 text-white shrink-0 py-4 px-4 sm:px-8 shadow-lg relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo no canto esquerdo + Nome do sistema alinhado ao lado */}
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center shrink-0 transition-transform hover:scale-105">
              <img src={logoUrl} alt="Logo Opera Formação" onError={handleLogoErrorGlobal} className="w-24 h-24 object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight flex flex-wrap items-center gap-2">
                OPERA FORMAÇÃO
                <span className="text-[9px] text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1" style={{ backgroundColor: brandPalette.accent }}>
                  <ShieldCheck className="w-3 h-3" /> PAINEL ADM
                </span>
                {isOnline ? (
                  <span className="text-[9px] bg-zinc-900 border border-emerald-500/30 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1" title="Sistema pronto e funcionando localmente">
                    <Wifi className="w-3 h-3 shrink-0" /> Local Online
                  </span>
                ) : (
                  <span className="text-[9px] bg-emerald-950/20 border border-emerald-500/40 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse" title="Modo 100% Offline Ativo. Todos os dados continuam salvos e disponíveis!">
                    <WifiOff className="w-3 h-3 shrink-0 text-amber-400" /> Modo Offline
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium">
                Emissor Oficial de Carteiras e Certificados Digitais
              </p>
            </div>
          </div>

          {/* Top Backup Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Compartilhar acesso com a secretaria"
            >
              <Users className="w-3.5 h-3.5" style={{ color: brandPalette.accent }} />
              Compartilhar Acesso
            </button>
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Backup completo dos registros"
            >
              <FileDown className="w-3.5 h-3.5" style={{ color: brandPalette.accent }} />
              Exportar Banco
            </button>
            <label className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm">
              <FileUp className="w-3.5 h-3.5" style={{ color: brandPalette.accent }} />
              Importar Banco
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowApostilasModal(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Gerenciar apostilas de cada curso"
            >
              <BookOpen className="w-3.5 h-3.5" style={{ color: brandPalette.accent }} />
              Gerenciar Apostilas
            </button>
          </div>
        </div>
      </header>

      {/* IMPORT NOTIFICATION */}
      {importStatus && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 mt-4">
          <div className={`p-4 rounded-xl border font-bold text-sm shadow-md animate-fade-in ${
            importStatus.type === "success" 
              ? "bg-zinc-950 border-emerald-500/30 text-emerald-400" 
              : "bg-red-950 border-red-800 text-red-200"
          }`}>
            {importStatus.text}
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 mt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT DYNAMIC TAB WORKSPACE - 7 COLS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TAB 1: DASHBOARD (Área administrativa) */}
          {currentTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Premium Welcome Card */}
              <div className="bg-zinc-950 text-white rounded-2xl p-6 shadow-xl border border-zinc-900 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-44 h-44 opacity-10 pointer-events-none">
                  <img src={logoUrl} alt="Watermark" onError={handleLogoErrorGlobal} className="w-full h-full object-contain" />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary rounded-full blur-3xl opacity-20 -mr-6 -mt-6" />
                
                <div className="relative z-10 space-y-4">
                  <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-brand-accent inline-block">
                    Plataforma Oficial
                  </span>
                  <div className="space-y-1.5">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Painel de Emissão & Gestão</h2>
                    <p className="text-zinc-400 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
                      O processo manual e lento foi substituído por uma emissão digital de alta fidelidade técnica. Cadastre operadores de máquinas pesadas, visualize e gere documentos oficiais num clique.
                    </p>
                  </div>

                  {/* Call to action inside Welcome Card */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={handleNewCertificate}
                      className="px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 hover:scale-102 cursor-pointer text-white"
                      style={{ backgroundColor: brandPalette.accent }}
                    >
                      <PlusCircle className="w-4 h-4" />
                      Emitir Carteira
                    </button>
                    <button
                      onClick={handleFocusSearch}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5"
                    >
                      <Search className="w-4 h-4" />
                      Buscar Registro
                    </button>
                  </div>
                </div>
              </div>

              {/* BENTO STATS GRID (com cores derivadas da logo) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 text-zinc-50 opacity-20 group-hover:scale-110 transition-transform">
                    <Users className="w-20 h-20" />
                  </div>
                  <div className="p-3 rounded-xl transition-colors shrink-0" style={{ backgroundColor: brandPalette.lightAccent, color: brandPalette.primary }}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Operadores</span>
                    <p className="text-2xl font-black text-zinc-900 mt-0.5">{totalOperators}</p>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 text-zinc-50 opacity-20 group-hover:scale-110 transition-transform">
                    <Cpu className="w-20 h-20" />
                  </div>
                  <div className="p-3 rounded-xl transition-colors shrink-0" style={{ backgroundColor: brandPalette.lightAccent, color: brandPalette.primary }}>
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Máquinas</span>
                    <p className="text-2xl font-black text-zinc-900 mt-0.5">{uniqueMachines}</p>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 text-zinc-50 opacity-20 group-hover:scale-110 transition-transform">
                    <Award className="w-20 h-20" />
                  </div>
                  <div className="p-3 rounded-xl transition-colors shrink-0" style={{ backgroundColor: brandPalette.lightAccent, color: brandPalette.primary }}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">Emissões Válidas</span>
                    <p className="text-2xl font-black text-zinc-900 mt-0.5">{activeEmissions}</p>
                  </div>
                </div>
              </div>

              {/* Custom branding analytical section (Obj: Grafico com cores derivadas da logo) */}
              <div className="bg-white border border-zinc-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-zinc-900 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" style={{ color: brandPalette.accent }} />
                      Resumo da Distribuição do Banco
                    </h4>
                    <p className="text-xs text-zinc-500">Métricas analíticas corporativas automáticas</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 tracking-wider font-mono">LIVE STATE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dynamic Graphic representation */}
                  <div className="p-4 rounded-xl border border-zinc-100 flex flex-col justify-between space-y-4" style={{ backgroundColor: brandPalette.neutralBg }}>
                    <span className="text-xs font-bold text-zinc-600">Proporção Ativos vs Totais</span>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-500">
                        <span>Emissões Válidas ({activeEmissions})</span>
                        <span>{totalOperators > 0 ? Math.round((activeEmissions / totalOperators) * 100) : 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${totalOperators > 0 ? (activeEmissions / totalOperators) * 100 : 0}%`,
                            backgroundColor: brandPalette.primary
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-100 flex flex-col justify-between space-y-4" style={{ backgroundColor: brandPalette.neutralBg }}>
                    <span className="text-xs font-bold text-zinc-600">Status Operacional Geral</span>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: brandPalette.accent }} />
                      <div className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
                        Pronto para Emissões
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-semibold">Os PDFs são salvos com resolução de 300 DPI.</p>
                  </div>
                </div>

                {/* Micro guidelines block */}
                <div className="bg-zinc-50 rounded-xl p-3 text-zinc-500 text-xs flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 shrink-0" style={{ color: brandPalette.primary }} />
                  <span>Selecione a aba <strong>Emitir</strong> para cadastrar um novo operador. Para visualizar carteiras antigas, navegue no <strong>Histórico</strong>.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENT FORM (Cadastro) */}
          {currentTab === "form" && (
            <div className="animate-fade-in">
              <StudentForm
                student={editingStudent}
                onSave={handleSaveStudent}
                onCancel={() => {
                  setEditingStudent(undefined);
                  setCurrentTab("dashboard");
                }}
              />
            </div>
          )}

          {/* TAB 3: DIRECTORY / HISTORY (Histórico) */}
          {currentTab === "history" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
                    <Database className="w-5 h-5" style={{ color: brandPalette.primary }} />
                    Histórico Geral de Emissões
                  </h3>
                  <p className="text-xs text-zinc-500">Busque, edite e baixe documentos dos operadores cadastrados</p>
                </div>
                <button
                  onClick={() => {
                    setEditingStudent(undefined);
                    setCurrentTab("form");
                  }}
                  className="px-3.5 py-1.5 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm hover:scale-102 cursor-pointer"
                  style={{ backgroundColor: brandPalette.accent }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Cadastrar Novo
                </button>
              </div>

              <StudentList
                students={students}
                fineTuneConfig={categoryConfigs}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                onPreview={setPreviewModalStudent}
                selectedStudentId={selectedPreviewStudent?.id}
                onSelect={setSelectedPreviewStudent}
              />
            </div>
          )}

          {/* TAB 4: CALIBRATION / FINE TUNE (Calibração) */}
          {currentTab === "finetune" && (
            <div className="animate-fade-in">
              <FineTunePanel
                config={fineTuneConfig}
                onChange={handleFineTuneChange}
                onSave={handleSaveFineTune}
                onDiscard={handleDiscardFineTune}
                onReset={handleResetFineTune}
                hasUnsavedChanges={JSON.stringify(fineTuneConfig) !== JSON.stringify(savedFineTuneConfig)}
                activeCategory={activeCalibrationCategory}
                onCategoryChange={setActiveCalibrationCategory}
                categoryConfigs={categoryConfigs}
                savedCategoryConfigs={savedCategoryConfigs}
                onImportAll={handleImportAllFineTune}
              />
            </div>
          )}

        </div>

        {/* RIGHT LIVE PREVIEWER (MANTENDO PREVIEW SIDE-BY-SIDE NO DESKTOP) - 5 COLS */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-zinc-900 tracking-wider uppercase flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4" style={{ color: brandPalette.primary }} />
                Pré-Visualização em Tempo Real
              </h3>
              <p className="text-[11px] text-zinc-500">Atualiza automaticamente conforme alterações nos dados ou calibração</p>
            </div>

            <CardRenderer
              student={previewStudent}
              config={fineTuneConfig}
              onPreview={setPreviewModalStudent}
            />

            {/* Hidden font helper */}
            <div className="sr-only select-none pointer-events-none" style={{ fontFamily: "'Great Vibes', cursive" }}>
              Force load Great Vibes Cursive Font
            </div>
          </div>
        </div>

      </main>

      {/* 4. FLOATING BOTTOM NAVIGATION BAR (Menu inferior) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg bg-zinc-950/95 backdrop-blur-md border border-zinc-900 rounded-2xl shadow-2xl px-4 py-2 flex justify-around items-center" id="bottom_navigation_bar">
        <button
          onClick={() => setCurrentTab("dashboard")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            currentTab === "dashboard"
              ? "font-extrabold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          style={{ color: currentTab === "dashboard" ? brandPalette.accent : undefined }}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold">Painel</span>
        </button>

        <button
          onClick={() => {
            setEditingStudent(undefined);
            setCurrentTab("form");
          }}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            currentTab === "form"
              ? "font-extrabold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          style={{ color: currentTab === "form" ? brandPalette.accent : undefined }}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold">Emitir</span>
        </button>

        <button
          onClick={() => setCurrentTab("history")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            currentTab === "history"
              ? "font-extrabold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          style={{ color: currentTab === "history" ? brandPalette.accent : undefined }}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold">Histórico</span>
        </button>

        <button
          onClick={() => setCurrentTab("finetune")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            currentTab === "finetune"
              ? "font-extrabold scale-105"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          style={{ color: currentTab === "finetune" ? brandPalette.accent : undefined }}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold">Calibrar</span>
        </button>
      </nav>

      {/* FULL PREVIEW MODAL */}
      {previewModalStudent && (
        <DocumentPreviewModal
          student={previewModalStudent}
          config={categoryConfigs[previewModalStudent.category || "PESADAS"] || fineTuneConfig}
          onClose={() => setPreviewModalStudent(undefined)}
        />
      )}

      {/* SHARE ACCESS MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in" id="share_access_modal">
          <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block uppercase">
                  Compartilhar Sistema
                </span>
                <h3 className="text-lg font-extrabold tracking-tight">Autorizar Nova Conta</h3>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareEmail("");
                  setGeneratedLink("");
                  setCopyFeedback(false);
                }}
                className="p-1 rounded-lg hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Gere um link criptografado contendo o banco de dados atual de Alunos e as calibrações. O destinatário precisará validar o próprio e-mail para desbloquear o sistema.
            </p>

            <div className="space-y-4">
              {/* E-mail Input */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="share_email_input" className="text-xs font-bold text-zinc-400 block">
                  E-mail do Destinatário (Secretaria, Auxiliar, etc.)
                </label>
                <div className="flex gap-2">
                  <input
                    id="share_email_input"
                    type="email"
                    required
                    placeholder="exemplo@operaformacao.com.br"
                    value={shareEmail}
                    onChange={(e) => {
                      setShareEmail(e.target.value);
                      if (generatedLink) setGeneratedLink(""); // Reset generated link if email changes
                    }}
                    disabled={!!generatedLink}
                    className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-white placeholder-zinc-600 transition-all font-medium disabled:opacity-50"
                  />
                  {!generatedLink && (
                    <button
                      onClick={handleGenerateShareLink}
                      className="px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition-all hover:scale-102 cursor-pointer shrink-0"
                      style={{ backgroundColor: brandPalette.accent }}
                    >
                      Gerar Link
                    </button>
                  )}
                </div>
              </div>

              {/* Generated Link Panel */}
              {generatedLink && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-zinc-400 block">
                      Link de Acesso Autorizado
                    </label>
                    <div className="flex gap-2 bg-zinc-950 border border-zinc-850 p-2 rounded-xl items-center">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className="flex-1 bg-transparent border-none text-zinc-300 text-xs focus:outline-none overflow-x-auto whitespace-nowrap font-mono px-2"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          setCopyFeedback(true);
                          setTimeout(() => setCopyFeedback(false), 2000);
                        }}
                        className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-black transition-all cursor-pointer shrink-0 ${
                          copyFeedback ? "bg-emerald-500 text-white" : ""
                        }`}
                        style={{ backgroundColor: copyFeedback ? undefined : brandPalette.accent }}
                      >
                        {copyFeedback ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  {/* Sharing Action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a
                      href={`mailto:${shareEmail}?subject=Acesso%20Autorizado%20-%20Sistema%20Opera%20Forma%C3%A7%C3%A3o&body=Ol%C3%A1%2C%0A%0ASeu%20acesso%20ao%20Sistema%20Opera%20Forma%C3%A7%C3%A3o%20foi%20autorizado%20com%20sucesso.%0A%0APara%20entrar%20e%20sincronizar%20o%20banco%20de%20dados%2C%20clique%20no%20link%20abaixo%3A%0A${encodeURIComponent(generatedLink)}%0A%0AAten%C3%A7%C3%A3o%3A%20Insira%20seu%20e-mail%20(${shareEmail})%20quando%20solicitado%20para%20autenticar%20o%20dispositivo.%0A%0AAtenciosamente%2C%0AAdministra%C3%A7%C3%A3o`}
                      className="px-4 py-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-750 hover:border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      E-mail
                    </a>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Olá! Aqui está o seu link de acesso seguro para o Sistema Opera Formação:\n\n${generatedLink}\n\nAo abrir o link, insira o seu e-mail (${shareEmail}) para liberar o acesso e sincronizar os alunos.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                      </svg>
                      WhatsApp
                    </a>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => {
                        setShowShareModal(false);
                        setShareEmail("");
                        setGeneratedLink("");
                        setCopyFeedback(false);
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 font-bold underline cursor-pointer"
                    >
                      Fechar e voltar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest text-center pt-2">
              Sincronização Criptografada Direta
            </div>
          </div>
        </div>
      )}

      {/* GERENCIAR APOSTILAS MODAL */}
      {showApostilasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in" id="manage_apostilas_modal">
          <div className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block uppercase">
                  Apostilas de Estudo
                </span>
                <h3 className="text-lg font-extrabold tracking-tight">Gerenciador de Apostilas</h3>
              </div>
              <button
                onClick={() => setShowApostilasModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-850 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Adicione arquivos PDF personalizados de apostila para cada tipo de curso. Quando o aluno for compartilhado por WhatsApp ou E-mail, a apostila correta correspondente ao seu curso será incluída e baixada automaticamente junto com a carteirinha digital.
            </p>

            {/* Grid of Course Handouts */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {(["PESADAS", "AGRICOLAS", "MUNCK", "EMPILHADEIRA"] as Category[]).map((cat) => {
                const hasCustom = apostilasStatus[cat];
                const label = getCategoryLabel(cat);
                
                return (
                  <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-850 rounded-2xl gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-zinc-100">{label}</span>
                        {hasCustom ? (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Personalizada
                          </span>
                        ) : cat === "PESADAS" ? (
                          <span className="text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
                            Padrão Ativo
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Nenhum arquivo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        {cat === "PESADAS" && !hasCustom && "Usando apostila padrão (/apostila-maquinas-pesadas.pdf)"}
                        {cat === "PESADAS" && hasCustom && "Usando arquivo personalizado carregado no navegador"}
                        {cat !== "PESADAS" && !hasCustom && "Não enviará apostila, apenas a carteirinha (carregue um arquivo para ativar)"}
                        {cat !== "PESADAS" && hasCustom && "Usando arquivo personalizado carregado no navegador"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {hasCustom ? "Substituir PDF" : "Carregar PDF"}
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleUploadApostila(cat, e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {hasCustom && (
                        <button
                          onClick={() => handleRemoveApostila(cat)}
                          className="p-2 bg-red-950 hover:bg-red-900 text-red-400 hover:text-red-300 border border-red-900/30 rounded-xl transition-all cursor-pointer"
                          title="Remover apostila personalizada e usar o padrão"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note about Florestais */}
            <div className="bg-amber-500/5 border border-amber-500/10 p-3 sm:p-4 rounded-2xl flex items-start gap-3">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wide block">
                  Aviso Importante:
                </span>
                <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
                  As <strong>Máquinas Florestais</strong> não necessitam de apostila no compartilhamento, conforme os procedimentos oficiais da instituição. Apenas os outros cursos serão acompanhados por material didático.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowApostilasModal(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PERSONAL WELCOME TOAST (Karol) */}
      {showWelcomeToast && (
        <div 
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-950/95 border border-brand-accent/30 rounded-3xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] animate-fade-in-up flex items-start gap-4 transition-all"
          id="welcome_karol_toast"
        >
          {/* Pulsing Accent Icon */}
          <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-accent/15 border border-brand-accent/20 text-brand-accent overflow-hidden shadow-inner">
            <span className="absolute inset-0 bg-brand-accent/25 rounded-2xl animate-ping scale-75 opacity-75" />
            <Sparkles className="w-5.5 h-5.5 relative z-10" style={{ color: brandPalette.accent }} />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[9px] uppercase tracking-widest">
              <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Assistente Oficial</span>
            </div>
            <h4 className="text-sm font-black text-white leading-snug tracking-tight">
              Olá, Karol!
            </h4>
            <p className="text-[11px] text-zinc-300 font-semibold leading-relaxed">
              {welcomeMessage}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setShowWelcomeToast(false)}
            className="text-zinc-500 hover:text-white hover:bg-white/5 p-1 rounded-lg transition-all shrink-0 cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export type Category = "PESADAS" | "AGRICOLAS" | "MUNCK" | "EMPILHADEIRA" | "FLORESTAIS";
export type CalibrationCategory = Category | "PESADAS_JHONNY" | "PESADAS_RICHARD";

export interface Student {
  id: string;
  name: string;
  cpf: string;
  birthDate: string; // YYYY-MM-DD
  machines: string[]; // List of machines
  emissionDate: string; // YYYY-MM-DD
  validityYears: number;
  photoUrl: string; // Base64 representation of operator photo
  category?: Category; // Category of course/document
  instructor?: "Ivan" | "Jhonny" | "Richard";
  whatsApp?: string; // Operator's WhatsApp number for internal use
  createdAt: string;
  updatedAt: string;
  emissionDay?: string;
  emissionMonth?: string;
}

export interface TextPosition {
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage of canvas width
  height: number; // percentage of canvas height
  fontSize: number; // in pixels
  color: string;
}

export interface FineTuneConfig {
  walletFront: {
    photo: TextPosition;
    name: TextPosition;
    cpf: TextPosition;
    birthDate: TextPosition;
    validity: TextPosition;
    machines: TextPosition & { lineHeight?: number };
  };
  certFront: {
    name: TextPosition;
    dateText: TextPosition;
    dateDay: TextPosition;
    dateMonth: TextPosition;
    cpf: TextPosition;
  };
  certBack: {
    machines: TextPosition & { lineHeight?: number };
  };
}

export const DEFAULT_FINE_TUNE_CONFIG: FineTuneConfig = {
  walletFront: {
    photo: { x: 8.5, y: 31, width: 22, height: 35, fontSize: 0, color: "" },
    name: { x: 51, y: 25, width: 40, height: 8, fontSize: 13, color: "#111827" },
    cpf: { x: 50, y: 41, width: 21, height: 7, fontSize: 11, color: "#1e293b" },
    birthDate: { x: 74, y: 41, width: 18, height: 7, fontSize: 11, color: "#1e293b" },
    validity: { x: 66, y: 86, width: 20, height: 7, fontSize: 11, color: "#1e293b" },
    machines: { x: 60, y: 59, width: 35, height: 21, fontSize: 10, color: "#1e293b" },
  },
  certFront: {
    name: { x: 50, y: 46, width: 75, height: 10, fontSize: 36, color: "#000000" },
    dateText: { x: 50, y: 71, width: 50, height: 8, fontSize: 14, color: "#000000" },
    dateDay: { x: 42.5, y: 71, width: 10, height: 8, fontSize: 14, color: "#000000" },
    dateMonth: { x: 55, y: 71, width: 30, height: 8, fontSize: 14, color: "#000000" },
    cpf: { x: 50, y: 53, width: 40, height: 6, fontSize: 18, color: "#000000" },
  },
  certBack: {
    machines: { x: 50, y: 50, width: 40, height: 30, fontSize: 16, color: "#000000", lineHeight: 1.3 },
  }
};

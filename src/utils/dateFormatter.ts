export function formatCPF(value: string): string {
  // Remove non-digits
  const digits = value.replace(/\D/g, "");
  // Mask to 000.000.000-00
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getMonthNamePT(monthIndex: number): string {
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return months[monthIndex] || "";
}

export function formatCertificateDate(dateStr: string): string {
  if (!dateStr) return "__ de _________ de ____";
  const [year, month, day] = dateStr.split("-").map(Number);
  const monthName = getMonthNamePT(month - 1);
  const capitalizedMonth = monthName ? monthName.charAt(0).toUpperCase() + monthName.slice(1) : "";
  return `${day} de ${capitalizedMonth} de ${year}`;
}

export function formatNameTitleCase(name: string): string {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  const lowercasePrepositions = ["de", "da", "do", "dos", "das", "e"];
  
  return words
    .map((word, index) => {
      if (!word) return "";
      const lower = word.toLowerCase();
      if (lowercasePrepositions.includes(lower) && index > 0) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function calculateValidity(emissionDateStr: string, years: number): string {
  if (!emissionDateStr) return "";
  const [year, month, day] = emissionDateStr.split("-").map(Number);
  
  // Basic date offset
  const validityDate = new Date(year + years, month - 1, day);
  
  // Format to YYYY-MM-DD
  const y = validityDate.getFullYear();
  const m = String(validityDate.getMonth() + 1).padStart(2, "0");
  const d = String(validityDate.getDate()).padStart(2, "0");
  
  return `${y}-${m}-${d}`;
}

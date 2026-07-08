import { Student, Category } from "../types";

const LOCAL_STORAGE_KEY = "opera_formacao_students_db";

export function getStudents(): Student[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return [];
  }
}

export function saveStudent(student: Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string }): Student {
  const students = getStudents();
  const now = new Date().toISOString();
  
  const existingIndex = student.id ? students.findIndex((s) => s.id === student.id) : -1;
  let savedStudent: Student;

  if (existingIndex > -1) {
    savedStudent = {
      ...students[existingIndex],
      ...student,
      updatedAt: now,
    } as Student;
    students[existingIndex] = savedStudent;
  } else {
    savedStudent = {
      ...student,
      id: student.id || Math.random().toString(36).substring(2, 11),
      createdAt: student.createdAt || now,
      updatedAt: now,
    } as Student;
    students.unshift(savedStudent); // Add to beginning of list
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
  return savedStudent;
}

export function deleteStudent(id: string): boolean {
  try {
    const students = getStudents();
    const filtered = students.filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting student:", error);
    return false;
  }
}

export function searchStudents(query: string): Student[] {
  const students = getStudents();
  if (!query.trim()) return students;
  
  const cleanQuery = query.toLowerCase().replace(/\D/g, "");
  const textQuery = query.toLowerCase().trim();

  return students.filter((student) => {
    // Search by clean CPF or textual name
    const matchesName = student.name.toLowerCase().includes(textQuery);
    const cleanStudentCpf = student.cpf.replace(/\D/g, "");
    const matchesCpf = cleanStudentCpf.includes(cleanQuery) || student.cpf.includes(textQuery);
    
    return matchesName || matchesCpf;
  });
}

export function exportDatabase(): string {
  const students = getStudents();
  return JSON.stringify({
    version: "1.0",
    exportedAt: new Date().toISOString(),
    students,
  }, null, 2);
}

export function importDatabase(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.students)) {
      return { success: false, count: 0, error: "Formato de arquivo inválido. Deve conter a lista de alunos." };
    }

    const currentStudents = getStudents();
    const imported: Student[] = parsed.students;

    // Merge by id (imported overwrites or adds new ones)
    const mergedMap = new Map<string, Student>();
    currentStudents.forEach((s) => mergedMap.set(s.id, s));
    imported.forEach((s) => {
      if (s.id && s.name && s.cpf) {
        mergedMap.set(s.id, s);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    // Sort by updatedAt descending
    mergedList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedList));
    return { success: true, count: imported.length };
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : "Erro desconhecido ao importar." };
  }
}

// Store custom PDF blob in IndexedDB for persistent browser storage of high quality handbook
export function saveCustomApostila(category: Category, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("opera_formacao_assets", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      const putRequest = store.put(blob, `apostila_${category}`);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Retrieve custom PDF blob from IndexedDB for persistent browser storage of high quality handbook
export function getCustomApostila(category: Category): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("opera_formacao_assets", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("files", "readonly");
      const store = tx.objectStore("files");
      const getRequest = store.get(`apostila_${category}`);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else if (category === "PESADAS") {
          // Fallback to old "apostila" key for PESADAS backwards compatibility
          const oldGetRequest = store.get("apostila");
          oldGetRequest.onsuccess = () => resolve(oldGetRequest.result || null);
          oldGetRequest.onerror = () => resolve(null);
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Remove custom PDF blob from IndexedDB
export function deleteCustomApostila(category: Category): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("opera_formacao_assets", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      const delRequest = store.delete(`apostila_${category}`);
      delRequest.onsuccess = () => {
        if (category === "PESADAS") {
          // Also clear the old key
          const oldDelRequest = store.delete("apostila");
          oldDelRequest.onsuccess = () => resolve();
          oldDelRequest.onerror = () => resolve();
        } else {
          resolve();
        }
      };
      delRequest.onerror = () => reject(delRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}


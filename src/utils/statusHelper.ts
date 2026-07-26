export function getAutomatedStatus(item: { date_start: string | Date; date_end?: string | Date | null }): "rencana" | "berjalan" | "selesai" {
  if (!item || !item.date_start) return "rencana";
  
  const now = new Date();
  const startDate = new Date(item.date_start);
  
  // Try parsing date_end; if missing or invalid, default to 4 hours duration
  let endDate: Date;
  if (item.date_end) {
    endDate = new Date(item.date_end);
    if (isNaN(endDate.getTime())) {
      endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    }
  } else {
    endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
  }

  if (now < startDate) {
    return "rencana";
  } else if (now >= startDate && now <= endDate) {
    return "berjalan";
  } else {
    return "selesai";
  }
}

// Convert generic status to English string ("planned", "ongoing", "completed")
export function getEnglishStatus(status: string): "planned" | "ongoing" | "completed" {
  const norm = status ? status.toLowerCase() : "";
  if (norm === "berjalan" || norm === "ongoing") return "ongoing";
  if (norm === "selesai" || norm === "completed") return "completed";
  return "planned";
}

// Convert generic status to Indonesian label ("Rencana", "Berjalan", "Selesai")
export function getIndonesianStatusLabel(status: string): string {
  const norm = status ? status.toLowerCase() : "";
  if (norm === "berjalan" || norm === "ongoing") return "Berjalan";
  if (norm === "selesai" || norm === "completed") return "Selesai";
  return "Rencana";
}

export function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  
  // Month mapping
  const monthMap: Record<string, number> = {
    januari: 0, jan: 0,
    februari: 1, feb: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agt: 7, ags: 7,
    september: 8, sep: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10,
    desember: 11, des: 11, dec: 11
  };

  const words = cleaned.split(/\s+/);
  let day = 1;
  let month = 0;
  let year = new Date().getFullYear();

  // Find 4-digit year if exists
  const yearMatch = cleaned.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  // Find month
  let monthFound = false;
  for (const word of words) {
    if (monthMap[word] !== undefined) {
      month = monthMap[word];
      monthFound = true;
      break;
    }
  }

  // Try to find a dynamic day number (excluding the 4-digit year)
  const numbers = words.filter(w => /^\d{1,2}$/.test(w));
  if (numbers.length > 0) {
    const candidateDay = parseInt(numbers[0], 10);
    if (candidateDay >= 1 && candidateDay <= 31) {
      day = candidateDay;
    }
  }

  if (monthFound) {
    return new Date(year, month, day);
  }

  // Fallback to standard javascript date parsing in case it's ISO format
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export function getAutomatedProgramStatus(prog: { date?: string; status?: string }): "rencana" | "berjalan" | "selesai" {
  if (!prog || !prog.date) return (prog?.status as any) || "rencana";

  const parsedDate = parseIndonesianDate(prog.date);
  if (!parsedDate) {
    return (prog.status as any) || "rencana";
  }

  const now = new Date();
  
  // Set default duration to end of day or end of month depending on the date string
  const lowerDate = prog.date.toLowerCase();
  const hasDay = /\b\d{1,2}\b/.test(lowerDate.replace(/\b20\d{2}\b/, "")); // Check if there is a day number (excluding year)
  
  let endDate = new Date(parsedDate);
  if (hasDay) {
    // End of day
    endDate.setHours(23, 59, 59, 999);
  } else {
    // End of month
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of month
    endDate.setHours(23, 59, 59, 999);
  }

  // Compare
  if (now < parsedDate) {
    return "rencana";
  } else if (now >= parsedDate && now <= endDate) {
    return "berjalan";
  } else {
    return "selesai";
  }
}

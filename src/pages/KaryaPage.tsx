import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Assuming supabase is exported from lib/supabase or similar
import { FileText, Play } from "lucide-react";

const getDirectDownloadUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  const trimmed = url.trim();
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileDMatch[1]}&confirm=t`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${idMatch[1]}&confirm=t`;
  }
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1] && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=download&id=${dMatch[1]}&confirm=t`;
  }
  return trimmed;
};

export default function KaryaPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorks() {
      const { data, error } = await supabase
        .from("teacher_works")
        .select("*");

      if (data) {
        const userIds = [...new Set(data.map((w: any) => w.user_id).filter(Boolean))];
        let profilesData: any[] = [];
        
        if (userIds.length > 0) {
          const { data: pData } = await supabase
             .from("user_profiles")
             .select("id, nama")
             .in("id", userIds);
          if (pData) profilesData = pData;
        }

        const worksWithProfiles = data.map((work: any) => ({
          ...work,
          profiles: profilesData.find(p => p.id === work.user_id) || null
        }));
        setWorks(worksWithProfiles);
      }
      setLoading(false);
    }
    fetchWorks();
  }, []);

  return (
    <div className="container mx-auto px-6 py-24 min-h-screen">
      <h1 className="text-4xl font-heading font-bold text-soft-black mb-12">Hasil Karya Guru</h1>
      {loading ? (
        <p>Memuat...</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-gray-500">Guru</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-gray-500">Judul Karya</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-gray-500">Jenis</th>
                  <th className="py-4 px-6 font-bold text-xs uppercase tracking-widest text-gray-500 text-center font-sans">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {works.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-soft-black text-sm">{work.profiles?.nama || "Guru"}</td>
                    <td className="py-4 px-6 text-gray-600 text-sm font-medium">{work.title}</td>
                    <td className="py-4 px-6 uppercase text-[10px] tracking-widest font-bold text-main-blue">{work.work_type}</td>
                    <td className="py-4 px-6 text-center">
                       {work.file_url ? (
                         <a href={getDirectDownloadUrl(work.file_url)} download={work.title} className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-600 hover:text-white px-4 py-1.5 rounded-full font-bold transition-all select-none" title="Download Karya">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                           Download Karya
                         </a>
                       ) : (
                         <span className="text-gray-400">-</span>
                       )}
                    </td>
                  </tr>
                ))}
                {works.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 italic">Belum ada karya yang diunggah.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

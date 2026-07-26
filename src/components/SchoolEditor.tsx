import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Loader2, Save, Check } from "lucide-react";

export default function SchoolEditor() {
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [excellenceText, setExcellenceText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSchools() {
      const { data, error } = await supabase.from('schools').select('id, name, keunggulan');
      if (!error) setSchools(data || []);
      setIsLoading(false);
    }
    fetchSchools();
  }, []);

  const handleEdit = (school: any) => {
    setEditingId(school.id);
    setExcellenceText(school.keunggulan || "");
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    await supabase.from('schools').update({ keunggulan: excellenceText }).eq('id', id);
    setSchools(schools.map(s => s.id === id ? { ...s, keunggulan: excellenceText } : s));
    setEditingId(null);
    setIsSaving(false);
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-main-blue" /></div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold font-heading text-soft-black mb-6">Kelola Keunggulan Sekolah</h2>
      <div className="space-y-4">
        {schools.map(school => (
          <div key={school.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{school.name}</span>
              {editingId === school.id ? (
                <button onClick={() => handleSave(school.id)} className="text-leaf-green hover:text-leaf-green/80 p-2">
                  {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                </button>
              ) : (
                <button onClick={() => handleEdit(school)} className="text-main-blue hover:text-main-blue/80 text-sm font-semibold">Edit</button>
              )}
            </div>
            {editingId === school.id ? (
              <textarea 
                value={excellenceText} 
                onChange={e => setExcellenceText(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-600 italic">{school.keunggulan || "Belum ada keunggulan"}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

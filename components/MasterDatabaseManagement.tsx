import React, { useState, useEffect } from 'react';
import { masterSupabase } from '../services/supabaseClient';
import { Loader2, Plus, Trash2, Edit2, Save, X, School, CheckCircle2, XCircle } from 'lucide-react';

interface SchoolDatabase {
  id: string;
  school_code: string;
  school_name: string;
  supabase_url: string;
  supabase_anon_key: string;
  is_active: boolean;
}

export const MasterDatabaseManagement: React.FC = () => {
  const [schools, setSchools] = useState<SchoolDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SchoolDatabase>>({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      if (!masterSupabase) throw new Error("Database Pusat tidak terkonfigurasi.");
      
      const { data, error: fetchErr } = await masterSupabase
        .from('school_databases')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchErr) throw fetchErr;
      setSchools(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: string) => {
    try {
      const cleanCode = (editForm.school_code || '').trim();
      if (!/^\d{8}$/.test(cleanCode)) {
        throw new Error('NPSN Sekolah harus berupa 8 digit angka!');
      }

      setLoading(true);
      if (id) {
        // Update
        const { error: updateErr } = await masterSupabase
          .from('school_databases')
          .update({
            school_code: cleanCode,
            school_name: editForm.school_name,
            supabase_url: editForm.supabase_url,
            supabase_anon_key: editForm.supabase_anon_key,
            is_active: editForm.is_active ?? true
          })
          .eq('id', id);
        if (updateErr) throw updateErr;
      } else {
        // Insert
        const { error: insertErr } = await masterSupabase
          .from('school_databases')
          .insert([{
            school_code: cleanCode,
            school_name: editForm.school_name,
            supabase_url: editForm.supabase_url,
            supabase_anon_key: editForm.supabase_anon_key,
            is_active: true
          }]);
        if (insertErr) throw insertErr;
      }
      
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
      await fetchSchools();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data sekolah ini?')) return;
    try {
      setLoading(true);
      const { error: delErr } = await masterSupabase
        .from('school_databases')
        .delete()
        .eq('id', id);
      if (delErr) throw delErr;
      await fetchSchools();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleActive = async (school: SchoolDatabase) => {
    try {
      setLoading(true);
      const { error: updateErr } = await masterSupabase
        .from('school_databases')
        .update({ is_active: !school.is_active })
        .eq('id', school.id);
      if (updateErr) throw updateErr;
      await fetchSchools();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && schools.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manajemen Database Pusat</h2>
          <p className="text-sm text-gray-500">Kelola database pusat untuk aktivasi sekolah</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditForm({});
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" /> Tambah Sekolah
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-2 md:p-3">NPSN Sekolah</th>
              <th className="p-2 md:p-3">Nama Sekolah</th>
              <th className="p-2 md:p-3">Supabase URL</th>
              <th className="p-2 md:p-3">Anon Key</th>
              <th className="p-2 md:p-3">Status</th>
              <th className="p-2 md:p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="border-b bg-blue-50/30">
                <td className="p-3">
                  <input className="w-full border p-1 rounded" maxLength={8} value={editForm.school_code || ''} onChange={e => setEditForm({...editForm, school_code: e.target.value.replace(/\D/g, '')})} placeholder="Mis: 20521000" />
                </td>
                <td className="p-3">
                  <input className="w-full border p-1 rounded" value={editForm.school_name || ''} onChange={e => setEditForm({...editForm, school_name: e.target.value})} placeholder="Nama Sekolah" />
                </td>
                <td className="p-3">
                  <input className="w-full border p-1 rounded" value={editForm.supabase_url || ''} onChange={e => setEditForm({...editForm, supabase_url: e.target.value})} placeholder="https://..." />
                </td>
                <td className="p-3">
                  <input className="w-full border p-1 rounded" value={editForm.supabase_anon_key || ''} onChange={e => setEditForm({...editForm, supabase_anon_key: e.target.value})} placeholder="eyJ..." />
                </td>
                <td className="p-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editForm.is_active ?? true} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} />
                    <span>Aktif</span>
                  </label>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleSave()} className="p-1 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4"/></button>
                    <button onClick={() => setIsAdding(false)} className="p-1 bg-gray-100 text-gray-700 rounded"><X className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            )}
            {schools.map(school => (
              <tr key={school.id} className="border-b hover:bg-gray-50">
                {isEditing === school.id ? (
                  <>
                    <td className="p-3">
                      <input className="w-full border p-1 rounded" maxLength={8} value={editForm.school_code || ''} onChange={e => setEditForm({...editForm, school_code: e.target.value.replace(/\D/g, '')})} />
                    </td>
                    <td className="p-3">
                      <input className="w-full border p-1 rounded" value={editForm.school_name || ''} onChange={e => setEditForm({...editForm, school_name: e.target.value})} />
                    </td>
                    <td className="p-3">
                      <input className="w-full border p-1 rounded" value={editForm.supabase_url || ''} onChange={e => setEditForm({...editForm, supabase_url: e.target.value})} />
                    </td>
                    <td className="p-3">
                      <input className="w-full border p-1 rounded" value={editForm.supabase_anon_key || ''} onChange={e => setEditForm({...editForm, supabase_anon_key: e.target.value})} />
                    </td>
                    <td className="p-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editForm.is_active ?? true} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} />
                        <span>Aktif</span>
                      </label>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleSave(school.id)} className="p-1 bg-green-100 text-green-700 rounded"><Save className="w-4 h-4"/></button>
                        <button onClick={() => setIsEditing(null)} className="p-1 bg-gray-100 text-gray-700 rounded"><X className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-medium text-gray-800">{school.school_code}</td>
                    <td className="p-3">{school.school_name || 'Dinas Pendidikan'}</td>
                    <td className="p-3 max-w-xs truncate" title={school.supabase_url}>{school.supabase_url}</td>
                    <td className="p-3 max-w-xs truncate" title={school.supabase_anon_key}>{school.supabase_anon_key.substring(0, 20)}...</td>
                    <td className="p-3">
                      <button 
                        onClick={() => toggleActive(school)}
                        className={`px-2 py-1 rounded text-xs font-bold ${school.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {school.is_active ? 'Aktif' : 'Non-aktif'}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setIsEditing(school.id); setEditForm(school); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(school.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {schools.length === 0 && !isAdding && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Belum ada data sekolah di database pusat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

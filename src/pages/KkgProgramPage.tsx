import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Briefcase, Calendar, ChevronDown, Upload } from 'lucide-react';
import { useState } from 'react';
import { useSiteContent } from '../contexts/SiteContext';
import { getAutomatedProgramStatus } from '../utils/statusHelper';

export default function KkgProgramPage() {
  const [activeProgramGroup, setActiveProgramGroup] = useState('tahunan');
  const [openProgramIdx, setOpenProgramIdx] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { content } = useSiteContent();
  const kkg = content.kkg || {programs: {}};
  
  const programCategories = kkg.programCategories || [
    { id: 'tahunan', label: 'Program Tahunan' },
    { id: 'workshop', label: 'Workshop & Pelatihan' },
    { id: 'supervisi', label: 'Supervisi Akademik' },
    { id: 'media', label: 'Pengembangan Media' },
  ];

  const activeGroup = programCategories.some(c => c.id === activeProgramGroup)
    ? activeProgramGroup
    : (programCategories[0]?.id || 'tahunan');

  const programsData = kkg.programs || { tahunan: [], workshop: [], supervisi: [], media: [] };

  return (
    <div className="pt-24 pb-20 bg-light-gray min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        <h1 className="text-4xl font-heading font-bold text-soft-black mb-12">Program Kerja KKG</h1>
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
            {programCategories.map(cat => (
                <button
                key={cat.id}
                onClick={() => {
                    setActiveProgramGroup(cat.id);
                    setOpenProgramIdx(0);
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeGroup === cat.id 
                    ? 'bg-main-blue text-white shadow-lg shadow-main-blue/20' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
                }`}
                >
                {cat.label}
                </button>
            ))}
        </div>
        <div className="space-y-4">
            {(programsData[activeGroup] || [])?.map((prog: any, idx: number) => {
                const autoStatus = getAutomatedProgramStatus(prog);
                return (
                    <div key={idx} className={`bg-white border rounded-2xl overflow-hidden`}>
                        <button 
                            onClick={() => setOpenProgramIdx(openProgramIdx === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left"
                        >
                            <div className="flex flex-col">
                                <h4 className="font-semibold text-soft-black">{prog.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {prog.date}
                                    </span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border
                                        ${autoStatus === 'selesai' ? 'bg-green-50 text-green-700 border-green-100' : 
                                          autoStatus === 'berjalan' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' : 
                                          'bg-orange-50 text-orange-700 border-orange-100'}
                                    `}>
                                        {autoStatus === 'selesai' ? 'selesai' : autoStatus === 'berjalan' ? 'berjalan' : 'rencana'}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 transition-transform ${openProgramIdx === idx ? 'rotate-180 text-main-blue' : 'text-gray-400'}`} />
                        </button>
                        {openProgramIdx === idx && (
                            <div className="px-6 pb-5 pt-2 text-gray-600 border-t border-gray-50">
                                 <p className="text-sm leading-relaxed">{prog.desc}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}

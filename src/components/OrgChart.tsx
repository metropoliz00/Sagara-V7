import { motion } from "motion/react";
import React from 'react';

export default function OrgChart({ members = [], onEdit, onDelete }: { members: any[], onEdit?: (member: any) => void, onDelete?: (id: string) => void }) {
  const Card: React.FC<{ member: any, size?: "sm" | "md", memberKey: string, key?: React.Key }> = ({ member, size = "md", memberKey }) => (
    <motion.div 
      key={memberKey}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-white rounded-2xl p-4 text-center border border-gray-200 shadow-sm transition-all relative ${size === "md" ? "w-64" : "w-64"} z-10 hover:-translate-y-1 hover:shadow-md hover:border-main-blue/50 group`}
    >
      <div className={`mx-auto bg-gray-100 rounded-full mb-3 overflow-hidden border-2 border-white shadow-sm ${size === "md" ? "w-16 h-16" : "w-12 h-12"}`}>
        <img src={member?.photo_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${member?.name || "default"}`} alt={member?.name || "member"} className="w-full h-full object-cover object-top" />
      </div>
      <h4 className="font-bold text-soft-black text-sm mb-0.5 leading-tight">{member?.name || "-"}</h4>
      {member?.nip && <p className="text-[10px] text-gray-500 mb-1">NIP. {member.nip}</p>}
      <p className="text-main-blue font-semibold text-xs mb-1">{member?.role || "Jabatan"}</p>
      <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full leading-tight">{member?.school || "-"}</div>
      
      {onEdit && onDelete && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm border border-gray-100">
          <button onClick={() => onEdit(member)} className="p-1 text-gray-500 hover:text-main-blue transition-colors"><span className="text-[10px] font-bold">Edit</span></button>
          <button onClick={() => onDelete(member.id)} className="p-1 text-gray-500 hover:text-red-500 transition-colors"><span className="text-[10px] font-bold">X</span></button>
        </div>
      )}
    </motion.div>
  );

  const getLevels = () => {
    if (!Array.isArray(members) || members.length === 0) return [];

    const levelGroups: { [key: string]: any[] } = {};

    members.forEach(member => {
        const role = member.role?.toLowerCase() || "";
        
        let targetGroup = "";
        
        if (/pembina/i.test(role)) targetGroup = "Pembina";
        else if (/penanggung/i.test(role)) targetGroup = "Penanggung Jawab";
        else if (/ketua/i.test(role)) targetGroup = "Ketua";
        else if (/sekretaris|bendahara/i.test(role)) targetGroup = "Sekretariat";
        else if (/pemandu/i.test(role)) targetGroup = "Pemandu";
        else if (role.includes("bidang")) targetGroup = "Bidang-Bidang";
        else if (/anggota/i.test(role)) targetGroup = "Anggota";
        else targetGroup = member.role || "Lain-lain";

        if (!levelGroups[targetGroup]) levelGroups[targetGroup] = [];
        levelGroups[targetGroup].push(member);
    });

    const orderedKeys = ["Pembina", "Penanggung Jawab", "Ketua", "Sekretariat", "Bidang-Bidang", "Pemandu", "Anggota"];
    const result = [];
    
    // Add known ordered keys first
    for (const key of orderedKeys) {
        if (levelGroups[key]) {
            result.push(levelGroups[key]);
            delete levelGroups[key];
        }
    }
    
    // Add remaining groups
    for (const key in levelGroups) {
        result.push(levelGroups[key]);
    }
    
    return result;
  };

  const levels = getLevels();

  if (levels.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">Belum ada anggota.</p>;
  }

  return (
    <div className="flex flex-col items-center p-8 overflow-x-auto w-full">
      {levels.map((level, i) => {
        const chunks = [];
        for (let j = 0; j < level.length; j += 4) {
          chunks.push(level.slice(j, j + 4));
        }
        
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="w-px h-8 bg-gradient-to-b from-main-blue/40 to-main-blue shadow-[0_0_8px_rgba(37,99,235,0.2)] my-2 relative z-0" />
            )}
            {chunks.map((chunk, chunkIndex) => (
              <div key={`${i}-${chunkIndex}`} className="flex flex-row flex-nowrap justify-center gap-6 relative z-10 w-full max-w-7xl my-2">
                {chunk.map(member => (
                  <Card key={member.id} member={member} memberKey={member.id} />
                ))}
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

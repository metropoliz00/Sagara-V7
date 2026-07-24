#!/bin/bash

# We will apply a patch to AttendancePrint.tsx

cat << 'INNER_EOF' > /tmp/AttendancePrint.patch
--- src/components/print/AttendancePrint.tsx
+++ src/components/print/AttendancePrint.tsx
@@ -14,14 +15,18 @@
   schoolProfile?: SchoolProfileData;
   teacherProfile?: TeacherProfileData;
   currentClassId: string;
+  type?: 'month' | 'semester';
 }
 
 export const AttendancePrint: React.FC<AttendancePrintProps> = ({
   students,
   allStudents,
   allAttendanceRecords,
   holidays,
   schoolProfile,
   teacherProfile,
-  currentClassId
+  currentClassId,
+  type = 'month'
 }) => {
   const [isOpen, setIsOpen] = useState(false);
   
@@ -29,6 +34,7 @@
   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [selectedClass, setSelectedClass] = useState(currentClassId);
+  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>('ganjil');
   
   // Handle ALL class selection by finding unique classes
   const availableClasses = useMemo(() => {
@@ -176,6 +182,37 @@
     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
   ];
 
+  // SEMESTER LOGIC
+  const semesterMonths = useMemo(() => {
+    return selectedSemester === 'ganjil' 
+        ? [{num: 7, name: 'Juli'}, {num: 8, name: 'Agustus'}, {num: 9, name: 'September'}, {num: 10, name: 'Oktober'}, {num: 11, name: 'November'}, {num: 12, name: 'Desember'}]
+        : [{num: 1, name: 'Januari'}, {num: 2, name: 'Februari'}, {num: 3, name: 'Maret'}, {num: 4, name: 'April'}, {num: 5, name: 'Mei'}, {num: 6, name: 'Juni'}];
+  }, [selectedSemester]);
+
+  const semesterRecapData = useMemo(() => {
+    const data: Record<string, Record<number, { S: number; I: number; A: number }>> = {};
+    filteredStudents.forEach(s => {
+      data[s.id] = {};
+      semesterMonths.forEach(m => {
+        data[s.id][m.num] = { S: 0, I: 0, A: 0 };
+      });
+    });
+    if (allAttendanceRecords && Array.isArray(allAttendanceRecords)) {
+      allAttendanceRecords.forEach((record: any) => {
+        const sId = String(record.studentId).trim();
+        if (!data[sId]) return;
+        let dateStr = String(record.date).trim();
+        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
+        const parts = dateStr.split('-');
+        if (parts.length === 3) {
+           const recYear = parseInt(parts[0], 10);
+           const recMonth = parseInt(parts[1], 10);
+           let isMatch = false;
+           if (selectedSemester === 'ganjil' && recYear === selectedYear && recMonth >= 7 && recMonth <= 12) isMatch = true;
+           if (selectedSemester === 'genap' && recYear === selectedYear && recMonth >= 1 && recMonth <= 6) isMatch = true;
+           if (isMatch && data[sId][recMonth]) {
+             const status = String(record.status).toLowerCase();
+             if (status === 'sick') data[sId][recMonth].S++;
+             if (status === 'permit') data[sId][recMonth].I++;
+             if (status === 'alpha') data[sId][recMonth].A++;
+           }
+        }
+      });
+    }
+    return data;
+  }, [filteredStudents, allAttendanceRecords, selectedSemester, selectedYear, semesterMonths]);
+
   const handlePrintClick = () => {
     print('Laporan Absensi', 'landscape', 'attendance-special-print-area');
     setIsOpen(false);
@@ -250,7 +287,19 @@
                       ))}
                    </select>
                  </div>
+                 
+                 {type === 'semester' ? (
+                  <div className="flex gap-4">
+                    <div className="flex-1">
+                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
+                      <select className="w-full border rounded-lg px-3 py-2" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value as 'ganjil' | 'genap')}>
+                        <option value="ganjil">Ganjil (Juli - Des)</option>
+                        <option value="genap">Genap (Jan - Jun)</option>
+                      </select>
+                    </div>
+                  </div>
+                 ) : (
                  <div className="flex gap-4">
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
@@ -263,6 +312,7 @@
                       </select>
                     </div>
                  </div>
+                 )}
+                 
                  <div className="flex gap-4">
                     <div className="flex-1">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
@@ -282,6 +332,60 @@
               </div>
            </div>
         </div>
       )}
 
       {/* Hidden Print Area */}
       <div className="hidden">
         <div id="attendance-special-print-area">
           <div className="print-page landscape">
             
             {/* Header */}
             <div className="header-section">
               <h2>
-                REKAP ABSENSI {selectedClass === 'ALL' ? 'SEMUA KELAS' : `KELAS ${selectedClass}`}
+                {type === 'semester' ? 'REKAP ABSENSI SATU SEMESTER' : `REKAP ABSENSI ${selectedClass === 'ALL' ? 'SEMUA KELAS' : `KELAS ${selectedClass}`}`}
               </h2>
               <div className="header-meta">
                 <span>Nama Sekolah : {schoolProfile?.name || '-'}</span>
                 <span>Kelas : {selectedClass}</span>
-                <span>Bulan : {monthNames[selectedMonth - 1]} {selectedYear}</span>
+                <span>{type === 'semester' ? `Semester : ${selectedSemester === 'ganjil' ? 'Ganjil' : 'Genap'} ${currentAcademicYear}` : `Bulan : ${monthNames[selectedMonth - 1]} ${selectedYear}`}</span>
               </div>
             </div>
 
-            <table className="attendance-print-table">
+            {type === 'semester' ? (
+              <table className="attendance-print-table semester-print-table">
+                <thead>
+                    <tr>
+                        <th rowSpan={2} style={{width: '3%'}}>No</th>
+                        <th rowSpan={2} style={{width: '20%', textAlign: 'left', paddingLeft: '5px'}}>Nama Siswa</th>
+                        {semesterMonths.map(m => (
+                            <th key={m.num} colSpan={3}>{m.name}</th>
+                        ))}
+                        <th colSpan={3}>Total Semester</th>
+                    </tr>
+                    <tr>
+                        {semesterMonths.map(m => (
+                            <React.Fragment key={m.num}>
+                                <th style={{width: '3%'}}>S</th>
+                                <th style={{width: '3%'}}>I</th>
+                                <th style={{width: '3%'}}>A</th>
+                            </React.Fragment>
+                        ))}
+                        <th style={{width: '4%'}}>S</th>
+                        <th style={{width: '4%'}}>I</th>
+                        <th style={{width: '4%'}}>A</th>
+                    </tr>
+                </thead>
+                <tbody>
+                    {filteredStudents.map((s, idx) => {
+                        let totalS = 0; let totalI = 0; let totalA = 0;
+                        return (
+                            <tr key={s.id}>
+                                <td>{idx + 1}</td>
+                                <td style={{textAlign: 'left', paddingLeft: '5px', whiteSpace: 'nowrap', overflow: 'hidden'}}>{s.name.toUpperCase()}</td>
+                                {semesterMonths.map(m => {
+                                    const monthData = semesterRecapData[s.id]?.[m.num] || { S: 0, I: 0, A: 0 };
+                                    totalS += monthData.S; totalI += monthData.I; totalA += monthData.A;
+                                    return (
+                                        <React.Fragment key={m.num}>
+                                            <td>{monthData.S || '-'}</td>
+                                            <td>{monthData.I || '-'}</td>
+                                            <td>{monthData.A || '-'}</td>
+                                        </React.Fragment>
+                                    );
+                                })}
+                                <td style={{fontWeight: 'bold'}}>{totalS || '-'}</td>
+                                <td style={{fontWeight: 'bold'}}>{totalI || '-'}</td>
+                                <td style={{fontWeight: 'bold'}}>{totalA || '-'}</td>
+                            </tr>
+                        );
+                    })}
+                </tbody>
+              </table>
+            ) : (
+            <table className="attendance-print-table">
               <thead>
                 <tr>
                   <th rowSpan={2} style={{ width: '25px' }}>No</th>
@@ -321,6 +425,7 @@
                 {generateAttendanceRows()}
               </tbody>
             </table>
+            )}
 
             {/* Footer with Signatures */}
             <div className="footer-section" style={{ marginTop: '30px' }}>
INNER_EOF

patch -p0 < /tmp/AttendancePrint.patch


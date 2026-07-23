/// <reference types="vite/client" />
import { supabase, masterSupabase } from './supabaseClient';
import { cacheService } from '../src/services/cacheService';
import { 
  Student, AgendaItem, GradeRecord, GradeData, BehaviorLog, Extracurricular, 
  TeacherProfileData, SchoolProfileData, User, Holiday, InventoryItem, Guest, 
  ScheduleItem, PiketGroup, SikapAssessment, KarakterAssessment, SeatingLayouts, 
  AcademicCalendarData, EmploymentLink, LearningReport, LiaisonLog, PermissionRequest, 
  LearningJournalEntry, SupportDocument, OrganizationStructure, SchoolAsset, 
  BOSTransaction, LearningDocumentation, BookLoan, BookInventory, Graduate, Material,
  Sumatif, SumatifResult, GradeHistoryRecord, LearningPlan, KokurikulerPlan, EmergencyAlert, GtkRecord, PerformanceAssessment, MailRecord
} from '../types';

const isApiConfigured = () => {
  const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_URL') : null;
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') : null;
  return (!!savedUrl && !!savedKey) || (!!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY);
};

export const apiService = {
  isConfigured: isApiConfigured,

  // --- SYNC UTILS ---
  syncUserToStudent: async (user: User, studentId: string): Promise<void> => {
      const { data: student, error } = await supabase.from('students').select('*').eq('id', studentId).single();
      if (error || !student) return;

      const updates: any = {};
      if (!student.name && user.fullName) updates.name = user.fullName;
      if (!student.nis && user.username) updates.nis = user.username;
      if (!student.address && user.address) updates.address = user.address;
      if (!student.parent_phone && user.phone) updates.parent_phone = user.phone;

      if (Object.keys(updates).length > 0) {
          await supabase.from('students').update(updates).eq('id', studentId);
      }
  },

  syncStudentToUser: async (student: Student, userId: string): Promise<void> => {
      const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error || !user) return;

      const updates: any = {};
      if (!user.full_name && student.name) updates.full_name = student.name;
      if (!user.username && student.nis) updates.username = student.nis;
      if (!user.address && student.address) updates.address = student.address;
      if (!user.phone && student.parentPhone) updates.phone = student.parentPhone;

      if (Object.keys(updates).length > 0) {
          await supabase.from('users').update(updates).eq('id', userId);
      }
  },

  // --- Auth & Users ---

  login: async (username: string, password?: string): Promise<User | null> => {
    // If logging in as superadmin, always query the master central database
    const client = (username.toLowerCase() === 'superadmin' && masterSupabase) ? masterSupabase : supabase;
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    
    if (error || !data) return null;
    let bPlace = '';
    let bDate = '';
    try {
      if (data.birth_info && data.birth_info.startsWith('{')) {
        const parsed = JSON.parse(data.birth_info);
        bPlace = parsed.place || '';
        bDate = parsed.date || '';
      } else {
        bPlace = data.birth_info || '';
      }
    } catch (e) {}

    return {
      ...data,
      fullName: data.full_name,
      birthPlace: bPlace,
      birthDate: bDate,
      classId: data.class_id,
      studentId: data.student_id
    } as User;
  },

  loginWithGoogle: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return null;
    let bPlace = '';
    let bDate = '';
    try {
      if (data.birth_info && data.birth_info.startsWith('{')) {
        const parsed = JSON.parse(data.birth_info);
        bPlace = parsed.place || '';
        bDate = parsed.date || '';
      } else {
        bPlace = data.birth_info || '';
      }
    } catch (e) {}

    return {
      ...data,
      fullName: data.full_name,
      birthPlace: bPlace,
      birthDate: bDate,
      classId: data.class_id,
      studentId: data.student_id
    } as User;
  },

  getUsers: async (currentUser: User | null): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) return [];
    return data.map((u: any) => {
      let bPlace = '';
      let bDate = '';
      try {
        if (u.birth_info && u.birth_info.startsWith('{')) {
          const parsed = JSON.parse(u.birth_info);
          bPlace = parsed.place || '';
          bDate = parsed.date || '';
        } else {
           bPlace = u.birth_info || '';
        }
      } catch (e) {}

      return {
        ...u,
        fullName: u.full_name,
        birthPlace: bPlace,
        birthDate: bDate,
        classId: u.class_id,
        studentId: u.student_id
      };
    });
  },

  saveUser: async (user: User): Promise<User> => {
    const dbUser = {
      username: user.username,
      password: user.password,
      role: user.role,
      full_name: user.fullName,
      nip: user.nip,
      nuptk: user.nuptk,
      birth_info: JSON.stringify({ place: user.birthPlace || '', date: user.birthDate || '' }),
      education: user.education,
      position: user.position,
      rank: user.rank,
      class_id: user.classId,
      email: (user.email && user.email.trim() !== '' && user.email.trim() !== '-') ? user.email.trim() : null,
      phone: user.phone,
      address: user.address,
      photo: user.photo,
      signature: user.signature,
      student_id: user.studentId
    };

    if (user.id) {
      const { data, error } = await supabase
        .from('users')
        .update(dbUser)
        .eq('id', user.id)
        .select()
        .single();
      if (error) {
        console.error("Error updating user:", error);
        throw error;
      }
      if (user.role === 'siswa' && user.studentId) {
          await apiService.syncUserToStudent(user, user.studentId);
      }
      return { ...data, fullName: data.full_name, classId: data.class_id };
    } else {
      const { data, error } = await supabase
        .from('users')
        .insert([dbUser])
        .select()
        .single();
      if (error) {
        console.error("Error inserting user:", error);
        throw error;
      }
      if (user.role === 'siswa' && data.student_id) {
          await apiService.syncUserToStudent({ ...user, id: data.id }, data.student_id);
      }
      return { ...data, fullName: data.full_name, classId: data.class_id };
    }
  },

  saveUserBatch: async (users: Omit<User, 'id'>[]): Promise<void> => {
    const dbUsers = users.map(u => ({
      username: u.username.trim().toLowerCase(),
      password: u.password,
      role: u.role,
      full_name: u.fullName,
      nip: u.nip,
      nuptk: u.nuptk,
      birth_info: JSON.stringify({ place: u.birthPlace || '', date: u.birthDate || '' }),
      education: u.education,
      position: u.position,
      rank: u.rank,
      class_id: u.classId,
      email: (u.email && u.email.trim() !== '' && u.email.trim() !== '-') ? u.email.trim().toLowerCase() : null,
      phone: u.phone,
      address: u.address,
      photo: u.photo,
      signature: u.signature,
      student_id: u.studentId
    }));
    
    // Chunk for stability (increase to 100 for high efficiency)
    const chunkSize = 100;
    for (let i = 0; i < dbUsers.length; i += chunkSize) {
        const chunk = dbUsers.slice(i, i + chunkSize);
        // Use upsert onConflict username to gracefully handle existing records and updates
        const { error } = await supabase.from('users').upsert(chunk, { onConflict: 'username' });
        if (error) {
            console.error("Error batch inserting users chunk:", error);
            throw error;
        }
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    await supabase.from('users').delete().eq('id', id);
  },

  syncStudentAccounts: async (): Promise<{ status: string; message: string }> => {
    try {
      // 1. Get all students
      const { data: students, error: studentError } = await supabase.from('students').select('*');
      if (studentError) throw studentError;

      // 2. Get all existing student users
      const { data: users, error: userError } = await supabase.from('users').select('*').eq('role', 'siswa');
      if (userError) throw userError;

      let createdCount = 0;
      let updatedCount = 0;

      for (const student of students) {
        if (!student.nis) continue; // Skip if no NIS

        // Find existing user by student_id
        let existingUser = users.find((u: any) => u.student_id === student.id);

        // If not found by ID, try finding by username (NIS)
        if (!existingUser) {
           existingUser = users.find((u: any) => u.username === student.nis);
        }

        const userData = {
            username: student.nis,
            role: 'siswa',
            full_name: student.name,
            class_id: student.class_id,
            student_id: student.id,
        };

        if (existingUser) {
            // Update existing user to ensure data is in sync
            const { error } = await supabase.from('users').update(userData).eq('id', existingUser.id);
            if (!error) updatedCount++;
        } else {
            // Create new user
            const { error } = await supabase.from('users').insert([{
                ...userData,
                password: student.nis // Default password is NIS
            }]);
            if (!error) createdCount++;
        }
      }

      return { status: 'success', message: `Sinkronisasi berhasil. ${createdCount} akun dibuat, ${updatedCount} akun diperbarui.` };
    } catch (error: any) {
      console.error('Sync error:', error);
      return { status: 'error', message: 'Gagal melakukan sinkronisasi: ' + error.message };
    }
  },

  // --- Graduates ---
  getGraduates: async (): Promise<Graduate[]> => {
    const { data, error } = await supabase.from('graduates').select('*');
    if (error) return [];
    return data.map((g: any) => ({
      ...g,
      nis: g.nis || '',
      ijazahNumber: g.ijazah_number,
      graduationYear: g.graduation_year,
      continuedTo: g.continued_to,
      sklUrl: g.skl_url,
      isVisible: g.is_visible !== false,
      createdAt: g.created_at ? new Date(g.created_at).getTime() : undefined,
      updatedAt: g.updated_at ? new Date(g.updated_at).getTime() : undefined
    }));
  },

  saveGraduate: async (graduate: Graduate): Promise<void> => {
    const dbGraduate: any = {
      id: graduate.id,
      nis: graduate.nis || '',
      nisn: graduate.nisn,
      name: graduate.name,
      ijazah_number: graduate.ijazahNumber,
      status: graduate.status,
      graduation_year: graduate.graduationYear,
      continued_to: graduate.continuedTo,
      skl_url: graduate.sklUrl,
      is_visible: graduate.isVisible !== false
    };
    
    // Only pass dates if they can be converted to ISO strings properly to avoid Postgres TIMESTAMPTZ errors
    if (graduate.createdAt) dbGraduate.created_at = new Date(graduate.createdAt).toISOString();
    if (graduate.updatedAt) dbGraduate.updated_at = new Date(graduate.updatedAt).toISOString();
    
    const { error } = await supabase.from('graduates').upsert(dbGraduate);
    if (error) {
      console.error("Error saving graduate:", error);
      throw error;
    }
  },

  deleteGraduate: async (id: string): Promise<void> => {
    const { error } = await supabase.from('graduates').delete().eq('id', id);
    if (error) {
      console.error("Error deleting graduate:", error);
      throw error;
    }
  },

  getGraduateByStudent: async (student: Student): Promise<Graduate | null> => {
    // 1. Try by ID (most reliable if graduated via button)
    const { data: byId } = await supabase
      .from('graduates')
      .select('*')
      .eq('id', student.id)
      .maybeSingle();
    
    if (byId) {
      return {
        ...byId,
        ijazahNumber: byId.ijazah_number,
        graduationYear: byId.graduation_year,
        continuedTo: byId.continued_to,
        sklUrl: byId.skl_url,
        isVisible: byId.is_visible !== false
      } as Graduate;
    }

    // 2. Try by NISN (if graduated via button or manually with NISN)
    if (student.nisn) {
      const { data: byNisN } = await supabase
        .from('graduates')
        .select('*')
        .eq('nisn', student.nisn)
        .maybeSingle();
      
      if (byNisN) {
        return {
          ...byNisN,
          ijazahNumber: byNisN.ijazah_number,
          graduationYear: byNisN.graduation_year,
          continuedTo: byNisN.continued_to,
          sklUrl: byNisN.skl_url,
          isVisible: byNisN.is_visible !== false
        } as Graduate;
      }
    }

    // 3. Try by NIS (in case manually added or NIS was put in NISN field)
    if (student.nis) {
      const { data: byNis } = await supabase
        .from('graduates')
        .select('*')
        .eq('nisn', student.nis)
        .maybeSingle();
      
      if (byNis) {
        return {
          ...byNis,
          ijazahNumber: byNis.ijazah_number,
          graduationYear: byNis.graduation_year,
          continuedTo: byNis.continued_to,
          sklUrl: byNis.skl_url,
          isVisible: byNis.is_visible !== false
        } as Graduate;
      }
    }

    return null;
  },

  getStudentByNisn: async (nisn: string): Promise<Student | null> => {
    if (!nisn) return null;
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('nisn', nisn)
      .maybeSingle();
    
    if (error || !data) return null;
    return {
      ...data,
      classId: data.class_id,
      birthPlace: data.birth_place,
      birthDate: data.birth_date,
      fatherName: data.father_name,
      fatherJob: data.father_job,
      fatherEducation: data.father_education,
      motherName: data.mother_name,
      motherJob: data.mother_job,
      motherEducation: data.mother_education,
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      parentJob: data.parent_job,
      economyStatus: data.economy_status,
      bloodType: data.blood_type,
      healthNotes: data.health_notes,
      behaviorScore: Number(data.behavior_score),
      attendance: {
        present: Number(data.present),
        sick: Number(data.sick),
        permit: Number(data.permit),
        alpha: Number(data.alpha)
      },
      teacherNotes: data.teacher_notes
    } as Student;
  },

  getStudentByNis: async (nis: string): Promise<Student | null> => {
    if (!nis) return null;
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('nis', nis)
      .maybeSingle();
    
    if (error || !data) return null;
    return {
      ...data,
      classId: data.class_id,
      birthPlace: data.birth_place,
      birthDate: data.birth_date,
      fatherName: data.father_name,
      fatherJob: data.father_job,
      fatherEducation: data.father_education,
      motherName: data.mother_name,
      motherJob: data.mother_job,
      motherEducation: data.mother_education,
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      parentJob: data.parent_job,
      economyStatus: data.economy_status,
      bloodType: data.blood_type,
      healthNotes: data.health_notes,
      behaviorScore: Number(data.behavior_score),
      attendance: {
        present: Number(data.present),
        sick: Number(data.sick),
        permit: Number(data.permit),
        alpha: Number(data.alpha)
      },
      teacherNotes: data.teacher_notes
    } as Student;
  },

  saveGraduateBatch: async (graduates: Graduate[]): Promise<void> => {
    const dbGraduates = graduates.map(g => {
      const dbG: any = {
        id: g.id,
        nis: g.nis || '',
        nisn: g.nisn,
        name: g.name,
        ijazah_number: g.ijazahNumber,
        status: g.status,
        graduation_year: g.graduationYear,
        continued_to: g.continuedTo,
        skl_url: g.sklUrl || '',
        is_visible: g.isVisible !== false
      };
      if (g.createdAt) dbG.created_at = new Date(g.createdAt).toISOString();
      if (g.updatedAt) dbG.updated_at = new Date(g.updatedAt).toISOString();
      return dbG;
    });
    const { error } = await supabase.from('graduates').upsert(dbGraduates);
    if (error) {
      console.error("Error saving graduate batch:", error);
      throw error;
    }
  },

  // --- Students ---
  getStudents: async (currentUser: User | null): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) return [];
    return data.map((s: any) => ({
      ...s,
      classId: s.class_id,
      birthPlace: s.birth_place,
      birthDate: s.birth_date,
      fatherName: s.father_name,
      fatherJob: s.father_job,
      fatherEducation: s.father_education,
      motherName: s.mother_name,
      motherJob: s.mother_job,
      motherEducation: s.mother_education,
      parentName: s.parent_name,
      parentPhone: s.parent_phone,
      parentJob: s.parent_job,
      economyStatus: s.economy_status,
      bloodType: s.blood_type,
      healthNotes: s.health_notes,
      behaviorScore: Number(s.behavior_score),
      attendance: {
        present: Number(s.present),
        sick: Number(s.sick),
        permit: Number(s.permit),
        alpha: Number(s.alpha)
      },
      teacherNotes: s.teacher_notes
    })).sort((a: Student, b: Student) => a.name.localeCompare(b.name));
  },

  createStudent: async (student: Omit<Student, 'id'>): Promise<Student> => {
    const dbStudent = {
      class_id: student.classId,
      nis: student.nis,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
      birth_place: student.birthPlace,
      birth_date: student.birthDate || null,
      religion: student.religion,
      address: student.address,
      father_name: student.fatherName,
      father_job: student.fatherJob,
      father_education: student.fatherEducation,
      mother_name: student.motherName,
      mother_job: student.motherJob,
      mother_education: student.motherEducation,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      parent_job: student.parentJob,
      economy_status: student.economyStatus,
      height: student.height,
      weight: student.weight,
      blood_type: student.bloodType,
      health_notes: student.healthNotes,
      hobbies: student.hobbies,
      ambition: student.ambition,
      achievements: student.achievements,
      violations: student.violations,
      behavior_score: student.behaviorScore,
      photo: student.photo,
      teacher_notes: student.teacherNotes,
      present: student.attendance?.present || 0,
      sick: student.attendance?.sick || 0,
      permit: student.attendance?.permit || 0,
      alpha: student.attendance?.alpha || 0
    };
    const { data, error } = await supabase.from('students').insert([dbStudent]).select().single();
    if (error) {
      console.error("Error creating student:", error);
      throw error;
    }
    return { ...data, classId: data.class_id } as unknown as Student;
  },

  createStudentBatch: async (students: Omit<Student, 'id'>[]): Promise<any> => {
    const dbStudents = students.map(s => {
      let cleanBirthDate: string | null = null;
      if (s.birthDate && String(s.birthDate).trim() !== '' && String(s.birthDate).trim() !== '-') {
        const bdStr = String(s.birthDate).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(bdStr)) {
          cleanBirthDate = bdStr;
        } else {
          // Attempt to parse if string is e.g. DD/MM/YYYY or similar
          const parts = bdStr.split(/[\/\.-]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              cleanBirthDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else if (parts[2].length === 4) {
              cleanBirthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }
      }

      return {
        class_id: s.classId || '1A',
        nis: String(s.nis).trim(),
        nisn: (s.nisn && String(s.nisn).trim() !== '-' && String(s.nisn).trim() !== '') ? String(s.nisn).trim() : null,
        nik: (s.nik && String(s.nik).trim() !== '-' && String(s.nik).trim() !== '') ? String(s.nik).trim() : null,
        name: String(s.name).trim().toUpperCase(),
        gender: (s.gender && String(s.gender).toUpperCase().includes('P')) ? 'P' : 'L',
        birth_place: (s.birthPlace && String(s.birthPlace).trim() !== '-') ? String(s.birthPlace).trim() : null,
        birth_date: cleanBirthDate,
        religion: s.religion || 'Islam',
        address: (s.address && String(s.address).trim() !== '-') ? String(s.address).trim() : null,
        father_name: (s.fatherName && String(s.fatherName).trim() !== '-') ? String(s.fatherName).trim().toUpperCase() : null,
        father_job: (s.fatherJob && String(s.fatherJob).trim() !== '-') ? String(s.fatherJob).trim() : null,
        father_education: (s.fatherEducation && String(s.fatherEducation).trim() !== '-') ? String(s.fatherEducation).trim() : null,
        mother_name: (s.motherName && String(s.motherName).trim() !== '-') ? String(s.motherName).trim().toUpperCase() : null,
        mother_job: (s.motherJob && String(s.motherJob).trim() !== '-') ? String(s.motherJob).trim() : null,
        mother_education: (s.motherEducation && String(s.motherEducation).trim() !== '-') ? String(s.motherEducation).trim() : null,
        parent_name: (s.parentName && String(s.parentName).trim() !== '-') ? String(s.parentName).trim().toUpperCase() : null,
        parent_phone: (s.parentPhone && String(s.parentPhone).trim() !== '-') ? String(s.parentPhone).trim() : null,
        parent_job: (s.parentJob && String(s.parentJob).trim() !== '-') ? String(s.parentJob).trim() : null,
        economy_status: s.economyStatus || 'Mampu',
        height: isNaN(Number(s.height)) ? 0 : Number(s.height),
        weight: isNaN(Number(s.weight)) ? 0 : Number(s.weight),
        blood_type: (s.bloodType && String(s.bloodType).trim() !== '-') ? String(s.bloodType).trim() : null,
        health_notes: (s.healthNotes && String(s.healthNotes).trim() !== '-') ? String(s.healthNotes).trim() : null,
        hobbies: (s.hobbies && String(s.hobbies).trim() !== '-') ? String(s.hobbies).trim() : null,
        ambition: (s.ambition && String(s.ambition).trim() !== '-') ? String(s.ambition).trim() : null,
        achievements: Array.isArray(s.achievements) ? s.achievements : [],
        violations: Array.isArray(s.violations) ? s.violations : [],
        behavior_score: isNaN(Number(s.behaviorScore)) ? 100 : Number(s.behaviorScore),
        photo: s.photo || null,
        teacher_notes: s.teacherNotes || null,
        present: s.attendance?.present || 0,
        sick: s.attendance?.sick || 0,
        permit: s.attendance?.permit || 0,
        alpha: s.attendance?.alpha || 0
      };
    });

    const chunkSize = 50;
    const allResults: any[] = [];

    for (let i = 0; i < dbStudents.length; i += chunkSize) {
      const chunk = dbStudents.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('students').upsert(chunk, { onConflict: 'nis' }).select();
      if (error) {
        console.error("Error creating student batch chunk:", error);
        throw error;
      }
      if (data) allResults.push(...data);
    }

    return { status: 'success', data: allResults };
  },

  updateStudent: async (student: Student): Promise<void> => {
    const dbStudent = {
      class_id: student.classId,
      nis: student.nis,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
      birth_place: student.birthPlace,
      birth_date: student.birthDate || null,
      religion: student.religion,
      address: student.address,
      father_name: student.fatherName,
      father_job: student.fatherJob,
      father_education: student.fatherEducation,
      mother_name: student.motherName,
      mother_job: student.motherJob,
      mother_education: student.motherEducation,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      parent_job: student.parentJob,
      economy_status: student.economyStatus,
      height: student.height,
      weight: student.weight,
      blood_type: student.bloodType,
      health_notes: student.healthNotes,
      hobbies: student.hobbies,
      ambition: student.ambition,
      achievements: student.achievements,
      violations: student.violations,
      behavior_score: student.behaviorScore,
      present: student.attendance.present,
      sick: student.attendance.sick,
      permit: student.attendance.permit,
      alpha: student.attendance.alpha,
      photo: student.photo,
      teacher_notes: student.teacherNotes
    };
    await supabase.from('students').update(dbStudent).eq('id', student.id);
    
    // Sync to user
    const { data: user } = await supabase.from('users').select('id').eq('student_id', student.id).single();
    if (user) {
        await apiService.syncStudentToUser(student, user.id);
    }
  },

  deleteStudent: async (id: string): Promise<void> => {
    try {
      // 1. Delete dependent records first to avoid Foreign Key constraint violations
      // Delete user account
      await supabase.from('users').delete().eq('student_id', id);
      
      // Delete related assessments and logs
      await supabase.from('grades').delete().eq('student_id', id);
      await supabase.from('counseling').delete().eq('student_id', id);
      await supabase.from('penilaian_sikap').delete().eq('student_id', id);
      await supabase.from('penilaian_karakter').delete().eq('student_id', id);
      await supabase.from('sumatif_results').delete().eq('student_id', id);
      await supabase.from('buku_penghubung').delete().eq('student_id', id);
      await supabase.from('permission_requests').delete().eq('student_id', id);
      
      // 2. Finally delete the student record
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        console.error("Error deleting student:", error);
        throw error;
      }
    } catch (error) {
      console.error("Critical error in deleteStudent:", error);
      throw error;
    }
  },

  // --- Agendas ---
  getAgendas: async (currentUser: User | null): Promise<AgendaItem[]> => {
    const { data, error } = await supabase.from('agendas').select('*');
    if (error) return [];
    return data.map((a: any) => ({ 
      ...a, 
      classId: a.class_id,
      endDate: a.end_date 
    }));
  },
  createAgenda: async (agenda: AgendaItem): Promise<void> => {
    console.log("Creating agenda:", agenda);
    const { error } = await supabase.from('agendas').insert([{
      class_id: agenda.classId,
      title: agenda.title,
      date: agenda.date,
      time: agenda.time,
      type: agenda.type,
      completed: agenda.completed
    }]);
    if (error) {
      console.error("Error creating agenda:", error);
      throw error;
    }
  },
  updateAgenda: async (agenda: AgendaItem): Promise<void> => {
    const { error } = await supabase.from('agendas').update({
      class_id: agenda.classId,
      title: agenda.title,
      date: agenda.date,
      time: agenda.time,
      type: agenda.type,
      completed: agenda.completed
    }).eq('id', agenda.id);
    if (error) {
      console.error("Error updating agenda:", error);
      throw error;
    }
  },
  deleteAgenda: async (id: string): Promise<void> => {
    await supabase.from('agendas').delete().eq('id', id);
  },

  // --- Materials ---
  getMaterials: async (classId: string): Promise<Material[]> => {
    console.log("Fetching materials for classId:", classId);
    const { data, error } = await supabase.from('materials').select('*').eq('class_id', classId);
    if (error) {
      console.warn("Error fetching materials:", error);
      return [];
    }
    console.log("Materials fetched from Supabase:", data);
    return data.map((m: any) => {
      let link = m.link || '';
      let videoLink = '';
      let infographic = '';
      let taskLink = '';
      let taskFile = '';
      let taskTitle = '';
      if (link && link.includes('|||')) {
          const parts = link.split('|||');
          link = parts[0] || '';
          videoLink = parts[1] || '';
          infographic = parts[2] || '';
          taskLink = parts[3] || '';
          taskFile = parts[4] || '';
          taskTitle = parts[5] || '';
      }
      return {
        id: m.id,
        classId: m.class_id,
        subjectId: m.subject_id,
        title: m.title,
        description: m.description,
        link: link,
        videoLink: videoLink,
        infographic: infographic,
        taskLink: taskLink,
        taskFile: taskFile,
        taskTitle: taskTitle,
        isVisible: m.is_visible,
        createdAt: m.created_at
      };
    });
  },
  createMaterial: async (material: Omit<Material, 'id' | 'createdAt'> & { createdAt?: string }): Promise<void> => {
    const combinedLink = (material.videoLink || material.infographic || material.taskLink || material.taskFile || material.taskTitle)
      ? `${material.link}|||${material.videoLink || ''}|||${material.infographic || ''}|||${material.taskLink || ''}|||${material.taskFile || ''}|||${material.taskTitle || ''}`
      : material.link;
    const { error } = await supabase.from('materials').insert([{
      class_id: material.classId,
      subject_id: material.subjectId,
      title: material.title,
      description: material.description,
      link: combinedLink,
      is_visible: material.isVisible,
      created_at: material.createdAt || new Date().toISOString()
    }]);
    if (error) {
      console.error("Error creating material:", error);
      throw error;
    }
  },
  updateMaterial: async (material: Material): Promise<void> => {
    const combinedLink = (material.videoLink || material.infographic || material.taskLink || material.taskFile || material.taskTitle)
      ? `${material.link}|||${material.videoLink || ''}|||${material.infographic || ''}|||${material.taskLink || ''}|||${material.taskFile || ''}|||${material.taskTitle || ''}`
      : material.link;
    const { error } = await supabase.from('materials').update({
      subject_id: material.subjectId,
      title: material.title,
      description: material.description,
      link: combinedLink,
      is_visible: material.isVisible,
      created_at: material.createdAt
    }).eq('id', material.id);
    if (error) {
      console.error("Error updating material:", error);
      throw error;
    }
  },
  deleteMaterial: async (id: string): Promise<void> => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) {
      console.error("Error deleting material:", error);
      throw error;
    }
  },

  // --- Grades ---
  getGrades: async (currentUser: User | null): Promise<GradeRecord[]> => {
    const { data, error } = await supabase.from('grades').select('*');
    if (error) return [];
    
    const gradeMap: Record<string, GradeRecord> = {};
    data.forEach((row: any) => {
      if (!gradeMap[row.student_id]) {
        gradeMap[row.student_id] = {
          studentId: row.student_id,
          classId: row.class_id,
          subjects: {}
        };
      }
      gradeMap[row.student_id].subjects[row.subject_id] = {
        sum1: Number(row.sum1),
        sum2: Number(row.sum2),
        sum3: Number(row.sum3),
        sum4: Number(row.sum4),
        sas: Number(row.sas),
        ...(row.extra_data || {})
      };
    });
    return Object.values(gradeMap);
  },
  getGradesForStudent: async (studentId: string): Promise<GradeRecord | null> => {
    const { data, error } = await supabase.from('grades').select('*').eq('student_id', studentId);
    if (error || !data || data.length === 0) return null;
    
    const record: GradeRecord = {
      studentId,
      classId: data[0].class_id,
      subjects: {}
    };
    
    data.forEach((row: any) => {
      record.subjects[row.subject_id] = {
        sum1: Number(row.sum1),
        sum2: Number(row.sum2),
        sum3: Number(row.sum3),
        sum4: Number(row.sum4),
        sas: Number(row.sas),
        ...(row.extra_data || {})
      };
    });
    return record;
  },
  deleteGradesForStudent: async (studentId: string): Promise<void> => {
    const { error } = await supabase.from('grades').delete().eq('student_id', studentId);
    if (error) console.error('Error deleting grades:', error);
  },
  getGradeHistory: async (studentId: string): Promise<any[]> => {
    const { data, error } = await supabase.from('class_config').select('data').eq('class_id', `grade_history_${studentId}`).single();
    if (error || !data) return [];
    return data.data?.history || [];
  },
  saveGradeHistory: async (studentId: string, historyEntry: any): Promise<void> => {
    const historyId = `grade_history_${studentId}`;
    const { data: existing } = await supabase.from('class_config').select('data').eq('class_id', historyId).single();
    const currentData = existing?.data || { history: [] };
    
    // Check if entry already exists for this semester and year
    const existingIndex = currentData.history.findIndex((h: any) => h.id === historyEntry.id);
    if (existingIndex >= 0) {
      currentData.history[existingIndex] = historyEntry;
    } else {
      currentData.history.push(historyEntry);
    }
    
    await supabase.from('class_config').upsert({ class_id: historyId, data: currentData }, { onConflict: 'class_id' });
  },
  getClassGradeHistory: async (classId: string): Promise<GradeHistoryRecord[]> => {
    const { data, error } = await supabase.from('class_config').select('data').eq('class_id', `class_grade_history_${classId}`).single();
    if (error || !data) return [];
    return data.data?.history || [];
  },
  saveClassGradeHistory: async (classId: string, historyEntry: GradeHistoryRecord): Promise<void> => {
    const historyId = `class_grade_history_${classId}`;
    const { data: existing } = await supabase.from('class_config').select('data').eq('class_id', historyId).single();
    const currentData = existing?.data || { history: [] };
    
    const existingIndex = currentData.history.findIndex((h: any) => h.id === historyEntry.id);
    if (existingIndex >= 0) {
      currentData.history[existingIndex] = historyEntry;
    } else {
      currentData.history.push(historyEntry);
    }
    
    await supabase.from('class_config').upsert({ class_id: historyId, data: currentData }, { onConflict: 'class_id' });
  },
  deleteClassGradeHistory: async (classId: string, historyId: string): Promise<void> => {
    const configId = `class_grade_history_${classId}`;
    const { data: existing } = await supabase.from('class_config').select('data').eq('class_id', configId).single();
    if (!existing) return;
    
    const currentData = existing.data || { history: [] };
    currentData.history = currentData.history.filter((h: any) => h.id !== historyId);
    
    await supabase.from('class_config').upsert({ class_id: configId, data: currentData }, { onConflict: 'class_id' });
  },
  saveGrade: async (studentId: string, subjectId: string, gradeData: GradeData, classId: string): Promise<void> => {
    if (!studentId || !subjectId) {
      console.error('Invalid parameters for saveGrade:', { studentId, subjectId, classId });
      throw new Error('ID Siswa dan Mata Pelajaran wajib diisi.');
    }

    // Extract dynamic fields into extra_data
    const { sum1, sum2, sum3, sum4, sas, ...extra_data } = gradeData;
    
    const payload: any = {
      student_id: studentId,
      subject_id: subjectId,
      class_id: classId,
      sum1: sum1 || 0,
      sum2: sum2 || 0,
      sum3: sum3 || 0,
      sum4: sum4 || 0,
      sas: sas || 0,
      extra_data: extra_data
    };

    // First try with extra_data
    const { error } = await supabase.from('grades').upsert(payload, { onConflict: 'student_id,subject_id' });
    
    if (error) {
      console.warn('Upsert with extra_data failed, trying fallback without extra_data...', error);
      
      // Fallback: remove extra_data from payload and try again (in case the column does not exist in the DB)
      const fallbackPayload = {
        student_id: studentId,
        subject_id: subjectId,
        class_id: classId,
        sum1: sum1 || 0,
        sum2: sum2 || 0,
        sum3: sum3 || 0,
        sum4: sum4 || 0,
        sas: sas || 0
      };

      const { error: fallbackError } = await supabase.from('grades').upsert(fallbackPayload, { onConflict: 'student_id,subject_id' });
      
      if (fallbackError) {
        console.error('Error saving grade (fallback failed):', fallbackError);
        throw fallbackError;
      }
    }
  },
  
  getCustomGradeColumns: async (classId: string, subjectId: string): Promise<string[]> => {
    const { data, error } = await supabase.from('class_config').select('data').eq('class_id', `grade_columns_${classId}_${subjectId}`).single();
    if (error || !data) return [];
    return data.data?.columns || [];
  },
  
  saveCustomGradeColumns: async (classId: string, subjectId: string, columns: string[]): Promise<void> => {
    await supabase.from('class_config').upsert({ 
      class_id: `grade_columns_${classId}_${subjectId}`, 
      data: { columns } 
    }, { onConflict: 'class_id' });
  },

  // --- Counseling ---
  getCounselingLogs: async (currentUser: User | null): Promise<BehaviorLog[]> => {
    const { data, error } = await supabase.from('counseling').select('*');
    if (error) return [];
    return data.map((l: any) => ({
      ...l,
      classId: l.class_id,
      studentId: l.student_id,
      studentName: l.student_name
    }));
  },
  createCounselingLog: async (log: BehaviorLog): Promise<void> => {
    await supabase.from('counseling').insert([{
      class_id: log.classId,
      student_id: log.studentId,
      student_name: log.studentName,
      date: log.date,
      type: log.type,
      category: log.category,
      description: log.description,
      point: log.point,
      emotion: log.emotion,
      status: log.status
    }]);
  },

  // --- Extracurriculars ---
  getExtracurriculars: async (currentUser: User | null): Promise<Extracurricular[]> => {
    const { data, error } = await supabase.from('extracurriculars').select('*');
    if (error) return [];
    return data.map((e: any) => ({ ...e, classId: e.class_id }));
  },
  createExtracurricular: async (extra: Extracurricular): Promise<void> => {
    console.log("Creating extracurricular:", extra);
    const { error } = await supabase.from('extracurriculars').insert([{
      class_id: extra.classId,
      name: extra.name,
      category: extra.category,
      schedule: extra.schedule,
      coach: extra.coach,
      members: extra.members
    }]);
    if (error) console.error("Error creating extracurricular:", error);
  },
  updateExtracurricular: async (extra: Extracurricular): Promise<void> => {
    await supabase.from('extracurriculars').update({
      class_id: extra.classId,
      name: extra.name,
      category: extra.category,
      schedule: extra.schedule,
      coach: extra.coach,
      members: extra.members
    }).eq('id', extra.id);
  },
  deleteExtracurricular: async (id: string): Promise<void> => {
    await supabase.from('extracurriculars').delete().eq('id', id);
  },

  // --- Profiles ---
  getProfiles: async (): Promise<{ teacher?: TeacherProfileData, school?: SchoolProfileData }> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return {};
    const profiles: any = {};
    data.forEach((p: any) => {
      profiles[p.id] = p.data;
    });
    return profiles;
  },
  saveProfile: async (type: 'teacher' | 'school' | 'service_info', data: any): Promise<void> => {
    const { error } = await supabase.from('profiles').upsert({ id: type, data });
    if (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
  },

  // --- Holidays ---
  getHolidays: async (currentUser: User | null): Promise<Holiday[]> => {
    const { data, error } = await supabase.from('holidays').select('*');
    if (error) return [];
    return data.map((h: any) => ({ ...h, classId: h.class_id }));
  },
  saveHolidayBatch: async (holidays: Omit<Holiday, 'id'>[]): Promise<void> => {
    if (holidays.length === 0) return;

    const dbHolidays = holidays.map(h => ({
      class_id: h.classId,
      date: h.date,
      description: h.description,
      type: h.type
    }));

    // Extract unique dates and class_ids to delete existing ones
    const dates = [...new Set(holidays.map(h => h.date))];
    const classIds = [...new Set(holidays.map(h => h.classId))];

    // Delete existing holidays for these dates and class_ids to prevent duplicates
    if (dates.length > 0 && classIds.length > 0) {
      await supabase
        .from('holidays')
        .delete()
        .in('date', dates)
        .in('class_id', classIds);
    }

    await supabase.from('holidays').insert(dbHolidays);
  },
  updateHoliday: async (holiday: Holiday): Promise<void> => {
    await supabase.from('holidays').update({
      class_id: holiday.classId,
      date: holiday.date,
      description: holiday.description,
      type: holiday.type
    }).eq('id', holiday.id);
  },
  deleteHoliday: async (id: string): Promise<void> => {
    await supabase.from('holidays').delete().eq('id', id);
  },

  // --- Attendance ---
  getAttendance: async (currentUser: User | null): Promise<any[]> => {
    const { data, error } = await supabase.from('attendance').select('*');
    if (error) return [];
    const allRecords: any[] = [];
    data.forEach((row: any) => {
      const parts = row.id.split('_');
      const classId = parts[0];
      const date = parts[1];
      if (Array.isArray(row.records)) {
        row.records.forEach((rec: any) => {
          allRecords.push({ ...rec, date, classId });
        });
      }
    });
    return allRecords;
  },
  saveAttendance: async (date: string, records: any[], forceClasses?: string[]): Promise<void> => {
    const classGroups: Record<string, any[]> = {};
    
    // Initialize forced classes with empty arrays to allow clearing them
    if (forceClasses) {
      forceClasses.forEach(classId => {
        if (classId) classGroups[classId] = [];
      });
    }

    records.forEach(r => {
      if (r.classId) {
        if (!classGroups[r.classId]) classGroups[r.classId] = [];
        classGroups[r.classId].push({ studentId: r.studentId, status: r.status, notes: r.notes || '' });
      }
    });

    for (const classId in classGroups) {
      const id = `${classId}_${date}`;
      await supabase.from('attendance').upsert({ id, records: classGroups[classId] });
    }
  },
  saveSingleScanAttendance: async (date: string, scanRecord: any): Promise<void> => {
    const classId = scanRecord.classId;
    if (!classId) return;
    const id = `${classId}_${date}`;
    
    const { data } = await supabase.from('attendance').select('records').eq('id', id).single();
    
    let existingRecords: any[] = [];
    if (data && data.records && Array.isArray(data.records)) {
      existingRecords = data.records;
    }
    
    const existingIndex = existingRecords.findIndex((r: any) => String(r.studentId) === String(scanRecord.studentId));
    if (existingIndex >= 0) {
      existingRecords[existingIndex] = { studentId: scanRecord.studentId, status: scanRecord.status, notes: scanRecord.notes || '' };
    } else {
      existingRecords.push({ studentId: scanRecord.studentId, status: scanRecord.status, notes: scanRecord.notes || '' });
    }
    
    await supabase.from('attendance').upsert({ id, records: existingRecords });
  },
  saveAttendanceBatch: async (batchData: { date: string, records: any[] }[], forceClasses?: string[]): Promise<void> => {
    const upserts: any[] = [];
    const classGroupsByDate: Record<string, Record<string, any[]>> = {};

    batchData.forEach(d => {
      if (!classGroupsByDate[d.date]) classGroupsByDate[d.date] = {};
      
      // Initialize forced classes for each date
      if (forceClasses) {
        forceClasses.forEach(classId => {
          if (classId) classGroupsByDate[d.date][classId] = [];
        });
      }

      d.records.forEach(r => {
        if (r.classId) {
          if (!classGroupsByDate[d.date][r.classId]) classGroupsByDate[d.date][r.classId] = [];
          classGroupsByDate[d.date][r.classId].push({ studentId: r.studentId, status: r.status, notes: r.notes || '' });
        }
      });
    });

    for (const date in classGroupsByDate) {
      for (const classId in classGroupsByDate[date]) {
        upserts.push({
          id: `${classId}_${date}`,
          records: classGroupsByDate[date][classId]
        });
      }
    }

    if (upserts.length > 0) {
      const { error } = await supabase.from('attendance').upsert(upserts);
      if (error) throw error;
    }
  },

  // --- Sikap & Karakter ---
  getSikapAssessments: async (currentUser: User | null): Promise<SikapAssessment[]> => {
    const { data, error } = await supabase.from('penilaian_sikap').select('*');
    if (error) return [];
    return data.map((s: any) => ({
      ...s,
      studentId: s.student_id,
      classId: s.class_id,
      penalaranKritis: Number(s.penalaran_kritis)
    }));
  },
  saveSikapAssessment: async (studentId: string, classId: string, assessment: any): Promise<void> => {
    const { error } = await supabase.from('penilaian_sikap').upsert({
      student_id: studentId,
      class_id: classId,
      keimanan: assessment.keimanan,
      kewargaan: assessment.kewargaan,
      penalaran_kritis: assessment.penalaranKritis,
      kreativitas: assessment.kreativitas,
      kolaborasi: assessment.kolaborasi,
      kemandirian: assessment.kemandirian,
      kesehatan: assessment.kesehatan,
      komunikasi: assessment.komunikasi
    });
    if (error) {
      console.error("Error saving sikap assessment:", error);
      throw error;
    }
  },
  getKarakterAssessments: async (currentUser: User | null): Promise<KarakterAssessment[]> => {
    const { data, error } = await supabase.from('penilaian_karakter').select('*');
    if (error) return [];
    return data.map((k: any) => ({
      ...k,
      studentId: k.student_id,
      classId: k.class_id,
      bangunPagi: k.bangun_pagi,
      tidurAwal: k.tidur_awal
    }));
  },
  saveKarakterAssessment: async (studentId: string, classId: string, assessment: any): Promise<void> => {
    const { error } = await supabase.from('penilaian_karakter').upsert({
      student_id: studentId,
      class_id: classId,
      bangun_pagi: assessment.bangunPagi,
      beribadah: assessment.beribadah,
      berolahraga: assessment.berolahraga,
      makan_sehat: assessment.makanSehat,
      gemar_belajar: assessment.gemarBelajar,
      bermasyarakat: assessment.bermasyarakat,
      tidur_awal: assessment.tidurAwal,
      catatan: assessment.catatan,
      afirmasi: assessment.afirmasi
    });
    if (error) {
      console.error("Error saving karakter assessment:", error);
      throw error;
    }
  },

  // --- Employment Links ---
  getEmploymentLinks: async (): Promise<EmploymentLink[]> => {
    const { data, error } = await supabase.from('employment_links').select('*');
    if (error || !data || data.length === 0) {
      return [
        { id: 'def-1', title: 'Si Jempol', url: 'https://sijempol.tubankab.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAXCAMAAABd273TAAAAbFBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFhYMDAwAAAAAAAChoaHZ2dmampozMzMAAAAcHBwpKSmKior09PRcXFwjIyPNzc2rq6s5OTns7Ox4eHgAAAAAAAC3t7e9vb0AAABCQkIDazJdAAAAI3RSTlMAFUt3s+VdmdD///8H8/////8n//////////////+E/f//OIGIR7EAAAEaSURBVHgBbdIFDsQgEEBR6v1QY0u9Xb3/HXfCuryE6GgG9S0IozhJIvVPkGY52iB+A4owK4GqbrTVlHG0e68piaK1ruu7ocNZA5TZLaZEoDF2hKmH2RnjIyAJJSBGLEZbQ2vWmm1jBD3i5UrtgREMgn6qOjxn8WIfoKubZp3wnLlvw0FlwNFXEf0Jo3Gap1TtDrgOjDEaaQFuwHFXntVtCIzDypMW7aXhLg+V8D3adsShB9nCHXGIOC3UTcZTNa1VRWv8cE8hT0O9zhYLHDL1kvB06pfZjIjk/U73CG30LAFgEeodokVrun5rRgTxT4C39PN2QZSFelfyMK2n3/z3Tcfj5m/4peAp358D9UsO4vlP9N95Fyap+uMKV5wYXq2GYZoAAAAASUVORK5CYII=' },
        { id: 'def-2', title: 'E-Kinerja', url: 'https://kinerja.bkn.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAEZklEQVR4Ab2WA5QjWRSG79i2zaSqx66qV8msbXuP1jbGdlXGtj2pytq2bdthJ/vfnnROUGl3f+fcOO/+7+o9qiC1FH2JpgrfXaowrpowYWkrqkFqqcI0FeGLwxJsE4TvGyEWu6kmUFXDk+Y8ZYjG8yyOqhs4msYOHSzm9S7qQNXJ8OEr6iHcbzsLMKOKMqNdded+qrNzmOYLVNqBrhvjNd24Q/MYVxx33ILWKceq0UvVzBUIv1/Rzfn8WtHMb5PO45x/IZZ0pYoyadKk2gjhqozK1nz/wsm7+PwT2NOqurgfpTF27IJGmuYbydXP/y8W+9vO4S0Sj4uGVB4maMY5+UKL3b0/ceKsFgSCdoEetaUHQpZ0YiKRW/FhW74H34djAem7fw9Lw6msKLqxNp8AFnfUufsSLB6LBqQ4rDDsl+6gND5/vGdDfP4Hf88WsaV1OQKPSFLElm9MHHBndgscLXMWsDTu8SzpQyBqy0/zwimzpb9CB4b1pSSJSVQbTl8r/h4C76Q0/oFTROaHou9syaJ0hDAEcl7oJELXlxQQCFvugynnqV26X/zV37c5Jfkv4O4WteQZEHLdKyuG10uJ2zm4fjggHUmJs6UDuWkQS25CK/2XkwLhe5BAxHYVYNdf54gISC+H/a7BlIfEviEto5a0lyMGYTsilnzVn7arNTkxfvzszqpuXAgxZ6O6j0dt3M+doOsLXAR+2Cg3CfmlE7DYnTFbXoaiOwQRTyGvn0PI+pg95KR/9wzq9Pm6ng1DjxT0j9ruW+H0c9j8v/fK7dNbnsrKWMwDRTO2ah7zDCEm1SUHOMQhFBfERNm4E2CF/Bq1cBFVFq/XbDNBmD/w8FF180lF932I2fAGJuO1kyg1AwgO98PiDp1QeRCF2U5FypOTkkQsaUG6gJDffSxVFXB2uZMAjso555xTJxmBQNL5v0XPGFxVeAyb85wE8Mg+55xJ9RMBuQny/ieKccHvXPm2bPFkpKrA45nXA85+cxzVmvkogVhAPgUC9vNAIvDXIwPb4P1zvz08vAWVBZ73Xu/C3nzmZ96AFkiYD28i1F/i+Ueejml3gO/H66aLAHa+KXhwcHdKA+15aTQg704OJWfOOWdnHYR3FocShsXNr1XNwHG7dA4OooNFdwBlYSfuXc41LqMnQcx0TTNvOEFZ0o7AX0e456XZlMW7aE+eA5iie371j26eL7fX5jsHhMe8msoAnKwMHhnagxxgYcmJ+b7jCYldPpXnJHyiLBPrv0MFo+BgJ+UhaLlF+gH2196BbbLay3wmT3vdTqXw9c6xjbD7NxDiMykPXIRw/ndSROifI4M7Zgu4yUFAENOvf2lXOBwsi7Ho79yCVAIxSz4Vv9sVtuTzKRue72ilxXAaYucqj1zdOItKgWc8KjyGCGylqkCIeW25pSCo1PscX82Kpx0LoZrkP0saG0PYkzmNJh4a2plqkjAuF2kHzntU0/CtOE3AVKppHp8k6oYt1/mce9z/61Il+R+aGkcqvOwyagAAAABJRU5ErkJggg==' },
        { id: 'def-3', title: 'ASN Digital', url: 'https://asn.digital/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAcCAMAAABMOI/cAAAA4VBMVEVHcEzjFVfdHl/eHV7dHl/dH1/dHl/hGle7wcS8vsG0oLLeHl6jWpK9v8G9v8G6vcHeHl7eHV7hE1reGl3gGly6vcG6vcHBxcPdHV+8vsG4yMi8xcbcMWe1usG8vsG9v8HhDFjTZoW6ysnwDyzNg5e8vsG5xMbPeZHgAVXFpK7XWHu8vsEmndjRcYz2ACkMo94kndnlAFEZm9kqndcondgnndgen9oqnthWjceIbqmYpMAondgnndgnndhDlM4RndonndgrndcsnddMo9RmqdGRs8obnNkonNe9v8G9v8EnndjmGRR6AAAAS3RSTlMAdFz/VylJJ4GiBZEBxv8y/6y+6dEtQdrivGL//w6t8P/9Tw7/cEiz////k2X4Ikv//0I4ibra6ez//4q38P//xyoke///qA/S1O7W4ErNAAABbUlEQVR4AYXJBWICMRBA0U+Dww4OtZUKbsHdnfvfp+76knHe4XLxoxOl3PzA41XK6+Mbr/J6fG7l5RN/gKAKQUiFCfh5Z0iEaAziUSJi8C4oQiIJyQQiQV6kgLRkng6nGUm/rIjIGXB+cRmH+OXFOXAmEcC0xDbh3Lm6vr5yzsG0xQoCcC1icuPcXlzcOjeYItdP22yKtNi5fKEoUizkc7akSWWvMeTJRcnxg79QupAnBsF0thwoG1KIUakQK4jxMGbTQSAMUHVqda3rPqcKL7snN43SdVPr5nWpccMTWu1Ot9ftD4YGzSbGcNB/GDujFmOtJ92pns1m81Zr/lD0tDvResxiCS4nzmqtH6xXJB0XLBcAMZUENvrBBkiqGACehIoD21lvt+vNtkBcJXzATdQFbPXaAGOtt4BL3fBipbeZPRwyW73iHUvdxTbAsOnqJe+OeodYYAk7feRdq4IpfvCLSaXFJ2nJQU7S/Oce2SQsFHaTZ54AAAAASUVORK5CYII=' },
        { id: 'def-4', title: 'SITEMAN', url: 'https://siteman.tubankab.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAABXFBMVEVHcEwAAAkaEhYVCwslFiBkEyQ6JyEAAAC2bgvwggvqgwjyhwf6iQv6iADvG1zGcAfxfgzxghDrgw3ygQj2iw7NjSUAAADvhA3wgQjtfwjzgQOgQjHlfxHHcQzpgRLsgRHrgQ+wZwP3jA33jRPogA4REBlNt9yH4v9Hs9koR1ZIvslHvMU+u8UviJUjbpgik+MeYZZGwspCucJBuso9tbxDs7QbcK0SjtwUkeMaYZJBucI9troncp+dZA0chNMViNQpks08t74mgcoggsghgdE+t7klcHEkfcYigMYkfcoef88gZ7Amf8dAvLw2ucY/jpklfsUle8VHsMk0lpMpe8lUwd24Dn2wEn4le8VGhptHtNueGVj0FpH9D5f7E5T5D5j8FJP0DYtow+v8EI78FI6+AFSvDDfsG4M5eqn3Fov/C5j/D4whgdT2EpH9DoPyEIX+EJPrFYftCIrXCo2OOQisAAAAdHRSTlMAAhMJGjAiBkJbGwSkbASNLzez8YEUDb0+i/kpd2Pc/+VRkuLJLRgDMS1ji3ZSQohbpPH83T2G7tx2tf8aZb/9BOZ446TKXLX/Y1ac11W/XfE4gpyR3Ehl/HvuHIPC5d21d5Bj/4c/GCM8/fATlNRSpDFZY0bUSTkAAAHkSURBVHgBfE6DEQRBEJw927aNd/6Zva0ut+EBBP+AMAwHIEgK/+KjGZYDnhVEToKPRloWFF7VdMN8TSIJtxAm247i6p7IvzX6bBAyLKsGUZykjzIkoaOoZnkusGxQxHpWAn27hFdVDcAZeRwnURLHtoNVTXu9RHX9MJYmI9tH5WhgpWmeF/hFLJer9abfSqgNtCgpXA7tDm1TA28FQRDu7R4abVgH1bNt27Zt//+k+27qdsLJhwxtdsc1gKzSaXQZnUo35i89nqcHrPD67HrmvSa/RWV2uQIqCU1pzgdDvrAWCQLU5JerIy5XJApO2lg8lEimrFokViu3WNQBVyAqUhl9KJ5OJr3h5BlkM4ZsJmN2mXMAOvLxULBQKLjPBSNLsZRTBlxOLdjq0/F4Oljww4QEAWkNpoCah4IkuhBFyyIq1pyrmLIKLKnWalUeuxOxfD0fS7DgdN2oNK1Mq93p9voDjvEXyul6PqwAEOeGxQIZdcc0up3JdCbRB4MJHkAyl0vdiz5Fet3lctWe0d7Xbgwgg4ULbrMabwe70b7X2xwE2OTnXnddii2Ox+ppcHwA0WeQwXi1OSw6G8RcY/LrhmbtVX9BDvu28PeGyWy0H5GL2W4q/HPPmOdo0xgh0PzB/37FG/iWVVFQ0slaAAAAAElFTkSuQmCC' },
        { id: 'def-5', title: 'RUMAH PENDIDIKAN', url: 'https://rumah.pendidikan.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAARVBMVEVHcEwjPH8lPIAlPIAmPIAmPIAmPIAzsec0suY0suYnOn8mPIA0suYzsuYzsec0suY0suYzsuYzseY0suY0suYhS40lO4DeEm79AAAAF3RSTlMADXqmyP/dTv+PI+3lSC/z1yB9wWwIP48BlLoAAACHSURBVHgBfcnFAcQwEASwCZvZ7r/TgzB59RXumrbrZx0e2mEzEjfnxA4cwymFhOJ62phrDrDGqZnVwDMtW5DpqQSRjspApScygkhPZEA9OeoZQKT1RDJFJUuVZH+qkmm2ZZ9XKAOidTP1EzBIdONq6JDDQWPI7dBucCPKUFAjhhZVQ4e6630BVPkQ8cT5RlYAAAAASUVORK5CYII=' },
        { id: 'def-6', title: 'Info GTK', url: 'https://info.gtk.kemdikbud.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAPFBMVEVHcExWPXxWPXxWPXxWPXxWPXxOMndEInBJKnRTOXqhlrP////08/bOyNd+bpmvpr6onrhlT4Y6Emvj3+hDnPvOAAAABnRSTlMAZNP7/72pkG4ZAAAAp0lEQVR4AX2TxQHAIAwAUwiupfvv2tQFue8hUQCYGMcKziYgBHYQdA+7TMD6kgHvSw54INWFNrc9pbTuxIeou5JIupbB5pxTIDubSiYliULWylpKJGRqS20IFdrPGiQyfa770aYySmWRtcxFExjud+toTfHOqY5EvVzhdm6axp+KkPSnV5V8iL+b+VFL/KViYj6wdlYGL8lPKy9uhXw8YKPRHA/1aB1WHmASpA8/vQcAAAAASUVORK5CYII=' },
        { id: 'def-7', title: 'Pengelola Kinerja', url: 'https://guru.kemendikdasmen.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAuElEQVR4AWNg7bxRwNZ+8z8tMHv7rf0c7dcVGPCChvsCrO03JtDKEWwdN9+ztt9KYCAE2NsgIUE7fLueoCNAwcXefvM+DR1yH2QHQUcAg209LR3B1nYzgGBosLVfbxjwKGHtumVA4yhpgNlFKFocaIEFgDmQKAdE7fpiELH9swO1MchcgpZHbH+vELrt039a4cHvgFEHjDpg1AGjDhh1wKgDRh0w6oBRB4w6IGD9ewGgwve0ccDH+wAciFQ6gvI/cAAAAABJRU5ErkJggg==' },
        { id: 'def-8', title: 'SIMPKB', url: 'https://paspor-gtk.simpkb.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAkFBMVEVHcEwAkt8Akt4Akt4Akt4Ak+AAkt4AlOUAluYEjdoNbKgKfMEWZJQFiNEAkt8Akt8Ak98PdbMYUXEFgssAkt8Akt+Hn7cAkOJulLfBvr3///+1tLRci7TPzczs6efa19X39/bx8O/KxsOcq7zg3uBfZ3I3eapJhbShnZqvqqaxu8WFipK5t3O/ugXq5QAAkt5cETZeAAAAMHRSTlMAXbXujP///////f79/2obyv38/tel/f/9/f/9/f3//v///f3++/39/P39/f39/zX42/aTAAACN0lEQVR4AXWTh3qrMAyFyZDklQkNsYhxMGSPvv/bXRtud/uztThwPmdfGI0nk/Eo+4spAJJAgumv6RFIpdEYqWYE8x/pxVLq1XqllTLGrPNZsfjWTnnM5TMQQsiZUUbgFykvtFqvcwDSm40mEKvVWuPLR34JWhgBZb61zNUuL4mUNmL5kc8NEmjnar9n19ig45DciOL/fJBGSoS85eCbvXfc5oCk1AzGKT8HqU2MIKzYdnXjLa8AI2o9S5+7QDJK9JFZZ2vv4ymVI8xMLFxkY0QC7Cmt46piZ0tMiBUhLrNJqp1BX7DhvfMNb4aCIZoViHQQmIAjJw18gmHCgRAn2RLh1JYxC0SKm/OlZkUEkAbuAIvsBctrS0B6d9uVNlwuIch4q2NoE8WMsylSaE6ntmbXzW5NVTU36R3X7enUBMJpNkraepzX3t7vNl4cJ5LaebaI2qzliPWqqh/Pzio3PNsj4GuWIeiaE5bPfH8+7vFiOVFrwGQVipvtmPdp7uP5fMSLjy3d5UxYJC8QTu8F9+fznuQ0sag6QdSYzMCy2sdof+o6Trfx2AeJ0YpIgZCfrWcOtokH723oX5Cn35QYIdKJI741V+eu5tpP2RHGj+zpndvu1LG9bg6HzbU9qt02WYnZwBQRgU6+dsE754Or/YkAMUkcwIiMJlStjbRVCJfB6jdGyeqwzaksV6uypHzrjpAUvPOCMCshNQ0nLCWmdfHB6xjwK+PXH6tzPh0XE8RJMZ7OP7L/ACZmO0lgThaBAAAAAElFTkSuQmCC' },
        { id: 'def-9', title: 'SRIKANDI', url: 'https://srikandi.anri.go.id/', icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAA81BMVEX////x6ND+//727dj9+/jnzonz7Nvz58vv5c7w37L69engvljbtWDXqi/p0qHgw27fwWf8+fLq2bzUrEXXuXbhxn3fv17n0JXauV3Zrj/byJbOp0bYsk/JdkXNTiXRfFzOy6XbtVTUslbo0pmsVjqLABbCXWFMmnBsonzv4Lq6TjZqMDdXOyVpamfNx8LMqFSmpZl4cTyDOyTRRC3NokzcwoW1v4daXFe2MwbOXyPdsZ7hz6br7vLRrF/Bw8DCt5XGtYjP0NLMuH/TxZv37e3iv7/16enlx8fx4dfp0Mjs1dbWo6PPjo7He3vSmprYqKi/ampj4AzaAAABDklEQVR4AWIYQAAgexiQGAaCtWPbtv3/bzU3KC5rY3/42sfTf+50BvJyvQF13/8nH8/9mnshKCjE7v/J6xO/EzuSoneHK8NyUJLlBfYhUtKFE2T8DN3D8rKgqJquG5SJW9BOFpco23E936R4NoBeORumFEZxkmYSzz+g5AM3TDovyqo2DKgRZK2Gabt+aM7XTe6wvpkxo1pPwIZgnnfXQFyWKwrMTZakCYyn9pMIcjBc0rfs7KUc9Bw5mLDGjLWTs7OpILoooDnxNkAYAGIgqWIQL/I5iv2ngcqsYDWS7ljUhFXfHs7JLPbSU1br9KI3p+0AGqhT6vYMMCPzAQ6s7F/mprFlKvg3oFuctyvmC9DAKAa8spscAAAAAElFTkSuQmCC' },
      ];
    }
    return data;
  },
  saveEmploymentLink: async (link: any): Promise<void> => {
    if (link.id && !link.id.startsWith('def-')) {
      await supabase.from('employment_links').update({ title: link.title, url: link.url, icon: link.icon }).eq('id', link.id);
    } else {
      await supabase.from('employment_links').insert([{ title: link.title, url: link.url, icon: link.icon }]);
    }
  },
  deleteEmploymentLink: async (id: string): Promise<void> => {
    if (id.startsWith('def-')) return;
    await supabase.from('employment_links').delete().eq('id', id);
  },

  // --- Inventory ---
  getInventory: async (classId: string): Promise<InventoryItem[]> => {
    if (!isApiConfigured()) {
      const cached = cacheService.get<InventoryItem[]>('inventory') || [];
      if (classId === 'ALL') return cached;
      return cached.filter(i => String(i.classId).trim().toLowerCase() === String(classId).trim().toLowerCase());
    }
    try {
      const query = supabase.from('inventory').select('*');
      if (classId !== 'ALL') query.eq('class_id', classId);
      const { data, error } = await query;
      if (error) {
        const cached = cacheService.get<InventoryItem[]>('inventory') || [];
        if (classId === 'ALL') return cached;
        return cached.filter(i => String(i.classId).trim().toLowerCase() === String(classId).trim().toLowerCase());
      }
      return data.map((i: any) => ({ ...i, classId: i.class_id }));
    } catch (err) {
      console.warn("getInventory failed, using local fallback:", err);
      const cached = cacheService.get<InventoryItem[]>('inventory') || [];
      if (classId === 'ALL') return cached;
      return cached.filter(i => String(i.classId).trim().toLowerCase() === String(classId).trim().toLowerCase());
    }
  },
  saveInventory: async (item: InventoryItem): Promise<void> => {
    try {
      const cached = cacheService.get<InventoryItem[]>('inventory') || [];
      const index = cached.findIndex(i => i.id === item.id);
      if (index !== -1) {
        cached[index] = item;
      } else {
        cached.push(item);
      }
      cacheService.set('inventory', cached);
    } catch (e) {
      console.warn("Failed to write inventory to cache:", e);
    }

    if (!isApiConfigured()) return;

    try {
      const dbItem = { id: item.id, class_id: item.classId, name: item.name, condition: item.condition, qty: item.qty };
      const { data: existing } = await supabase.from('inventory').select('id').eq('id', item.id).single();
      
      if (existing) {
        await supabase.from('inventory').update({ ...dbItem, id: undefined }).eq('id', item.id);
      } else {
        await supabase.from('inventory').insert([dbItem]);
      }
    } catch (err) {
      console.warn("saveInventory database failed:", err);
    }
  },
  deleteInventory: async (id: string, classId: string): Promise<any> => {
    try {
      const cached = cacheService.get<InventoryItem[]>('inventory') || [];
      const filtered = cached.filter(i => i.id !== id);
      cacheService.set('inventory', filtered);
    } catch (e) {}

    if (!isApiConfigured()) return { status: 'success' };

    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      return { status: 'success' };
    } catch (err: any) {
      console.warn("deleteInventory database failed:", err);
      return { status: 'error', message: err.message };
    }
  },

  // --- Guests ---
  getGuests: async (classId: string): Promise<Guest[]> => {
    if (!isApiConfigured()) {
      const cached = cacheService.get<Guest[]>('guests') || [];
      return cached.filter(g => String(g.classId).trim().toLowerCase() === String(classId).trim().toLowerCase());
    }
    try {
      const { data, error } = await supabase.from('guests').select('*').eq('class_id', classId);
      if (error) {
        const cached = cacheService.get<Guest[]>('guests') || [];
        return cached.filter(g => String(g.classId).trim().toLowerCase() === String(classId).trim().toLowerCase());
      }
      return data.map((g: any) => ({ ...g, classId: g.class_id }));
    } catch (err) {
      console.warn("getGuests failed, using local fallback:", err);
      const cached = cacheService.get<Guest[]>('guests') || [];
      return cached.filter(g => String(g.classId).trim().toLowerCase() === String(classId).trim().toLowerCase());
    }
  },
  saveGuest: async (guest: Guest): Promise<void> => {
    try {
      const cached = cacheService.get<Guest[]>('guests') || [];
      const index = cached.findIndex(g => g.id === guest.id);
      if (index !== -1) {
        cached[index] = guest;
      } else {
        cached.push(guest);
      }
      cacheService.set('guests', cached);
    } catch (e) {
      console.warn("Failed to write guest to cache:", e);
    }

    if (!isApiConfigured()) return;

    try {
      const dbGuest = { id: guest.id, class_id: guest.classId, date: guest.date, time: guest.time, name: guest.name, agency: guest.agency, purpose: guest.purpose };
      const { data: existing } = await supabase.from('guests').select('id').eq('id', guest.id).single();
      
      if (existing) {
        await supabase.from('guests').update({ ...dbGuest, id: undefined }).eq('id', guest.id);
      } else {
        await supabase.from('guests').insert([dbGuest]);
      }
    } catch (err) {
      console.warn("saveGuest database failed:", err);
    }
  },
  deleteGuest: async (id: string, classId: string): Promise<any> => {
    try {
      const cached = cacheService.get<Guest[]>('guests') || [];
      const filtered = cached.filter(g => g.id !== id);
      cacheService.set('guests', filtered);
    } catch (e) {}

    if (!isApiConfigured()) return { status: 'success' };

    try {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) throw error;
      return { status: 'success' };
    } catch (err: any) {
      console.warn("deleteGuest database failed:", err);
      return { status: 'error', message: err.message };
    }
  },

  // --- GTK Data ---
  getGtkData: async (): Promise<GtkRecord[]> => {
    const { data, error } = await supabase.from('gtk_data').select('*');
    if (error || !data || data.length === 0) {
      // Fallback: Check if old data exists in class_config
      const { data: oldData } = await supabase.from('class_config').select('data').eq('class_id', 'global_gtk_data').single();
      if (oldData && oldData.data?.records && Array.isArray(oldData.data.records)) {
        return oldData.data.records as GtkRecord[];
      }
      return [];
    }
    return data.map((g: any) => ({
      id: g.id,
      userId: g.user_id,
      nama: g.nama,
      nip: g.nip || '',
      nuptk: g.nuptk || '',
      jenisKelamin: g.jenis_kelamin || '',
      tempatLahir: g.tempat_lahir || '',
      tanggalLahir: g.tanggal_lahir || '',
      ijazahTertinggi: g.ijazah_tertinggi || '',
      jabatan: g.jabatan || '',
      statusPegawai: g.status_pegawai || '',
      tmtPengangkatan: g.tmt_pengangkatan || '',
      mulaiBekerjaDiSini: g.mulai_bekerja_disini || '',
      pangkatGolongan: g.pangkat_golongan || '',
      masaKerjaTahun: g.masa_kerja_tahun || 0,
      masaKerjaBulan: g.masa_kerja_bulan || 0,
      skTerakhir: g.sk_terakhir || '',
      emailPribadi: g.email_pribadi || '',
      emailBelajar: g.email_belajar || '',
      foto: g.foto || ''
    }));
  },
  saveGtkData: async (records: GtkRecord[]): Promise<void> => {
    const dbRecords = records.map(r => ({
      id: r.id,
      user_id: r.userId || null,
      nama: r.nama,
      nip: r.nip,
      nuptk: r.nuptk,
      jenis_kelamin: r.jenisKelamin,
      tempat_lahir: r.tempatLahir,
      tanggal_lahir: r.tanggalLahir || null,
      ijazah_tertinggi: r.ijazahTertinggi,
      jabatan: r.jabatan,
      status_pegawai: r.statusPegawai,
      tmt_pengangkatan: r.tmtPengangkatan || null,
      mulai_bekerja_disini: r.mulaiBekerjaDiSini || null,
      pangkat_golongan: r.pangkatGolongan,
      masa_kerja_tahun: r.masaKerjaTahun,
      masa_kerja_bulan: r.masaKerjaBulan,
      sk_terakhir: r.skTerakhir,
      email_pribadi: r.emailPribadi,
      email_belajar: r.emailBelajar,
      foto: r.foto,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('gtk_data').upsert(dbRecords, { onConflict: 'id' });
    if (error) {
      console.error("Error saving GTK data:", error);
      throw error;
    }
  },
  deleteGtkData: async (id: string): Promise<void> => {
    const { error } = await supabase.from('gtk_data').delete().eq('id', id);
    if (error) {
      console.error("Error deleting GTK data:", error);
      throw error;
    }
  },

  // --- Class Config (Schedule, Piket, Seating, KKTP) ---
  getClassConfig: async (classId: string): Promise<{
      schedule: ScheduleItem[], 
      piket: PiketGroup[], 
      seats: SeatingLayouts, 
      kktp?: Record<string, number>, 
      academicCalendar?: AcademicCalendarData, 
      timeSlots?: string[], 
      organization?: OrganizationStructure,
      settings?: { 
          showStudentRecap?: boolean; 
          showSummativeToStudents?: boolean;
          recapPrintDate?: string;
          recapPrintPlace?: string;
      },
      dpl_indicators?: string[]
  }> => {
     const defaultConfig = {schedule: [], piket: [], seats: { classical: [], groups: [], ushape: [] }, academicCalendar: {}, timeSlots: [], organization: { roles: {}, sections: [] }, settings: {} };
     if (!classId) return defaultConfig;
     
     if (!isApiConfigured()) {
       const cached = cacheService.get<any>(`class_config_${classId}`);
       return cached ? { ...defaultConfig, ...cached } : defaultConfig;
     }
     
     try {
       const { data, error } = await supabase.from('class_config').select('data').eq('class_id', classId).single();
       if (error || !data) {
         const cached = cacheService.get<any>(`class_config_${classId}`);
         return cached ? { ...defaultConfig, ...cached } : defaultConfig;
       }
       return { ...defaultConfig, ...data.data };
     } catch (err) {
       console.warn("getClassConfig failed, using local fallback:", err);
       const cached = cacheService.get<any>(`class_config_${classId}`);
       return cached ? { ...defaultConfig, ...cached } : defaultConfig;
     }
  },
  saveClassConfig: async (key: string, data: any, classId: string): Promise<void> => {
     try {
       const cached = cacheService.get<any>(`class_config_${classId}`) || {};
       cached[key] = data;
       cacheService.set(`class_config_${classId}`, cached);
     } catch (e) {
       console.warn("Failed to write class config to local cache:", e);
     }

     if (!isApiConfigured()) return;
     
     try {
       const { data: existing } = await supabase.from('class_config').select('data').eq('class_id', classId).single();
       const currentData = existing?.data || {};
       currentData[key] = data;
       const { error } = await supabase.from('class_config').upsert({ class_id: classId, data: currentData }, { onConflict: 'class_id' });
       if (error) {
         throw error;
       }
     } catch (err) {
       console.warn("saveClassConfig database write failed:", err);
     }
  },

  // --- Learning Reports ---
  getLearningReports: async (classId: string): Promise<LearningReport[]> => {
    const { data, error } = await supabase.from('learning_reports').select('*');
    if (error) return [];
    
    const mapped = data.map((r: any) => ({ 
      ...r, 
      classId: r.class_id, 
      documentLink: r.document_link, 
      teacherName: r.teacher_name 
    }));

    if (!classId) return mapped;

    return mapped.filter((r: any) => {
      const s1 = String(r.classId || '').trim().toLowerCase();
      const s2 = String(classId || '').trim().toLowerCase();
      return s1 === s2 || s1 === '' || s1 === 'undefined' || s1 === 'null';
    });
  },
  saveLearningReport: async (report: any): Promise<void> => {
    console.log("Saving report:", report);
    const dbReport = {
      class_id: report.classId,
      date: report.date,
      type: report.type,
      subject: report.subject,
      topic: report.topic,
      document_link: report.documentLink,
      teacher_name: report.teacherName
    };
    console.log("dbReport:", dbReport);
    if (report.id && !report.id.startsWith('report-') && !report.id.startsWith('jurnal-')) {
      const { error } = await supabase.from('learning_reports').update(dbReport).eq('id', report.id);
      if (error) {
        console.error("Update error:", error);
        throw error;
      }
    } else if (report.id && report.id.startsWith('jurnal-')) {
      const { data: existing, error: fetchError } = await supabase
        .from('learning_reports')
        .select('id')
        .eq('class_id', report.classId)
        .eq('date', report.date)
        .eq('type', 'Jurnal Harian')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Fetch existing report error:", fetchError);
      }

      if (existing) {
        const { error } = await supabase.from('learning_reports').update(dbReport).eq('id', existing.id);
        if (error) {
          console.error("Update journal report error:", error);
          throw error;
        }
      } else {
        const { error } = await supabase.from('learning_reports').insert([dbReport]);
        if (error) {
          console.error("Insert journal report error:", error);
          throw error;
        }
      }
    } else {
      const { error } = await supabase.from('learning_reports').insert([dbReport]);
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
    }
  },
  deleteLearningReport: async (id: string, classId: string): Promise<void> => {
    const { error } = await supabase.from('learning_reports').delete().eq('id', id);
    if (error) {
      console.error("Delete error:", error);
      throw error;
    }
  },

  // --- Learning Journal ---
  getLearningJournal: async (classId: string): Promise<LearningJournalEntry[]> => {
    const { data, error } = await supabase.from('jurnal_kelas').select('*').eq('class_id', classId);
    if (error) return [];
    
    const entries: LearningJournalEntry[] = [];
    data.forEach((row: any) => {
        if (Array.isArray(row.content)) {
            row.content.forEach((item: any) => {
                entries.push({
                    ...item,
                    classId: row.class_id,
                    date: row.date,
                    day: row.day
                });
            });
        }
    });
    return entries;
  },
  getLearningJournalAll: async (): Promise<LearningJournalEntry[]> => {
    const { data, error } = await supabase.from('jurnal_kelas').select('*');
    if (error) return [];
    
    const entries: LearningJournalEntry[] = [];
    data.forEach((row: any) => {
        if (Array.isArray(row.content)) {
            row.content.forEach((item: any) => {
                entries.push({
                    ...item,
                    classId: row.class_id,
                    date: row.date,
                    day: row.day
                });
            });
        }
    });
    return entries;
  },
  saveLearningJournalBatch: async (entries: any[]): Promise<void> => {
    // Group entries by date
    const entriesByDate: Record<string, any[]> = {};
    entries.forEach(e => {
        if (!entriesByDate[e.date]) {
            entriesByDate[e.date] = [];
        }
        entriesByDate[e.date].push(e);
    });

    const dbRows = Object.keys(entriesByDate).map(date => {
        const dateEntries = entriesByDate[date];
        const firstEntry = dateEntries[0];
        
        const content = dateEntries.map(e => ({
            id: (e.id && !e.id.startsWith('temp-') && !e.id.startsWith('manual-')) ? e.id : crypto.randomUUID(),
            timeSlot: e.timeSlot,
            subject: e.subject,
            topic: e.topic,
            activities: e.activities,
            evaluation: e.evaluation,
            reflection: e.reflection,
            followUp: e.followUp,
            model: e.model,
            pendekatan: e.pendekatan,
            metode: e.metode,
            isTeacherPresent: e.isTeacherPresent,
            teacherName: e.teacherName,
            supervisionFeedback: e.supervisionFeedback,
            supervisorName: e.supervisorName,
            feedbackRead: e.feedbackRead
        }));

        return {
            class_id: firstEntry.classId,
            date: date,
            day: firstEntry.day,
            content: content
        };
    });

    const { error } = await supabase.from('jurnal_kelas').upsert(dbRows, { onConflict: 'class_id, date' });
    if (error) throw error;
  },
  deleteLearningJournal: async (id: string, classId: string): Promise<void> => {
    // Find the row containing the entry
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .select('*')
      .eq('class_id', classId)
      .filter('content', 'cs', `[{"id": "${id}"}]`);
    
    if (error || !data || data.length === 0) return;

    const row = data[0];
    const newContent = row.content.filter((entry: any) => entry.id !== id);

    await supabase
      .from('jurnal_kelas')
      .update({ content: newContent })
      .eq('id', row.id);
  },

  getAllLearningJournals: async (): Promise<LearningJournalEntry[]> => {
    const { data, error } = await supabase.from('jurnal_kelas').select('*');
    if (error) return [];
    
    const entries: LearningJournalEntry[] = [];
    data.forEach((row: any) => {
        if (Array.isArray(row.content)) {
            row.content.forEach((item: any) => {
                entries.push({
                    ...item,
                    classId: row.class_id,
                    date: row.date,
                    day: row.day
                });
            });
        }
    });
    return entries;
  },

  markJournalFeedbackAsRead: async (entryId: string, classId: string): Promise<void> => {
    const { data, error } = await supabase
      .from('jurnal_kelas')
      .select('*')
      .eq('class_id', classId)
      .filter('content', 'cs', `[{"id": "${entryId}"}]`);
    
    if (error || !data || data.length === 0) return;

    const row = data[0];
    const newContent = row.content.map((entry: any) => {
        if (entry.id === entryId) {
            return { ...entry, feedbackRead: true };
        }
        return entry;
    });

    await supabase
      .from('jurnal_kelas')
      .update({ content: newContent })
      .eq('id', row.id);
  },

  // --- Learning Documentation ---
  getLearningDocumentation: async (classId: string): Promise<LearningDocumentation[]> => {
    const { data, error } = await supabase.from('learning_documentation').select('*').eq('class_id', classId);
    if (error) return [];
    return data.map((d: any) => ({ ...d, classId: d.class_id, namaKegiatan: d.nama_kegiatan, linkFoto: d.link_foto }));
  },
  saveLearningDocumentation: async (doc: any): Promise<void> => {
    const dbDoc = { class_id: doc.classId, nama_kegiatan: doc.namaKegiatan, link_foto: doc.linkFoto };
    if (doc.id) {
      await supabase.from('learning_documentation').update(dbDoc).eq('id', doc.id);
    } else {
      await supabase.from('learning_documentation').insert([dbDoc]);
    }
  },
  deleteLearningDocumentation: async (id: string, classId: string): Promise<void> => {
    await supabase.from('learning_documentation').delete().eq('id', id);
  },

  // --- Liaison Logs ---
  getLiaisonLogs: async (currentUser: User | null): Promise<LiaisonLog[]> => {
    const { data, error } = await supabase.from('buku_penghubung').select('*');
    if (error) return [];
    return data.map((l: any) => ({ ...l, classId: l.class_id, studentId: l.student_id }));
  },
  saveLiaisonLog: async (log: any): Promise<void> => {
    await supabase.from('buku_penghubung').insert([{
      class_id: log.classId,
      student_id: log.studentId,
      date: log.date,
      sender: log.sender,
      message: log.message,
      status: log.status,
      category: log.category,
      response: log.response
    }]);
  },
  updateLiaisonStatus: async (ids: string[], status: string): Promise<void> => {
    await supabase.from('buku_penghubung').update({ status }).in('id', ids);
  },
  replyLiaisonLog: async (id: string, response: string): Promise<void> => {
    await supabase.from('buku_penghubung').update({ response, status: 'Diterima' }).eq('id', id);
  },

  // --- Permission Requests ---
  getPermissionRequests: async (currentUser: User | null): Promise<PermissionRequest[]> => {
    const { data, error } = await supabase.from('permission_requests').select('*');
    if (error) return [];
    return data.map((p: any) => ({ ...p, classId: p.class_id, studentId: p.student_id }));
  },
  savePermissionRequest: async (request: any): Promise<void> => {
    await supabase.from('permission_requests').insert([{
      class_id: request.classId,
      student_id: request.studentId,
      date: request.date,
      type: request.type,
      reason: request.reason,
      status: 'Pending'
    }]);
  },
  processPermissionRequest: async (id: string, actionStatus: string): Promise<void> => {
    const newStatus = actionStatus === 'approve' ? 'Approved' : 'Rejected';
    
    // 1. Get request details
    const { data: request, error: fetchError } = await supabase
        .from('permission_requests')
        .select('*')
        .eq('id', id)
        .single();
    
    if (fetchError || !request) throw fetchError || new Error('Request not found');

    // 2. Update status
    await supabase.from('permission_requests').update({ status: newStatus }).eq('id', id);

    // 3. If approved, add to attendance
    if (actionStatus === 'approve') {
        const attendanceId = `${request.class_id}_${request.date}`;
        
        // Get existing attendance
        const { data: attendance, error: attError } = await supabase
            .from('attendance')
            .select('*')
            .eq('id', attendanceId)
            .single();
        
        const newRecord = {
            studentId: request.student_id,
            status: request.type, // Maps to attendance status ('sick', 'permit', 'dispensation')
            notes: request.reason
        };

        if (attendance) {
            // Update existing - filter out old record for this student to avoid duplicates
            const otherRecords = (attendance.records || []).filter((r: any) => r.studentId !== request.student_id);
            const records = [...otherRecords, newRecord];
            await supabase.from('attendance').update({ records }).eq('id', attendanceId);
        } else {
            // Create new
            await supabase.from('attendance').insert([{
                id: attendanceId,
                records: [newRecord]
            }]);
        }
    } else if (actionStatus === 'reject') {
        // If rejected, ensure it's NOT in attendance (remove if exists)
        const attendanceId = `${request.class_id}_${request.date}`;
        const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('id', attendanceId)
            .single();
        
        if (attendance && attendance.records) {
            const filteredRecords = attendance.records.filter((r: any) => r.studentId !== request.student_id);
            if (filteredRecords.length !== attendance.records.length) {
                await supabase.from('attendance').update({ records: filteredRecords }).eq('id', attendanceId);
            }
        }
    }
  },

  // --- Support Documents ---
  getSupportDocuments: async (currentUser: User | null): Promise<SupportDocument[]> => {
    const { data, error } = await supabase.from('support_documents').select('*');
    if (error) return [];
    return data.map((d: any) => ({ ...d, classId: d.class_id }));
  },
  saveSupportDocument: async (doc: any): Promise<void> => {
    const dbDoc = { class_id: doc.classId, name: doc.name, url: doc.url };
    if (doc.id) {
      await supabase.from('support_documents').update(dbDoc).eq('id', doc.id);
    } else {
      await supabase.from('support_documents').insert([dbDoc]);
    }
  },
  deleteSupportDocument: async (id: string, classId: string): Promise<void> => {
    await supabase.from('support_documents').delete().eq('id', id);
  },

  // --- School Assets (Sarana Prasarana) ---
  getSchoolAssets: async (): Promise<SchoolAsset[]> => {
    const { data, error } = await supabase.from('school_assets').select('*');
    if (error) return [];
    return data;
  },
  saveSchoolAsset: async (asset: SchoolAsset): Promise<void> => {
    const dbAsset = {
      id: asset.id,
      name: asset.name,
      qty: asset.qty,
      condition: asset.condition,
      location: asset.location
    };
    
    const { data: existing } = await supabase.from('school_assets').select('id').eq('id', asset.id).single();

    if (existing) {
      await supabase.from('school_assets').update({ ...dbAsset, id: undefined }).eq('id', asset.id);
    } else {
      await supabase.from('school_assets').insert([dbAsset]);
    }
  },
  deleteSchoolAsset: async (id: string): Promise<void> => {
    await supabase.from('school_assets').delete().eq('id', id);
  },

  // --- Academic Calendar ---
  getAcademicCalendar: async (id: string = 'global'): Promise<AcademicCalendarData> => {
    if (!isApiConfigured()) {
      const cached = cacheService.get<AcademicCalendarData>(`academic_calendar_${id}`);
      return cached || {};
    }
    try {
      const { data, error } = await supabase
        .from('academic_calendar')
        .select('data')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.warn('Error fetching academic calendar:', error);
        }
        const cached = cacheService.get<AcademicCalendarData>(`academic_calendar_${id}`);
        return cached || {};
      }
      if (!data) return {};
      return data.data as AcademicCalendarData;
    } catch (err) {
      console.warn("getAcademicCalendar failed, using local fallback:", err);
      const cached = cacheService.get<AcademicCalendarData>(`academic_calendar_${id}`);
      return cached || {};
    }
  },
  saveAcademicCalendar: async (data: AcademicCalendarData, id: string = 'global'): Promise<void> => {
    try {
      cacheService.set(`academic_calendar_${id}`, data);
    } catch (e) {
      console.warn("Failed to save academic calendar to cache:", e);
    }

    if (!isApiConfigured()) return;

    try {
      const { error } = await supabase
        .from('academic_calendar')
        .upsert({ id, data, updated_at: new Date().toISOString() });
      if (error) {
        console.error('Error saving academic calendar:', error);
        throw error;
      }
    } catch (err) {
      console.warn("saveAcademicCalendar database failed:", err);
    }
  },

  // --- Schedule ---
  getSchedule: async (classId: string): Promise<ScheduleItem[]> => {
    if (!isApiConfigured()) {
      const cached = cacheService.get<ScheduleItem[]>(`schedule_${classId}`);
      return cached || [];
    }
    try {
      const { data, error } = await supabase.from('schedule').select('*').eq('class_id', classId);
      if (error) {
        console.error('Error fetching schedule:', error);
        const cached = cacheService.get<ScheduleItem[]>(`schedule_${classId}`);
        return cached || [];
      }
      return data.map((s: any) => ({ id: s.id, day: s.day, time: s.time, subject: s.subject }));
    } catch (err) {
      console.warn("getSchedule failed, using local fallback:", err);
      const cached = cacheService.get<ScheduleItem[]>(`schedule_${classId}`);
      return cached || [];
    }
  },
  getScheduleAll: async (): Promise<(ScheduleItem & { classId: string })[]> => {
    if (!isApiConfigured()) {
      const allSchedules: (ScheduleItem & { classId: string })[] = [];
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith('schedule_')) {
            const classId = k.replace('schedule_', '');
            const items = cacheService.get<ScheduleItem[]>(k);
            if (items && Array.isArray(items)) {
              items.forEach(item => {
                allSchedules.push({ ...item, classId });
              });
            }
          }
        });
      } catch (e) {}
      return allSchedules;
    }
    try {
      const { data, error } = await supabase.from('schedule').select('*');
      if (error) {
        console.error('Error fetching all schedules:', error);
        return [];
      }
      return data.map((s: any) => ({ id: s.id, day: s.day, time: s.time, subject: s.subject, classId: s.class_id }));
    } catch (err) {
      console.warn("getScheduleAll failed:", err);
      return [];
    }
  },
  saveSchedule: async (classId: string, schedule: ScheduleItem[]): Promise<void> => {
    try {
      cacheService.set(`schedule_${classId}`, schedule);
    } catch (e) {
      console.warn("Failed to save schedule to cache:", e);
    }

    if (!isApiConfigured()) return;

    try {
      // First, delete existing schedule for this class
      const { error: deleteError } = await supabase.from('schedule').delete().eq('class_id', classId);
      if (deleteError) {
        console.error('Error deleting old schedule:', deleteError);
        throw deleteError;
      }

      if (schedule.length === 0) return;

      // Then insert new schedule
      const dbSchedule = schedule.map(s => ({
        class_id: classId,
        day: s.day,
        time: s.time,
        subject: s.subject
      }));

      const { error: insertError } = await supabase.from('schedule').insert(dbSchedule);
      if (insertError) {
        console.error('Error saving schedule:', insertError);
        throw insertError;
      }
    } catch (err) {
      console.warn("saveSchedule database failed:", err);
    }
  },

  // --- Book Loans ---
  getBookLoans: async (currentUser: User | null): Promise<BookLoan[]> => {
    const { data, error } = await supabase.from('book_loans').select('*');
    if (error) return [];
    return data.map((l: any) => ({ ...l, classId: l.class_id, studentId: l.student_id, studentName: l.student_name }));
  },
  saveBookLoan: async (loan: BookLoan): Promise<void> => {
    const dbLoan = {
      id: loan.id,
      student_id: loan.studentId,
      student_name: loan.studentName,
      class_id: loan.classId,
      books: loan.books,
      qty: loan.qty,
      status: loan.status,
      date: loan.date,
      notes: loan.notes
    };
    
    const { data: existing } = await supabase.from('book_loans').select('id').eq('id', loan.id).single();

    if (existing) {
      await supabase.from('book_loans').update({ ...dbLoan, id: undefined }).eq('id', loan.id);
    } else {
      await supabase.from('book_loans').insert([dbLoan]);
    }
  },
  deleteBookLoan: async (id: string): Promise<void> => {
    await supabase.from('book_loans').delete().eq('id', id);
  },

  // --- Book Inventory ---
  getBookInventory: async (classId: string): Promise<BookInventory[]> => {
    const { data, error } = await supabase.from('book_inventory').select('*').eq('class_id', classId);
    if (error) return [];
    return data.map((b: any) => ({
      ...b,
      classId: b.class_id,
      subjectId: b.subject_id,
      totalStock: Number(b.total_stock),
      coverUrl: b.cover_url,
      digitalUrl: b.digital_url
    }));
  },
  saveBookInventory: async (inventory: BookInventory[]): Promise<void> => {
    const dbInventory = inventory.map(b => ({
      id: b.id,
      class_id: b.classId,
      subject_id: b.subjectId,
      name: b.name,
      stock: b.stock,
      total_stock: b.totalStock,
      cover_url: b.coverUrl,
      digital_url: b.digitalUrl
    }));
    await supabase.from('book_inventory').upsert(dbInventory);
  },
  uploadBookCover: async (bookId: string, coverUrl: string): Promise<void> => {
    await supabase.from('book_inventory').update({ cover_url: coverUrl }).eq('id', bookId);
  },

  // --- BOS Management ---
  getBOS: async (): Promise<BOSTransaction[]> => {
    const { data, error } = await supabase.from('bos_management').select('*');
    if (error) return [];
    return data;
  },
  saveBOS: async (transaction: BOSTransaction): Promise<void> => {
    const dbTransaction = {
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount
    };

    const { data: existing } = await supabase.from('bos_management').select('id').eq('id', transaction.id).single();

    if (existing) {
      await supabase.from('bos_management').update({ ...dbTransaction, id: undefined }).eq('id', transaction.id);
    } else {
      await supabase.from('bos_management').insert([dbTransaction]);
    }
  },
  deleteBOS: async (id: string): Promise<void> => {
    await supabase.from('bos_management').delete().eq('id', id);
  },

  // --- Performance Assessments ---
  getPerformanceAssessments: async (): Promise<PerformanceAssessment[]> => {
    const { data, error } = await supabase.from('performance_assessments').select('*');
    if (error) return [];
    return data.map((pa: any) => {
      const scoresObj = pa.scores || {};
      const academicYear = scoresObj.academicYear || '';
      const semester = scoresObj.semester || '';
      const isVisible = scoresObj.isVisible !== false; // default to true if undefined
      
      const numericScores: Record<number, number> = {};
      Object.keys(scoresObj).forEach(key => {
        if (key !== 'academicYear' && key !== 'semester' && key !== 'isVisible') {
          numericScores[Number(key)] = Number(scoresObj[key]);
        }
      });

      return {
        ...pa,
        teacherId: pa.teacher_id,
        teacherName: pa.teacher_name,
        supervisorId: pa.supervisor_id,
        supervisorName: pa.supervisor_name,
        totalScore: pa.total_score,
        createdAt: pa.created_at,
        scores: numericScores,
        academicYear,
        semester,
        isVisible
      };
    });
  },
  savePerformanceAssessment: async (assessment: PerformanceAssessment): Promise<void> => {
    const dbAssessment: any = {
      teacher_id: assessment.teacherId,
      teacher_name: assessment.teacherName,
      supervisor_id: assessment.supervisorId,
      supervisor_name: assessment.supervisorName,
      date: assessment.date,
      scores: {
        ...assessment.scores,
        academicYear: assessment.academicYear,
        semester: assessment.semester,
        isVisible: assessment.isVisible !== false
      },
      reflection: assessment.reflection,
      total_score: assessment.totalScore,
      percentage: assessment.percentage,
      category: assessment.category
    };

    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (assessment.id && isUuid(assessment.id)) {
      // It's an edit of an existing record
      const { error } = await supabase
        .from('performance_assessments')
        .update(dbAssessment)
        .eq('id', assessment.id);
      if (error) {
        console.error("Error updating performance assessment:", error);
        throw error;
      }
    } else {
      // It's a new record
      const { error } = await supabase.from('performance_assessments').insert([dbAssessment]);
      if (error) {
        console.error("Error saving performance assessment:", error);
        throw error;
      }
    }
  },

  // --- Backup/Restore ---
  backupData: async (): Promise<any> => {
    const tables = [
      'users', 'students', 'graduates', 'agendas', 'materials', 'grades', 
      'counseling', 'extracurriculars', 'profiles', 'holidays', 'attendance', 
      'penilaian_sikap', 'penilaian_karakter', 'employment_links', 'inventory', 
      'guests', 'class_config', 'sumatifs', 'sumatif_results', 'academic_calendar', 
      'schedule', 'book_inventory', 'book_loans', 'bos_management', 'school_assets', 
      'learning_documentation', 'support_documents', 'permission_requests', 
      'buku_penghubung', 'jurnal_kelas', 'learning_reports', 'learning_plans',
      'kokurikuler_plans', 'emergency_alerts', 'performance_assessments', 'gtk_data'
    ];

    const backup: any = {};
    
    // 1. Ambil data lokal dari localStorage (untuk backup offline / demo)
    if (typeof window !== 'undefined') {
      try {
        const localKeys = Object.keys(localStorage);
        const excludeKeys = ['CUSTOM_SUPABASE_URL', 'CUSTOM_SUPABASE_ANON_KEY', 'sagara_user', 'sb-'];
        const localCacheBackup: Record<string, any> = {};
        
        localKeys.forEach(key => {
          if (!excludeKeys.some(ek => key.includes(ek))) {
            try {
              const val = localStorage.getItem(key);
              if (val) {
                localCacheBackup[key] = JSON.parse(val);
              }
            } catch (e) {
              localCacheBackup[key] = localStorage.getItem(key);
            }
          }
        });
        backup['_local_cache'] = localCacheBackup;
      } catch (err) {
        console.warn("Failed to backup local storage:", err);
      }
    }

    // 2. Ambil data dari database Supabase jika terkoneksi
    try {
      const results = await Promise.all(tables.map(table => supabase.from(table).select('*')));
      
      results.forEach((res, index) => {
        if (!res.error) {
          backup[tables[index]] = res.data;
        } else {
          console.warn(`Warning: Table ${tables[index]} could not be backed up or does not exist.`);
        }
      });
      
      return backup;
    } catch (error) {
      console.error("Critical error during database backup:", error);
      // Jika database offline, tetap kembalikan data local cache yang berhasil dibackup
      if (backup['_local_cache']) {
        return backup;
      }
      throw error;
    }
  },
  restoreData: async (data: any): Promise<any> => {
    if (!data || (Object.keys(data).length === 0 && (!data._local_cache || Object.keys(data._local_cache).length === 0))) {
      return { status: 'error', message: 'Data backup tidak valid atau kosong.' };
    }

    try {
      const tables = [
        'users', 'students', 'graduates', 'agendas', 'materials', 'grades', 
        'counseling', 'extracurriculars', 'profiles', 'holidays', 'attendance', 
        'penilaian_sikap', 'penilaian_karakter', 'employment_links', 'inventory', 
        'guests', 'class_config', 'sumatifs', 'sumatif_results', 'academic_calendar', 
        'schedule', 'book_inventory', 'book_loans', 'bos_management', 'school_assets', 
        'learning_documentation', 'support_documents', 'permission_requests', 
        'buku_penghubung', 'jurnal_kelas', 'learning_reports', 'learning_plans',
        'kokurikuler_plans', 'emergency_alerts', 'performance_assessments', 'gtk_data'
      ];

      // Mapping table name to cacheService keys
      const tableToCacheKeyMap: Record<string, string> = {
        'users': 'users',
        'students': 'students',
        'graduates': 'graduates',
        'agendas': 'agendas',
        'materials': 'materials',
        'grades': 'grades',
        'counseling': 'counselingLogs',
        'extracurriculars': 'extracurriculars',
        'profiles': 'profiles',
        'holidays': 'holidays',
        'attendance': 'allAttendanceRecords',
        'penilaian_sikap': 'sikapAssessments',
        'penilaian_karakter': 'karakterAssessments',
        'employment_links': 'employmentLinks',
        'inventory': 'inventory',
        'guests': 'guests',
        'class_config': 'class_config',
        'sumatifs': 'sumatifs',
        'sumatif_results': 'sumatif_results',
        'academic_calendar': 'academic_calendar',
        'schedule': 'schedule',
        'book_inventory': 'book_inventory',
        'book_loans': 'bookLoans',
        'bos_management': 'bosTransactions',
        'school_assets': 'schoolAssets',
        'learning_documentation': 'learningDocumentation',
        'support_documents': 'supportDocuments',
        'permission_requests': 'permissionRequests',
        'buku_penghubung': 'liaisonLogs',
        'jurnal_kelas': 'jurnal_kelas',
        'learning_reports': 'learningReports',
        'learning_plans': 'learning_plans',
        'kokurikuler_plans': 'kokurikuler_plans',
        'emergency_alerts': 'emergency_alerts',
        'performance_assessments': 'performanceAssessments',
        'gtk_data': 'gtkData'
      };

      const mapDbToClient = (table: string, row: any) => {
        if (!row) return row;
        const mapped = { ...row };
        
        if ('class_id' in row) mapped.classId = row.class_id;
        if ('student_id' in row) mapped.studentId = row.student_id;
        if ('subject_id' in row) mapped.subjectId = row.subject_id;
        if ('created_at' in row) mapped.createdAt = row.created_at;
        
        if (table === 'users') {
          mapped.fullName = row.full_name;
          let bPlace = '';
          let bDate = '';
          try {
            if (row.birth_info && row.birth_info.startsWith('{')) {
              const parsed = JSON.parse(row.birth_info);
              bPlace = parsed.place || '';
              bDate = parsed.date || '';
            } else {
              bPlace = row.birth_info || '';
            }
          } catch (e) {}
          mapped.birthPlace = bPlace;
          mapped.birthDate = bDate;
        }
        
        if (table === 'students') {
          mapped.birthPlace = row.birth_place;
          mapped.birthDate = row.birth_date;
          mapped.fatherName = row.father_name;
          mapped.fatherJob = row.father_job;
          mapped.fatherEducation = row.father_education;
          mapped.motherName = row.mother_name;
          mapped.motherJob = row.mother_job;
          mapped.motherEducation = row.mother_education;
          mapped.guardianName = row.guardian_name;
          mapped.guardianJob = row.guardian_job;
          mapped.guardianEducation = row.guardian_education;
          mapped.academicStatus = row.academic_status;
          mapped.academicYear = row.academic_year;
          mapped.seatingRow = row.seating_row;
          mapped.seatingCol = row.seating_col;
        }
        
        if (table === 'counseling') {
          mapped.followUp = row.follow_up;
        }
        
        if (table === 'sumatifs') {
          mapped.startTime = row.start_time;
          mapped.endTime = row.end_time;
          mapped.isActive = row.is_active;
          mapped.isVisible = row.is_visible;
        }
        
        if (table === 'sumatif_results') {
          mapped.statusTes = row.status_tes;
          mapped.needsGrading = row.needs_grading;
          mapped.manualScores = row.manual_scores;
          mapped.submittedAt = row.submitted_at;
        }
        
        if (table === 'buku_penghubung') {
          mapped.isReadByParent = row.is_read_by_parent;
        }

        if (table === 'gtk_data') {
          mapped.userId = row.user_id;
          mapped.jenisKelamin = row.jenis_kelamin;
          mapped.tempatLahir = row.tempat_lahir;
          mapped.tanggalLahir = row.tanggal_lahir;
          mapped.ijazahTertinggi = row.ijazah_tertinggi;
          mapped.statusPegawai = row.status_pegawai;
          mapped.tmtPengangkatan = row.tmt_pengangkatan;
          mapped.mulaiBekerjaDiSini = row.mulai_bekerja_disini;
          mapped.pangkatGolongan = row.pangkat_golongan;
          mapped.masaKerjaTahun = row.masa_kerja_tahun;
          mapped.masaKerjaBulan = row.masa_kerja_bulan;
          mapped.skTerakhir = row.sk_terakhir;
          mapped.emailPribadi = row.email_pribadi;
          mapped.emailBelajar = row.email_belajar;
        }
        
        if (table === 'learning_plans') {
          mapped.schoolName = row.school_name;
          mapped.classSemester = row.class_semester;
          mapped.academicYear = row.academic_year;
          mapped.timeAllocation = row.time_allocation;
          mapped.studentCharacteristics = row.student_characteristics;
          mapped.profileDimensions = row.profile_dimensions;
          mapped.capaianPembelajaran = row.capaian_pembelajaran;
          mapped.learningGoals = row.learning_goals;
          mapped.pendekatanReason = row.pendekatan_reason;
          mapped.modelReason = row.model_reason;
          mapped.strategiReason = row.strategi_reason;
          mapped.metodeReason = row.metode_reason;
          mapped.lintasDisiplin = row.lintas_disiplin;
          mapped.kegiatanAwal = row.kegiatan_awal;
          mapped.kegiatanInti = row.kegiatan_inti;
          mapped.kegiatanPenutup = row.kegiatan_penutup;
          mapped.kegiatanAwalTitle = row.kegiatan_awal_title;
          mapped.kegiatanIntiTitle = row.kegiatan_inti_title;
          mapped.kegiatanPenutupTitle = row.kegiatan_penutup_title;
          mapped.durasiAwal = row.durasi_awal;
          mapped.durasiInti = row.durasi_inti;
          mapped.durasiPenutup = row.durasi_penutup;
          mapped.asesmenAwal = row.asesmen_awal;
          mapped.asesmenProses = row.asesmen_proses;
          mapped.asesmenAkhir = row.asesmen_akhir;
          mapped.createdDate = row.created_date;
        }
        
        if (table === 'performance_assessments') {
          mapped.teacherId = row.teacher_id;
          mapped.teacherName = row.teacher_name;
          mapped.supervisorId = row.supervisor_id;
          mapped.supervisorName = row.supervisor_name;
          mapped.totalScore = row.total_score;
        }
        
        if (table === 'graduates') {
          mapped.ijazahNumber = row.ijazah_number;
          mapped.graduationYear = row.graduation_year;
          mapped.continuedTo = row.continued_to;
          mapped.sklUrl = row.skl_url;
          mapped.isVisible = row.is_visible;
        }
        
        if (table === 'agendas') {
          mapped.endDate = row.end_date;
        }
        
        if (table === 'learning_reports') {
          mapped.documentLink = row.document_link;
          mapped.teacherName = row.teacher_name;
        }
        
        if (table === 'learning_documentation') {
          mapped.namaKegiatan = row.nama_kegiatan;
          mapped.linkFoto = row.link_foto;
        }
        
        if (table === 'book_inventory') {
          mapped.totalStock = row.total_stock;
          mapped.coverUrl = row.cover_url;
        }
        
        return mapped;
      };

      const mapClientToDb = (table: string, row: any) => {
        const mapped = { ...row };
        
        // Common mapping: camelCase -> snake_case
        if (mapped.classId) { mapped.class_id = mapped.classId; delete mapped.classId; }
        if (mapped.studentId) { mapped.student_id = mapped.studentId; delete mapped.studentId; }
        if (mapped.subjectId) { mapped.subject_id = mapped.subjectId; delete mapped.subjectId; }
        if (mapped.createdAt) { mapped.created_at = mapped.createdAt; delete mapped.createdAt; }
        
        // Specific table mappings
        if (table === 'students') {
            if (mapped.birthPlace) { mapped.birth_place = mapped.birthPlace; delete mapped.birthPlace; }
            if (mapped.birthDate) { mapped.birth_date = mapped.birthDate; delete mapped.birthDate; }
            if (mapped.fatherName) { mapped.father_name = mapped.fatherName; delete mapped.fatherName; }
            if (mapped.fatherJob) { mapped.father_job = mapped.fatherJob; delete mapped.fatherJob; }
            if (mapped.fatherEducation) { mapped.father_education = mapped.fatherEducation; delete mapped.fatherEducation; }
            if (mapped.motherName) { mapped.mother_name = mapped.motherName; delete mapped.motherName; }
            if (mapped.motherJob) { mapped.mother_job = mapped.motherJob; delete mapped.motherJob; }
            if (mapped.motherEducation) { mapped.mother_education = mapped.motherEducation; delete mapped.motherEducation; }
            if (mapped.guardianName) { mapped.guardian_name = mapped.guardianName; delete mapped.guardianName; }
            if (mapped.guardianJob) { mapped.guardian_job = mapped.guardianJob; delete mapped.guardianJob; }
            if (mapped.guardianEducation) { mapped.guardian_education = mapped.guardianEducation; delete mapped.guardianEducation; }
            if (mapped.academicStatus) { mapped.academic_status = mapped.academicStatus; delete mapped.academicStatus; }
            if (mapped.academicYear) { mapped.academic_year = mapped.academicYear; delete mapped.academicYear; }
            if (mapped.seatingRow) { mapped.seating_row = mapped.seatingRow; delete mapped.seatingRow; }
            if (mapped.seatingCol) { mapped.seating_col = mapped.seatingCol; delete mapped.seatingCol; }
        }
        
        if (table === 'sumatifs') {
            if (mapped.startTime) { mapped.start_time = mapped.startTime; delete mapped.startTime; }
            if (mapped.endTime) { mapped.end_time = mapped.endTime; delete mapped.endTime; }
            if (mapped.isActive !== undefined) { mapped.is_active = mapped.isActive; delete mapped.isActive; }
            if (mapped.isVisible !== undefined) { mapped.is_visible = mapped.isVisible; delete mapped.isVisible; }
        }
        
        if (table === 'sumatif_results') {
            if (mapped.statusTes) { mapped.status_tes = mapped.statusTes; delete mapped.statusTes; }
            if (mapped.needsGrading !== undefined) { mapped.needs_grading = mapped.needsGrading; delete mapped.needsGrading; }
            if (mapped.manualScores) { mapped.manual_scores = mapped.manualScores; delete mapped.manualScores; }
            if (mapped.submittedAt) { mapped.submitted_at = mapped.submittedAt; delete mapped.submittedAt; }
        }
        
        if (table === 'buku_penghubung') {
            if (mapped.isReadByParent !== undefined) { mapped.is_read_by_parent = mapped.isReadByParent; delete mapped.isReadByParent; }
        }

        if (table === 'counseling') {
            if (mapped.followUp) { mapped.follow_up = mapped.followUp; delete mapped.followUp; }
        }
        
        if (table === 'gtk_data') {
            if (mapped.userId !== undefined) { mapped.user_id = mapped.userId; delete mapped.userId; }
            if (mapped.jenisKelamin !== undefined) { mapped.jenis_kelamin = mapped.jenisKelamin; delete mapped.jenisKelamin; }
            if (mapped.tempatLahir !== undefined) { mapped.tempat_lahir = mapped.tempatLahir; delete mapped.tempatLahir; }
            if (mapped.tanggalLahir !== undefined) { mapped.tanggal_lahir = mapped.tanggalLahir; delete mapped.tanggalLahir; }
            if (mapped.ijazahTertinggi !== undefined) { mapped.ijazah_tertinggi = mapped.ijazahTertinggi; delete mapped.ijazahTertinggi; }
            if (mapped.statusPegawai !== undefined) { mapped.status_pegawai = mapped.statusPegawai; delete mapped.statusPegawai; }
            if (mapped.tmtPengangkatan !== undefined) { mapped.tmt_pengangkatan = mapped.tmtPengangkatan; delete mapped.tmtPengangkatan; }
            if (mapped.mulaiBekerjaDiSini !== undefined) { mapped.mulai_bekerja_disini = mapped.mulaiBekerjaDiSini; delete mapped.mulaiBekerjaDiSini; }
            if (mapped.pangkatGolongan !== undefined) { mapped.pangkat_golongan = mapped.pangkatGolongan; delete mapped.pangkatGolongan; }
            if (mapped.masaKerjaTahun !== undefined) { mapped.masa_kerja_tahun = mapped.masaKerjaTahun; delete mapped.masaKerjaTahun; }
            if (mapped.masaKerjaBulan !== undefined) { mapped.masa_kerja_bulan = mapped.masaKerjaBulan; delete mapped.masaKerjaBulan; }
            if (mapped.skTerakhir !== undefined) { mapped.sk_terakhir = mapped.skTerakhir; delete mapped.skTerakhir; }
            if (mapped.emailPribadi !== undefined) { mapped.email_pribadi = mapped.emailPribadi; delete mapped.emailPribadi; }
            if (mapped.emailBelajar !== undefined) { mapped.email_belajar = mapped.emailBelajar; delete mapped.emailBelajar; }
        }
        
        if (table === 'learning_plans') {
          if (mapped.schoolName) { mapped.school_name = mapped.schoolName; delete mapped.schoolName; }
          if (mapped.classSemester) { mapped.class_semester = mapped.classSemester; delete mapped.classSemester; }
          if (mapped.academicYear) { mapped.academic_year = mapped.academicYear; delete mapped.academicYear; }
          if (mapped.timeAllocation) { mapped.time_allocation = mapped.timeAllocation; delete mapped.timeAllocation; }
          if (mapped.studentCharacteristics) { mapped.student_characteristics = mapped.studentCharacteristics; delete mapped.studentCharacteristics; }
          if (mapped.profileDimensions) { mapped.profile_dimensions = mapped.profileDimensions; delete mapped.profileDimensions; }
          if (mapped.capaianPembelajaran) { mapped.capaian_pembelajaran = mapped.capaianPembelajaran; delete mapped.capaianPembelajaran; }
          if (mapped.learningGoals) { mapped.learning_goals = mapped.learningGoals; delete mapped.learningGoals; }
          if (mapped.pendekatanReason) { mapped.pendekatan_reason = mapped.pendekatanReason; delete mapped.pendekatanReason; }
          if (mapped.modelReason) { mapped.model_reason = mapped.modelReason; delete mapped.modelReason; }
          if (mapped.strategiReason) { mapped.strategi_reason = mapped.strategiReason; delete mapped.strategiReason; }
          if (mapped.metodeReason) { mapped.metode_reason = mapped.metodeReason; delete mapped.metodeReason; }
          if (mapped.lintasDisiplin) { mapped.lintas_disiplin = mapped.lintasDisiplin; delete mapped.lintasDisiplin; }
          if (mapped.kegiatanAwal) { mapped.kegiatan_awal = mapped.kegiatanAwal; delete mapped.kegiatanAwal; }
          if (mapped.kegiatanInti) { mapped.kegiatan_inti = mapped.kegiatanInti; delete mapped.kegiatanInti; }
          if (mapped.kegiatanPenutup) { mapped.kegiatan_penutup = mapped.kegiatanPenutup; delete mapped.kegiatanPenutup; }
          if (mapped.kegiatanAwalTitle) { mapped.kegiatan_awal_title = mapped.kegiatanAwalTitle; delete mapped.kegiatanAwalTitle; }
          if (mapped.kegiatanIntiTitle) { mapped.kegiatan_inti_title = mapped.kegiatanIntiTitle; delete mapped.kegiatanIntiTitle; }
          if (mapped.kegiatanPenutupTitle) { mapped.kegiatan_penutup_title = mapped.kegiatanPenutupTitle; delete mapped.kegiatanPenutupTitle; }
          if (mapped.durasiAwal !== undefined) { mapped.durasi_awal = mapped.durasiAwal; delete mapped.durasiAwal; }
          if (mapped.durasiInti !== undefined) { mapped.durasi_inti = mapped.durasiInti; delete mapped.durasiInti; }
          if (mapped.durasiPenutup !== undefined) { mapped.durasi_penutup = mapped.durasiPenutup; delete mapped.durasiPenutup; }
          if (mapped.asesmenAwal) { mapped.asesmen_awal = mapped.asesmenAwal; delete mapped.asesmenAwal; }
          if (mapped.asesmenProses) { mapped.asesmen_proses = mapped.asesmenProses; delete mapped.asesmenProses; }
          if (mapped.asesmenAkhir) { mapped.asesmen_akhir = mapped.asesmenAkhir; delete mapped.asesmenAkhir; }
          if (mapped.createdDate) { mapped.created_date = mapped.createdDate; delete mapped.createdDate; }
        }
        
        if (table === 'performance_assessments') {
          if (mapped.teacherId) { mapped.teacher_id = mapped.teacherId; delete mapped.teacherId; }
          if (mapped.teacherName) { mapped.teacher_name = mapped.teacherName; delete mapped.teacherName; }
          if (mapped.supervisorId) { mapped.supervisor_id = mapped.supervisorId; delete mapped.supervisorId; }
          if (mapped.supervisorName) { mapped.supervisor_name = mapped.supervisorName; delete mapped.supervisorName; }
          if (mapped.totalScore !== undefined) { mapped.total_score = mapped.totalScore; delete mapped.totalScore; }
        }
        
        if (table === 'graduates') {
          if (mapped.ijazahNumber) { mapped.ijazah_number = mapped.ijazahNumber; delete mapped.ijazahNumber; }
          if (mapped.graduationYear) { mapped.graduation_year = mapped.graduationYear; delete mapped.graduationYear; }
          if (mapped.continuedTo) { mapped.continued_to = mapped.continuedTo; delete mapped.continuedTo; }
          if (mapped.sklUrl) { mapped.skl_url = mapped.sklUrl; delete mapped.sklUrl; }
          if (mapped.isVisible !== undefined) { mapped.is_visible = mapped.isVisible; delete mapped.isVisible; }
        }
        
        if (table === 'agendas') {
          if (mapped.endDate) { mapped.end_date = mapped.endDate; delete mapped.endDate; }
        }
        
        if (table === 'learning_reports') {
          if (mapped.documentLink) { mapped.document_link = mapped.documentLink; delete mapped.documentLink; }
          if (mapped.teacherName) { mapped.teacher_name = mapped.teacherName; delete mapped.teacherName; }
        }
        
        if (table === 'learning_documentation') {
          if (mapped.namaKegiatan) { mapped.nama_kegiatan = mapped.namaKegiatan; delete mapped.namaKegiatan; }
          if (mapped.linkFoto) { mapped.link_foto = mapped.linkFoto; delete mapped.linkFoto; }
        }
        
        if (table === 'book_inventory') {
          if (mapped.totalStock !== undefined) { mapped.total_stock = mapped.totalStock; delete mapped.totalStock; }
          if (mapped.coverUrl) { mapped.cover_url = mapped.coverUrl; delete mapped.coverUrl; }
        }

        return mapped;
      };

      // --- 1. Restore ke local cacheService ---
      if (typeof window !== 'undefined') {
        try {
          if (data && data._local_cache) {
            const cacheData = data._local_cache;
            Object.keys(cacheData).forEach(key => {
              if (key === 'learningDocumentation') return;
              const item = cacheData[key];
              if (item && typeof item === 'object' && 'value' in item) {
                localStorage.setItem(key, JSON.stringify(item));
              } else {
                localStorage.setItem(key, typeof item === 'string' ? item : JSON.stringify(item));
              }
            });
          } else if (data) {
            // Jika file backup berisi format tabel database langsung, kita petakan ke cacheService
            for (const table of tables) {
              const cacheKey = tableToCacheKeyMap[table];
              if (cacheKey && data[table] && Array.isArray(data[table])) {
                const mappedRows = data[table].map((row: any) => mapDbToClient(table, row));
                cacheService.set(cacheKey, mappedRows);
              }
            }
          }
        } catch (err) {
          console.warn("Failed to restore local storage cache:", err);
        }
      }

      // --- 2. Restore ke Database Supabase jika dikonfigurasi ---
      if (isApiConfigured()) {
        // Hapus sumatif_results dulu
        await supabase.from('sumatif_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Hapus tabel lainnya
        for (const table of tables) {
          if (table === 'sumatif_results') continue;
          
          try {
            let deleteOp;
            if (table === 'grades' || table === 'penilaian_sikap' || table === 'penilaian_karakter') {
              deleteOp = supabase.from(table).delete().neq('student_id', '___NONE___');
            } else if (table === 'class_config') {
              deleteOp = supabase.from(table).delete().neq('class_id', '___NONE___');
            } else {
              deleteOp = supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            }
            
            const { error } = await deleteOp;
            if (error) {
              console.warn(`Warning: Could not clear table ${table}:`, error.message);
              await supabase.from(table).delete().gt('created_at', '1970-01-01').catch(() => {});
            }
          } catch (e) {
            console.warn(`Error clearing table ${table}:`, e);
          }
        }

        // Masukkan data kembali ke Supabase
        const restorationErrors: string[] = [];
        for (const table of tables) {
          if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
            // Apply mapping first
            const tableData = data[table].map((row: any) => mapClientToDb(table, row));
            
            // Coba insert row-by-row untuk kontrol lebih baik dan validasi per-baris
            for (const row of tableData) {
              // Try insert first
              let { error } = await supabase.from(table).insert(row);
              
              if (error) {
                // If insert fails, try upsert
                const { error: upsertError } = await supabase.from(table).upsert(row);
                
                if (upsertError) {
                  // If upsert fails, try removing 'id' and 'created_at' and upsert again
                  const sanitizedRow = { ...row };
                  delete sanitizedRow.id;
                  delete sanitizedRow.created_at;

                  const { error: retryError } = await supabase.from(table).upsert(sanitizedRow);
                  if (retryError) {
                    const errMsg = `Error restoring row in ${table} (ID: ${row.id || 'N/A'}): ${retryError.message} - Details: ${retryError.details || 'N/A'}`;
                    console.error(errMsg, row);
                    restorationErrors.push(errMsg);
                  }
                }
              }
            }
          }
        }
        // Jangan throw error di sini untuk memberikan kelonggaran
        if (restorationErrors.length > 0) {
          console.warn('Beberapa baris gagal dipulihkan:', restorationErrors.length, 'gagal.');
        }

        // Refresh cache from DB
        for (const table of tables) {
          const cacheKey = tableToCacheKeyMap[table];
          if (cacheKey) {
            const { data: dbData, error: dbError } = await supabase.from(table).select('*');
            if (!dbError && dbData) {
              const mappedRows = dbData.map((row: any) => mapDbToClient(table, row));
              cacheService.set(cacheKey, mappedRows);
            }
          }
        }
      }

      return { status: 'success', message: 'Data berhasil dipulihkan.' };
    } catch (error: any) {
      console.error("Critical error during restore:", error);
      return { status: 'error', message: error.message || 'Gagal memulihkan data.' };
    }
  },

  // --- Sumatif ---
  getSumatifs: async (classId: string): Promise<Sumatif[]> => {
    const cached = cacheService.get<Sumatif[]>(`sumatifs_${classId}`) || cacheService.get<Sumatif[]>(`sumatifs`);
    if (!isApiConfigured()) {
      return cached || [];
    }
    try {
      const { data, error } = await supabase
        .from('sumatifs')
        .select('*')
        .eq('class_id', classId);
      if (error) {
        return cached || [];
      }
      return (data || []).map((s: any) => ({
        ...s,
        classId: s.class_id,
        subjectId: s.subject_id,
        startTime: s.start_time,
        endTime: s.end_time,
        isActive: s.is_active,
        isVisible: s.is_visible,
        token: s.token,
        createdAt: s.created_at
      }));
    } catch (err) {
      return cached || [];
    }
  },
  saveSumatif: async (sumatif: Sumatif): Promise<Sumatif> => {
    const classId = sumatif.classId;
    const cached = cacheService.get<Sumatif[]>(`sumatifs_${classId}`) || [];
    const savedSumatif = { ...sumatif };
    if (!savedSumatif.id) {
      savedSumatif.id = 'sumatif-' + Date.now();
      savedSumatif.createdAt = new Date().toISOString();
    }
    const index = cached.findIndex(s => s.id === savedSumatif.id);
    if (index !== -1) {
      cached[index] = savedSumatif;
    } else {
      cached.push(savedSumatif);
    }
    cacheService.set(`sumatifs_${classId}`, cached);

    if (!isApiConfigured()) {
      return savedSumatif;
    }

    try {
      const dbSumatif = {
        class_id: sumatif.classId,
        subject_id: sumatif.subjectId,
        title: sumatif.title,
        type: sumatif.type,
        duration: sumatif.duration,
        start_time: sumatif.startTime || null,
        end_time: sumatif.endTime || null,
        is_active: sumatif.isActive,
        is_visible: sumatif.isVisible ?? true,
        token: sumatif.token || null,
        questions: sumatif.questions
      };

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sumatif.id || '');

      if (sumatif.id && sumatif.id !== '' && isUUID) {
        const { data, error } = await supabase
          .from('sumatifs')
          .update(dbSumatif)
          .eq('id', sumatif.id)
          .select()
          .single();
        if (error) {
          console.error("Error updating sumatif:", error);
          throw error;
        }
        const result = { 
          ...data, 
          classId: data.class_id, 
          subjectId: data.subject_id,
          startTime: data.start_time,
          endTime: data.end_time,
          isActive: data.is_active,
          isVisible: data.is_visible,
          token: data.token,
          createdAt: data.created_at
        };
        const idx = cached.findIndex(s => s.id === result.id);
        if (idx !== -1) { cached[idx] = result; } else { cached.push(result); }
        cacheService.set(`sumatifs_${classId}`, cached);
        return result;
      } else {
        const { data, error } = await supabase
          .from('sumatifs')
          .insert([dbSumatif])
          .select()
          .single();
        if (error) {
          console.error("Error inserting sumatif:", error);
          throw error;
        }
        const result = { 
          ...data, 
          classId: data.class_id, 
          subjectId: data.subject_id,
          startTime: data.start_time,
          endTime: data.end_time,
          isActive: data.is_active,
          isVisible: data.is_visible,
          token: data.token,
          createdAt: data.created_at
        };
        const finalCached = cached.filter(s => s.id !== sumatif.id);
        finalCached.push(result);
        cacheService.set(`sumatifs_${classId}`, finalCached);
        return result;
      }
    } catch (err) {
      console.warn("saveSumatif database failed, using local result:", err);
      return savedSumatif;
    }
  },
  deleteSumatif: async (id: string): Promise<void> => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('sumatifs_')) {
          const cached = cacheService.get<Sumatif[]>(k);
          if (cached) {
            const filtered = cached.filter(s => s.id !== id);
            cacheService.set(k, filtered);
          }
        }
      });
      localStorage.removeItem(`sumatif_results_${id}`);
    } catch (e) {}

    if (!isApiConfigured()) return;

    try {
      await supabase.from('sumatifs').delete().eq('id', id);
    } catch (err) {
      console.warn("deleteSumatif database failed:", err);
    }
  },
  getSumatifResults: async (sumatifId: string): Promise<SumatifResult[]> => {
    if (!isApiConfigured()) {
      const cached = cacheService.get<SumatifResult[]>(`sumatif_results_${sumatifId}`);
      return cached || [];
    }
    try {
      const { data, error } = await supabase
        .from('sumatif_results')
        .select('*')
        .eq('sumatif_id', sumatifId);
      if (error) {
        console.error("Error fetching sumatif results:", error);
        const cached = cacheService.get<SumatifResult[]>(`sumatif_results_${sumatifId}`);
        return cached || [];
      }
      return data.map((r: any) => ({
        ...r,
        sumatifId: r.sumatif_id,
        studentId: r.student_id,
        submittedAt: r.submitted_at,
        status_tes: r.status_tes,
        needsGrading: r.needs_grading,
        manualScores: r.manual_scores,
        createdAt: r.created_at
      }));
    } catch (err) {
      console.warn("getSumatifResults failed, using local fallback:", err);
      const cached = cacheService.get<SumatifResult[]>(`sumatif_results_${sumatifId}`);
      return cached || [];
    }
  },
  submitSumatifResult: async (result: Omit<SumatifResult, 'id'>): Promise<void> => {
    const sumatifId = result.sumatifId;
    const cached = cacheService.get<SumatifResult[]>(`sumatif_results_${sumatifId}`) || [];
    const existingIndex = cached.findIndex(r => r.studentId === result.studentId);
    const savedResult = {
      id: existingIndex !== -1 ? cached[existingIndex].id : 'res-' + Date.now(),
      ...result,
      status_tes: result.status_tes || 'selesai',
      needsGrading: result.needsGrading || false,
      manualScores: result.manualScores || {},
      submittedAt: result.submittedAt || new Date().toISOString()
    } as SumatifResult;

    if (existingIndex !== -1) {
      cached[existingIndex] = savedResult;
    } else {
      cached.push(savedResult);
    }
    cacheService.set(`sumatif_results_${sumatifId}`, cached);

    if (!isApiConfigured()) return;

    try {
      const { error } = await supabase.from('sumatif_results').upsert({
        sumatif_id: result.sumatifId,
        student_id: result.studentId,
        score: result.score,
        answers: result.answers,
        status_tes: result.status_tes || 'selesai',
        needs_grading: result.needsGrading || false,
        manual_scores: result.manualScores || {},
        submitted_at: result.submittedAt || new Date().toISOString()
      }, { onConflict: 'sumatif_id,student_id' });
      if (error) throw error;
    } catch (err) {
      console.warn("submitSumatifResult database failed:", err);
    }
  },
  updateSumatifResultGrading: async (resultId: string, manualScores: Record<string, number>, finalScore: number): Promise<void> => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('sumatif_results_')) {
          const cached = cacheService.get<SumatifResult[]>(k);
          if (cached) {
            const index = cached.findIndex(r => r.id === resultId);
            if (index !== -1) {
              cached[index].manualScores = manualScores;
              cached[index].score = finalScore;
              cached[index].needsGrading = false;
              cacheService.set(k, cached);
            }
          }
        }
      });
    } catch (e) {}

    if (!isApiConfigured()) return;

    try {
      const { error } = await supabase
        .from('sumatif_results')
        .update({
          manual_scores: manualScores,
          score: finalScore,
          needs_grading: false
        })
        .eq('id', resultId);
      
      if (error) {
        console.error("Error updating sumatif grading:", error);
        throw error;
      }
    } catch (err) {
      console.warn("updateSumatifResultGrading database failed:", err);
    }
  },
  resetSumatifResult: async (sumatifId: string, studentId: string): Promise<void> => {
    const cached = cacheService.get<SumatifResult[]>(`sumatif_results_${sumatifId}`) || [];
    const index = cached.findIndex(r => r.studentId === studentId);
    if (index !== -1) {
      cached[index].status_tes = 'mulai';
      cached[index].score = 0;
      cached[index].answers = {};
      cached[index].submittedAt = '';
      cacheService.set(`sumatif_results_${sumatifId}`, cached);
    }

    if (!isApiConfigured()) return;

    try {
      const { error } = await supabase
        .from('sumatif_results')
        .update({ status_tes: 'mulai', score: 0, answers: {}, submitted_at: null })
        .eq('sumatif_id', sumatifId)
        .eq('student_id', studentId);
      if (error) throw error;
    } catch (err) {
      console.warn("resetSumatifResult database failed:", err);
    }
  },
  startSumatifResult: async (sumatifId: string, studentId: string): Promise<void> => {
    const cached = cacheService.get<SumatifResult[]>(`sumatif_results_${sumatifId}`) || [];
    const index = cached.findIndex(r => r.studentId === studentId);
    const newResult: SumatifResult = {
      id: index !== -1 ? cached[index].id : 'res-' + Date.now(),
      sumatifId,
      studentId,
      score: 0,
      answers: {},
      status_tes: 'mulai',
      needsGrading: false,
      manualScores: {},
      submittedAt: new Date().toISOString()
    };
    if (index !== -1) {
      cached[index] = newResult;
    } else {
      cached.push(newResult);
    }
    cacheService.set(`sumatif_results_${sumatifId}`, cached);

    if (!isApiConfigured()) return;

    try {
      const { error } = await supabase
        .from('sumatif_results')
        .upsert({ sumatif_id: sumatifId, student_id: studentId, status_tes: 'mulai', score: 0, answers: {}, submitted_at: null }, { onConflict: 'sumatif_id,student_id' });
      if (error) throw error;
    } catch (err) {
      console.warn("startSumatifResult database failed:", err);
    }
  },

  // --- Learning Plans ---
  getLearningPlans: async (): Promise<LearningPlan[]> => {
    const { data, error } = await supabase
      .from('learning_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching learning plans from database:", error);
      return [];
    }
    
    return data.map((item: any) => ({
      id: item.id,
      schoolName: item.school_name,
      compiler: item.compiler,
      nip: item.nip,
      subject: item.subject,
      topic: item.topic,
      classSemester: item.class_semester,
      academicYear: item.academic_year,
      timeAllocation: item.time_allocation,
      studentCharacteristics: item.student_characteristics,
      profileDimensions: item.profile_dimensions || [],
      capaianPembelajaran: item.capaian_pembelajaran,
      learningGoals: item.learning_goals || [],
      pendekatan: item.pendekatan,
      pendekatanReason: item.pendekatan_reason,
      model: item.model,
      modelReason: item.model_reason,
      strategi: item.strategi,
      strategiReason: item.strategi_reason,
      metode: item.metode || [],
      metodeReason: item.metode_reason,
      lintasDisiplin: item.lintas_disiplin,
      mitra: item.mitra,
      digital: item.digital,
      lingkungan: item.lingkungan,
      kegiatanAwal: item.kegiatan_awal || [],
      kegiatanInti: item.kegiatan_inti || [],
      kegiatanPenutup: item.kegiatan_penutup || [],
      kegiatanAwalTitle: item.kegiatan_awal_title,
      kegiatanIntiTitle: item.kegiatan_inti_title,
      kegiatanPenutupTitle: item.kegiatan_penutup_title,
      durasiAwal: item.durasi_awal,
      durasiInti: item.durasi_inti,
      durasiPenutup: item.durasi_penutup,
      asesmenAwal: item.asesmen_awal,
      asesmenProses: item.asesmen_proses,
      asesmenAkhir: item.asesmen_akhir,
      attachments: item.attachments || [],
      createdDate: item.created_date,
      createdAt: item.created_at
    }));
  },

  saveLearningPlan: async (plan: LearningPlan): Promise<LearningPlan> => {
    const dbPlan = {
      id: plan.id,
      school_name: plan.schoolName,
      compiler: plan.compiler,
      nip: plan.nip,
      subject: plan.subject,
      topic: plan.topic,
      class_semester: plan.classSemester,
      academic_year: plan.academicYear,
      time_allocation: plan.timeAllocation,
      student_characteristics: plan.studentCharacteristics,
      profile_dimensions: plan.profileDimensions,
      capaian_pembelajaran: plan.capaianPembelajaran,
      learning_goals: plan.learningGoals,
      pendekatan: plan.pendekatan,
      pendekatan_reason: plan.pendekatanReason,
      model: plan.model,
      model_reason: plan.modelReason,
      strategi: plan.strategi,
      strategi_reason: plan.strategiReason,
      metode: plan.metode,
      metode_reason: plan.metodeReason,
      lintas_disiplin: plan.lintasDisiplin,
      mitra: plan.mitra,
      digital: plan.digital,
      lingkungan: plan.lingkungan,
      kegiatan_awal: plan.kegiatanAwal,
      kegiatan_inti: plan.kegiatanInti,
      kegiatan_penutup: plan.kegiatanPenutup,
      kegiatan_awal_title: plan.kegiatanAwalTitle,
      kegiatan_inti_title: plan.kegiatanIntiTitle,
      kegiatan_penutup_title: plan.kegiatanPenutupTitle,
      durasi_awal: plan.durasiAwal,
      durasi_inti: plan.durasiInti,
      durasi_penutup: plan.durasiPenutup,
      asesmen_awal: plan.asesmenAwal,
      asesmen_proses: plan.asesmenProses,
      asesmen_akhir: plan.asesmenAkhir,
      attachments: plan.attachments || [],
      created_date: plan.createdDate,
      created_at: plan.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('learning_plans')
      .upsert(dbPlan, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Error saving learning plan to database:", error);
      throw error;
    }

    return {
      id: data.id,
      schoolName: data.school_name,
      compiler: data.compiler,
      nip: data.nip,
      subject: data.subject,
      topic: data.topic,
      classSemester: data.class_semester,
      academicYear: data.academic_year,
      timeAllocation: data.time_allocation,
      studentCharacteristics: data.student_characteristics,
      profileDimensions: data.profile_dimensions || [],
      capaianPembelajaran: data.capaian_pembelajaran,
      learningGoals: data.learning_goals || [],
      pendekatan: data.pendekatan,
      pendekatanReason: data.pendekatan_reason,
      model: data.model,
      modelReason: data.model_reason,
      strategi: data.strategi,
      strategiReason: data.strategi_reason,
      metode: data.metode || [],
      metodeReason: data.metode_reason,
      lintasDisiplin: data.lintas_disiplin,
      mitra: data.mitra,
      digital: data.digital,
      lingkungan: data.lingkungan,
      kegiatanAwal: data.kegiatan_awal || [],
      kegiatanInti: data.kegiatan_inti || [],
      kegiatanPenutup: data.kegiatan_penutup || [],
      kegiatanAwalTitle: data.kegiatan_awal_title,
      kegiatanIntiTitle: data.kegiatan_inti_title,
      kegiatanPenutupTitle: data.kegiatan_penutup_title,
      durasiAwal: data.durasi_awal,
      durasiInti: data.durasi_inti,
      durasiPenutup: data.durasi_penutup,
      asesmenAwal: data.asesmen_awal,
      asesmenProses: data.asesmen_proses,
      asesmenAkhir: data.asesmen_akhir,
      attachments: data.attachments || [],
      createdDate: data.created_date,
      createdAt: data.created_at
    };
  },

  deleteLearningPlan: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('learning_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting learning plan from database:", error);
      throw error;
    }
  },

  // --- Kokurikuler Plans (RPK) ---
  getKokurikulerPlans: async (): Promise<KokurikulerPlan[]> => {
    const { data, error } = await supabase
      .from('kokurikuler_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching kokurikuler plans from database:", error);
      const cached = cacheService.get('kokurikuler_plans') as KokurikulerPlan[];
      if (cached) return cached;
      return [];
    }
    
    const plans = data.map((item: any) => ({
      id: item.id,
      identitas: item.identitas || {},
      analisisKebutuhan: item.analisis_kebutuhan || {},
      dimensiProfil: item.dimensi_profil || [],
      tujuanPembelajaran: item.tujuan_pembelajaran || [],
      praktikPedagogis: item.praktik_pedagogis || '',
      lingkunganPembelajaran: item.lingkungan_pembelajaran || '',
      pemanfaatanDigital: item.pemanfaatan_digital || '',
      kemitraan: item.kemitraan || {},
      kegiatan: item.kegiatan || [],
      asesmen: item.asesmen || { formatif: '', sumatif: '' },
      produk: item.produk || [],
      createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    }));
    
    cacheService.set('kokurikuler_plans', plans);
    return plans;
  },

  saveKokurikulerPlan: async (plan: KokurikulerPlan): Promise<KokurikulerPlan> => {
    const dbPlan = {
      id: plan.id,
      identitas: plan.identitas,
      analisis_kebutuhan: plan.analisisKebutuhan,
      dimensi_profil: plan.dimensiProfil,
      tujuan_pembelajaran: plan.tujuanPembelajaran,
      praktik_pedagogis: plan.praktikPedagogis,
      lingkungan_pembelajaran: plan.lingkunganPembelajaran,
      pemanfaatan_digital: plan.pemanfaatanDigital,
      kemitraan: plan.kemitraan,
      kegiatan: plan.kegiatan,
      asesmen: plan.asesmen,
      produk: plan.produk,
      created_at: plan.createdAt ? new Date(plan.createdAt).toISOString() : new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('kokurikuler_plans')
      .upsert(dbPlan, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Error saving kokurikuler plan to database:", error);
      const cached = (cacheService.get('kokurikuler_plans') || []) as KokurikulerPlan[];
      const updated = cached.some((p: any) => p.id === plan.id)
        ? cached.map((p: any) => p.id === plan.id ? plan : p)
        : [plan, ...cached];
      cacheService.set('kokurikuler_plans', updated);
      throw error;
    }

    const savedPlan: KokurikulerPlan = {
      id: data.id,
      identitas: data.identitas || {},
      analisisKebutuhan: data.analisis_kebutuhan || {},
      dimensiProfil: data.dimensi_profil || [],
      tujuanPembelajaran: data.tujuan_pembelajaran || [],
      praktikPedagogis: data.praktik_pedagogis || '',
      lingkunganPembelajaran: data.lingkungan_pembelajaran || '',
      pemanfaatanDigital: data.pemanfaatan_digital || '',
      kemitraan: data.kemitraan || {},
      kegiatan: data.kegiatan || [],
      asesmen: data.asesmen || { formatif: '', sumatif: '' },
      produk: data.produk || [],
      createdAt: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    };

    const cached = (cacheService.get('kokurikuler_plans') || []) as KokurikulerPlan[];
    const updated = cached.some((p: any) => p.id === savedPlan.id)
      ? cached.map((p: any) => p.id === savedPlan.id ? savedPlan : p)
      : [savedPlan, ...cached];
    cacheService.set('kokurikuler_plans', updated);

    return savedPlan;
  },

  deleteKokurikulerPlan: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('kokurikuler_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting kokurikuler plan from database:", error);
      throw error;
    }

    const cached = (cacheService.get('kokurikuler_plans') || []) as KokurikulerPlan[];
    cacheService.set('kokurikuler_plans', cached.filter((p: any) => p.id !== id));
  },

  // --- Emergency Alerts ---
  getActiveAlert: async (): Promise<EmergencyAlert | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      if (error.code !== '42P01' && error.code !== 'PGRST116') {
         // Only log if it's not "table doesn't exist" or "no rows returned"
         // console.error("Error fetching active alert:", error);
      }
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      type: data.type,
      description: data.description,
      isActive: data.is_active,
      triggeredBy: data.triggered_by,
      triggeredByName: data.triggered_by_name,
      createdAt: data.created_at
    };
  },
  triggerAlert: async (alert: Omit<EmergencyAlert, 'id' | 'createdAt'>): Promise<any> => {
    if (!supabase) return;
    
    // Delete all existing alerts to "overwrite" the database with only the latest one
    await supabase.from('emergency_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Insert new alert
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([{
        type: alert.type,
        description: alert.description,
        is_active: alert.isActive,
        triggered_by: alert.triggeredBy,
        triggered_by_name: alert.triggeredByName
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  clearAlert: async (): Promise<any> => {
    if (!supabase) return;
    const { error } = await supabase
      .from('emergency_alerts')
      .update({ is_active: false })
      .eq('is_active', true);
    
    if (error) throw error;
    return { success: true };
  },
  updatePassword: async (userId: string, newPassword?: string, username?: string): Promise<void> => {
    if (!supabase) return;
    const client = (username?.toLowerCase() === 'superadmin' && masterSupabase) ? masterSupabase : supabase;
    const { error } = await client
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);
    if (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  // --- Mail Records (Surat Menyurat) ---
  getMailRecords: async (classId?: string): Promise<MailRecord[]> => {
    try {
      const cached = cacheService.get<MailRecord[]>('mail_records') || [];
      if (!isApiConfigured()) return cached;
      const { data, error } = await supabase.from('mail_records').select('*').order('created_at', { ascending: false });
      if (error || !data) return cached;
      const mapped: MailRecord[] = data.map((item: any) => ({
        id: item.id,
        type: item.type || 'masuk',
        letterNumber: item.letter_number || '',
        agendaNumber: item.agenda_number || '',
        senderOrRecipient: item.sender_or_recipient || '',
        subject: item.subject || '',
        letterDate: item.letter_date || '',
        receivedOrSentDate: item.received_or_sent_date || '',
        category: item.category || 'Biasa',
        description: item.description || '',
        fileUrl: item.file_url || '',
        status: item.status || 'Tersimpan',
        classId: item.class_id || '',
        createdAt: item.created_at || new Date().toISOString()
      }));
      cacheService.set('mail_records', mapped);
      return mapped;
    } catch (e) {
      console.warn("getMailRecords error, returning cached:", e);
      return cacheService.get<MailRecord[]>('mail_records') || [];
    }
  },
  saveMailRecord: async (mail: MailRecord): Promise<void> => {
    try {
      const cached = cacheService.get<MailRecord[]>('mail_records') || [];
      const index = cached.findIndex(m => m.id === mail.id);
      if (index !== -1) {
        cached[index] = mail;
      } else {
        cached.unshift(mail);
      }
      cacheService.set('mail_records', cached);
    } catch (e) {}

    if (!isApiConfigured()) return;

    try {
      const dbItem = {
        id: mail.id,
        type: mail.type,
        letter_number: mail.letterNumber,
        agenda_number: mail.agendaNumber || '',
        sender_or_recipient: mail.senderOrRecipient,
        subject: mail.subject,
        letter_date: mail.letterDate,
        received_or_sent_date: mail.receivedOrSentDate,
        category: mail.category,
        description: mail.description || '',
        file_url: mail.fileUrl || '',
        status: mail.status || 'Tersimpan',
        class_id: mail.classId || ''
      };

      const { data: existing } = await supabase.from('mail_records').select('id').eq('id', mail.id).single();
      if (existing) {
        await supabase.from('mail_records').update(dbItem).eq('id', mail.id);
      } else {
        await supabase.from('mail_records').insert([dbItem]);
      }
    } catch (err) {
      console.warn("saveMailRecord DB error (fallback to local cache):", err);
    }
  },
  deleteMailRecord: async (id: string): Promise<{ status: string; message?: string }> => {
    try {
      const cached = cacheService.get<MailRecord[]>('mail_records') || [];
      const filtered = cached.filter(m => m.id !== id);
      cacheService.set('mail_records', filtered);
    } catch (e) {}

    if (!isApiConfigured()) return { status: 'success' };

    try {
      await supabase.from('mail_records').delete().eq('id', id);
      return { status: 'success' };
    } catch (err: any) {
      console.warn("deleteMailRecord DB error:", err);
      return { status: 'error', message: err?.message };
    }
  }
};

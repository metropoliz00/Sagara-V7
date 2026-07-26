import { supabase } from './supabase';

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  description: string;
  created_at: string;
  user_role: string;
}

export async function logActivity(user: any, action: string, description: string) {
  if (!supabase || !user) return;

  try {
    const { error } = await supabase.from('activity_logs').insert([{
      user_id: user.id || user.uid,
      user_name: user.nama || user.username || user.email || 'Anonymous',
      user_role: user.role || 'user',
      action,
      description
    }]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Error logging activity exception:', err);
  }
}

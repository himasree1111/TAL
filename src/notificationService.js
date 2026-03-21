import supabase from './supabaseClient';

// ✅ CREATE NOTIFICATION
export const createNotification = async (
  title,
  message,
  targetAudience = 'all',
  expiresAt = null
) => {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .ilike('title', title.trim())
      .ilike('message', message.trim())
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (checkError) throw checkError;

    if (existing.length > 0) {
      throw new Error('Duplicate notification exists within 24 hours');
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          title,
          message,
          audience: targetAudience.toLowerCase().trim(), // ✅ normalize
          expires_at: expiresAt || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, notification: data };

  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};


// ✅ GET STUDENT NOTIFICATIONS (FIXED)
export const getStudentNotifications = async (studentType) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const type = (studentType || "all").toLowerCase().trim();

    const filtered = data.filter(n => {
      const audience = (n.audience || "").toLowerCase().trim();

      const notExpired =
        !n.expires_at || new Date(n.expires_at) > new Date();

      const audienceMatch =
        audience === "all" || audience === type;

      return notExpired && audienceMatch;
    });

    return { success: true, notifications: filtered };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};


// ✅ REAL-TIME SUBSCRIPTION (WORKING)
export const subscribeToNotifications = (callback) => {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};
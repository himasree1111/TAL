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


// ✅ SHARED FILTER UTIL (NEW)
export const filterNotification = (notification, studentType) => {
  const audience = (notification.audience || "").toLowerCase().trim();
  const type = (studentType || "all").toLowerCase().trim();
  const notExpired = !notification.expires_at || new Date(notification.expires_at) > new Date();
  const audienceMatch = audience === "all" || audience === type;
  console.log(`[FILTER] ${notification.title || 'ID:'+notification.id}: audience="${audience}" vs type="${type}", expired=${!notExpired}`);
  return notExpired && audienceMatch;
};

// ✅ GET STUDENT NOTIFICATIONS (ENHANCED w/ DEBUG)
export const getStudentNotifications = async (studentType) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const type = (studentType || "all").toLowerCase().trim();

    console.log(`[FETCH] Fetched ${data.length} total, filtered to ${filtered.length} for type "${studentType}"`);
    return { success: true, notifications: filtered };

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
      console.log("[REALTIME] New payload received:", payload.new);
      callback(payload.new);
      }
    )
    .subscribe();
};
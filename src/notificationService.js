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
          audience: targetAudience.toLowerCase().trim(),
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

// ✅ GET ALL ADMIN NOTIFICATIONS

export const getAdminNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`[ADMIN] Fetched ${data.length} notifications`);
    return { success: true, notifications: data };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};


// ✅ SHARED FILTER UTIL
export const filterNotification = (notification, studentType) => {
  const audience = (notification.audience || "").toLowerCase().trim();
  const type = (studentType || "all").toLowerCase().trim();
  const notExpired = !notification.expires_at || new Date(notification.expires_at) > new Date();
  const audienceMatch = audience === "all" || audience === type;
  return notExpired && audienceMatch;
};

// ✅ DELETE NOTIFICATION
export const deleteNotification = async (id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};





export const getVolunteerNotifications = async (volunteerEmail) => {
  try {
    console.log('[VOLUNTEER] Email:', volunteerEmail);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or('audience.eq.volunteers,audience.eq.all')
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log('[VOLUNTEER] Fetched', data?.length || 0, 'notifications');
    return { success: true, notifications: data || [] };
    
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};


  // ✅ GET STUDENT NOTIFICATIONS




// ✅ GET STUDENT NOTIFICATIONS

export const getStudentNotifications = async (studentType) => {
  try {
    const type = (studentType || "all").toLowerCase().trim();
    const audienceFilter = type === 'all' ? '' : `audience.eq.${type}`;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(audienceFilter ? [`audience.eq.${type},audience.eq.all`] : ['audience.eq.all'])
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`[STUDENT ${type}] Fetched ${data?.length || 0} notifications`);
    return { success: true, notifications: data || [] };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};


// ✅ REAL-TIME SUBSCRIPTION
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



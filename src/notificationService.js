import supabase from './supabaseClient';

// Create a new notification
export const createNotification = async (title, message, targetAudience = 'all', expiresAt = null) => {
  try {
<<<<<<< HEAD
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
=======
    // Check for duplicates (same title and message within the last 24 hours)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('title', title)
      .eq('message', message)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (existing) {
      throw new Error('Duplicate notification: Similar notification exists within 24 hours');
    }

    // Insert notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert([{ title, message, target_audience: targetAudience, expires_at: expiresAt }])
>>>>>>> parent of 9e14c56 (Merge branch 'main' of https://github.com/himasree1111/TAL)
      .select()
      .single();

    if (error) throw error;

<<<<<<< HEAD
    return { success: true, notification: data };
=======
    // Get all students based on target audience
    let studentQuery = supabase.from('profiles').select('id').eq('role', 'student');
    if (targetAudience !== 'all') {
      // Add logic for specific targeting if needed
    }

    const { data: students, error: studentError } = await studentQuery;
    if (studentError) throw studentError;
>>>>>>> parent of 9e14c56 (Merge branch 'main' of https://github.com/himasree1111/TAL)

    // Insert user_notifications for each student
    const userNotifications = students.map(student => ({
      notification_id: notification.id,
      student_id: student.id
    }));

    const { error: mappingError } = await supabase
      .from('user_notifications')
      .insert(userNotifications);

    if (mappingError) throw mappingError;

    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

<<<<<<< HEAD

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
=======
// Get notifications for a student
export const getStudentNotifications = async (studentId) => {
>>>>>>> parent of 9e14c56 (Merge branch 'main' of https://github.com/himasree1111/TAL)
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

<<<<<<< HEAD
    const type = (studentType || "all").toLowerCase().trim();

    const filtered = data.filter((notification) => filterNotification(notification, type));

    console.log(`[FETCH] Fetched ${data.length} total, filtered to ${filtered.length} for type "${studentType}"`);
    return { success: true, notifications: filtered };


=======
    // Filter out expired notifications
    const now = new Date();
    const validNotifications = data.filter(item =>
      !item.notifications.expires_at || new Date(item.notifications.expires_at) > now
    );

    return { success: true, notifications: validNotifications };
>>>>>>> parent of 9e14c56 (Merge branch 'main' of https://github.com/himasree1111/TAL)
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

<<<<<<< HEAD

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
=======
// Mark notification as read
export const markNotificationAsRead = async (userNotificationId) => {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', userNotificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Real-time subscription for new notifications
export const subscribeToNotifications = (studentId, callback) => {
  const subscription = supabase
    .channel('user_notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'user_notifications',
      filter: `student_id=eq.${studentId}`
    }, callback)
    .subscribe();

  return subscription;
>>>>>>> parent of 9e14c56 (Merge branch 'main' of https://github.com/himasree1111/TAL)
};
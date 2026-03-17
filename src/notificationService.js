// src/notificationService.js
import supabase from './supabaseClient';

// Create a new notification
export const createNotification = async (title, message, targetAudience = 'all', expiresAt = null) => {
  try {
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
      .select()
      .single();

    if (notifError) throw notifError;

    // Get all students based on target audience
    let studentQuery = supabase.from('profiles').select('id').eq('role', 'student');
    if (targetAudience !== 'all') {
      // Add logic for specific targeting if needed
    }

    const { data: students, error: studentError } = await studentQuery;
    if (studentError) throw studentError;

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

// Get notifications for a student
export const getStudentNotifications = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select(`
        id,
        is_read,
        read_at,
        created_at,
        notifications (
          id,
          title,
          message,
          created_at,
          expires_at
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter out expired notifications
    const now = new Date();
    const validNotifications = data.filter(item =>
      !item.notifications.expires_at || new Date(item.notifications.expires_at) > now
    );

    return { success: true, notifications: validNotifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }
};

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
};
// src/notificationService.js
import supabase from './supabaseClient';

// ✅ CREATE NOTIFICATION
export const createNotification = async (
  title,
  message,
  targetAudience = 'all',
  expiresAt = null
) => {
  try {
    // 🔹 Duplicate check (last 24 hrs)
    const { data: existing, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('title', title.trim().toLowerCase())
      .eq('message', message.trim().toLowerCase())
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      throw new Error('Duplicate notification exists within 24 hours');
    }

    // 🔹 Insert notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert([
        {
          title,
          message,
          audience: targetAudience,
          expires_at: expiresAt || null
        }
      ])
      .select()
      .single();

    if (notifError) throw notifError;

    // 🔹 Get students
    let studentQuery;

    if (targetAudience === "eligible") {
      studentQuery = supabase.from("eligible_students").select("id");
    } else if (targetAudience === "non-eligible") {
      studentQuery = supabase.from("non_eligible_students").select("id");
    } else {
      studentQuery = supabase.from("admin_student_info").select("id");
    }

    const { data: students, error: studentError } = await studentQuery;
    if (studentError) throw studentError;

    if (students && students.length > 0) {
      // 🔹 Batch insert notifications to students in chunks
      const chunkSize = 500;

      for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);

        const batch = chunk.map(student => ({
          notification_id: notification.id,
          student_id: student.id
        }));

        const { error } = await supabase
          .from('user_notifications')
          .insert(batch);

        if (error) throw error;
      }
    }

    return { success: true, notification };

  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

// ✅ GET STUDENT NOTIFICATIONS
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

    // 🔹 Remove expired notifications
    const validNotifications = data.filter(item => {
      const exp = item.notifications?.expires_at;
      return !exp || new Date(exp).getTime() > Date.now();
    });

    return { success: true, notifications: validNotifications };

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }
};

// ✅ MARK AS READ
export const markNotificationAsRead = async (userNotificationId) => {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', userNotificationId);

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// ✅ REAL-TIME SUBSCRIPTION
export const subscribeToNotifications = (studentId, setNotifications) => {
  const subscription = supabase
    .channel('user_notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `student_id=eq.${studentId}`
      },
      async (payload) => {
        // 🔹 Fetch full notification details
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', payload.new.notification_id)
          .single();

        // 🔹 Update UI instantly
        setNotifications(prev => [
          {
            ...payload.new,
            notifications: data
          },
          ...prev
        ]);
      }
    )
    .subscribe();

  return subscription;
};


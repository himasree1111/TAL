/**
 * Authentication Service for Student Login
 * Handles custom auth flow with eligibility checks
 */

import supabase from "./supabaseClient";

/**
 * Check if an email exists in the eligible_students table
 * @param {string} email - Student email to check
 * @returns {Promise<Object|null>} - Student record or null if not found
 */
export const checkEligibility = async (email) => {
  try {
    const { data, error } = await supabase
      .from("eligible_students")
      .select("id, email, auth_id, full_name")
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) {
      console.error("Eligibility check error:", error);
      throw new Error("Error checking eligibility");
    }

    return data;
  } catch (err) {
    console.error("checkEligibility error:", err);
    throw err;
  }
};

/**
 * Sign up a new student with email and password
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @returns {Promise<Object>} - Auth user object with id
 */
export const handleSignup = async (email, password) => {
  try {
    // 1. Create auth user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/student-dashboard`,
      },
    });

    if (error) {
      throw new Error(error.message || "Sign up failed");
    }

    if (!data.user) {
      throw new Error("No user returned from sign up");
    }

    // 2. Store auth_id in eligible_students table
    const { error: updateError } = await supabase
      .from("eligible_students")
      .update({
        auth_id: data.user.id,
      })
      .eq("email", email.trim());

    if (updateError) {
      // If update fails, we need to delete the auth user
      await supabase.auth.admin.deleteUser(data.user.id).catch(() => {});
      throw new Error("Failed to link account");
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    console.error("handleSignup error:", err);
    throw err;
  }
};

/**
 * Sign in an existing student with email and password
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @returns {Promise<Object>} - Auth session object
 */
export const handleLogin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      throw new Error(error.message || "Login failed");
    }

    if (!data.user || !data.session) {
      throw new Error("No session created");
    }

    return {
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    console.error("handleLogin error:", err);
    throw err;
  }
};

/**
 * Verify that the logged-in user exists in eligible_students
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Object|null>} - Student record or null if not found
 */
export const verifyUserAuth = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("eligible_students")
      .select("id, email, full_name, auth_id, status")
      .eq("auth_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Auth verification error:", error);
      throw new Error("Error verifying authentication");
    }

    return data;
  } catch (err) {
    console.error("verifyUserAuth error:", err);
    throw err;
  }
};

/**
 * Check current auth status
 * @returns {Promise<Object|null>} - Current session or null
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Session check error:", error);
      return null;
    }

    return data.session;
  } catch (err) {
    console.error("getCurrentSession error:", err);
    return null;
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message || "Logout failed");
    }

    // Clear local storage
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("isStudentLoggedIn");
    localStorage.removeItem("studentId");
  } catch (err) {
    console.error("handleLogout error:", err);
    throw err;
  }
};

/**
 * Get the currently signed-in user
 * @returns {Promise<Object|null>} - User object or null
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
};

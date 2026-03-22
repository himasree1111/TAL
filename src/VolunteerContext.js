import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const VolunteerContext = createContext();

export const useVolunteer = () => {
  const context = useContext(VolunteerContext);
  if (!context) {
    throw new Error('useVolunteer must be used within VolunteerProvider');
  }
  return context;
};

export const VolunteerProvider = ({ children }) => {
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigateRef = useRef();

  const navigate = useNavigate();
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const fetchVolunteerData = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setVolunteer(null);
        return;
      }

      const user = session.user;
      const email = user.email;
      const metadataName = user.user_metadata?.name;
      
      const { data: profile } = await supabase
        .from('profiles_volunteers')
        .select('full_name, phone, email')
        .eq('id', user.id)
        .single();

      const volunteerData = {
        id: user.id,
        name: profile?.full_name || metadataName || email?.split('@')[0] || 'Volunteer',
        phone: profile?.phone || user.user_metadata?.phone || '',
        email: profile?.email || email,
        metadata: user.user_metadata
      };

      setVolunteer(volunteerData);
    } catch (error) {
      console.error('Error fetching volunteer data:', error);
      setVolunteer(null);
    } finally {
      setLoading(false);
    }
  };

  const updateVolunteerData = async (updates) => {
    try {
      if (!volunteer?.id) return;

      const { error } = await supabase
        .from('profiles_volunteers')
        .upsert({ 
          id: volunteer.id,
          full_name: updates.name || volunteer.name,
          phone: updates.phone || volunteer.phone,
          email: updates.email || volunteer.email,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchVolunteerData();
      return true;
    } catch (error) {
      console.error('Error updating volunteer data:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchVolunteerData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchVolunteerData();
      } else if (event === 'SIGNED_OUT') {
        setVolunteer(null);
        navigateRef.current('/coverpage');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <VolunteerContext.Provider value={{
      volunteer,
      loading,
      fetchVolunteerData,
      updateVolunteerData
    }}>
      {children}
    </VolunteerContext.Provider>
  );
};

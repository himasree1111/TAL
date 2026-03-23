import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from './supabaseClient';
const DonorContext = createContext();


export const useDonor = () => {
  const context = useContext(DonorContext);
  if (!context) {
    throw new Error('useDonor must be used within DonorProvider');
  }
  return context;
};

export const DonorProvider = ({ children }) => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);



  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setDonor(null);
        return;
      }

      const user = session.user;
      const email = user.email;

      // Query donor table directly (SQLite backend pattern)
      const { data: donorData, error: donorError } = await supabase
        .from('profiles_volunteers')
        .select('full_name, phone, email')
        .eq('id', user.id)
        .single();

      
      if (donorError || !donorData) {
        console.warn('Donor not found:', donorError);
        setDonor(null);
        return;
      }

        const donorInfo = donorData;





      const donorDataObj = {
        id: donorInfo?.id || user.id,
        name: donorInfo?.full_name || user.user_metadata?.name || email?.split('@')[0] || 'Donor',

        email: email,
        metadata: user.user_metadata
      };

      setDonor(donorDataObj);
    } catch (error) {
      console.error('Error fetching donor data:', error);
      setDonor(null);
    } finally {
      setLoading(false);
    }
  };

  const updateDonorData = async (updates) => {
    try {
      if (!donor?.id) return false;

      // Update via RPC or direct table (matching backend pattern)
      const { error } = await supabase
        .from('profiles_volunteers')
        .upsert({ 
          id: donor.id,
          full_name: updates.name || donor.name,
          phone: updates.phone || donor.phone,
          email: updates.email || donor.email,
          updated_at: new Date().toISOString()
        });


      if (error) throw error;

      await fetchDonorData();
      return true;
    } catch (error) {
      console.error('Error updating donor data:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchDonorData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchDonorData();
      } else if (event === 'SIGNED_OUT') {
        setDonor(null);
        // navigateRef removed - no navigation here
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <DonorContext.Provider value={{
      donor,
      loading,
      fetchDonorData,
      updateDonorData
    }}>
      {children}
    </DonorContext.Provider>
  );
};


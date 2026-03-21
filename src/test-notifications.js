import React, { useEffect, useState } from 'react';
import supabase from './supabaseClient';
import { getStudentNotifications } from './notificationService';

export default function TestNotifications() {
  const [rawData, setRawData] = useState(null);
  const [type, setType] = useState('eligible');
  const [res, setRes] = useState(null);

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .then(({ data, error }) => {
        console.log('Raw notifications:', data);
        setRawData(data);
      });
  }, []);

  const testFetch = async () => {
    const result = await getStudentNotifications(type);
    console.log('getStudentNotifications result:', result);
    setRes(result);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Test Notifications</h2>
      <button onClick={testFetch}>Test getStudentNotifications({type})</button>
      <button onClick={() => setType('eligible')}>Eligible</button>
      <button onClick={() => setType('non-eligible')}>Non-eligible</button>
      <button onClick={() => setType('all')}>All</button>
      
      <h3>Raw data from table:</h3>
      <pre>{JSON.stringify(rawData, null, 2)}</pre>
      
      <h3>Test result:</h3>
      <pre>{JSON.stringify(res, null, 2)}</pre>
    </div>
  );
}


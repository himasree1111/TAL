import React, { createContext, useContext, useState, useEffect } from 'react';

const StudentContext = createContext();

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within StudentProvider');
  }
  return context;
};

export const StudentProvider = ({ children }) => {
  const [studentEmail, setStudentEmail] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('studentEmail');
    if (email) {
      setStudentEmail(email);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('studentEmail');
    localStorage.removeItem('isStudentLoggedIn');
    setStudentEmail(null);
  };

  return (
    <StudentContext.Provider value={{ studentEmail, setStudentEmail, logout }}>
      {children}
    </StudentContext.Provider>
  );
};


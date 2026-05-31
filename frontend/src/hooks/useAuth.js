import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(null);
  }, []);

  return { user };
};

export default useAuth;

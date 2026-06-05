import { useEffect } from 'react';

export default function Register() {
  useEffect(() => {
    window.location.href = '/login';
  }, []);

  return null;
}

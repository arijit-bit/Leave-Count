"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-70px)]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email or Phone Number</label>
          <input 
            type="text" 
            required 
            autoComplete="username"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            required 
            autoComplete="current-password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
          Login
        </button>
        
        <p className="mt-4 text-sm text-center">
          Don't have an account? <Link href="/register" className="text-indigo-600 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}

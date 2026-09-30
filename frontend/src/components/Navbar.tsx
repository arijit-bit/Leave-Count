"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          Leave Tracker
        </Link>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href="/login" className="text-indigo-600 hover:underline">
                Login
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

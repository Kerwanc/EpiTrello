'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { Button } from './Button';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-[#D9CDB5] shadow-sm border-b border-[#C4B89A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">EpiTrello</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/boards"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-bold"
                >
                  Boards
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 font-bold">
                    {user?.username}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

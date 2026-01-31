'use client';

import Link from 'next/link';
import { useAuth } from './components/AuthProvider';
import { Button } from './components/Button';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">EpiTrello</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Organize your tasks, collaborate with your team, and get more done.
        </p>

        {isAuthenticated ? (
          <Link href="/boards">
            <Button size="lg">Go to My Boards</Button>
          </Link>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="primary">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Login
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">Organize Tasks</h3>
            <p className="text-gray-600">
              Create boards, lists, and cards to organize your work
            </p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Collaborate</h3>
            <p className="text-gray-600">
              Share boards with your team and work together
            </p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">Get Things Done</h3>
            <p className="text-gray-600">
              Track progress and complete tasks efficiently
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

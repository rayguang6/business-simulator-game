'use client';

import { useState, FormEvent } from 'react';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onProfileSubmit: (email: string, username: string) => Promise<void>; 
  isSubmitting: boolean;
}

export default function ProfileSetupModal({
  isOpen,
  onProfileSubmit,
  isSubmitting,
}: ProfileSetupModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !username.trim()) {
      setError('Email and Username are required.');
      return;
    }
    // Basic email validation (can be more sophisticated)
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    try {
      await onProfileSubmit(email.trim(), username.trim());
      // Parent component will handle closing the modal on successful submission
    } catch (err: any) { 
      console.error("[ProfileSetupModal] Submission error:", err);
      setError(err.message || 'Failed to set up profile. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold text-white mb-6 text-center">Set Up Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-700 text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
              Username <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-700 text-white rounded-md border border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              placeholder="YourGamerTag"
              required
              disabled={isSubmitting}
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !username.trim()}
            className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
} 
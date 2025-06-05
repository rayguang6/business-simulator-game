"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { UserProfileService } from '@/lib/services/userProfileService';

export default function HomePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await UserProfileService.getCurrentUserAndProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
      setIsLoading(false);
    };
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await UserProfileService.signOut();
    setUserProfile(null);
  };

  const handleProfileSubmit = async (email: string, username: string) => {
    setIsSubmitting(true);
    try {
      const newProfile = await UserProfileService.signUpOrSignInAndCreateProfile(email, username);
      setUserProfile(newProfile);
      setShowProfileModal(false);
    } catch (error) {
      // Error is handled in modal
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <p className="text-white text-xl">Loading...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Business Simulator</h1>
            <p className="text-indigo-200">Build your empire from scratch</p>
          </div>
          <div className="p-6 space-y-4">
            <motion.button
              onClick={() => {
                if (userProfile) {
                  router.push('/play');
                } else {
                  setShowProfileModal(true);
                }
              }}
              className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Play Game
            </motion.button>

            {userProfile ? (
              <div className="text-center p-4 bg-slate-700 rounded-lg">
                <p className="text-slate-300 text-sm">Logged in as:</p>
                <p className="text-white font-semibold">{userProfile.display_name || userProfile.username}</p>
                {userProfile.email && <p className="text-slate-400 text-xs">({userProfile.email})</p>}
                <button 
                  onClick={handleSignOut}
                  className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowProfileModal(true)}
                className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Login / Create Profile
              </motion.button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <motion.button
                onClick={() => router.push('/leaderboard')}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🏆 Leaderboard
              </motion.button>

              <motion.button
                onClick={() => router.push('/stats')}
                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                📊 Stats
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      {showProfileModal && (
        <ProfileSetupModal
          isOpen={true}
          onProfileSubmit={handleProfileSubmit}
          isSubmitting={isSubmitting}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
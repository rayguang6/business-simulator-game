// components/home/IndustrySelector.tsx
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import ProfileSetupModal from '../ProfileSetupModal'; // Adjusted path if necessary
import { UserProfileService } from '@/lib/services/userProfileService';
import { GameSessionService } from '@/lib/services/gameSessionService';

export default function IndustrySelector({ industries }: { industries: Industry[] }) {
  const router = useRouter();
  const setSelectedIndustry = useGameStore((state) => state.setSelectedIndustry);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('[IndustrySelector] useEffect: Attempting to fetch initial profile...');
      setIsLoadingProfile(true);
      try {
        const profile = await UserProfileService.getCurrentUserAndProfile();
        console.log('[IndustrySelector] useEffect: Fetched initial profile:', profile);
        if (profile && profile.username) { // Ensure profile and username exist
          setUserProfile(profile);
          setShowProfileModal(false); 
        } else {
          console.log('[IndustrySelector] useEffect: No valid profile found, showing modal.');
          setShowProfileModal(true); 
        }
      } catch (error) {
        console.error('[IndustrySelector] useEffect: Error fetching profile:', error);
        setShowProfileModal(true); // Show modal on error too
      }
      setIsLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (email: string, username: string) => {
    console.log(`[IndustrySelector] handleProfileSubmit with email: ${email}, username: ${username}`);
    setIsSubmittingProfile(true);
    try {
      const newProfile = await UserProfileService.signUpOrSignInAndCreateProfile(email, username);
      if (newProfile) {
        console.log('[IndustrySelector] Profile setup success:', newProfile);
        setUserProfile(newProfile);
        setShowProfileModal(false);
      } else {
        console.error('[IndustrySelector] Profile submission failed or returned null.');
        // The modal itself will show an error, but we log here too.
        // Potentially set a local error state if needed for UI feedback outside modal
      }
    } catch (error: any) {
      console.error('[IndustrySelector] Error during profile submission process:', error);
      // Error will be displayed in the modal by its own state
      // throw error; // Re-throwing will propagate to modal if it needs to handle it further
    }
    setIsSubmittingProfile(false);
  };
  
  const startGame = async (industry: Industry) => {
    if (!userProfile || !userProfile.username) { 
      setShowProfileModal(true); 
      return;
    }
    if (industry.isAvailable) {
      setSelectedIndustry(industry); 
      router.push(`/${industry.id}`);
    }
  };

  const showStats = async () => {
    if (!userProfile || !userProfile.username) {
      // If signOut is available and makes sense, could offer to sign out or just prompt to set up.
      // For now, just guiding to profile setup if not done.
      const shouldSetup = confirm("You need a profile to see personalized stats. Set up now?");
      if (shouldSetup) {
        setShowProfileModal(true);
      } else {
        // Optionally, navigate to generic stats or home if user declines profile setup.
        // For now, we just go to stats, which might be empty or generic.
        router.push('/stats');
      }
      return;
    }
    router.push('/stats');
  };

  const handleSignOut = async () => {
    console.log('[IndustrySelector] Attempting sign out...');
    await UserProfileService.signOut();
    setUserProfile(null);
    setShowProfileModal(true); // Show profile modal after sign out for new user/sign in
    console.log('[IndustrySelector] User signed out, profile modal will be shown.');
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-xl">Loading Your Profile...</p>
      </div>
    );
  }

  // If not loading, and modal should be shown OR (still no user profile AND modal isn't explicitly false)
  if (showProfileModal || (!userProfile && showProfileModal !== false)) {
    return (
      <ProfileSetupModal
        isOpen={true} 
        onProfileSubmit={handleProfileSubmit}
        isSubmitting={isSubmittingProfile}
      />
    );
  }

  // Render main UI only if profile exists and modal is not shown
  return (
    <div className="space-y-3">
      {userProfile && userProfile.username && (
        <div className="mb-6 p-4 bg-slate-800 rounded-lg text-center">
          <p className="text-slate-300 text-sm">Playing as:</p>
          <p className="text-white font-semibold text-lg">{userProfile.display_name || userProfile.username}</p>
          {userProfile.email && <p className="text-slate-400 text-xs">({userProfile.email})</p>}
          <button 
            onClick={handleSignOut}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Sign Out
          </button>
        </div>
      )}

      <motion.button
        onClick={showStats}
        className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-indigo-500 transition-all duration-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        📊 View Stats {userProfile && userProfile.username ? `(as ${userProfile.display_name || userProfile.username})` : ""}
      </motion.button>

      <motion.button
        onClick={() => router.push('/leaderboard')}
        className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg border border-purple-500 transition-all duration-200 mt-3"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        🏆 View Leaderboard
      </motion.button>

      {industries.map((industry: Industry) => {
        return (
          <motion.button
            key={industry.id}
            onClick={() => startGame(industry)}
            className={`cursor-pointer w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 shadow-md 
              ${
                industry.isAvailable
                  ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 hover:border-indigo-400'
                  : 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed opacity-70'
              }`}
            whileHover={{ scale: industry.isAvailable ? 1.02 : 1 }}
            whileTap={{ scale: industry.isAvailable ? 0.98 : 1 }}
            disabled={!userProfile || !userProfile.username} // Disable if no profile
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">{industry.icon}</span>
              <div className="text-left">
                <div className="flex items-center">
                  <span className="font-semibold text-white">{industry.name}</span>
                  {!industry.isAvailable && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded-full">Coming Soon</span>
                  )}
                </div>
                {industry.isAvailable && (
                  <div className="flex space-x-3 mt-1">
                    <span className="text-xs text-amber-300">💰 ${industry.startingCash.toLocaleString()}</span>
                    <span className="text-xs text-green-300">📈 ${industry.startingRevenue.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
            {industry.isAvailable && <span className="text-blue-400 text-lg">→</span>}
          </motion.button>
        );
      })}
    </div>
  );
}
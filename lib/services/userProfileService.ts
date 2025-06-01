import { supabase } from '../supabase';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';

// A placeholder password - in a real app, use secure password handling or passwordless auth.
const DUMMY_PASSWORD = 'SupabasePassword123!';

export class UserProfileService {
  static async getCurrentAuthUser(): Promise<SupabaseUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[UserProfileService] Error fetching current auth user:', error.message);
      return null;
    }
    return user;
  }

  static async getProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error, status } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 means no rows found, which is fine for a new user
        console.error('[UserProfileService] Error fetching profile by ID:', error.message);
        return null;
      }
      return data as UserProfile;
    } catch (err: any) {
      console.error('[UserProfileService] Unexpected error in getProfileById:', err.message);
      return null;
    }
  }
  
  /**
   * Signs up a new user with email and a DUMMY password, then creates their profile.
   * If user already exists, it attempts to sign them in and update their profile.
   */
  static async signUpOrSignInAndCreateProfile(email: string, username: string): Promise<UserProfile | null> {
    console.log(`[UserProfileService] Attempting signUpOrSignIn for email: ${email}, username: ${username}`);
    let authUser: SupabaseUser | null = null;
    let session = null;

    // Try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: DUMMY_PASSWORD, // In real app, get password from user or use magic link
    });

    if (signUpError) {
      // Check if error is because user already exists
      if (signUpError.message.includes('User already registered') || (signUpError as AuthError).status === 400 || (signUpError as AuthError).status === 422) {
        console.log('[UserProfileService] User already exists, attempting sign-in for:', email);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: DUMMY_PASSWORD, // Use the same dummy password
        });

        if (signInError) {
          console.error('[UserProfileService] Error signing in existing user:', signInError.message);
          throw new Error(`Failed to sign in: ${signInError.message}`);
        }
        authUser = signInData.user;
        session = signInData.session;
        console.log('[UserProfileService] Existing user signed in successfully:', authUser?.id);
      } else {
        console.error('[UserProfileService] Error signing up new user:', signUpError.message);
        throw new Error(`Failed to sign up: ${signUpError.message}`);
      }
    } else {
      authUser = signUpData.user;
      session = signUpData.session;
      console.log('[UserProfileService] New user signed up successfully:', authUser?.id);
    }

    if (!authUser || !session) {
      console.error('[UserProfileService] Auth user or session is null after sign-up/sign-in attempt.');
      throw new Error('Authentication failed. User or session is missing.');
    }

    // Now, create or update the profile in user_profiles table
    const userId = authUser.id;
    const existingProfile = await this.getProfileById(userId);

    let finalProfileData: UserProfile | null = null;

    if (existingProfile) {
      console.log(`[UserProfileService] Profile exists for ${userId}. Updating username if different.`);
      if (existingProfile.username !== username || !existingProfile.display_name) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ username: username, display_name: username, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single();
        if (updateError) {
          console.error('[UserProfileService] Error updating profile:', updateError.message);
          // Return existing profile data even if update fails, but log error
          finalProfileData = { ...existingProfile, email: authUser.email };
        } else {
          console.log('[UserProfileService] Profile updated successfully:', updatedProfile);
          finalProfileData = { ...(updatedProfile as UserProfile), email: authUser.email };
        }
      } else {
        finalProfileData = { ...existingProfile, email: authUser.email };
      }
    } else {
      console.log(`[UserProfileService] No profile exists for ${userId}. Creating new profile.`);
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username: username,
          display_name: username, // Default display_name to username
          email: authUser.email // Store email from auth user if desired
        })
        .select()
        .single();
      if (insertError) {
        console.error('[UserProfileService] Error inserting new profile:', insertError.message);
        // If profile creation fails, this is a problem. We might want to sign the user out or handle differently.
        // For now, we throw an error, which the modal can catch.
        await supabase.auth.signOut(); // Clean up auth session if profile fails
        throw new Error(`Failed to create profile in database: ${insertError.message}`);
      }
      console.log('[UserProfileService] New profile created successfully:', newProfile);
      finalProfileData = { ...(newProfile as UserProfile), email: authUser.email };
    }
    return finalProfileData;
  }

  static async getCurrentUserAndProfile(): Promise<UserProfile | null> {
    const authUser = await this.getCurrentAuthUser();
    if (!authUser) {
      return null;
    }
    const profile = await this.getProfileById(authUser.id);
    if (!profile || !profile.username) { // Ensure profile exists and is valid
      console.warn(`[UserProfileService] User ${authUser.id} is authenticated, but no valid profile found.`);
      // Potentially attempt to create a profile here if one is missing but auth user exists?
      // For now, returning null means the profile setup modal should appear.
      return null;
    }
    return { ...profile, email: authUser.email }; // Combine profile with auth user's email
  }

  static async signOut(): Promise<void> {
    console.log('[UserProfileService] Attempting signOut...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[UserProfileService] Error signing out:', error.message);
    }
  }
} 
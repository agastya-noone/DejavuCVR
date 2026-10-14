import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  testConnectionAndReadWrite,
  ConnectionVerificationResult
} from '../lib/firebase';
import { getUserProfile, setUserProfile } from '../lib/timetableService';
import { UserProfile, UserRole } from '../types';

// Admin email bootstrapped from environment
export const BOOTSTRAP_ADMIN_EMAIL = 'agastya752@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  connectionResult: ConnectionVerificationResult | null;
  demoModeActive: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  verifyLiveReadWrite: () => Promise<ConnectionVerificationResult>;
  setDemoPersona: (role: UserRole, batchId?: string, facultyId?: string, name?: string) => void;
  clearDemoPersona: () => void;
  updateCurrentUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [connectionResult, setConnectionResult] = useState<ConnectionVerificationResult | null>(null);
  const [demoPersona, setDemoPersonaState] = useState<UserProfile | null>(null);

  // Check connection on boot
  useEffect(() => {
    testConnectionAndReadWrite().then((res) => {
      setConnectionResult(res);
      setIsFirebaseConnected(res.connected);
    });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Perform live read/write verification now that user is signed in
          testConnectionAndReadWrite().then((res) => {
            setConnectionResult(res);
            setIsFirebaseConnected(res.connected);
          });

          let profile = await getUserProfile(user.uid);
          const isAdminEmail = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

          if (!profile) {
            // New user registration
            const newProf: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: isAdminEmail ? 'admin' : 'student',
              createdAt: new Date().toISOString()
            };
            if (!isAdminEmail) {
              newProf.batchId = 'batch_demo_alpha';
            }
            await setUserProfile(newProf);
            profile = newProf;
          } else if (isAdminEmail && profile.role !== 'admin') {
            // Guarantee admin access for bootstrap email
            profile = {
              ...profile,
              role: 'admin'
            };
            await setUserProfile(profile);
          }
          setUserProfileState(profile);
        } catch (err) {
          console.error('Error fetching/setting user profile:', err);
        }
      } else {
        setUserProfileState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      console.error('Email Sign In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    requestedRole?: UserRole
  ) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      const isAdminEmail = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      // Default new users to student unless admin email, preventing privilege escalation
      const assignedRole: UserRole = isAdminEmail ? 'admin' : (requestedRole === 'teacher' ? 'student' : 'student');

      const newProfile: UserProfile = {
        id: user.uid,
        email,
        displayName: displayName || email.split('@')[0],
        role: assignedRole,
        createdAt: new Date().toISOString()
      };
      if (assignedRole === 'student') {
        newProfile.batchId = 'batch_demo_alpha';
      }

      await setUserProfile(newProfile);
      setUserProfileState(newProfile);
    } catch (err: unknown) {
      console.error('Email Registration Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setDemoPersonaState(null);
    await signOut(auth);
    setUserProfileState(null);
  };

  const verifyLiveReadWrite = async (): Promise<ConnectionVerificationResult> => {
    const res = await testConnectionAndReadWrite();
    setConnectionResult(res);
    setIsFirebaseConnected(res.connected);
    return res;
  };

  const setDemoPersona = (role: UserRole, batchId?: string, facultyId?: string, name?: string) => {
    const simulatedProfile: UserProfile = {
      id: `demo_${role}_${Date.now()}`,
      email: `${role}.demo@synchroniq.campus`,
      displayName: name || (role === 'admin' ? 'Campus Timetable Administrator' : role === 'teacher' ? 'Dr. Evelyn Vance [Demo]' : 'Student [Batch Alpha]'),
      role,
      createdAt: new Date().toISOString()
    };
    if (role === 'student') {
      simulatedProfile.batchId = batchId || 'batch_demo_alpha';
    } else if (role === 'teacher') {
      simulatedProfile.facultyId = facultyId || 'fac_demo_vance';
    }
    setDemoPersonaState(simulatedProfile);
  };

  const clearDemoPersona = () => {
    setDemoPersonaState(null);
  };

  const updateCurrentUserProfile = async (data: Partial<UserProfile>) => {
    if (!effectiveProfile) return;
    const updated = { ...effectiveProfile, ...data, updatedAt: new Date().toISOString() };
    if (demoPersona) {
      setDemoPersonaState(updated);
    } else {
      await setUserProfile(updated);
      setUserProfileState(updated);
    }
  };

  const effectiveProfile = demoPersona || userProfile;
  const effectiveRole = effectiveProfile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile: effectiveProfile,
        role: effectiveRole,
        loading,
        isFirebaseConnected,
        connectionResult,
        demoModeActive: !!demoPersona,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        verifyLiveReadWrite,
        setDemoPersona,
        clearDemoPersona,
        updateCurrentUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

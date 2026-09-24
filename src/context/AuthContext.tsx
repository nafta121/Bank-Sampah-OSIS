import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuthListener,
  signInWithGoogle,
  logoutFirebase,
  getCachedAccessToken,
} from '../services/firebase.ts';
import { ClassProfile } from '../types/index.ts';

export type UserRole = 'admin_osis' | 'class_rep' | 'guest';

export interface CurrentAuthUser {
  role: UserRole;
  displayName: string;
  email?: string | null;
  classId?: string;
  className?: string;
  isFirebaseUser?: boolean;
}

interface AuthContextType {
  currentUser: CurrentAuthUser;
  firebaseUser: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginAsAdminGoogle: () => Promise<void>;
  loginAsAdminPin: (pin: string) => boolean;
  loginAsClass: (cls: ClassProfile, pin: string) => boolean;
  loginWithUsernameAndPin: (
    username: string,
    pin: string,
    classes: ClassProfile[]
  ) => { success: boolean; error?: string };
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentAuthUser>(() => {
    const saved = localStorage.getItem('bank_sampah_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'admin_osis' || parsed.role === 'class_rep')) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    // Default to guest so Login Page is displayed first
    return {
      role: 'guest',
      displayName: 'Pengunjung Bank Sampah',
    };
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setFirebaseUser(user);
        setAccessToken(token || getCachedAccessToken());
        if (currentUser.role === 'admin_osis') {
          setCurrentUser((prev) => ({
            ...prev,
            displayName: user.displayName || 'Pengurus OSIS',
            email: user.email,
            isFirebaseUser: true,
          }));
        }
      },
      () => {
        setFirebaseUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, [currentUser.role]);

  // Persist current session
  useEffect(() => {
    localStorage.setItem('bank_sampah_active_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const loginAsAdminGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      setFirebaseUser(res.user);
      setAccessToken(res.accessToken);
      const userObj: CurrentAuthUser = {
        role: 'admin_osis',
        displayName: res.user.displayName || 'Admin OSIS Terverifikasi',
        email: res.user.email,
        isFirebaseUser: true,
      };
      setCurrentUser(userObj);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdminPin = (pin: string): boolean => {
    // Default master PIN for OSIS staff is 1234
    if (pin === '1234' || pin === '0000') {
      const userObj: CurrentAuthUser = {
        role: 'admin_osis',
        displayName: 'Pengurus OSIS (PIN Mode)',
        email: 'osis.banksampah@sekolah.sch.id',
      };
      setCurrentUser(userObj);
      return true;
    }
    return false;
  };

  const loginAsClass = (cls: ClassProfile, pin: string): boolean => {
    // Accepts PIN 123456 as standard, cls.pin, or 1234
    const validPins = ['123456', '1234', cls.pin];
    if (validPins.includes(pin.trim())) {
      const userObj: CurrentAuthUser = {
        role: 'class_rep',
        displayName: cls.name,
        classId: cls.classId,
        className: cls.name,
      };
      setCurrentUser(userObj);
      return true;
    }
    return false;
  };

  const loginWithUsernameAndPin = (
    username: string,
    pin: string,
    classes: ClassProfile[]
  ): { success: boolean; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUser) {
      return { success: false, error: 'Silakan masukkan username kelas' };
    }

    // Match by username or classId or clean format (e.g. x-mipa-1, X-MIPA-1, xmipa1)
    const matchedClass = classes.find((c) => {
      const u = (c.username || '').toLowerCase();
      const id = c.classId.toLowerCase();
      const strippedId = id.replace(/[^a-z0-9]/g, '');
      const strippedInput = cleanUser.replace(/[^a-z0-9]/g, '');
      return (
        u === cleanUser ||
        id === cleanUser ||
        strippedId === strippedInput ||
        c.name.toLowerCase().includes(cleanUser)
      );
    });

    if (!matchedClass) {
      return {
        success: false,
        error: `Username "${username}" tidak ditemukan. Contoh: x-mipa-1, x-mipa-2, xi-mipa-1`,
      };
    }

    const validPins = ['123456', '1234', matchedClass.pin];
    if (!validPins.includes(cleanPin)) {
      return {
        success: false,
        error: 'PIN salah! Gunakan PIN default standar: 123456',
      };
    }

    const userObj: CurrentAuthUser = {
      role: 'class_rep',
      displayName: matchedClass.name,
      classId: matchedClass.classId,
      className: matchedClass.name,
    };
    setCurrentUser(userObj);
    return { success: true };
  };

  const logout = async () => {
    await logoutFirebase();
    setFirebaseUser(null);
    setAccessToken(null);
    const guestObj: CurrentAuthUser = {
      role: 'guest',
      displayName: 'Pengunjung Bank Sampah',
    };
    setCurrentUser(guestObj);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        accessToken,
        isLoading,
        isAuthenticated: currentUser.role !== 'guest',
        loginAsAdminGoogle,
        loginAsAdminPin,
        loginAsClass,
        loginWithUsernameAndPin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

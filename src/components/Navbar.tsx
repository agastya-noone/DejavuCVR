import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  LogOut,
  UserCheck,
  Shield,
  GraduationCap,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefreshData, isRefreshing }) => {
  const { currentUser, userProfile, role, logout, setDemoPersona, demoModeActive, isFirebaseConnected } = useAuth();

  const getRoleBadge = (r: UserRole | null) => {
    switch (r) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Shield className="w-3 h-3 text-violet-400" />
            Administrator
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <UserCheck className="w-3 h-3 text-blue-400" />
            Faculty
          </span>
        );
      case 'student':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <GraduationCap className="w-3 h-3 text-emerald-400" />
            Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SYNCHRONIQ
              </span>
              <span className="hidden sm:inline-block text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-400 border border-indigo-800/40">
                Campus Solve
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Scheduling. Zero Avoidable Conflicts.
            </p>
          </div>
        </div>

        {/* Center / Role Switcher for Hackathon Judges & Testing */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Quick Persona:
          </span>
          <button
            onClick={() => setDemoPersona('admin', undefined, undefined, 'Campus Administrator')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setDemoPersona('teacher', undefined, 'fac_demo_vance', 'Dr. Evelyn Vance [Demo]')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              role === 'teacher'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Faculty (Dr. Vance)
          </button>
          <button
            onClick={() => setDemoPersona('student', 'batch_demo_alpha', undefined, 'Student [Batch Alpha]')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              role === 'student' && userProfile?.batchId === 'batch_demo_alpha'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Student (Batch Alpha)
          </button>
          <button
            onClick={() => setDemoPersona('student', 'batch_demo_beta', undefined, 'Student [Batch Beta]')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              role === 'student' && userProfile?.batchId === 'batch_demo_beta'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Student (Batch Beta)
          </button>
        </div>

        {/* Right Section: Status, Profile & Sign Out */}
        <div className="flex items-center gap-3">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              title="Refresh timetable from Firestore"
              aria-label="Refresh timetable from Firestore"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}

          {/* Connection status indicator */}
          <div
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800/80"
            title={isFirebaseConnected ? 'Cloud Firestore Persistent' : 'Connecting to Firestore'}
          >
            {isFirebaseConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 hidden md:inline text-[11px] font-medium">Firestore Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 hidden md:inline text-[11px]">Connecting</span>
              </>
            )}
          </div>

          {/* User profile pill */}
          <div className="flex items-center gap-2 pl-1">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {userProfile?.displayName || currentUser?.displayName || 'User'}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {getRoleBadge(role)}
                {demoModeActive && (
                  <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-1 rounded border border-amber-500/20">
                    Demo
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 text-slate-400 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

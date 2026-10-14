import React, { useState } from 'react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../../context/AuthContext';
import {
  Calendar,
  Shield,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Mail,
  KeyRound,
  UserPlus,
  LogIn,
  AlertCircle,
  WifiOff
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    setDemoPersona,
    isFirebaseConnected
  } = useAuth();

  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setAuthError(err?.message || 'Failed to sign in with Google. Please check browser popups.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'email_login') {
        await loginWithEmail(email, password);
      } else if (authMode === 'email_register') {
        await registerWithEmail(email, password, displayName);
        setAuthSuccess('Account registered successfully! Accessing campus portal...');
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Email/Password provider is not yet enabled in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Email/Password and enable it.'
        );
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. Please verify your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please switch to the Sign In tab.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else {
        setAuthError(err?.message || 'Authentication error. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SYNCHRONIQ
              </span>
              <span className="ml-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Academic Administration
              </span>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
              {isFirebaseConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-slate-700 font-medium">Cloud Firestore Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700">Connecting Database</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row items-center gap-12 my-auto">
        {/* Left Side: Product Value & Institutional Pillars */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
            Institutional Timetable Scheduling Platform
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Automated Academic Scheduling. <br />
            <span className="text-blue-700">
              Constraint-Verified & Conflict-Free.
            </span>
          </h1>

          <p className="text-sm text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            SYNCHRONIQ provides automated timetable generation with strict constraint validation,
            preventing room, faculty, and student cohort double-bookings with live Cloud Firestore synchronization.
          </p>

          {/* Pillars List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Conflict Prevention:</span>
                <p className="text-slate-600">Strict non-overlap checks for instructors, classrooms, and batches.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Laboratory Facility Mapping:</span>
                <p className="text-slate-600">Practical modules automatically mapped to laboratory facilities.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Room Capacity Verification:</span>
                <p className="text-slate-600">Enforces seating thresholds to prevent overcrowding.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Role-Based Security:</span>
                <p className="text-slate-600">Audited access for Administrators, Faculty, and Students.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="w-full max-w-md">
          <div className="p-7 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-2 border border-slate-200">
                <Lock className="w-5 h-5 text-slate-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Portal Authentication</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sign in with institutional credentials or authorized evaluator account
              </p>
            </div>

            {/* Error & Success Messages */}
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-tight">{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="leading-tight">{authSuccess}</span>
              </div>
            )}

            {/* Auth Method Navigation Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('google');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  authMode === 'google'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email_login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  authMode === 'email_login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email_register');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  authMode === 'email_register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* Tab 1: Google Sign In */}
            {authMode === 'google' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {loading ? 'Signing in with Google...' : 'Sign in with Google'}
                </button>

                <div className="text-center pt-1">
                  <span className="text-[11px] text-slate-500">
                    Administrator email: <span className="text-slate-800 font-mono font-medium">{BOOTSTRAP_ADMIN_EMAIL}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2 & 3: Email / Password Auth Form */}
            {(authMode === 'email_login' || authMode === 'email_register') && (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'email_register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="w-full bg-white text-xs text-slate-900 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@campus.edu"
                      className="w-full bg-white text-xs text-slate-900 pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white text-xs text-slate-900 pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  {authMode === 'email_login' ? (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      {loading ? 'Signing In...' : 'Sign In with Email'}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      {loading ? 'Creating Account...' : 'Register Student Account'}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2.5 text-slate-500 font-semibold tracking-wider">
                  Quick Access
                </span>
              </div>
            </div>

            {/* Quick Demo Access for Hackathon Judges */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-200 text-slate-800">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Sign In as Administrator (Google)
                    </h4>
                    <p className="text-[10px] text-slate-500">Authorized administrative access</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => setDemoPersona('teacher', undefined, 'fac_demo_vance', 'Dr. Evelyn Vance [Demo]')}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Preview Faculty View (Dr. Evelyn Vance)
                    </h4>
                    <p className="text-[10px] text-slate-500">Assigned lectures & availability</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => setDemoPersona('student', 'batch_demo_alpha', undefined, 'Student [Batch Alpha]')}
                className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Preview Student View (Batch Alpha)
                    </h4>
                    <p className="text-[10px] text-slate-500">Cohort timetable & daily sessions</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        SYNCHRONIQ • Academic Timetable Management System
      </footer>
    </div>
  );
};

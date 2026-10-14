import React, { useState } from 'react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL } from '../../context/AuthContext';
import {
  Calendar,
  Sparkles,
  Shield,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Mail,
  KeyRound,
  UserPlus,
  LogIn,
  AlertCircle,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    setDemoPersona,
    isFirebaseConnected,
    connectionResult
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambience & Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              SYNCHRONIQ
            </span>
            <span className="ml-2 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-400 border border-indigo-800/40">
              Campus Solve Track
            </span>
          </div>
        </div>

        {/* Live Firestore Connection Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            {isFirebaseConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">Cloud Firestore Active</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Connecting to Firebase</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row items-center gap-12">
        {/* Left Side: Product Value & Scheduling Pillars */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            DejaVu Hackathon • Campus Solve Track
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Intelligent Scheduling. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Zero Avoidable Conflicts.
            </span>
          </h1>

          <p className="text-base text-slate-400 max-w-xl mx-auto lg:mx-0">
            SYNCHRONIQ is a production-grade academic timetable management system with role-based access, automated
            multi-constraint scheduling, and persistent Cloud Firestore synchronization.
          </p>

          {/* Pillars List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">Zero Double-Booking:</span>
                <p className="text-slate-400">Strictly prevents faculty, room, and batch collisions.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">Laboratory Guarantee:</span>
                <p className="text-slate-400">Practical lab subjects automatically mapped to lab facilities.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">Capacity Enforcement:</span>
                <p className="text-slate-400">Ensures classrooms fit enrolled batch numbers.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">ABAC Security:</span>
                <p className="text-slate-400">Cloud Firestore Security Rules for Students, Teachers & Admins.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Unified Authentication Card */}
        <div className="w-full max-w-md">
          <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative">
            <div className="text-center mb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-2.5 border border-indigo-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Campus Portal Access</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Firebase Authentication & Cloud Firestore persistent database
              </p>
            </div>

            {/* Error & Success Messages */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-tight">{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-tight">{authSuccess}</span>
              </div>
            )}

            {/* Auth Method Navigation Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('google');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  authMode === 'google'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Auth
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email_login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  authMode === 'email_login'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Email Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email_register');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  authMode === 'email_register'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
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
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {loading ? 'Authenticating with Google...' : 'Sign in with Google'}
                </button>

                <div className="text-center pt-1">
                  <span className="text-[10px] text-slate-500">
                    Administrator bootstrap email: <span className="text-indigo-400 font-mono">{BOOTSTRAP_ADMIN_EMAIL}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2 & 3: Email / Password Auth Form */}
            {(authMode === 'email_login' || authMode === 'email_register') && (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'email_register' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Jordan Smith"
                      className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@campus.edu"
                      className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
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
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-semibold tracking-wider">
                  Evaluator Fast-Track
                </span>
              </div>
            </div>

            {/* Quick Demo Access for Hackathon Judges */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 text-center mb-1">
                One-click access (signs in to live Cloud Firestore):
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full p-2 rounded-xl bg-violet-950/30 hover:bg-violet-900/50 border border-violet-700/50 text-left flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-violet-300">
                      Sign in as Campus Administrator (Google)
                    </h4>
                    <p className="text-[9px] text-violet-300/80">Authorized admin access to load demo data & manage schedule</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => setDemoPersona('teacher', undefined, 'fac_demo_vance', 'Dr. Evelyn Vance [Demo]')}
                className="w-full p-2 rounded-xl bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/40 text-left flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300">
                      Preview Faculty Dashboard (Dr. Evelyn Vance)
                    </h4>
                    <p className="text-[9px] text-slate-400">Operating Systems • Teaching capacity & office hours</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => setDemoPersona('student', 'batch_demo_alpha', undefined, 'Student [Batch Alpha]')}
                className="w-full p-2 rounded-xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-left flex items-center justify-between transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Preview Student Dashboard (Batch Alpha)
                    </h4>
                    <p className="text-[9px] text-slate-400">Personal weekly lectures & today's schedule</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-3.5 text-center text-[11px] text-slate-500">
        SYNCHRONIQ • Intelligent Scheduling. Zero Avoidable Conflicts. • Cloud Firestore & Firebase Auth
      </footer>
    </div>
  );
};

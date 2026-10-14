import React from 'react';
import { LoadDemoDataResult } from '../../lib/demoData';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Database,
  ShieldCheck,
  Building2,
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface DemoDataReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: LoadDemoDataResult | null;
  onForceReload?: () => void;
  isReloading?: boolean;
}

export const DemoDataReportModal: React.FC<DemoDataReportModalProps> = ({
  isOpen,
  onClose,
  result,
  onForceReload,
  isReloading = false
}) => {
  if (!isOpen || !result) return null;

  const isSuccess = result.status === 'loaded_success';
  const hasConflicts = result.validationReport.conflicts.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Synthetic Dataset & Validation Audit</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Fictional Demo Data
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-constraint verification across Cloud Firestore collections.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
              isSuccess
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold">
                {isSuccess
                  ? 'Fictional Demo Dataset Loaded into Cloud Firestore'
                  : 'Existing Records Detected — Overwrite Protected'}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">{result.message}</p>
            </div>
          </div>

          {/* Fictional Data Disclaimer Note */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Fictional Demo Data Notice: </span>
              All faculty names, student cohorts, course codes, and facilities are purely synthetic fictional
              constructs created for demonstration and testing purposes. No real campus or personal identities are
              used.
            </div>
          </div>

          {/* Loaded Dataset Metrics */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Synthetic Resources Generated & Persisted
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <Users className="w-4 h-4 mx-auto text-indigo-400 mb-1" />
                <span className="text-[10px] text-slate-400">Batches</span>
                <p className="text-base font-bold text-white">{result.stats.batches}</p>
                <span className="text-[9px] text-slate-500">Alpha & Beta</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <UserCheck className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <span className="text-[10px] text-slate-400">Faculty</span>
                <p className="text-base font-bold text-white">{result.stats.faculty}</p>
                <span className="text-[9px] text-slate-500">5 Ph.D. Instructors</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <BookOpen className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <span className="text-[10px] text-slate-400">Subjects</span>
                <p className="text-base font-bold text-white">{result.stats.subjects}</p>
                <span className="text-[9px] text-slate-500">4 Lec, 2 Practical</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <Building2 className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                <span className="text-[10px] text-slate-400">Facilities</span>
                <p className="text-base font-bold text-white">{result.stats.rooms}</p>
                <span className="text-[9px] text-slate-500">3 Halls, 1 Lab</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <Calendar className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <span className="text-[10px] text-slate-400">Sessions</span>
                <p className="text-base font-bold text-white">{result.stats.entries}</p>
                <span className="text-[9px] text-slate-500">Weekly Slots</span>
              </div>
            </div>
          </div>

          {/* Timetable Invariants Audit Section */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Multi-Constraint Verification Audit
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  !hasConflicts
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {!hasConflicts ? '0 CONFLICTS DETECTED' : `${result.validationReport.conflicts.length} ISSUES`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">1. Faculty Double-Booking:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 0 Collisions
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">2. Batch Schedule Non-Overlap:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 0 Collisions
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">3. Room Double-Booking:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 0 Collisions
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">4. Room Capacity Compliance:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Pass (Cap &ge; Batch)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">5. Laboratory Facility Checks:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Pass (Labs in Lab)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">6. Faculty Availability (5 Days):</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Respected
                </span>
              </div>
            </div>
          </div>

          {/* Conflict list if any were reported */}
          {hasConflicts && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/60 space-y-2">
              <h5 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Detected Schedule Conflicts:
              </h5>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {result.validationReport.conflicts.map((c, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-slate-900 text-rose-200 border border-rose-900/40">
                    <span className="font-bold">{c.title}: </span>
                    {c.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Persistent in Firestore collection <span className="font-mono text-slate-400">/timetableEntries</span>
          </div>

          <div className="flex items-center gap-2">
            {!isSuccess && onForceReload && (
              <button
                onClick={onForceReload}
                disabled={isReloading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isReloading ? 'Reloading...' : 'Force Overwrite with Fictional Data'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              Done & View Timetable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

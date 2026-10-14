import React, { useState } from 'react';
import {
  Batch,
  Faculty,
  FacultyAvailability,
  Room,
  Subject,
  TimetableEntry,
  ScheduleGenerationResult
} from '../../types';
import { generateAutomatedSchedule } from '../../lib/scheduler';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Save,
  X,
  Cpu,
  FileText
} from 'lucide-react';

interface AutomatedSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  batches: Batch[];
  rooms: Room[];
  faculty: Faculty[];
  availabilities: FacultyAvailability[];
  onCommitSchedule: (newEntries: TimetableEntry[]) => Promise<void>;
}

export const AutomatedSchedulerModal: React.FC<AutomatedSchedulerModalProps> = ({
  isOpen,
  onClose,
  subjects,
  batches,
  rooms,
  faculty,
  availabilities,
  onCommitSchedule
}) => {
  const [result, setResult] = useState<ScheduleGenerationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  if (!isOpen) return null;

  const handleRunScheduler = () => {
    setIsRunning(true);
    // Slight timeout so UI can display solver spinning
    setTimeout(() => {
      const res = generateAutomatedSchedule(subjects, batches, rooms, faculty, availabilities);
      setResult(res);
      setIsRunning(false);
    }, 400);
  };

  const handleSaveToFirestore = async () => {
    if (!result || result.scheduledEntries.length === 0) return;
    setIsCommitting(true);
    try {
      await onCommitSchedule(result.scheduledEntries);
      onClose();
    } catch (err) {
      console.error('Failed to commit schedule:', err);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Automated Constraint Scheduler
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Rule-Based Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Solves multi-batch assignments with zero room, faculty, or cohort collisions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Input scope summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Subjects
              </span>
              <p className="text-lg font-bold text-white">{subjects.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Batches
              </span>
              <p className="text-lg font-bold text-white">{batches.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Classrooms
              </span>
              <p className="text-lg font-bold text-white">{rooms.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Faculty
              </span>
              <p className="text-lg font-bold text-white">{faculty.length}</p>
            </div>
          </div>

          {/* Rules & Invariants Handled */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Enforced Constraints:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400">
              <div>✓ Zero faculty double-booking</div>
              <div>✓ Zero batch schedule overlaps</div>
              <div>✓ Room capacity &ge; batch enrollment</div>
              <div>✓ Laboratory requirements mapped to labs</div>
              <div>✓ Faculty availability windows respected</div>
              <div>✓ Balanced daily lecture distribution</div>
            </div>
          </div>

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              {/* Status Header */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  result.success
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {result.success
                      ? 'Optimal Schedule Generated — 100% Conflict-Free'
                      : `Partially Generated (${result.totalSlotsScheduled}/${result.totalSlotsNeeded} sessions allocated)`}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {result.success
                      ? `Successfully allocated all ${result.totalSlotsScheduled} required lectures & practicals across campus facilities.`
                      : `${result.unallocatedSubjects.length} subjects could not be fully placed due to room capacity or slot congestion.`}
                  </p>
                </div>
              </div>

              {/* Unallocated warnings if any */}
              {result.unallocatedSubjects.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-2">
                  <h5 className="text-xs font-bold text-rose-300">Unallocated Subject Details:</h5>
                  <div className="space-y-1.5">
                    {result.unallocatedSubjects.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300"
                      >
                        <span className="font-semibold text-white">{item.subject.name}</span>: {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engine Log Details */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Solver Execution Trace:
                </span>
                <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                  {result.logs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes('[Allocated]')
                          ? 'text-emerald-400/90'
                          : log.includes('[Warning]') || log.includes('[Constraint]')
                          ? 'text-amber-400/90'
                          : log.includes('[Error]')
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunScheduler}
              disabled={isRunning || subjects.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-indigo-400" />
                  Running Solver...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-indigo-400" />
                  {result ? 'Re-Run Solver' : 'Run Intelligent Generation'}
                </>
              )}
            </button>

            {result && result.scheduledEntries.length > 0 && (
              <button
                onClick={handleSaveToFirestore}
                disabled={isCommitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isCommitting ? 'Persisting to Firestore...' : 'Commit to Firestore'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

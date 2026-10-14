import React, { useState, useEffect } from 'react';
import {
  Batch,
  Faculty,
  FacultyAvailability,
  Room,
  Subject,
  TimetableConflict,
  TimetableEntry,
  DayOfWeek,
  DAYS_OF_WEEK,
  TIME_SLOTS,
  SessionType
} from '../../types';
import { validateEntry } from '../../lib/scheduler';
import { X, AlertCircle, AlertTriangle, CheckCircle2, Save } from 'lucide-react';

interface TimetableEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: TimetableEntry | null;
  entries: TimetableEntry[];
  subjects: Subject[];
  batches: Batch[];
  rooms: Room[];
  faculty: Faculty[];
  availabilities: FacultyAvailability[];
  onSaveEntry: (entry: TimetableEntry) => Promise<void>;
}

export const TimetableEntryModal: React.FC<TimetableEntryModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  entries,
  subjects,
  batches,
  rooms,
  faculty,
  availabilities,
  onSaveEntry
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [timeSlotIndex, setTimeSlotIndex] = useState(0);
  const [sessionType, setSessionType] = useState<SessionType>('lecture');
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (entryToEdit) {
      setSubjectId(entryToEdit.subjectId);
      setBatchId(entryToEdit.batchId);
      setFacultyId(entryToEdit.facultyId);
      setRoomId(entryToEdit.roomId);
      setDay(entryToEdit.day);
      setSessionType(entryToEdit.sessionType);
      const slotIdx = TIME_SLOTS.findIndex(
        (s) => s.start === entryToEdit.startTime && s.end === entryToEdit.endTime
      );
      setTimeSlotIndex(slotIdx >= 0 ? slotIdx : 0);
    } else {
      if (subjects.length > 0) {
        const s = subjects[0];
        setSubjectId(s.id);
        setBatchId(s.batchId);
        setFacultyId(s.facultyId);
        setSessionType(s.isLab ? 'lab' : 'lecture');
      }
      if (rooms.length > 0) setRoomId(rooms[0].id);
      setDay('Monday');
      setTimeSlotIndex(0);
    }
  }, [entryToEdit, isOpen, subjects, rooms]);

  // When subject changes, automatically set batch and faculty default
  const handleSubjectChange = (id: string) => {
    setSubjectId(id);
    const sub = subjects.find((s) => s.id === id);
    if (sub) {
      setBatchId(sub.batchId);
      setFacultyId(sub.facultyId);
      setSessionType(sub.isLab ? 'lab' : 'lecture');
    }
  };

  // Run real-time validation on proposed entry
  useEffect(() => {
    if (!subjectId || !batchId || !facultyId || !roomId) {
      setConflicts([]);
      return;
    }

    const sub = subjects.find((s) => s.id === subjectId);
    const bat = batches.find((b) => b.id === batchId);
    const fac = faculty.find((f) => f.id === facultyId);
    const rom = rooms.find((r) => r.id === roomId);
    const slot = TIME_SLOTS[timeSlotIndex] || TIME_SLOTS[0];

    const tempEntry: TimetableEntry = {
      id: entryToEdit?.id || 'temp_validate_id',
      subjectId,
      subjectName: sub?.name || 'Subject',
      batchId,
      batchName: bat?.name || 'Batch',
      facultyId,
      facultyName: fac?.name || 'Faculty',
      roomId,
      roomName: rom?.name || 'Room',
      day,
      startTime: slot.start,
      endTime: slot.end,
      sessionType
    };

    const detected = validateEntry(
      tempEntry,
      entries,
      faculty,
      batches,
      rooms,
      availabilities
    );
    setConflicts(detected);
  }, [subjectId, batchId, facultyId, roomId, day, timeSlotIndex, sessionType, entries]);

  if (!isOpen) return null;

  const hasBlockingErrors = conflicts.some((c) => c.severity === 'error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasBlockingErrors) return;

    const sub = subjects.find((s) => s.id === subjectId);
    const bat = batches.find((b) => b.id === batchId);
    const fac = faculty.find((f) => f.id === facultyId);
    const rom = rooms.find((r) => r.id === roomId);
    const slot = TIME_SLOTS[timeSlotIndex] || TIME_SLOTS[0];

    if (!sub || !bat || !fac || !rom) return;

    const entryToSave: TimetableEntry = {
      id: entryToEdit?.id || `entry_${Date.now()}`,
      subjectId,
      subjectName: sub.name,
      batchId,
      batchName: bat.name,
      facultyId,
      facultyName: fac.name,
      roomId,
      roomName: rom.name,
      day,
      startTime: slot.start,
      endTime: slot.end,
      sessionType
    };

    setIsSaving(true);
    try {
      await onSaveEntry(entryToSave);
      onClose();
    } catch (err) {
      console.error('Failed to save entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {entryToEdit ? 'Edit Timetable Session' : 'Schedule New Class Session'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Course Subject *
            </label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
              className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name} ({s.isLab ? 'Lab' : 'Lecture'})
                </option>
              ))}
            </select>
          </div>

          {/* Grid: Batch & Faculty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Student Batch *
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.studentCount} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Faculty Instructor *
              </label>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                required
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Room & Session Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Classroom / Lab *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.isLab ? 'Lab' : 'Classroom'}, Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Session Type *
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="lecture">Standard Lecture</option>
                <option value="lab">Practical Laboratory</option>
                <option value="tutorial">Tutorial / Seminar</option>
              </select>
            </div>
          </div>

          {/* Day & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Day of Week *
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Time Interval *
              </label>
              <select
                value={timeSlotIndex}
                onChange={(e) => setTimeSlotIndex(Number(e.target.value))}
                className="w-full bg-slate-950 text-xs text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {TIME_SLOTS.map((s, idx) => (
                  <option key={s.label} value={idx}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Constraint Check Result */}
          <div className="pt-2">
            {conflicts.length > 0 ? (
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Validation Invariants Violated ({conflicts.length}):</span>
                </div>
                <div className="space-y-1.5">
                  {conflicts.map((conf, i) => (
                    <div
                      key={i}
                      className={`text-[11px] p-2 rounded-xl flex items-start gap-2 ${
                        conf.severity === 'error'
                          ? 'bg-rose-950/40 border border-rose-900/60 text-rose-300'
                          : 'bg-amber-950/40 border border-amber-900/60 text-amber-300'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{conf.title}: </span>
                        {conf.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero conflicts detected. This slot satisfies all 6 institutional rules.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={hasBlockingErrors || isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Validating & Saving...' : 'Save Timetable Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

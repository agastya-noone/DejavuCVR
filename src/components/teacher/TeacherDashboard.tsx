import React, { useState, useMemo } from 'react';
import {
  Faculty,
  FacultyAvailability,
  TimetableEntry,
  DayOfWeek,
  DAYS_OF_WEEK,
  TIME_SLOTS
} from '../../types';
import { TimetableGrid } from '../common/TimetableGrid';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  CalendarCheck,
  Sparkles,
  Sliders,
  Save,
  Check,
  UserCheck
} from 'lucide-react';
import { saveFacultyAvailability } from '../../lib/timetableService';

interface TeacherDashboardProps {
  entries: TimetableEntry[];
  facultyList: Faculty[];
  currentFacultyId: string;
  availabilityList: FacultyAvailability[];
  onSelectFaculty?: (id: string) => void;
  onRefresh?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  entries,
  facultyList,
  currentFacultyId,
  availabilityList,
  onSelectFaculty,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'availability'>('schedule');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active faculty record
  const currentFaculty =
    facultyList.find((f) => f.id === currentFacultyId) || facultyList[0];

  // Timetable entries taught by this faculty member
  const facultyEntries = useMemo(() => {
    return entries.filter((e) => e.facultyId === currentFacultyId);
  }, [entries, currentFacultyId]);

  // Today calculation
  const todayName = useMemo(() => {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as any;
    const current = days[new Date().getDay()];
    return DAYS_OF_WEEK.includes(current as DayOfWeek) ? (current as DayOfWeek) : 'Monday';
  }, []);

  const todayClasses = useMemo(() => {
    return facultyEntries
      .filter((e) => e.day === todayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [facultyEntries, todayName]);

  const upcomingLecture = todayClasses.length > 0 ? todayClasses[0] : null;

  // Local state for availability editing
  const [localUnavailableSlots, setLocalUnavailableSlots] = useState<Record<DayOfWeek, string[]>>(() => {
    const initial: Record<DayOfWeek, string[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: []
    };
    for (const d of DAYS_OF_WEEK) {
      const rec = availabilityList.find(
        (a) => a.facultyId === currentFacultyId && a.day === d
      );
      if (rec && rec.unavailableSlots) {
        initial[d] = rec.unavailableSlots;
      }
    }
    return initial;
  });

  // Check for conflicts affecting this faculty
  const facultyConflicts = useMemo(() => {
    const warnings: string[] = [];

    // Check for double bookings within faculty entries
    for (let i = 0; i < facultyEntries.length; i++) {
      for (let j = i + 1; j < facultyEntries.length; j++) {
        const e1 = facultyEntries[i];
        const e2 = facultyEntries[j];
        if (e1.day === e2.day && e1.startTime === e2.startTime) {
          warnings.push(
            `Double-booking detected on ${e1.day} at ${e1.startTime}: "${e1.subjectName}" and "${e2.subjectName}".`
          );
        }
      }
    }

    // Check for sessions in unavailable slots
    facultyEntries.forEach((e) => {
      const slotLabel = `${e.startTime} - ${e.endTime}`;
      const unavail = localUnavailableSlots[e.day] || [];
      if (unavail.includes(slotLabel)) {
        warnings.push(
          `Schedule conflict on ${e.day} (${slotLabel}): Session "${e.subjectName}" scheduled during your declared unavailable slot.`
        );
      }
    });

    return warnings;
  }, [facultyEntries, localUnavailableSlots]);

  // Toggle slot unavailability
  const handleToggleSlot = (day: DayOfWeek, slotLabel: string) => {
    setLocalUnavailableSlots((prev) => {
      const current = prev[day] || [];
      const updated = current.includes(slotLabel)
        ? current.filter((s) => s !== slotLabel)
        : [...current, slotLabel];
      return { ...prev, [day]: updated };
    });
  };

  // Save updated availability to Firestore
  const handleSaveAvailability = async () => {
    if (!currentFaculty) return;
    setSavingAvailability(true);
    setSaveSuccess(false);

    try {
      for (const day of DAYS_OF_WEEK) {
        const rec: FacultyAvailability = {
          id: `${currentFaculty.id}_${day}`,
          facultyId: currentFaculty.id,
          day,
          availableSlots: [],
          unavailableSlots: localUnavailableSlots[day] || []
        };
        await saveFacultyAvailability(rec);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to save availability:', err);
    } finally {
      setSavingAvailability(false);
    }
  };

  const teachingHours = facultyEntries.length; // Each slot is 1 hour
  const maxHours = currentFaculty?.maxHoursPerWeek || 16;
  const loadPercentage = Math.min(100, Math.round((teachingHours / maxHours) * 100));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Faculty Portal
              </span>
              <span className="text-xs text-slate-400">
                {currentFaculty?.department || 'Department'} • {currentFaculty?.designation}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentFaculty ? currentFaculty.name : 'Faculty Dashboard'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Personalized weekly teaching assignments, workload tracking, and availability controls.
            </p>
          </div>

          {/* Faculty Selector (for demo evaluation) */}
          {facultyList.length > 0 && onSelectFaculty && (
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 pl-2">Faculty:</span>
              <select
                value={currentFacultyId}
                onChange={(e) => onSelectFaculty(e.target.value)}
                className="bg-slate-900 text-xs text-slate-200 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Conflict Alert Banner if any */}
      {facultyConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-200">
              Schedule Warning ({facultyConflicts.length})
            </h4>
            <ul className="text-xs text-amber-300/90 list-disc list-inside space-y-0.5">
              {facultyConflicts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Sessions */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Weekly Sessions</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{facultyEntries.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Teaching hours assigned</p>
        </div>

        {/* Workload Meter */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Teaching Capacity</span>
            <span className="text-[11px] font-mono text-slate-300">
              {teachingHours} / {maxHours} hrs
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                loadPercentage > 90 ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${loadPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">{loadPercentage}% of maximum target</p>
        </div>

        {/* Batches Handled */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Batches Handled</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {new Set(facultyEntries.map((e) => e.batchId)).size}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unique student cohorts</p>
        </div>

        {/* Conflicts Status */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Conflict State</span>
            {facultyConflicts.length === 0 ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div
            className={`text-lg font-bold ${
              facultyConflicts.length === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {facultyConflicts.length === 0 ? 'Zero Conflicts' : `${facultyConflicts.length} Notices`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Institutional timetable audit</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Weekly Teaching Timetable
        </button>
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'availability'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Faculty Availability & Office Hours
        </button>
      </div>

      {/* Tab 1: Schedule */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Today's Teaching Highlights */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Today's Teaching Schedule ({todayName})
              </div>
              <p className="text-sm text-slate-200">
                You have <span className="font-bold text-white">{todayClasses.length} lectures/labs</span>{' '}
                scheduled for today.
              </p>
            </div>

            {upcomingLecture && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  Next
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{upcomingLecture.subjectName}</h4>
                  <p className="text-[11px] text-slate-400">
                    {upcomingLecture.startTime} - {upcomingLecture.endTime} • {upcomingLecture.roomName} (
                    {upcomingLecture.batchName})
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timetable Grid */}
          {facultyEntries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 space-y-3">
              <CalendarCheck className="w-10 h-10 mx-auto text-blue-400/60" />
              <h3 className="text-base font-bold text-white">No Teaching Sessions Assigned</h3>
              <p className="text-xs max-w-md mx-auto">
                No active timetable entries are mapped to your faculty profile ({currentFaculty?.name}).
              </p>
            </div>
          ) : (
            <TimetableGrid
              entries={facultyEntries}
              facultyList={facultyList}
              highlightFacultyId={currentFacultyId}
            />
          )}
        </div>
      )}

      {/* Tab 2: Availability Editor */}
      {activeTab === 'availability' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Availability Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click time slots to toggle your availability. Red slots represent periods reserved for research,
                thesis mentoring, or administrative meetings. The automated scheduler will avoid these slots.
              </p>
            </div>

            <button
              onClick={handleSaveAvailability}
              disabled={savingAvailability}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all self-start sm:self-center"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Saved to Firestore!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />{' '}
                  {savingAvailability ? 'Saving...' : 'Save Availability'}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const unavail = localUnavailableSlots[day] || [];

              return (
                <div
                  key={day}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200">{day}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {TIME_SLOTS.length - unavail.length} free
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {TIME_SLOTS.map((slot) => {
                      const isUnavailable = unavail.includes(slot.label);
                      return (
                        <button
                          key={slot.label}
                          onClick={() => handleToggleSlot(day, slot.label)}
                          className={`w-full p-2 rounded-xl text-left text-xs font-medium transition-all flex items-center justify-between border ${
                            isUnavailable
                              ? 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-900/40'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-blue-500/40 hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-[11px] font-mono">{slot.label}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              isUnavailable
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isUnavailable ? 'BUSY' : 'OPEN'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

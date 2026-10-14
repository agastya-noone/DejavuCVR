import React, { useState, useMemo } from 'react';
import { Batch, Faculty, TimetableEntry, DayOfWeek, DAYS_OF_WEEK } from '../../types';
import { TimetableGrid } from '../common/TimetableGrid';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Beaker,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  Info,
  CalendarDays
} from 'lucide-react';

interface StudentDashboardProps {
  entries: TimetableEntry[];
  batches: Batch[];
  faculty: Faculty[];
  currentBatchId: string;
  onSelectBatch?: (batchId: string) => void;
  onRefresh?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  entries,
  batches,
  faculty,
  currentBatchId,
  onSelectBatch,
  onRefresh
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>('ALL');
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'lecture' | 'lab'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

  const activeBatch = batches.find((b) => b.id === currentBatchId) || batches[0];

  // Filter entries belonging to this student's batch
  const batchEntries = useMemo(() => {
    return entries.filter((e) => e.batchId === currentBatchId);
  }, [entries, currentBatchId]);

  // Apply Day and Session Type filters
  const filteredEntries = useMemo(() => {
    return batchEntries.filter((e) => {
      const matchDay = selectedDay === 'ALL' || e.day === selectedDay;
      const matchType = sessionFilter === 'ALL' || e.sessionType === sessionFilter;
      return matchDay && matchType;
    });
  }, [batchEntries, selectedDay, sessionFilter]);

  // Determine today's day of week
  const todayName = useMemo(() => {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as any;
    const current = days[new Date().getDay()];
    return DAYS_OF_WEEK.includes(current as DayOfWeek) ? (current as DayOfWeek) : 'Monday';
  }, []);

  // Today's classes
  const todayClasses = useMemo(() => {
    return batchEntries
      .filter((e) => e.day === todayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [batchEntries, todayName]);

  // Next upcoming lecture
  const upcomingLecture = todayClasses.length > 0 ? todayClasses[0] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Batch Info */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Student Portal
              </span>
              <span className="text-xs text-slate-400">
                {activeBatch?.year || 'Academic Year'} • {activeBatch?.semester || 'Semester'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeBatch ? activeBatch.name : 'Computer Science - Year 3 (Batch A)'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Personalized weekly schedule, lecture rooms, and faculty contacts.
            </p>
          </div>

          {/* Batch Selector (if multiple batches exist) */}
          {batches.length > 0 && onSelectBatch && (
            <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 pl-2">Batch:</span>
              <select
                value={currentBatchId}
                onChange={(e) => onSelectBatch(e.target.value)}
                className="bg-slate-900 text-xs text-slate-200 font-semibold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.studentCount} students)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Today's Schedule & Upcoming Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upcoming class hero card */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Next Scheduled Session</h3>
                <p className="text-xs text-slate-400">Targeting today ({todayName})</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
              {todayClasses.length} sessions today
            </span>
          </div>

          {upcomingLecture ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 via-slate-950 to-purple-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      upcomingLecture.sessionType === 'lab'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {upcomingLecture.sessionType.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-indigo-300 font-semibold">
                    {upcomingLecture.startTime} - {upcomingLecture.endTime}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {upcomingLecture.subjectName}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    {upcomingLecture.facultyName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {upcomingLecture.roomName}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex sm:flex-col items-center justify-center gap-1 bg-indigo-600/20 px-3 py-2 rounded-xl border border-indigo-500/30 text-center">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">{upcomingLecture.startTime}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center py-6 text-slate-400 text-xs">
              No more sessions scheduled for today ({todayName}). Enjoy your study break!
            </div>
          )}
        </div>

        {/* Quick batch statistics */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Batch Workload
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Weekly Lectures</span>
              <span className="font-bold text-white">
                {batchEntries.filter((e) => e.sessionType === 'lecture').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Practical Lab Sessions</span>
              <span className="font-bold text-purple-400">
                {batchEntries.filter((e) => e.sessionType === 'lab').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Weekly Slots</span>
              <span className="font-bold text-indigo-400">{batchEntries.length} slots</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Enrolled Students</span>
              <span className="font-bold text-slate-300">{activeBatch?.studentCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Day:
          </span>
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
              selectedDay === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Week
          </button>
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Session Type & View Switcher */}
        <div className="flex items-center gap-2">
          {/* Type filter */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value as any)}
            className="bg-slate-950 text-xs text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Session Types</option>
            <option value="lecture">Lectures Only</option>
            <option value="lab">Labs Only</option>
          </select>

          {/* Mode toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                viewMode === 'agenda' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {batchEntries.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Timetable Assigned Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Your academic department has not yet published the semester schedule for{' '}
              <span className="text-indigo-300 font-semibold">{activeBatch?.name || 'this batch'}</span>.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 text-xs text-slate-300">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Tip: Administrators can initialize demo data or generate schedules in the Admin view.
          </div>
        </div>
      ) : viewMode === 'grid' && selectedDay === 'ALL' && sessionFilter === 'ALL' ? (
        <TimetableGrid entries={batchEntries} facultyList={faculty} highlightBatchId={currentBatchId} />
      ) : (
        /* Agenda / Filtered List View */
        <div className="space-y-4">
          {DAYS_OF_WEEK.filter((d) => selectedDay === 'ALL' || d === selectedDay).map((day) => {
            const dayList = filteredEntries
              .filter((e) => e.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            if (dayList.length === 0 && selectedDay !== 'ALL') {
              return (
                <div
                  key={day}
                  className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-sm"
                >
                  No classes matching filters on {day}.
                </div>
              );
            }

            if (dayList.length === 0) return null;

            return (
              <div key={day} className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-200">{day}</span>
                  <span className="text-xs text-slate-400 font-mono">{dayList.length} sessions</span>
                </div>
                <div className="divide-y divide-slate-800/60 p-2 space-y-2">
                  {dayList.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              entry.sessionType === 'lab'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {entry.sessionType.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-300">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{entry.subjectName}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {entry.facultyName}
                          </span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            {entry.roomName}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                          {entry.batchName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

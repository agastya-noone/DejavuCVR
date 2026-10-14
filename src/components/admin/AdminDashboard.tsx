import React, { useState, useMemo } from 'react';
import {
  Batch,
  Faculty,
  FacultyAvailability,
  Room,
  Subject,
  TimetableEntry,
  ValidationReport
} from '../../types';
import { TimetableGrid } from '../common/TimetableGrid';
import { AutomatedSchedulerModal } from './AutomatedSchedulerModal';
import { TimetableEntryModal } from './TimetableEntryModal';
import { FacultyModal, BatchModal, SubjectModal, RoomModal } from './ResourceModals';
import { DemoDataReportModal } from './DemoDataReportModal';
import { ConflictMap } from './ConflictMap';
import { validateFullSchedule } from '../../lib/scheduler';
import { loadFictionalDemoData, LoadDemoDataResult } from '../../lib/demoData';
import {
  saveBatch,
  deleteBatch,
  saveFaculty,
  deleteFaculty,
  saveSubject,
  deleteSubject,
  saveRoom,
  deleteRoom,
  saveTimetableEntry,
  deleteTimetableEntry,
  replaceAllTimetableEntries
} from '../../lib/timetableService';
import {
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Play,
  RotateCcw,
  Download,
  Printer,
  Database,
  Trash2,
  Edit2,
  ShieldCheck,
  Check,
  Search,
  Filter,
  Flame
} from 'lucide-react';

interface AdminDashboardProps {
  entries: TimetableEntry[];
  batches: Batch[];
  faculty: Faculty[];
  subjects: Subject[];
  rooms: Room[];
  availabilities: FacultyAvailability[];
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  entries,
  batches,
  faculty,
  subjects,
  rooms,
  availabilities,
  onRefreshData
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'grid' | 'batches' | 'faculty' | 'subjects' | 'rooms' | 'conflicts' | 'conflict-map'>('grid');

  // Filter for the Timetable Grid
  const [gridFilterType, setGridFilterType] = useState<'batch' | 'faculty' | 'room'>('batch');
  const [selectedFilterId, setSelectedFilterId] = useState<string>('ALL');

  // Modals state
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimetableEntry | null>(null);

  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState<Faculty | null>(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

  // Demo seeding action feedback & audit report
  const [seeding, setSeeding] = useState(false);
  const [demoReport, setDemoReport] = useState<LoadDemoDataResult | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isForceReloading, setIsForceReloading] = useState(false);

  // Validation report
  const validationReport: ValidationReport = useMemo(() => {
    return validateFullSchedule(entries, faculty, batches, rooms, availabilities);
  }, [entries, faculty, batches, rooms, availabilities]);

  // Filtered timetable entries for the grid
  const displayedEntries = useMemo(() => {
    if (selectedFilterId === 'ALL') return entries;
    if (gridFilterType === 'batch') {
      return entries.filter((e) => e.batchId === selectedFilterId);
    }
    if (gridFilterType === 'faculty') {
      return entries.filter((e) => e.facultyId === selectedFilterId);
    }
    if (gridFilterType === 'room') {
      return entries.filter((e) => e.roomId === selectedFilterId);
    }
    return entries;
  }, [entries, gridFilterType, selectedFilterId]);

  // Handle Loading Synthetic Demo Data (Protects existing records by default)
  const handleLoadDemoData = async () => {
    setSeeding(true);
    try {
      const res = await loadFictionalDemoData(false);
      setDemoReport(res);
      setIsReportModalOpen(true);
      onRefreshData();
    } catch (err) {
      console.error('Demo data loading error:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Handle Force Reload if requested by admin
  const handleForceReloadDemoData = async () => {
    setIsForceReloading(true);
    try {
      const res = await loadFictionalDemoData(true);
      setDemoReport(res);
      onRefreshData();
    } catch (err) {
      console.error('Demo data force reload error:', err);
    } finally {
      setIsForceReloading(false);
    }
  };

  // Export Timetable to CSV
  const handleExportCSV = () => {
    if (entries.length === 0) {
      alert('No timetable entries to export.');
      return;
    }

    const headers = ['Day', 'Start Time', 'End Time', 'Subject', 'Session Type', 'Batch', 'Faculty', 'Room'];
    const rows = entries.map((e) => [
      `"${e.day}"`,
      `"${e.startTime}"`,
      `"${e.endTime}"`,
      `"${e.subjectName.replace(/"/g, '""')}"`,
      `"${e.sessionType}"`,
      `"${e.batchName.replace(/"/g, '""')}"`,
      `"${e.facultyName.replace(/"/g, '""')}"`,
      `"${e.roomName.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `synchroniq_timetable_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-violet-950/40 to-slate-900 border border-violet-900/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                Administrative Command Center
              </span>
              <span className="text-xs text-slate-400">Campus Solve Track • DejaVu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Institutional Timetable Controller
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Constraint-verified scheduling, automated conflict resolution, and campus resource orchestration.
            </p>
          </div>

          {/* Quick Actions Deck */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSchedulerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              Generate Schedule
            </button>

            <button
              onClick={() => setActiveTab('conflict-map')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'conflict-map'
                  ? 'bg-rose-950/70 border-rose-500/80 text-rose-200 shadow-lg shadow-rose-950/50'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-rose-300 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              Conflict Map (D3)
            </button>

            <button
              onClick={() => {
                setEntryToEdit(null);
                setIsEntryModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Session
            </button>

            <button
              onClick={handleLoadDemoData}
              disabled={seeding}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-violet-950/50 hover:bg-violet-900/60 text-violet-200 text-xs font-semibold border border-violet-800/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-violet-400" />
              {seeding ? 'Verifying & Loading...' : 'Load Demo Data'}
            </button>

            <button
              onClick={handleExportCSV}
              title="Export schedule as CSV"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              title="Print timetable view"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Batches */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Batches</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{batches.length}</div>
          <span className="text-[10px] text-slate-500">Student cohorts</span>
        </div>

        {/* Faculty */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Faculty</span>
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{faculty.length}</div>
          <span className="text-[10px] text-slate-500">Instructors</span>
        </div>

        {/* Subjects */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Subjects</span>
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">{subjects.length}</div>
          <span className="text-[10px] text-slate-500">Course modules</span>
        </div>

        {/* Classrooms */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Rooms</span>
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">{rooms.length}</div>
          <span className="text-[10px] text-slate-500">
            {rooms.filter((r) => r.isLab).length} Labs, {rooms.filter((r) => !r.isLab).length} Lecture
          </span>
        </div>

        {/* Total Scheduled */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Sessions</span>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <span className="text-[10px] text-slate-500">Active slots</span>
        </div>

        {/* Conflict Status Indicator */}
        <div
          onClick={() => setActiveTab('conflicts')}
          className={`p-4 rounded-2xl border shadow-lg cursor-pointer transition-all hover:border-indigo-500/50 ${
            validationReport.isValid
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold">Audit Status</span>
            {validationReport.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="text-base font-extrabold">
            {validationReport.isValid ? '100% Clean' : `${validationReport.conflicts.length} Violations`}
          </div>
          <span className="text-[10px] opacity-80">
            {validationReport.isValid ? 'Zero conflicts' : 'Review reports'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'grid'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Master Timetable Grid
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'batches'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Batches ({batches.length})
        </button>

        <button
          onClick={() => setActiveTab('faculty')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'faculty'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Faculty ({faculty.length})
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Subjects ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Rooms & Labs ({rooms.length})
        </button>

        <button
          onClick={() => setActiveTab('conflict-map')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'conflict-map'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-rose-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Conflict Map (D3)
        </button>

        <button
          onClick={() => setActiveTab('conflicts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'conflicts'
              ? 'bg-violet-600 text-white shadow-md'
              : validationReport.conflicts.length > 0
              ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Conflict Audit ({validationReport.conflicts.length})
        </button>
      </div>

      {/* Tab 1: Master Timetable Grid */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          {/* Grid Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-violet-400" /> Filter Grid By:
              </span>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => {
                    setGridFilterType('batch');
                    setSelectedFilterId('ALL');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    gridFilterType === 'batch' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Batch
                </button>
                <button
                  onClick={() => {
                    setGridFilterType('faculty');
                    setSelectedFilterId('ALL');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    gridFilterType === 'faculty' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => {
                    setGridFilterType('room');
                    setSelectedFilterId('ALL');
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                    gridFilterType === 'room' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Room
                </button>
              </div>
            </div>

            {/* Target Select */}
            <div className="flex items-center gap-2">
              <select
                value={selectedFilterId}
                onChange={(e) => setSelectedFilterId(e.target.value)}
                className="bg-slate-950 text-xs text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">All {gridFilterType === 'batch' ? 'Batches' : gridFilterType === 'faculty' ? 'Faculty' : 'Rooms'}</option>
                {gridFilterType === 'batch' &&
                  batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                {gridFilterType === 'faculty' &&
                  faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                {gridFilterType === 'room' &&
                  rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.isLab ? 'Lab' : 'Class'})
                    </option>
                  ))}
              </select>

              <span className="text-xs text-slate-500 font-mono">
                {displayedEntries.length} entries shown
              </span>
            </div>
          </div>

          {/* Timetable Grid View */}
          {displayedEntries.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20">
                <Database className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {batches.length === 0 ? 'Cloud Firestore Database is Empty' : 'No Scheduled Sessions Found'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {batches.length === 0
                    ? 'No faculty, batches, or timetable entries were found in your Firestore collections yet. Click "Load Demo Data" below to populate the full synthetic campus dataset.'
                    : 'No class sessions match the current filter selection. Select another batch/faculty or add a new session.'}
                </p>
              </div>

              {batches.length === 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleLoadDemoData}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Database className="w-4 h-4" />
                    {seeding ? 'Loading Synthetic Data...' : 'Load Fictional Demo Data'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <TimetableGrid
              entries={displayedEntries}
              facultyList={faculty}
              isAdmin={true}
              onEditEntry={(entry) => {
                setEntryToEdit(entry);
                setIsEntryModalOpen(true);
              }}
              onDeleteEntry={async (id) => {
                if (window.confirm('Are you sure you want to delete this scheduled session?')) {
                  await deleteTimetableEntry(id);
                  onRefreshData();
                }
              }}
            />
          )}
        </div>
      )}

      {/* Tab 2: Batches Management */}
      {activeTab === 'batches' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Student Batches</h3>
              <p className="text-xs text-slate-400">Manage cohorts and enrollment sizes for capacity enforcement.</p>
            </div>
            <button
              onClick={() => {
                setBatchToEdit(null);
                setIsBatchModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Batch
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {batches.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{b.name}</h4>
                  <p className="text-xs text-slate-400">
                    {b.year} • {b.semester} • <span className="text-violet-300 font-medium">{b.studentCount} students</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBatchToEdit(b);
                      setIsBatchModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete batch "${b.name}"?`)) {
                        await deleteBatch(b.id);
                        onRefreshData();
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Faculty Management */}
      {activeTab === 'faculty' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Faculty Directory</h3>
              <p className="text-xs text-slate-400">Instructor designations, maximum teaching hours, and departments.</p>
            </div>
            <button
              onClick={() => {
                setFacultyToEdit(null);
                setIsFacultyModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Faculty
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {faculty.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: f.color || '#6366f1' }}
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{f.name}</h4>
                    <p className="text-xs text-slate-400">
                      {f.designation} • {f.department} • <span className="font-mono text-slate-300">{f.email}</span> • Max {f.maxHoursPerWeek}h/wk
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFacultyToEdit(f);
                      setIsFacultyModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete faculty record "${f.name}"?`)) {
                        await deleteFaculty(f.id);
                        onRefreshData();
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Subjects Management */}
      {activeTab === 'subjects' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Course Curriculum & Subjects</h3>
              <p className="text-xs text-slate-400">Lecture counts, laboratory classification, and cohort assignments.</p>
            </div>
            <button
              onClick={() => {
                setSubjectToEdit(null);
                setIsSubjectModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subject
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {subjects.map((s) => {
              const b = batches.find((item) => item.id === s.batchId);
              const f = faculty.find((item) => item.id === s.facultyId);
              return (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-violet-300 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-800/40">
                        {s.code}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                      {s.isLab && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          LAB PRACTICAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {s.credits} Credits • {s.weeklyLectures} sessions/wk • Batch: {b?.name || s.batchId} • Faculty: {f?.name || s.facultyId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSubjectToEdit(s);
                        setIsSubjectModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete subject "${s.name}"?`)) {
                          await deleteSubject(s.id);
                          onRefreshData();
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Rooms Management */}
      {activeTab === 'rooms' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Classrooms & Laboratories</h3>
              <p className="text-xs text-slate-400">Campus facilities, physical capacity, and equipment status.</p>
            </div>
            <button
              onClick={() => {
                setRoomToEdit(null);
                setIsRoomModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Facility
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {rooms.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{r.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        r.isLab
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {r.isLab ? 'LABORATORY' : 'LECTURE HALL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Building: {r.building} • Seating Capacity: <span className="text-white font-medium">{r.capacity} seats</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRoomToEdit(r);
                      setIsRoomModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete room "${r.name}"?`)) {
                        await deleteRoom(r.id);
                        onRefreshData();
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Conflict Audit Center */}
      {activeTab === 'conflicts' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Institutional Conflict Audit Center
              </h3>
              <p className="text-xs text-slate-400">
                Evaluates all 6 institutional scheduling constraints across live timetable entries.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('conflict-map')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Flame className="w-3.5 h-3.5 text-rose-200" />
              Open Visual Conflict Map (D3)
            </button>
          </div>

          {validationReport.conflicts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Zero Avoidable Conflicts Detected</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All scheduled class sessions strictly satisfy faculty non-overlap, cohort availability, room capacities,
                and laboratory equipment requirements.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {validationReport.conflicts.map((conf, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                    conf.severity === 'error'
                      ? 'bg-rose-950/30 border-rose-900/60'
                      : 'bg-amber-950/30 border-amber-900/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          conf.severity === 'error'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {conf.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-white">{conf.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300">{conf.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Visual Conflict Map (D3) */}
      {activeTab === 'conflict-map' && (
        <ConflictMap
          entries={entries}
          rooms={rooms}
          faculty={faculty}
          batches={batches}
          subjects={subjects}
          availabilities={availabilities}
          onEditEntry={(entry) => {
            setEntryToEdit(entry);
            setIsEntryModalOpen(true);
          }}
        />
      )}

      {/* Automated Scheduler Modal */}
      <AutomatedSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        subjects={subjects}
        batches={batches}
        rooms={rooms}
        faculty={faculty}
        availabilities={availabilities}
        onCommitSchedule={async (newEntries) => {
          await replaceAllTimetableEntries(newEntries);
          onRefreshData();
        }}
      />

      {/* Timetable Entry Modal */}
      <TimetableEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEntryToEdit(null);
        }}
        entryToEdit={entryToEdit}
        entries={entries}
        subjects={subjects}
        batches={batches}
        rooms={rooms}
        faculty={faculty}
        availabilities={availabilities}
        onSaveEntry={async (entry) => {
          await saveTimetableEntry(entry);
          onRefreshData();
        }}
      />

      {/* Resource Modals */}
      <FacultyModal
        isOpen={isFacultyModalOpen}
        onClose={() => {
          setIsFacultyModalOpen(false);
          setFacultyToEdit(null);
        }}
        facultyToEdit={facultyToEdit}
        onSave={async (f) => {
          await saveFaculty(f);
          onRefreshData();
        }}
      />

      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setBatchToEdit(null);
        }}
        batchToEdit={batchToEdit}
        onSave={async (b) => {
          await saveBatch(b);
          onRefreshData();
        }}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setSubjectToEdit(null);
        }}
        subjectToEdit={subjectToEdit}
        batches={batches}
        faculty={faculty}
        onSave={async (s) => {
          await saveSubject(s);
          onRefreshData();
        }}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setRoomToEdit(null);
        }}
        roomToEdit={roomToEdit}
        onSave={async (r) => {
          await saveRoom(r);
          onRefreshData();
        }}
      />

      {/* Synthetic Demo Data Audit Report Modal */}
      <DemoDataReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        result={demoReport}
        onForceReload={handleForceReloadDemoData}
        isReloading={isForceReloading}
      />
    </div>
  );
};

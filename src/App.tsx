/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/auth/LoginView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  getBatches,
  getFaculty,
  getSubjects,
  getRooms,
  getTimetableEntries,
  getFacultyAvailability
} from './lib/timetableService';
import {
  Batch,
  Faculty,
  FacultyAvailability,
  Room,
  Subject,
  TimetableEntry
} from './types';
import { Calendar, Loader2 } from 'lucide-react';

import {
  DEMO_FICTIONAL_BATCHES,
  DEMO_FICTIONAL_FACULTY,
  DEMO_FICTIONAL_SUBJECTS,
  DEMO_FICTIONAL_ROOMS,
  DEMO_FICTIONAL_AVAILABILITY,
  DEMO_FICTIONAL_TIMETABLE_ENTRIES
} from './lib/demoData';

function DashboardRouter() {
  const { currentUser, userProfile, role, loading, demoModeActive } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [availabilities, setAvailabilities] = useState<FacultyAvailability[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Student active batch selection
  const [studentBatchId, setStudentBatchId] = useState<string>('batch_demo_alpha');
  // Teacher active faculty selection
  const [teacherFacultyId, setTeacherFacultyId] = useState<string>('fac_demo_vance');

  // Load dataset from Firestore (or in-memory demo if evaluator is using preview mode without auth)
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setDataLoading(true);
    }

    try {
      // If Evaluator Preview Fast-Track is active without Firebase login, provide in-memory demo data
      if (!currentUser && demoModeActive) {
        setBatches(DEMO_FICTIONAL_BATCHES);
        setFaculty(DEMO_FICTIONAL_FACULTY);
        setSubjects(DEMO_FICTIONAL_SUBJECTS);
        setRooms(DEMO_FICTIONAL_ROOMS);
        setAvailabilities(DEMO_FICTIONAL_AVAILABILITY);

        const currentRole = role || 'student';
        const filterId =
          currentRole === 'student'
            ? userProfile?.batchId || studentBatchId
            : currentRole === 'teacher'
            ? userProfile?.facultyId || teacherFacultyId
            : undefined;

        let filtered = DEMO_FICTIONAL_TIMETABLE_ENTRIES;
        if (currentRole === 'student' && filterId) {
          filtered = DEMO_FICTIONAL_TIMETABLE_ENTRIES.filter((e) => e.batchId === filterId);
        } else if (currentRole === 'teacher' && filterId) {
          filtered = DEMO_FICTIONAL_TIMETABLE_ENTRIES.filter((e) => e.facultyId === filterId);
        }
        setEntries(filtered);
        return;
      }

      // Load resources from Cloud Firestore
      const [bList, fList, sList, rList, aList] = await Promise.all([
        getBatches().catch(() => []),
        getFaculty().catch(() => []),
        getSubjects().catch(() => []),
        getRooms().catch(() => []),
        getFacultyAvailability().catch(() => [])
      ]);

      setBatches(bList);
      setFaculty(fList);
      setSubjects(sList);
      setRooms(rList);
      setAvailabilities(aList);

      if (bList.length > 0 && !bList.some((b) => b.id === studentBatchId)) {
        setStudentBatchId(bList[0].id);
      }
      if (fList.length > 0 && !fList.some((f) => f.id === teacherFacultyId)) {
        setTeacherFacultyId(fList[0].id);
      }

      // Timetable entries query
      const currentRole = role || 'student';
      const filterId =
        currentRole === 'student'
          ? userProfile?.batchId || studentBatchId
          : currentRole === 'teacher'
          ? userProfile?.facultyId || teacherFacultyId
          : undefined;

      const tEntries = await getTimetableEntries(currentRole, filterId).catch(() => []);
      setEntries(tEntries);
    } catch (err) {
      console.error('Error fetching timetable dataset from Firestore:', err);
    } finally {
      setDataLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser, demoModeActive, role, userProfile, studentBatchId, teacherFacultyId]);

  // Initial load when user or role changes
  useEffect(() => {
    if (currentUser || userProfile) {
      loadData();
    }
  }, [currentUser, userProfile, role, loadData]);

  // Sync default batchId/facultyId from user profile
  useEffect(() => {
    if (userProfile?.batchId) {
      setStudentBatchId(userProfile.batchId);
    }
    if (userProfile?.facultyId) {
      setTeacherFacultyId(userProfile.facultyId);
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30 animate-pulse">
          <Calendar className="w-6 h-6" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
        <p className="text-xs text-slate-400 font-medium">Initializing SYNCHRONIQ...</p>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser && !userProfile) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onRefreshData={() => loadData(true)} isRefreshing={isRefreshing} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {dataLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Synchronizing timetable records from Cloud Firestore...</p>
          </div>
        ) : role === 'admin' ? (
          <AdminDashboard
            entries={entries}
            batches={batches}
            faculty={faculty}
            subjects={subjects}
            rooms={rooms}
            availabilities={availabilities}
            onRefreshData={() => loadData(true)}
          />
        ) : role === 'teacher' ? (
          <TeacherDashboard
            entries={entries}
            facultyList={faculty}
            currentFacultyId={teacherFacultyId}
            availabilityList={availabilities}
            onSelectFaculty={(id) => {
              setTeacherFacultyId(id);
              loadData(true);
            }}
            onRefresh={() => loadData(true)}
          />
        ) : (
          <StudentDashboard
            entries={entries}
            batches={batches}
            faculty={faculty}
            currentBatchId={studentBatchId}
            onSelectBatch={(id) => {
              setStudentBatchId(id);
              loadData(true);
            }}
            onRefresh={() => loadData(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        SYNCHRONIQ • Intelligent Scheduling. Zero Avoidable Conflicts. • Campus Solve Track
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardRouter />
    </AuthProvider>
  );
}

import {
  Batch,
  Faculty,
  FacultyAvailability,
  Room,
  Subject,
  TimetableEntry,
  ValidationReport,
  DayOfWeek,
  DAYS_OF_WEEK
} from '../types';
import { validateFullSchedule } from './scheduler';
import {
  db,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  collection,
  getDocs,
  doc,
  writeBatch
} from 'firebase/firestore';
import {
  BATCHES_COL,
  FACULTY_COL,
  SUBJECTS_COL,
  ROOMS_COL,
  TIMETABLE_COL,
  AVAILABILITY_COL,
  sanitizeForFirestore
} from './timetableService';

/**
 * 1. Fictional Faculty Members (5)
 * All records are purely synthetic and labeled as fictional demo data.
 */
export const DEMO_FICTIONAL_FACULTY: (Faculty & { qualifications: string })[] = [
  {
    id: 'fac_demo_vance',
    name: 'Dr. Evelyn Vance [Fictional Demo]',
    department: 'Department of Software Systems [Demo]',
    email: 'evelyn.vance.demo@synchroniq.campus',
    designation: 'Associate Professor',
    maxHoursPerWeek: 16,
    color: '#6366f1', // Indigo
    qualifications: 'Ph.D. in Operating Systems & Concurrent Architectures',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fac_demo_thorne',
    name: 'Dr. Marcus Thorne [Fictional Demo]',
    department: 'Department of Information Systems [Demo]',
    email: 'marcus.thorne.demo@synchroniq.campus',
    designation: 'Professor of Data Engineering',
    maxHoursPerWeek: 16,
    color: '#8b5cf6', // Violet
    qualifications: 'Ph.D. in Distributed Data Stores & Storage Tiering',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fac_demo_sterling',
    name: 'Prof. Clara Vance-Sterling [Fictional Demo]',
    department: 'Department of Artificial Intelligence [Demo]',
    email: 'clara.sterling.demo@synchroniq.campus',
    designation: 'Assistant Professor',
    maxHoursPerWeek: 14,
    color: '#ec4899', // Pink
    qualifications: 'M.S., Ph.D. in Autonomous Systems & Deep Representation',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fac_demo_pendelton',
    name: 'Dr. Arthur Pendelton [Fictional Demo]',
    department: 'Department of Computer Networks [Demo]',
    email: 'arthur.pendelton.demo@synchroniq.campus',
    designation: 'Senior Lecturer',
    maxHoursPerWeek: 16,
    color: '#06b6d4', // Cyan
    qualifications: 'Ph.D. in Wireless Protocols & Cyber-Physical Security',
    createdAt: new Date().toISOString()
  },
  {
    id: 'fac_demo_zhao',
    name: 'Prof. Julian Zhao [Fictional Demo]',
    department: 'Department of Theoretical Computing [Demo]',
    email: 'julian.zhao.demo@synchroniq.campus',
    designation: 'Chair Professor',
    maxHoursPerWeek: 14,
    color: '#10b981', // Emerald
    qualifications: 'Ph.D. in Combinatorial Optimization & Graph Algorithms',
    createdAt: new Date().toISOString()
  }
];

/**
 * 2. Fictional Student Batches (2)
 */
export const DEMO_FICTIONAL_BATCHES: Batch[] = [
  {
    id: 'batch_demo_alpha',
    name: '[Demo] Batch Alpha — Computer Science Year 3',
    year: 'Year 3',
    semester: 'Semester 5',
    studentCount: 45,
    createdAt: new Date().toISOString()
  },
  {
    id: 'batch_demo_beta',
    name: '[Demo] Batch Beta — Computer Science Year 3',
    year: 'Year 3',
    semester: 'Semester 5',
    studentCount: 40,
    createdAt: new Date().toISOString()
  }
];

/**
 * 3. Fictional Campus Facilities (4, including 1 dedicated laboratory)
 */
export const DEMO_FICTIONAL_ROOMS: (Room & { equipment: string })[] = [
  {
    id: 'room_demo_gauss_101',
    name: '[Demo] Gauss Lecture Hall 101',
    building: 'North Science Block',
    capacity: 60,
    isLab: false,
    equipment: 'Smart Projector, Dual Interactive Whiteboards, Tiered Seating, Audio Mic Array',
    createdAt: new Date().toISOString()
  },
  {
    id: 'room_demo_euler_102',
    name: '[Demo] Euler Lecture Hall 102',
    building: 'North Science Block',
    capacity: 55,
    isLab: false,
    equipment: 'Interactive 85" Touchscreen, Digital Visualizer, Lecture Capture Camera',
    createdAt: new Date().toISOString()
  },
  {
    id: 'room_demo_apex_lab',
    name: '[Demo] Apex Systems & Networks Lab',
    building: 'Innovation Research Wing B',
    capacity: 48,
    isLab: true,
    equipment: '48 High-Performance Linux Workstations, Dual Gigabit Managed Switches, FPGA Hardware Kits, Logic Analyzers',
    createdAt: new Date().toISOString()
  },
  {
    id: 'room_demo_leibniz_201',
    name: '[Demo] Leibniz Seminar Room 201',
    building: 'Central Academic Quad',
    capacity: 48,
    isLab: false,
    equipment: 'Modular Collaborative Desks, Hybrid Video Conferencing, Digital Podium',
    createdAt: new Date().toISOString()
  }
];

/**
 * 4. Fictional Curriculum Subjects (6)
 * Explicit weekly lecture count and laboratory requirement tags.
 */
export const DEMO_FICTIONAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_demo_os',
    code: 'CS301-D',
    name: '[Demo] Operating Systems Architecture',
    credits: 4,
    weeklyLectures: 3,
    isLab: false,
    batchId: 'batch_demo_alpha',
    facultyId: 'fac_demo_vance',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_demo_db_lab',
    code: 'CS302L-D',
    name: '[Demo] Distributed Database Practical',
    credits: 3,
    weeklyLectures: 2,
    isLab: true, // Requires Laboratory Room
    batchId: 'batch_demo_alpha',
    facultyId: 'fac_demo_thorne',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_demo_networks',
    code: 'CS303-D',
    name: '[Demo] Network Protocols & Infrastructure',
    credits: 4,
    weeklyLectures: 3,
    isLab: false,
    batchId: 'batch_demo_alpha',
    facultyId: 'fac_demo_pendelton',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_demo_algorithms',
    code: 'CS304-D',
    name: '[Demo] Design & Analysis of Algorithms',
    credits: 4,
    weeklyLectures: 3,
    isLab: false,
    batchId: 'batch_demo_beta',
    facultyId: 'fac_demo_zhao',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_demo_ai',
    code: 'CS305-D',
    name: '[Demo] Principles of Machine Intelligence',
    credits: 4,
    weeklyLectures: 3,
    isLab: false,
    batchId: 'batch_demo_beta',
    facultyId: 'fac_demo_sterling',
    createdAt: new Date().toISOString()
  },
  {
    id: 'sub_demo_cloud_lab',
    code: 'CS306L-D',
    name: '[Demo] Cloud Infrastructure Practical',
    credits: 3,
    weeklyLectures: 2,
    isLab: true, // Requires Laboratory Room
    batchId: 'batch_demo_beta',
    facultyId: 'fac_demo_thorne',
    createdAt: new Date().toISOString()
  }
];

/**
 * 5. Faculty Availability for Five Working Days (Monday - Friday)
 * Declares research, mentoring, and administrative slots to be respected.
 */
export const DEMO_FICTIONAL_AVAILABILITY: FacultyAvailability[] = [
  // Dr. Evelyn Vance
  {
    id: 'fac_demo_vance_Monday',
    facultyId: 'fac_demo_vance',
    day: 'Monday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_vance_Tuesday',
    facultyId: 'fac_demo_vance',
    day: 'Tuesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_vance_Wednesday',
    facultyId: 'fac_demo_vance',
    day: 'Wednesday',
    availableSlots: [],
    unavailableSlots: ['14:00 - 15:00', '15:00 - 16:00'] // Departmental curriculum committee
  },
  {
    id: 'fac_demo_vance_Thursday',
    facultyId: 'fac_demo_vance',
    day: 'Thursday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_vance_Friday',
    facultyId: 'fac_demo_vance',
    day: 'Friday',
    availableSlots: [],
    unavailableSlots: []
  },

  // Dr. Marcus Thorne
  {
    id: 'fac_demo_thorne_Monday',
    facultyId: 'fac_demo_thorne',
    day: 'Monday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_thorne_Tuesday',
    facultyId: 'fac_demo_thorne',
    day: 'Tuesday',
    availableSlots: [],
    unavailableSlots: ['11:15 - 12:15'] // High-Performance Storage Research Colloquium
  },
  {
    id: 'fac_demo_thorne_Wednesday',
    facultyId: 'fac_demo_thorne',
    day: 'Wednesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_thorne_Thursday',
    facultyId: 'fac_demo_thorne',
    day: 'Thursday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_thorne_Friday',
    facultyId: 'fac_demo_thorne',
    day: 'Friday',
    availableSlots: [],
    unavailableSlots: ['15:00 - 16:00'] // Dean consultation hours
  },

  // Prof. Clara Vance-Sterling
  {
    id: 'fac_demo_sterling_Monday',
    facultyId: 'fac_demo_sterling',
    day: 'Monday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_sterling_Tuesday',
    facultyId: 'fac_demo_sterling',
    day: 'Tuesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_sterling_Wednesday',
    facultyId: 'fac_demo_sterling',
    day: 'Wednesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_sterling_Thursday',
    facultyId: 'fac_demo_sterling',
    day: 'Thursday',
    availableSlots: [],
    unavailableSlots: ['14:00 - 15:00'] // Autonomous systems lab review
  },
  {
    id: 'fac_demo_sterling_Friday',
    facultyId: 'fac_demo_sterling',
    day: 'Friday',
    availableSlots: [],
    unavailableSlots: []
  },

  // Dr. Arthur Pendelton
  {
    id: 'fac_demo_pendelton_Monday',
    facultyId: 'fac_demo_pendelton',
    day: 'Monday',
    availableSlots: [],
    unavailableSlots: ['15:00 - 16:00'] // Campus backbone networking maintenance
  },
  {
    id: 'fac_demo_pendelton_Tuesday',
    facultyId: 'fac_demo_pendelton',
    day: 'Tuesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_pendelton_Wednesday',
    facultyId: 'fac_demo_pendelton',
    day: 'Wednesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_pendelton_Thursday',
    facultyId: 'fac_demo_pendelton',
    day: 'Thursday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_pendelton_Friday',
    facultyId: 'fac_demo_pendelton',
    day: 'Friday',
    availableSlots: [],
    unavailableSlots: []
  },

  // Prof. Julian Zhao
  {
    id: 'fac_demo_zhao_Monday',
    facultyId: 'fac_demo_zhao',
    day: 'Monday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_zhao_Tuesday',
    facultyId: 'fac_demo_zhao',
    day: 'Tuesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_zhao_Wednesday',
    facultyId: 'fac_demo_zhao',
    day: 'Wednesday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_zhao_Thursday',
    facultyId: 'fac_demo_zhao',
    day: 'Thursday',
    availableSlots: [],
    unavailableSlots: []
  },
  {
    id: 'fac_demo_zhao_Friday',
    facultyId: 'fac_demo_zhao',
    day: 'Friday',
    availableSlots: [],
    unavailableSlots: ['14:00 - 15:00', '15:00 - 16:00'] // Theoretical colloquium
  }
];

/**
 * 6. Feasible Sample Weekly Timetable (16 Conflict-Free Sessions)
 * Strictly zero faculty, batch, or room collisions.
 * Room capacities and lab facilities 100% satisfied.
 */
export const DEMO_FICTIONAL_TIMETABLE_ENTRIES: TimetableEntry[] = [
  // --- MONDAY ---
  {
    id: 'syn_entry_mon_1',
    subjectId: 'sub_demo_os',
    subjectName: '[Demo] Operating Systems Architecture',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_vance',
    facultyName: 'Dr. Evelyn Vance [Fictional Demo]',
    roomId: 'room_demo_gauss_101',
    roomName: '[Demo] Gauss Lecture Hall 101',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_mon_2',
    subjectId: 'sub_demo_algorithms',
    subjectName: '[Demo] Design & Analysis of Algorithms',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_zhao',
    facultyName: 'Prof. Julian Zhao [Fictional Demo]',
    roomId: 'room_demo_euler_102',
    roomName: '[Demo] Euler Lecture Hall 102',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_mon_3',
    subjectId: 'sub_demo_db_lab',
    subjectName: '[Demo] Distributed Database Practical',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_thorne',
    facultyName: 'Dr. Marcus Thorne [Fictional Demo]',
    roomId: 'room_demo_apex_lab',
    roomName: '[Demo] Apex Systems & Networks Lab',
    day: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    sessionType: 'lab'
  },
  {
    id: 'syn_entry_mon_4',
    subjectId: 'sub_demo_ai',
    subjectName: '[Demo] Principles of Machine Intelligence',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_sterling',
    facultyName: 'Prof. Clara Vance-Sterling [Fictional Demo]',
    roomId: 'room_demo_leibniz_201',
    roomName: '[Demo] Leibniz Seminar Room 201',
    day: 'Monday',
    startTime: '11:15',
    endTime: '12:15',
    sessionType: 'lecture'
  },

  // --- TUESDAY ---
  {
    id: 'syn_entry_tue_1',
    subjectId: 'sub_demo_networks',
    subjectName: '[Demo] Network Protocols & Infrastructure',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_pendelton',
    facultyName: 'Dr. Arthur Pendelton [Fictional Demo]',
    roomId: 'room_demo_gauss_101',
    roomName: '[Demo] Gauss Lecture Hall 101',
    day: 'Tuesday',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_tue_2',
    subjectId: 'sub_demo_cloud_lab',
    subjectName: '[Demo] Cloud Infrastructure Practical',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_thorne',
    facultyName: 'Dr. Marcus Thorne [Fictional Demo]',
    roomId: 'room_demo_apex_lab',
    roomName: '[Demo] Apex Systems & Networks Lab',
    day: 'Tuesday',
    startTime: '10:00',
    endTime: '11:00',
    sessionType: 'lab'
  },
  {
    id: 'syn_entry_tue_3',
    subjectId: 'sub_demo_os',
    subjectName: '[Demo] Operating Systems Architecture',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_vance',
    facultyName: 'Dr. Evelyn Vance [Fictional Demo]',
    roomId: 'room_demo_gauss_101',
    roomName: '[Demo] Gauss Lecture Hall 101',
    day: 'Tuesday',
    startTime: '11:15',
    endTime: '12:15',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_tue_4',
    subjectId: 'sub_demo_algorithms',
    subjectName: '[Demo] Design & Analysis of Algorithms',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_zhao',
    facultyName: 'Prof. Julian Zhao [Fictional Demo]',
    roomId: 'room_demo_euler_102',
    roomName: '[Demo] Euler Lecture Hall 102',
    day: 'Tuesday',
    startTime: '14:00',
    endTime: '15:00',
    sessionType: 'lecture'
  },

  // --- WEDNESDAY ---
  {
    id: 'syn_entry_wed_1',
    subjectId: 'sub_demo_db_lab',
    subjectName: '[Demo] Distributed Database Practical',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_thorne',
    facultyName: 'Dr. Marcus Thorne [Fictional Demo]',
    roomId: 'room_demo_apex_lab',
    roomName: '[Demo] Apex Systems & Networks Lab',
    day: 'Wednesday',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'lab'
  },
  {
    id: 'syn_entry_wed_2',
    subjectId: 'sub_demo_ai',
    subjectName: '[Demo] Principles of Machine Intelligence',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_sterling',
    facultyName: 'Prof. Clara Vance-Sterling [Fictional Demo]',
    roomId: 'room_demo_leibniz_201',
    roomName: '[Demo] Leibniz Seminar Room 201',
    day: 'Wednesday',
    startTime: '10:00',
    endTime: '11:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_wed_3',
    subjectId: 'sub_demo_networks',
    subjectName: '[Demo] Network Protocols & Infrastructure',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_pendelton',
    facultyName: 'Dr. Arthur Pendelton [Fictional Demo]',
    roomId: 'room_demo_gauss_101',
    roomName: '[Demo] Gauss Lecture Hall 101',
    day: 'Wednesday',
    startTime: '11:15',
    endTime: '12:15',
    sessionType: 'lecture'
  },

  // --- THURSDAY ---
  {
    id: 'syn_entry_thu_1',
    subjectId: 'sub_demo_os',
    subjectName: '[Demo] Operating Systems Architecture',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_vance',
    facultyName: 'Dr. Evelyn Vance [Fictional Demo]',
    roomId: 'room_demo_gauss_101',
    roomName: '[Demo] Gauss Lecture Hall 101',
    day: 'Thursday',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_thu_2',
    subjectId: 'sub_demo_algorithms',
    subjectName: '[Demo] Design & Analysis of Algorithms',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_zhao',
    facultyName: 'Prof. Julian Zhao [Fictional Demo]',
    roomId: 'room_demo_euler_102',
    roomName: '[Demo] Euler Lecture Hall 102',
    day: 'Thursday',
    startTime: '10:00',
    endTime: '11:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_thu_3',
    subjectId: 'sub_demo_cloud_lab',
    subjectName: '[Demo] Cloud Infrastructure Practical',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_thorne',
    facultyName: 'Dr. Marcus Thorne [Fictional Demo]',
    roomId: 'room_demo_apex_lab',
    roomName: '[Demo] Apex Systems & Networks Lab',
    day: 'Thursday',
    startTime: '14:00',
    endTime: '15:00',
    sessionType: 'lab'
  },

  // --- FRIDAY ---
  {
    id: 'syn_entry_fri_1',
    subjectId: 'sub_demo_networks',
    subjectName: '[Demo] Network Protocols & Infrastructure',
    batchId: 'batch_demo_alpha',
    batchName: '[Demo] Batch Alpha — Computer Science Year 3',
    facultyId: 'fac_demo_pendelton',
    facultyName: 'Dr. Arthur Pendelton [Fictional Demo]',
    roomId: 'room_demo_gauss_101',
    roomName: '[Demo] Gauss Lecture Hall 101',
    day: 'Friday',
    startTime: '09:00',
    endTime: '10:00',
    sessionType: 'lecture'
  },
  {
    id: 'syn_entry_fri_2',
    subjectId: 'sub_demo_ai',
    subjectName: '[Demo] Principles of Machine Intelligence',
    batchId: 'batch_demo_beta',
    batchName: '[Demo] Batch Beta — Computer Science Year 3',
    facultyId: 'fac_demo_sterling',
    facultyName: 'Prof. Clara Vance-Sterling [Fictional Demo]',
    roomId: 'room_demo_leibniz_201',
    roomName: '[Demo] Leibniz Seminar Room 201',
    day: 'Friday',
    startTime: '10:00',
    endTime: '11:00',
    sessionType: 'lecture'
  }
];

export interface LoadDemoDataResult {
  status: 'loaded_success' | 'existing_preserved';
  message: string;
  stats: {
    batches: number;
    faculty: number;
    subjects: number;
    rooms: number;
    entries: number;
  };
  validationReport: ValidationReport;
}

/**
 * Administrator-controlled demo data loader.
 * Requirement 6: "Do not overwrite existing records when loading demo data."
 * Checks whether records already exist in Firestore; if records exist and forceOverwrite is false,
 * preserves existing records and validates the current state.
 */
export async function loadFictionalDemoData(forceOverwrite: boolean = false): Promise<LoadDemoDataResult> {
  try {
    // 1. Check existing records in Firestore
    const [existingBatchesSnap, existingEntriesSnap] = await Promise.all([
      getDocs(collection(db, BATCHES_COL)),
      getDocs(collection(db, TIMETABLE_COL))
    ]);

    const hasExistingData = !existingBatchesSnap.empty || !existingEntriesSnap.empty;

    if (hasExistingData && !forceOverwrite) {
      // Preserve existing records without overwriting
      const existingEntries = existingEntriesSnap.docs.map((d) => ({ ...d.data(), id: d.id } as TimetableEntry));
      const existingBatches = existingBatchesSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Batch));
      
      const validationReport = validateFullSchedule(
        existingEntries,
        DEMO_FICTIONAL_FACULTY,
        existingBatches,
        DEMO_FICTIONAL_ROOMS,
        DEMO_FICTIONAL_AVAILABILITY
      );

      return {
        status: 'existing_preserved',
        message: 'Existing timetable records detected in Firestore. Existing data was preserved without overwriting.',
        stats: {
          batches: existingBatchesSnap.size,
          faculty: DEMO_FICTIONAL_FACULTY.length,
          subjects: DEMO_FICTIONAL_SUBJECTS.length,
          rooms: DEMO_FICTIONAL_ROOMS.length,
          entries: existingEntriesSnap.size
        },
        validationReport
      };
    }

    // 2. Commit synthetic dataset to Firestore in atomic batch
    const batch = writeBatch(db);

    // Batches
    DEMO_FICTIONAL_BATCHES.forEach((b) => {
      batch.set(doc(db, BATCHES_COL, b.id), sanitizeForFirestore(b));
    });

    // Faculty
    DEMO_FICTIONAL_FACULTY.forEach((f) => {
      batch.set(doc(db, FACULTY_COL, f.id), sanitizeForFirestore(f));
    });

    // Rooms
    DEMO_FICTIONAL_ROOMS.forEach((r) => {
      batch.set(doc(db, ROOMS_COL, r.id), sanitizeForFirestore(r));
    });

    // Subjects
    DEMO_FICTIONAL_SUBJECTS.forEach((s) => {
      batch.set(doc(db, SUBJECTS_COL, s.id), sanitizeForFirestore(s));
    });

    // Availability
    DEMO_FICTIONAL_AVAILABILITY.forEach((a) => {
      batch.set(doc(db, AVAILABILITY_COL, a.id), sanitizeForFirestore(a));
    });

    // Timetable Entries
    DEMO_FICTIONAL_TIMETABLE_ENTRIES.forEach((e) => {
      batch.set(doc(db, TIMETABLE_COL, e.id), sanitizeForFirestore({
        ...e,
        createdAt: new Date().toISOString()
      }));
    });

    await batch.commit();

    // 3. Immediately run full multi-constraint validation
    const validationReport = validateFullSchedule(
      DEMO_FICTIONAL_TIMETABLE_ENTRIES,
      DEMO_FICTIONAL_FACULTY,
      DEMO_FICTIONAL_BATCHES,
      DEMO_FICTIONAL_ROOMS,
      DEMO_FICTIONAL_AVAILABILITY
    );

    return {
      status: 'loaded_success',
      message: 'Fictional demo dataset successfully loaded and synchronized with Cloud Firestore.',
      stats: {
        batches: DEMO_FICTIONAL_BATCHES.length,
        faculty: DEMO_FICTIONAL_FACULTY.length,
        subjects: DEMO_FICTIONAL_SUBJECTS.length,
        rooms: DEMO_FICTIONAL_ROOMS.length,
        entries: DEMO_FICTIONAL_TIMETABLE_ENTRIES.length
      },
      validationReport
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'loadFictionalDemoData');
  }
}

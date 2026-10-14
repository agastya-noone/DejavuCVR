import { DayOfWeek, TimetableConflict, TimetableEntry } from './index';

export type AIIntent =
  | 'GENERAL_QUERY'
  | 'GENERATE_TIMETABLE'
  | 'EXPLAIN_CONFLICT'
  | 'FIND_AVAILABLE_ROOM'
  | 'FIND_AVAILABLE_FACULTY'
  | 'SHOW_TIMETABLE'
  | 'SHOW_FACULTY_WORKLOAD'
  | 'ANALYZE_TIMETABLE'
  | 'COMPARE_CANDIDATES'
  | 'REQUEST_TIMETABLE_CHANGE'
  | 'REQUEST_RESCHEDULE'
  | 'CHECK_FACULTY_AVAILABILITY'
  | 'CHECK_ROOM_AVAILABILITY'
  | 'CHECK_BATCH_AVAILABILITY'
  | 'OPTIMIZE_TIMETABLE'
  | 'SHOW_FREE_PERIODS'
  | 'EXPLAIN_QUALITY_SCORE'
  | 'EXPORT_TIMETABLE'
  | 'PUBLISH_TIMETABLE'
  | 'UNKNOWN';

export interface StructuredAction {
  id: string;
  type:
    | 'APPLY_RESCHEDULE'
    | 'GENERATE_SCHEDULE'
    | 'TRIGGER_EXPORT'
    | 'PUBLISH_TIMETABLE'
    | 'NAVIGATE_TAB'
    | 'FILTER_VIEW';
  title: string;
  summary: string;
  impact?: string;
  requiresConfirmation: boolean;
  isExecuted?: boolean;
  payload: any;
}

export interface TimetableQualityScore {
  overallScore: number; // 0 - 100
  hardConstraintsSatisfied: boolean;
  errorConflictCount: number;
  warningConflictCount: number;
  roomUtilizationRate: number; // 0 - 100%
  facultyLoadBalanceScore: number; // 0 - 100
  studentFatigueScore: number; // 0 - 100 (higher is better, less consecutive classes)
  metrics: {
    label: string;
    value: string | number;
    status: 'good' | 'warning' | 'alert';
    detail: string;
  }[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: AIIntent;
  entities?: Record<string, any>;
  action?: StructuredAction;
  qualityMetrics?: TimetableQualityScore;
  conflictsData?: TimetableConflict[];
  suggestedFollowUps?: string[];
  isError?: boolean;
}

export interface AIProcessRequest {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  userRole: 'admin' | 'teacher' | 'student';
  userInfo: {
    id: string;
    email: string;
    displayName: string;
    batchId?: string;
    facultyId?: string;
  };
  contextSummary: {
    totalEntries: number;
    totalFaculty: number;
    totalBatches: number;
    totalRooms: number;
    totalSubjects: number;
    activeBatchName?: string;
    activeFacultyName?: string;
    sampleEntries: Partial<TimetableEntry>[];
    existingConflicts: number;
  };
}

export interface AIProcessResponse {
  intent: AIIntent;
  entities: Record<string, any>;
  explanation: string;
  action?: StructuredAction;
  recommendations?: string[];
  qualityMetrics?: TimetableQualityScore;
}

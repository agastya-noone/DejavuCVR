import React from 'react';
import {
  DAYS_OF_WEEK,
  TIME_SLOTS,
  DayOfWeek,
  TimetableEntry,
  Faculty
} from '../../types';
import { Clock, MapPin, User, Beaker, BookOpen, Trash2, Edit2 } from 'lucide-react';

interface TimetableGridProps {
  entries: TimetableEntry[];
  facultyList?: Faculty[];
  onEditEntry?: (entry: TimetableEntry) => void;
  onDeleteEntry?: (id: string) => void;
  isAdmin?: boolean;
  highlightFacultyId?: string;
  highlightBatchId?: string;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  entries,
  facultyList = [],
  onEditEntry,
  onDeleteEntry,
  isAdmin = false,
  highlightFacultyId,
  highlightBatchId
}) => {
  // Map entries by day and time slot
  const getEntryForSlot = (day: DayOfWeek, startTime: string): TimetableEntry | undefined => {
    return entries.find(
      (e) => e.day === day && e.startTime.substring(0, 5) === startTime.substring(0, 5)
    );
  };

  const getFacultyColor = (facultyId: string): string => {
    const f = facultyList.find((item) => item.id === facultyId);
    return f?.color || '#6366f1';
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[840px] rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-2xl">
        {/* Table Header: Days of the week */}
        <div className="grid grid-cols-6 border-b border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300">
          <div className="p-3 text-center border-r border-slate-800/80 uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Time Slot</span>
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="p-3 text-center border-r border-slate-800/80 last:border-r-0 uppercase tracking-wider font-bold text-slate-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Table Body: Slots x Days */}
        <div className="divide-y divide-slate-800/60">
          {TIME_SLOTS.map((slot) => (
            <div key={slot.label} className="grid grid-cols-6 min-h-[110px]">
              {/* Time Label Column */}
              <div className="p-3 border-r border-slate-800/80 bg-slate-900/40 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-bold text-slate-200">{slot.start}</span>
                <span className="text-[10px] text-slate-500 font-medium">to</span>
                <span className="text-xs font-medium text-slate-400">{slot.end}</span>
              </div>

              {/* Day Columns */}
              {DAYS_OF_WEEK.map((day) => {
                const entry = getEntryForSlot(day, slot.start);
                const facultyColor = entry ? getFacultyColor(entry.facultyId) : '#6366f1';
                const isHighlighted =
                  entry &&
                  ((highlightFacultyId && entry.facultyId === highlightFacultyId) ||
                    (highlightBatchId && entry.batchId === highlightBatchId));

                return (
                  <div
                    key={`${day}-${slot.label}`}
                    className={`p-2 border-r border-slate-800/80 last:border-r-0 flex flex-col justify-center transition-colors relative ${
                      isHighlighted ? 'bg-indigo-950/20' : 'hover:bg-slate-900/30'
                    }`}
                  >
                    {entry ? (
                      <div
                        className={`group relative rounded-xl p-2.5 transition-all text-left flex flex-col justify-between h-full border ${
                          entry.sessionType === 'lab'
                            ? 'bg-gradient-to-br from-purple-950/40 to-slate-900/90 border-purple-500/30 hover:border-purple-400/50'
                            : 'bg-gradient-to-br from-indigo-950/30 to-slate-900/90 border-indigo-500/25 hover:border-indigo-400/50'
                        } shadow-md`}
                        style={{ borderLeftColor: facultyColor, borderLeftWidth: '4px' }}
                      >
                        {/* Top: Session Type + Actions */}
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                              entry.sessionType === 'lab'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {entry.sessionType === 'lab' ? (
                              <>
                                <Beaker className="w-2.5 h-2.5" /> LAB
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-2.5 h-2.5" /> LEC
                              </>
                            )}
                          </span>

                          {isAdmin && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {onEditEntry && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditEntry(entry);
                                  }}
                                  title="Edit entry"
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                              {onDeleteEntry && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEntry(entry.id);
                                  }}
                                  title="Delete entry"
                                  className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Subject Title */}
                        <div className="font-semibold text-xs text-slate-100 line-clamp-2 leading-tight mb-1.5">
                          {entry.subjectName}
                        </div>

                        {/* Meta details */}
                        <div className="space-y-1 text-[11px] text-slate-400 mt-auto">
                          <div className="flex items-center gap-1 truncate text-slate-300 font-medium">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{entry.facultyName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <span className="flex items-center gap-1 text-slate-400 truncate">
                              <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="truncate">{entry.roomName}</span>
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 shrink-0">
                              {entry.batchName.replace('Computer Science - Year 3 ', '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-700 font-mono">
                        —
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

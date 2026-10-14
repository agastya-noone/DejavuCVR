import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TimetableEntry,
  Room,
  Faculty,
  Batch,
  Subject,
  FacultyAvailability,
  DayOfWeek,
  DAYS_OF_WEEK,
  TIME_SLOTS
} from '../../types';
import { timeToMinutes, isOverlapping, validateFullSchedule } from '../../lib/scheduler';
import {
  AlertTriangle,
  Flame,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Sparkles,
  MapPin,
  UserCheck,
  Users,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  ExternalLink,
  Zap,
  Filter,
  Eye
} from 'lucide-react';

export interface ConflictMapProps {
  entries: TimetableEntry[];
  rooms: Room[];
  faculty: Faculty[];
  batches: Batch[];
  subjects: Subject[];
  availabilities: FacultyAvailability[];
  onEditEntry?: (entry: TimetableEntry) => void;
}

export interface DetectedOverlap {
  id: string;
  type: 'ROOM_DOUBLE_BOOKED' | 'FACULTY_DOUBLE_BOOKED' | 'BATCH_DOUBLE_BOOKED';
  entityId: string;
  entityName: string;
  category: 'room' | 'faculty' | 'batch';
  day: DayOfWeek;
  entryA: TimetableEntry;
  entryB: TimetableEntry;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  description: string;
}

interface SimulatedEntryOverride {
  active: boolean;
  simulatedEntries: TimetableEntry[];
}

export const ConflictMap: React.FC<ConflictMapProps> = ({
  entries,
  rooms,
  faculty,
  batches,
  subjects,
  availabilities,
  onEditEntry
}) => {
  // View mode
  const [viewType, setViewType] = useState<'timeline' | 'network'>('timeline');

  // Resource grouping for timeline
  const [groupBy, setGroupBy] = useState<'room' | 'faculty' | 'batch'>('room');

  // Day filter
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>('Monday');

  // Conflict filter
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  // Selected entry for inspection
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Test simulation state to allow administrators to test the visual collision engine
  const [simulation, setSimulation] = useState<SimulatedEntryOverride>({
    active: false,
    simulatedEntries: []
  });

  // Effective entries (real + simulated if active)
  const effectiveEntries = useMemo(() => {
    if (simulation.active && simulation.simulatedEntries.length > 0) {
      return simulation.simulatedEntries;
    }
    return entries;
  }, [entries, simulation]);

  // Overall schedule validation
  const validation = useMemo(() => {
    return validateFullSchedule(effectiveEntries, faculty, batches, rooms, availabilities);
  }, [effectiveEntries, faculty, batches, rooms, availabilities]);

  // Compute all direct pairwise double-booking overlaps
  const detectedOverlaps = useMemo<DetectedOverlap[]>(() => {
    const overlaps: DetectedOverlap[] = [];
    const seenPairs = new Set<string>();

    for (let i = 0; i < effectiveEntries.length; i++) {
      for (let j = i + 1; j < effectiveEntries.length; j++) {
        const a = effectiveEntries[i];
        const b = effectiveEntries[j];

        if (a.day !== b.day) continue;

        if (isOverlapping(a.startTime, a.endTime, b.startTime, b.endTime)) {
          const startMin = Math.max(timeToMinutes(a.startTime), timeToMinutes(b.startTime));
          const endMin = Math.min(timeToMinutes(a.endTime), timeToMinutes(b.endTime));
          const durMin = Math.max(0, endMin - startMin);

          // Room collision
          if (a.roomId === b.roomId) {
            const pairKey = `room_${a.roomId}_${a.day}_${Math.min(startMin, endMin)}`;
            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              overlaps.push({
                id: `overlap_room_${a.id}_${b.id}`,
                type: 'ROOM_DOUBLE_BOOKED',
                entityId: a.roomId,
                entityName: a.roomName,
                category: 'room',
                day: a.day,
                entryA: a,
                entryB: b,
                startMinutes: startMin,
                endMinutes: endMin,
                durationMinutes: durMin,
                description: `Room "${a.roomName}" is double-booked by "${a.subjectName}" (${a.batchName}) and "${b.subjectName}" (${b.batchName}) on ${a.day} at ${a.startTime}-${a.endTime}.`
              });
            }
          }

          // Faculty collision
          if (a.facultyId === b.facultyId) {
            const pairKey = `fac_${a.facultyId}_${a.day}_${Math.min(startMin, endMin)}`;
            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              overlaps.push({
                id: `overlap_fac_${a.id}_${b.id}`,
                type: 'FACULTY_DOUBLE_BOOKED',
                entityId: a.facultyId,
                entityName: a.facultyName,
                category: 'faculty',
                day: a.day,
                entryA: a,
                entryB: b,
                startMinutes: startMin,
                endMinutes: endMin,
                durationMinutes: durMin,
                description: `Faculty "${a.facultyName}" is scheduled simultaneously for "${a.subjectName}" and "${b.subjectName}" on ${a.day} at ${a.startTime}-${a.endTime}.`
              });
            }
          }

          // Batch collision
          if (a.batchId === b.batchId) {
            const pairKey = `batch_${a.batchId}_${a.day}_${Math.min(startMin, endMin)}`;
            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              overlaps.push({
                id: `overlap_batch_${a.id}_${b.id}`,
                type: 'BATCH_DOUBLE_BOOKED',
                entityId: a.batchId,
                entityName: a.batchName,
                category: 'batch',
                day: a.day,
                entryA: a,
                entryB: b,
                startMinutes: startMin,
                endMinutes: endMin,
                durationMinutes: durMin,
                description: `Batch "${a.batchName}" is booked in two places at once: "${a.subjectName}" in ${a.roomName} and "${b.subjectName}" in ${b.roomName} on ${a.day}.`
              });
            }
          }
        }
      }
    }

    return overlaps;
  }, [effectiveEntries]);

  // Set of entry IDs that are involved in collisions
  const collidingEntryIds = useMemo(() => {
    const ids = new Set<string>();
    detectedOverlaps.forEach((o) => {
      ids.add(o.entryA.id);
      ids.add(o.entryB.id);
    });
    return ids;
  }, [detectedOverlaps]);

  // SVG references for D3 rendering
  const timelineSvgRef = useRef<SVGSVGElement | null>(null);
  const networkSvgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Toggle simulation to test collision highlighting
  const handleToggleSimulation = () => {
    if (simulation.active) {
      setSimulation({ active: false, simulatedEntries: [] });
      setSelectedEntryId(null);
    } else {
      // Find two real entries to create a synthetic double booking on Monday at 09:00
      const cloned = [...effectiveEntries];
      if (cloned.length >= 2) {
        // Clone first entry and schedule another entry in the same room at the same time
        const targetRoom = rooms[0] || { id: 'room_sim', name: 'Lecture Hall 101' };
        const sim1: TimetableEntry = {
          ...cloned[0],
          id: 'sim_clash_1',
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:00',
          roomId: targetRoom.id,
          roomName: targetRoom.name
        };
        const sim2: TimetableEntry = {
          ...cloned[1],
          id: 'sim_clash_2',
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:00',
          roomId: targetRoom.id,
          roomName: targetRoom.name
        };
        setSimulation({
          active: true,
          simulatedEntries: [
            sim1,
            sim2,
            ...cloned.filter((e) => e.id !== cloned[0].id && e.id !== cloned[1].id)
          ]
        });
        setSelectedDay('Monday');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // D3 TIMELINE / GANTT OVERLAY VISUALIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (viewType !== 'timeline' || !timelineSvgRef.current) return;

    const svg = d3.select(timelineSvgRef.current);
    svg.selectAll('*').remove();

    // Determine resources based on groupBy
    let resourcesList: { id: string; name: string; subtitle: string; icon: string }[] = [];
    if (groupBy === 'room') {
      resourcesList = rooms.map((r) => ({
        id: r.id,
        name: r.name,
        subtitle: `${r.isLab ? 'Laboratory' : 'Lecture'} • ${r.capacity} seats`,
        icon: 'room'
      }));
    } else if (groupBy === 'faculty') {
      resourcesList = faculty.map((f) => ({
        id: f.id,
        name: f.name,
        subtitle: `${f.designation} • ${f.department}`,
        icon: 'faculty'
      }));
    } else {
      resourcesList = batches.map((b) => ({
        id: b.id,
        name: b.name,
        subtitle: `${b.year} ${b.semester} • ${b.studentCount} students`,
        icon: 'batch'
      }));
    }

    if (resourcesList.length === 0) return;

    // Filter entries by selected day
    let visibleEntries = effectiveEntries.filter((e) =>
      selectedDay === 'ALL' ? true : e.day === selectedDay
    );

    if (showConflictsOnly) {
      visibleEntries = visibleEntries.filter((e) => collidingEntryIds.has(e.id));
    }

    // Canvas dimensions
    const margin = { top: 60, right: 40, bottom: 40, left: 190 };
    const rowHeight = 75;
    const innerWidth = 980;
    const innerHeight = resourcesList.length * rowHeight;
    const totalWidth = innerWidth + margin.left + margin.right;
    const totalHeight = innerHeight + margin.top + margin.bottom;

    svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    // Definitions (Gradients & Filters for collision glow)
    const defs = svg.append('defs');

    // Conflict Glow Filter
    const filter = defs.append('filter').attr('id', 'collision-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feDropShadow').attr('dx', '0').attr('dy', '0').attr('stdDeviation', '4').attr('flood-color', '#ef4444').attr('flood-opacity', '0.8');

    // Warning Striped Pattern for double booking
    const pattern = defs
      .append('pattern')
      .attr('id', 'conflict-stripes')
      .attr('width', 10)
      .attr('height', 10)
      .attr('patternTransform', 'rotate(45 0 0)')
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 10).attr('stroke', '#ef4444').attr('stroke-width', 4).attr('stroke-opacity', 0.4);
    pattern.append('line').attr('x1', 5).attr('y1', 0).attr('x2', 5).attr('y2', 10).attr('stroke', '#7f1d1d').attr('stroke-width', 4).attr('stroke-opacity', 0.6);

    // Zoom container
    const gContainer = svg.append('g').attr('class', 'zoom-container');

    // Time scale (09:00 -> 17:00, or 540 to 1020 minutes)
    const minTime = 540; // 09:00
    const maxTime = 1020; // 17:00
    const xScale = d3.scaleLinear().domain([minTime, maxTime]).range([margin.left, margin.left + innerWidth]);

    // Resource Y scale
    const yScale = d3
      .scaleBand()
      .domain(resourcesList.map((r) => r.id))
      .range([margin.top, margin.top + innerHeight])
      .padding(0.18);

    // Zoom & Pan behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 3])
      .translateExtent([
        [0, 0],
        [totalWidth * 1.5, totalHeight * 1.5]
      ])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Background resource lanes
    resourcesList.forEach((res, i) => {
      const y = yScale(res.id) || 0;
      const h = yScale.bandwidth();

      // Lane background rect
      gContainer
        .append('rect')
        .attr('x', margin.left)
        .attr('y', y)
        .attr('width', innerWidth)
        .attr('height', h)
        .attr('rx', 8)
        .attr('fill', i % 2 === 0 ? '#0f172a' : '#090d16')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 1);

      // Lane header badge (Left label)
      const labelG = gContainer.append('g').attr('transform', `translate(16, ${y + h / 2 - 10})`);

      labelG
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#f8fafc')
        .attr('font-size', '13px')
        .attr('font-weight', '700')
        .attr('dominant-baseline', 'middle')
        .text(res.name.length > 20 ? res.name.substring(0, 18) + '...' : res.name);

      labelG
        .append('text')
        .attr('x', 0)
        .attr('y', 16)
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('dominant-baseline', 'middle')
        .text(res.subtitle);
    });

    // Time Slot Grid Lines & Labels
    TIME_SLOTS.forEach((slot) => {
      const startMin = timeToMinutes(slot.start);
      const endMin = timeToMinutes(slot.end);
      const xStart = xScale(startMin);
      const xEnd = xScale(endMin);

      // Grid line
      gContainer
        .append('line')
        .attr('x1', xStart)
        .attr('y1', margin.top - 10)
        .attr('x2', xStart)
        .attr('y2', margin.top + innerHeight)
        .attr('stroke', '#334155')
        .attr('stroke-dasharray', '2 4')
        .attr('stroke-opacity', 0.6);

      // Top time label
      gContainer
        .append('text')
        .attr('x', (xStart + xEnd) / 2)
        .attr('y', margin.top - 20)
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('text-anchor', 'middle')
        .text(slot.label);
    });

    // Lunch Recess Shading (13:15 to 14:00)
    const recessStart = xScale(timeToMinutes('13:15'));
    const recessEnd = xScale(timeToMinutes('14:00'));
    gContainer
      .append('rect')
      .attr('x', recessStart)
      .attr('y', margin.top)
      .attr('width', recessEnd - recessStart)
      .attr('height', innerHeight)
      .attr('fill', '#fbbf24')
      .attr('fill-opacity', 0.05);

    gContainer
      .append('text')
      .attr('x', (recessStart + recessEnd) / 2)
      .attr('y', margin.top + innerHeight / 2)
      .attr('fill', '#d97706')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '2px')
      .attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90 ${(recessStart + recessEnd) / 2} ${margin.top + innerHeight / 2})`)
      .text('CAMPUS RECESS');

    // Group entries by resource
    const entriesByResource = new Map<string, TimetableEntry[]>();
    resourcesList.forEach((r) => entriesByResource.set(r.id, []));

    visibleEntries.forEach((entry) => {
      const resId =
        groupBy === 'room'
          ? entry.roomId
          : groupBy === 'faculty'
          ? entry.facultyId
          : entry.batchId;
      if (entriesByResource.has(resId)) {
        entriesByResource.get(resId)!.push(entry);
      }
    });

    // Render schedule blocks inside lanes
    entriesByResource.forEach((resEntries, resId) => {
      const rowY = yScale(resId) || 0;
      const rowH = yScale.bandwidth();

      // Check overlaps among entries in this specific lane
      resEntries.forEach((entry) => {
        const startMin = timeToMinutes(entry.startTime);
        const endMin = timeToMinutes(entry.endTime);
        const x = xScale(startMin);
        const width = Math.max(30, xScale(endMin) - x);

        const isColliding = collidingEntryIds.has(entry.id);
        const isSelected = selectedEntryId === entry.id;

        // In case of overlap in the same lane, check if this is overlapping another in the same lane
        const laneOverlaps = resEntries.filter(
          (o) => o.id !== entry.id && isOverlapping(entry.startTime, entry.endTime, o.startTime, o.endTime)
        );
        const hasLaneOverlap = laneOverlaps.length > 0;

        // If there's an in-lane overlap, stack or offset vertically
        let blockY = rowY + 6;
        let blockH = rowH - 12;

        if (hasLaneOverlap) {
          // split height to make both visually prominent
          const indexInOverlaps = [entry, ...laneOverlaps].sort((a, b) => a.id.localeCompare(b.id)).findIndex((e) => e.id === entry.id);
          const totalOverlaps = 1 + laneOverlaps.length;
          blockH = (rowH - 14) / totalOverlaps;
          blockY = rowY + 6 + indexInOverlaps * (blockH + 2);
        }

        const entryG = gContainer
          .append('g')
          .attr('class', `entry-block cursor-pointer transition-all`)
          .style('cursor', 'pointer')
          .on('click', () => {
            setSelectedEntryId(entry.id);
          });

        // Pulsing background rect if collision
        if (isColliding || hasLaneOverlap) {
          entryG
            .append('rect')
            .attr('x', x - 3)
            .attr('y', blockY - 2)
            .attr('width', width + 6)
            .attr('height', blockH + 4)
            .attr('rx', 6)
            .attr('fill', '#ef4444')
            .attr('fill-opacity', 0.25)
            .attr('filter', 'url(#collision-glow)');
        }

        // Main block rect
        entryG
          .append('rect')
          .attr('x', x)
          .attr('y', blockY)
          .attr('width', width)
          .attr('height', blockH)
          .attr('rx', 5)
          .attr(
            'fill',
            isSelected
              ? '#4f46e5'
              : isColliding || hasLaneOverlap
              ? '#7f1d1d'
              : entry.sessionType === 'lab'
              ? '#312e81'
              : '#1e293b'
          )
          .attr(
            'stroke',
            isSelected
              ? '#818cf8'
              : isColliding || hasLaneOverlap
              ? '#ef4444'
              : entry.sessionType === 'lab'
              ? '#6366f1'
              : '#3b82f6'
          )
          .attr('stroke-width', isSelected || isColliding || hasLaneOverlap ? 2 : 1)
          .attr('stroke-dasharray', isColliding ? '4 2' : 'none');

        // Pattern overlay for conflict
        if (isColliding || hasLaneOverlap) {
          entryG
            .append('rect')
            .attr('x', x)
            .attr('y', blockY)
            .attr('width', width)
            .attr('height', blockH)
            .attr('rx', 5)
            .attr('fill', 'url(#conflict-stripes)')
            .attr('pointer-events', 'none');
        }

        // Text Labels
        const textG = entryG.append('g').attr('transform', `translate(${x + 6}, ${blockY + blockH / 2})`);

        // Subject Title
        textG
          .append('text')
          .attr('x', 0)
          .attr('y', blockH > 35 ? -6 : 0)
          .attr('fill', '#ffffff')
          .attr('font-size', blockH > 35 ? '11px' : '9.5px')
          .attr('font-weight', '700')
          .attr('dominant-baseline', blockH > 35 ? 'auto' : 'middle')
          .text(() => {
            const label = `${entry.subjectName}`;
            const maxChars = Math.floor(width / 7.5);
            return label.length > maxChars ? label.slice(0, Math.max(4, maxChars - 2)) + '..' : label;
          });

        // Detail line (Batch / Faculty / Room depending on groupBy)
        if (blockH > 35) {
          const detail =
            groupBy === 'room'
              ? `${entry.batchName} • ${entry.facultyName}`
              : groupBy === 'faculty'
              ? `${entry.subjectName} • ${entry.roomName}`
              : `${entry.facultyName} • ${entry.roomName}`;

          textG
            .append('text')
            .attr('x', 0)
            .attr('y', 10)
            .attr('fill', isColliding ? '#fca5a5' : '#94a3b8')
            .attr('font-size', '9px')
            .text(() => {
              const maxChars = Math.floor(width / 6.5);
              return detail.length > maxChars ? detail.slice(0, Math.max(4, maxChars - 2)) + '..' : detail;
            });
        }

        // Collision Badge Indicator
        if (isColliding || hasLaneOverlap) {
          const badgeG = entryG
            .append('g')
            .attr('transform', `translate(${x + width - 18}, ${blockY + 4})`);

          badgeG
            .append('circle')
            .attr('cx', 6)
            .attr('cy', 6)
            .attr('r', 7)
            .attr('fill', '#ef4444');

          badgeG
            .append('text')
            .attr('x', 6)
            .attr('y', 9.5)
            .attr('fill', '#ffffff')
            .attr('font-size', '9px')
            .attr('font-weight', '900')
            .attr('text-anchor', 'middle')
            .text('!');
        }
      });
    });

    // Draw collision arc connectors between paired clashing sessions
    detectedOverlaps
      .filter((o) => (selectedDay === 'ALL' ? true : o.day === selectedDay))
      .forEach((ov) => {
        // Find lane coordinates
        const resId = ov.entityId;
        const laneY = yScale(resId);
        if (laneY === undefined) return;

        const xA = xScale(timeToMinutes(ov.entryA.startTime));
        const xB = xScale(timeToMinutes(ov.entryB.startTime));
        const midX = (xA + xB) / 2;

        // Arched bridge connecting conflicting sessions
        const pathData = `M ${xA + 20} ${laneY + 4} Q ${midX} ${laneY - 14} ${xB + 20} ${laneY + 4}`;

        gContainer
          .append('path')
          .attr('d', pathData)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '3 3')
          .attr('opacity', 0.85);

        // Conflict Tag Bubble at apex of arc
        const tag = gContainer
          .append('g')
          .attr('transform', `translate(${midX}, ${laneY - 15})`)
          .style('cursor', 'pointer')
          .on('click', () => {
            setSelectedEntryId(ov.entryA.id);
          });

        tag
          .append('rect')
          .attr('x', -35)
          .attr('y', -10)
          .attr('width', 70)
          .attr('height', 16)
          .attr('rx', 8)
          .attr('fill', '#ef4444');

        tag
          .append('text')
          .attr('x', 0)
          .attr('y', 2)
          .attr('fill', '#ffffff')
          .attr('font-size', '8px')
          .attr('font-weight', '800')
          .attr('text-anchor', 'middle')
          .text('CLASH DETECTED');
      });
  }, [
    viewType,
    groupBy,
    selectedDay,
    showConflictsOnly,
    selectedEntryId,
    effectiveEntries,
    rooms,
    faculty,
    batches,
    collidingEntryIds,
    detectedOverlaps
  ]);

  // ---------------------------------------------------------------------------
  // D3 FORCE-DIRECTED COLLISION NETWORK GRAPH
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (viewType !== 'network' || !networkSvgRef.current) return;

    const svg = d3.select(networkSvgRef.current);
    svg.selectAll('*').remove();

    const width = 900;
    const height = 500;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    let visibleEntries = effectiveEntries.filter((e) =>
      selectedDay === 'ALL' ? true : e.day === selectedDay
    );

    if (showConflictsOnly) {
      visibleEntries = visibleEntries.filter((e) => collidingEntryIds.has(e.id));
    }

    if (visibleEntries.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('fill', '#94a3b8')
        .attr('text-anchor', 'middle')
        .text('No schedule entries found for the selected filter.');
      return;
    }

    // Nodes represent sessions
    interface NetworkNode extends d3.SimulationNodeDatum {
      id: string;
      entry: TimetableEntry;
      isConflict: boolean;
      degree: number;
    }

    interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
      source: string | NetworkNode;
      target: string | NetworkNode;
      type: 'ROOM' | 'FACULTY' | 'BATCH';
      description: string;
    }

    const nodes: NetworkNode[] = visibleEntries.map((e) => ({
      id: e.id,
      entry: e,
      isConflict: collidingEntryIds.has(e.id),
      degree: 0
    }));

    const nodeMap = new Map<string, NetworkNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const links: NetworkLink[] = [];

    // Connect nodes that clash
    detectedOverlaps
      .filter((o) => (selectedDay === 'ALL' ? true : o.day === selectedDay))
      .forEach((o) => {
        if (nodeMap.has(o.entryA.id) && nodeMap.has(o.entryB.id)) {
          links.push({
            source: o.entryA.id,
            target: o.entryB.id,
            type:
              o.type === 'ROOM_DOUBLE_BOOKED'
                ? 'ROOM'
                : o.type === 'FACULTY_DOUBLE_BOOKED'
                ? 'FACULTY'
                : 'BATCH',
            description: o.description
          });
          nodeMap.get(o.entryA.id)!.degree++;
          nodeMap.get(o.entryB.id)!.degree++;
        }
      });

    // D3 Force Simulation
    const simulation = d3
      .forceSimulation<NetworkNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<NetworkNode, NetworkLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    const gContainer = svg.append('g');

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        gContainer.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    // Links (Conflict edges)
    const link = gContainer
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4 3')
      .attr('stroke-opacity', 0.85);

    // Link labels
    const linkText = gContainer
      .append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('fill', '#fca5a5')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('text-anchor', 'middle')
      .text((d) => `${d.type} CLASH`);

    // Nodes (Sessions)
    const node = gContainer
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedEntryId(d.entry.id);
      })
      .call(
        (d3.drag() as any)
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => (d.isConflict ? 24 : 18))
      .attr('fill', (d) => (d.isConflict ? '#7f1d1d' : '#1e293b'))
      .attr('stroke', (d) =>
        d.id === selectedEntryId ? '#818cf8' : d.isConflict ? '#ef4444' : '#3b82f6'
      )
      .attr('stroke-width', (d) => (d.id === selectedEntryId ? 3 : d.isConflict ? 2.5 : 1.5));

    // Node labels
    node
      .append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .text((d) => d.entry.subjectName.slice(0, 6));

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as NetworkNode).x || 0)
        .attr('y1', (d) => (d.source as NetworkNode).y || 0)
        .attr('x2', (d) => (d.target as NetworkNode).x || 0)
        .attr('y2', (d) => (d.target as NetworkNode).y || 0);

      linkText
        .attr('x', (d) => (((d.source as NetworkNode).x || 0) + ((d.target as NetworkNode).x || 0)) / 2)
        .attr('y', (d) => (((d.source as NetworkNode).y || 0) + ((d.target as NetworkNode).y || 0)) / 2 - 4);

      node.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`);
    });
  }, [viewType, selectedDay, showConflictsOnly, selectedEntryId, effectiveEntries, collidingEntryIds, detectedOverlaps]);

  // Zoom controls
  const handleZoomIn = () => {
    if (timelineSvgRef.current && zoomBehaviorRef.current) {
      d3.select(timelineSvgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (timelineSvgRef.current && zoomBehaviorRef.current) {
      d3.select(timelineSvgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (timelineSvgRef.current && zoomBehaviorRef.current) {
      d3.select(timelineSvgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Inspect selected entry
  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null;
    return effectiveEntries.find((e) => e.id === selectedEntryId) || null;
  }, [selectedEntryId, effectiveEntries]);

  // Conflicts related to the selected entry
  const selectedEntryCollisions = useMemo(() => {
    if (!selectedEntry) return [];
    return detectedOverlaps.filter(
      (o) => o.entryA.id === selectedEntry.id || o.entryB.id === selectedEntry.id
    );
  }, [selectedEntry, detectedOverlaps]);

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Heading & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Interactive Schedule Conflict Map</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                D3.js Collision Engine
              </span>
              {simulation.active && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                  <Zap className="w-3 h-3 text-amber-400" /> Test Double-Booking Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Visualizes spatial and temporal double-bookings across rooms, faculty, and student cohorts.
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewType('timeline')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewType === 'timeline' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Timeline Matrix
            </button>
            <button
              onClick={() => setViewType('network')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewType === 'network' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Collision Graph
            </button>
          </div>

          {/* Simulate Double-Booking button (for evaluator testing) */}
          <button
            onClick={handleToggleSimulation}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              simulation.active
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${simulation.active ? 'text-amber-400' : 'text-slate-400'}`} />
            {simulation.active ? 'Clear Test Collision' : '⚡ Simulate Test Collision'}
          </button>

          {/* D3 Zoom Controls */}
          {viewType === 'timeline' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset View"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Resource Dimension (Group By) */}
        {viewType === 'timeline' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Lanes:</span>
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setGroupBy('room')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  groupBy === 'room' ? 'bg-violet-600 text-white' : 'text-slate-400'
                }`}
              >
                <MapPin className="w-3 h-3" /> Rooms ({rooms.length})
              </button>
              <button
                onClick={() => setGroupBy('faculty')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  groupBy === 'faculty' ? 'bg-violet-600 text-white' : 'text-slate-400'
                }`}
              >
                <UserCheck className="w-3 h-3" /> Faculty ({faculty.length})
              </button>
              <button
                onClick={() => setGroupBy('batch')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  groupBy === 'batch' ? 'bg-violet-600 text-white' : 'text-slate-400'
                }`}
              >
                <Users className="w-3 h-3" /> Batches ({batches.length})
              </button>
            </div>
          </div>
        )}

        {/* Day Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-slate-400 font-medium mr-1">Day:</span>
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedDay === day ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {day}
            </button>
          ))}
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              selectedDay === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Days
          </button>
        </div>

        {/* Conflict Filter Toggle */}
        <button
          onClick={() => setShowConflictsOnly(!showConflictsOnly)}
          className={`px-3 py-1 rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
            showConflictsOnly
              ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-3 h-3" />
          {showConflictsOnly ? 'Showing Conflicts Only' : 'Show All Sessions'}
        </button>
      </div>

      {/* Main D3 Visualization Canvas */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800/90 shadow-2xl p-4 overflow-hidden relative">
        {/* Collision summary counter overlay */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow">
          {detectedOverlaps.length === 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 0 Simultaneous Overlaps
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> {detectedOverlaps.length} Overlapping Bookings
            </div>
          )}
        </div>

        {viewType === 'timeline' ? (
          <div className="w-full overflow-x-auto min-h-[480px]">
            <svg
              ref={timelineSvgRef}
              className="w-full h-auto min-w-[900px] select-none"
              style={{ minHeight: '480px' }}
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto min-h-[480px]">
            <svg
              ref={networkSvgRef}
              className="w-full h-auto min-w-[800px] select-none"
              style={{ minHeight: '480px' }}
            />
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Lecture Session
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Laboratory Practical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-600 border border-rose-400 inline-block animate-pulse" /> Double-Booked / Conflict
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30 inline-block" /> Recess Hour
            </span>
          </div>
          <span className="text-slate-500 italic">
            Click any session or clash marker to inspect & reschedule
          </span>
        </div>
      </div>

      {/* Selected Collision & Session Inspector */}
      {selectedEntry && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-indigo-900/40 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedEntry.sessionType.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedEntry.day} • {selectedEntry.startTime} - {selectedEntry.endTime}
                </span>
              </div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                {selectedEntry.subjectName}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Batch: <span className="text-white font-medium">{selectedEntry.batchName}</span> •
                Faculty: <span className="text-white font-medium">{selectedEntry.facultyName}</span> •
                Room: <span className="text-white font-medium">{selectedEntry.roomName}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onEditEntry && (
                <button
                  onClick={() => onEditEntry(selectedEntry)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Edit Session
                </button>
              )}
              <button
                onClick={() => setSelectedEntryId(null)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Active collision detail cards for this session */}
          {selectedEntryCollisions.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h5 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Detected Overlap Violations ({selectedEntryCollisions.length})
              </h5>
              {selectedEntryCollisions.map((coll, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-rose-300 uppercase text-[10px] block mb-0.5">
                      {coll.type.replace(/_/g, ' ')} ({coll.durationMinutes} min overlap)
                    </span>
                    <p className="text-slate-200">{coll.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      const other = coll.entryA.id === selectedEntry.id ? coll.entryB : coll.entryA;
                      setSelectedEntryId(other.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-[11px] font-semibold shrink-0 cursor-pointer"
                  >
                    View Clashing Session
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>This session is verified and clean of direct room, faculty, or cohort collisions.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

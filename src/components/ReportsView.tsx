import React, { useState, useMemo } from 'react';
import { LogEntry, PurposeCategory, Person } from '../types';
import { DelegationPotential, Alignment } from '../enums';
import { DELEGATION_POTENTIAL_OPTIONS, ALIGNMENT_OPTIONS } from '../constants';
import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  subMonths,
  isSameMonth,
  parseISO,
} from 'date-fns';

interface ReportsViewProps {
  allEntries: Record<string, LogEntry[]>;
  purposeCategories: PurposeCategory[];
  people: Person[];
}

type TimeRange = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth';

const timeRangeFilters: Record<TimeRange, (date: Date) => boolean> = {
  today: isToday,
  yesterday: isYesterday,
  thisWeek: (date: Date) => isThisWeek(date, { weekStartsOn: 1 }),
  thisMonth: isThisMonth,
  lastMonth: (date: Date) => {
    const lastMonthDate = subMonths(new Date(), 1);
    return isSameMonth(date, lastMonthDate);
  },
};

const TimeRangeLabels: Record<TimeRange, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
}

const StatCard: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-slate-50 rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);


export const ReportsView: React.FC<ReportsViewProps> = ({ allEntries, purposeCategories, people }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('thisWeek');

  const categoryMap = useMemo(() => {
    return new Map(purposeCategories.map(cat => [cat.id, cat]));
  }, [purposeCategories]);

  const personMap = useMemo(() => {
    return new Map(people.map(p => [p.id, p.name]));
  }, [people]);

  const filteredEntries = useMemo(() => {
    const flatEntries = Object.values(allEntries).flat();
    const filterFn = timeRangeFilters[timeRange];
    return flatEntries.filter((entry: LogEntry) => filterFn(parseISO(entry.date)));
  }, [allEntries, timeRange]);

  const stats = useMemo(() => {
    const purposeTotals: Record<string, number> = {};
    purposeCategories.forEach(cat => purposeTotals[cat.id] = 0);
    
    const delegationTotals: Record<string, number> = {};
    DELEGATION_POTENTIAL_OPTIONS.forEach(opt => delegationTotals[opt.value] = 0);

    const alignmentTotals: Record<string, number> = {};
    ALIGNMENT_OPTIONS.forEach(opt => alignmentTotals[opt.value] = 0);

    const personTotals: Record<string, { total: number, plannedMeeting: number, unplannedMeeting: number }> = {};
    people.forEach(p => personTotals[p.id] = { total: 0, plannedMeeting: 0, unplannedMeeting: 0 });
    
    let totalDuration = 0;

    filteredEntries.forEach(entry => {
      // Standard stats
      if (purposeTotals.hasOwnProperty(entry.projectPurposeId)) {
        purposeTotals[entry.projectPurposeId] += entry.duration;
      }
      delegationTotals[entry.delegationPotential] += entry.duration;
      alignmentTotals[entry.alignment] += entry.duration;
      totalDuration += entry.duration;

      // People stats
      if (entry.personId && personTotals.hasOwnProperty(entry.personId)) {
          personTotals[entry.personId].total += entry.duration;
          const category = categoryMap.get(entry.projectPurposeId);
          if (category?.label.toLowerCase().includes('meeting')) {
              if (entry.alignment === Alignment.ALIGNED) {
                  personTotals[entry.personId].plannedMeeting += entry.duration;
              } else {
                  personTotals[entry.personId].unplannedMeeting += entry.duration;
              }
          }
      }
    });

    const purposeStats = purposeCategories.map(cat => {
      const duration = purposeTotals[cat.id] || 0;
      return {
        id: cat.id,
        label: cat.label,
        color: cat.color,
        duration,
        percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0,
      };
    }).sort((a, b) => b.duration - a.duration);

    const delegationStats = DELEGATION_POTENTIAL_OPTIONS.map(({ value, label }) => {
      const duration = delegationTotals[value] || 0;
      return { value, label, duration, percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0 };
    }).sort((a,b) => b.duration - a.duration);
    
    const alignmentStats = ALIGNMENT_OPTIONS.map(({ value, label }) => {
      const duration = alignmentTotals[value] || 0;
      return { value, label, duration, percentage: totalDuration > 0 ? (duration / totalDuration) * 100 : 0 };
    }).sort((a,b) => b.duration - a.duration);

    const personStats = people.map(person => {
      const data = personTotals[person.id];
      return {
        id: person.id,
        name: person.name,
        total: data.total,
        plannedMeeting: data.plannedMeeting,
        unplannedMeeting: data.unplannedMeeting,
      };
    }).filter(p => p.total > 0).sort((a, b) => b.total - a.total);

    return { purposeStats, delegationStats, alignmentStats, personStats, totalDuration };
  }, [filteredEntries, purposeCategories, people, categoryMap]);

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(TimeRangeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500">No logged time for {TimeRangeLabels[timeRange].toLowerCase()}.</p>
        </div>
      )}

      {filteredEntries.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">Total Time Logged</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{formatMinutes(stats.totalDuration)}</p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">Planned Work</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {stats.alignmentStats.find(s => s.value === Alignment.ALIGNED)?.percentage.toFixed(0)}%
              </p>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">Disruptions</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {stats.alignmentStats.find(s => s.value === Alignment.DISRUPTION)?.percentage.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatCard title="Time by Purpose">
              {stats.purposeStats.map(stat => (
                <div key={stat.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-3 h-3 rounded ${stat.color.bg} ${stat.color.border} border-2`}></div>
                    <span className="text-sm text-slate-700">{stat.label}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-900">{formatMinutes(stat.duration)}</span>
                    <span className="text-xs text-slate-500 w-10 text-right">{stat.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </StatCard>

            <StatCard title="Delegation Potential">
              {stats.delegationStats.map(stat => (
                <div key={stat.value} className="flex justify-between items-center">
                  <span className="text-sm text-slate-700 flex-1">{stat.label}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-900">{formatMinutes(stat.duration)}</span>
                    <span className="text-xs text-slate-500 w-10 text-right">{stat.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </StatCard>

            <StatCard title="Work Alignment">
              {stats.alignmentStats.map(stat => (
                <div key={stat.value} className="flex justify-between items-center">
                  <span className="text-sm text-slate-700 flex-1">{stat.label}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-900">{formatMinutes(stat.duration)}</span>
                    <span className="text-xs text-slate-500 w-10 text-right">{stat.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </StatCard>

            <StatCard title="Time with People">
              {stats.personStats.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No person-based time logged yet.</p>
              ) : (
                stats.personStats.map(stat => (
                  <div key={stat.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{stat.name}</span>
                      <span className="text-sm font-medium text-slate-900">{formatMinutes(stat.total)}</span>
                    </div>
                    {(stat.plannedMeeting > 0 || stat.unplannedMeeting > 0) && (
                      <div className="text-xs text-slate-500 pl-4">
                        {stat.plannedMeeting > 0 && <span>Planned: {formatMinutes(stat.plannedMeeting)}</span>}
                        {stat.plannedMeeting > 0 && stat.unplannedMeeting > 0 && <span className="mx-2">•</span>}
                        {stat.unplannedMeeting > 0 && <span>Unplanned: {formatMinutes(stat.unplannedMeeting)}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </StatCard>
          </div>
        </>
      )}
    </div>
  );
};

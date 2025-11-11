import React, { useState, useRef, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { TIME_SLOTS } from '../constants';
import { LogEntry, Selection, PurposeCategory, Person, PlanEntry, NewPlanEntry } from '../types';
import { PlanModal } from './PlanModal';

interface DayViewProps {
  currentDate: Date;
  entries: LogEntry[];
  plans: PlanEntry[];
  purposeCategories: PurposeCategory[];
  people: Person[];
  onSelect: (selection: Selection) => void;
  onEdit: (entry: LogEntry) => void;
  onEditPlan: (plan: PlanEntry) => void;
  onChangeDay: (offset: number) => void;
  onSavePlan: (plan: NewPlanEntry | PlanEntry) => void;
  onDeletePlan: (planId: string) => void;
  onLogFromPlan: (plan: PlanEntry) => void;
}

type Mode = 'log' | 'plan';

const timeToIndex = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours - 8) * 4 + minutes / 15;
};

const DEFAULT_COLOR = { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-800' };

export const DayView: React.FC<DayViewProps> = ({ 
  currentDate, entries, plans, purposeCategories, people, onSelect, onEdit, onEditPlan, 
  onChangeDay, onSavePlan, onDeletePlan, onLogFromPlan
}) => {
  const [selectionStartIndex, setSelectionStartIndex] = useState<number | null>(null);
  const [selectionEndIndex, setSelectionEndIndex] = useState<number | null>(null);
  const isSelecting = useRef(false);
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('log');
  
  const [planModalState, setPlanModalState] = useState<{ isOpen: boolean; selection: Selection | null; editingPlan: PlanEntry | null }>({ isOpen: false, selection: null, editingPlan: null });


  const categoryMap = useMemo(() => {
    return new Map(purposeCategories.map(cat => [cat.id, cat]));
  }, [purposeCategories]);
  
  const personMap = useMemo(() => {
    return new Map(people.map(p => [p.id, p]));
  }, [people]);

  const occupiedLogSlots = useMemo(() => {
    const occupied = new Set<number>();
    entries.forEach(entry => {
      const startIndex = timeToIndex(entry.startTime);
      const numSlots = entry.duration / 15;
      for (let i = 0; i < numSlots; i++) {
        occupied.add(startIndex + i);
      }
    });
    return occupied;
  }, [entries]);

  const occupiedPlanSlots = useMemo(() => {
    const occupied = new Set<number>();
    plans.forEach(plan => {
      const startIndex = timeToIndex(plan.startTime);
      const numSlots = plan.duration / 15;
      for (let i = 0; i < numSlots; i++) {
        occupied.add(startIndex + i);
      }
    });
    return occupied;
  }, [plans]);

  const handleSelectionStart = (index: number) => {
    if (mode === 'log' && occupiedLogSlots.has(index)) return;
    isSelecting.current = true;
    setSelectionStartIndex(index);
    setSelectionEndIndex(index);
  };
  
  const handleSelectionMove = (index: number) => {
    if (isSelecting.current) {
        setSelectionEndIndex(index);
    }
  };

  const handleSelectionEnd = () => {
    if (!isSelecting.current || selectionStartIndex === null || selectionEndIndex === null) return;

    isSelecting.current = false;
    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    
    const occupiedSlots = mode === 'log' ? occupiedLogSlots : occupiedPlanSlots;
    let isValidSelection = true;
    for(let i = start; i <= end; i++) {
        if(occupiedSlots.has(i)) {
            isValidSelection = false;
            break;
        }
    }

    if(isValidSelection) {
        const startTime = TIME_SLOTS[start].time;
        const duration = (end - start + 1) * 15;
        const selection = { date: currentDate, startTime, duration };
        if (mode === 'log') {
          onSelect(selection);
        } else {
          setPlanModalState({ isOpen: true, selection, editingPlan: null });
        }
    }

    setSelectionStartIndex(null);
    setSelectionEndIndex(null);
  };
  
  const handleEditPlanClick = (plan: PlanEntry) => {
    setPlanModalState({ isOpen: true, selection: null, editingPlan: plan });
  }

  const handleClosePlanModal = () => {
    setPlanModalState({ isOpen: false, selection: null, editingPlan: null });
  }
  
  const renderSelection = () => {
    if (selectionStartIndex === null || selectionEndIndex === null) return null;

    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    
    const occupiedSlots = mode === 'log' ? occupiedLogSlots : occupiedPlanSlots;
    let isOverlapping = false;
    for (let i = start; i <= end; i++) {
      if (occupiedSlots.has(i)) {
        isOverlapping = true;
        break;
      }
    }

    const top = `${start * 2.5}rem`;
    const height = `${(end - start + 1) * 2.5}rem`;

    return (
        <div
            className={`absolute left-0 w-full rounded-lg pointer-events-none ${isOverlapping ? 'bg-red-400/50' : 'bg-blue-400/50'}`}
            style={{ top, height, zIndex: 5 }}
        />
    );
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button onClick={() => onChangeDay(-1)} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center order-first sm:order-none w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{format(currentDate, 'EEEE')}</h2>
            <p className="text-slate-500">{format(currentDate, 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-200 p-1 rounded-lg flex">
            <button onClick={() => setMode('plan')} className={`px-3 py-1 text-sm font-medium rounded-md ${mode === 'plan' ? 'bg-white shadow' : 'text-slate-600'}`}>Plan</button>
            <button onClick={() => setMode('log')} className={`px-3 py-1 text-sm font-medium rounded-md ${mode === 'log' ? 'bg-white shadow' : 'text-slate-600'}`}>Log</button>
          </div>
          <button onClick={() => onChangeDay(1)} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="flex" onMouseUp={handleSelectionEnd} onMouseLeave={handleSelectionEnd}>
        <div className="w-16 text-right pr-2">
          {TIME_SLOTS.map((slot, index) => (
            <div key={index} className="h-10 flex items-start justify-end">
              {slot.isStartOfHour && <span className="text-xs text-slate-500 -mt-2">{slot.time}</span>}
            </div>
          ))}
        </div>
        <div 
          className="flex-1 relative" 
          ref={scheduleGridRef}
        >
            {TIME_SLOTS.map((slot, index) => (
              <div
                key={index}
                className={`h-10 border-t border-slate-200 ${(mode === 'log' && occupiedLogSlots.has(index)) || (mode === 'plan' && occupiedPlanSlots.has(index)) ? 'bg-slate-100' : 'cursor-pointer hover:bg-blue-50'}`}
                onMouseDown={() => handleSelectionStart(index)}
                onMouseMove={() => handleSelectionMove(index)}
              ></div>
            ))}
            {renderSelection()}

            {/* Render Plans */}
            {plans.map(plan => {
                const startIndex = timeToIndex(plan.startTime);
                const durationSlots = plan.duration / 15;
                const top = `${startIndex * 2.5}rem`;
                const height = `${durationSlots * 2.5}rem`;
                const category = categoryMap.get(plan.projectPurposeId);
                const colors = category ? category.color : DEFAULT_COLOR;
                
                const isLogged = useMemo(() => {
                  for (let i = 0; i < durationSlots; i++) {
                    if (occupiedLogSlots.has(startIndex + i)) return true;
                  }
                  return false;
                }, [occupiedLogSlots, startIndex, durationSlots]);

                if (isLogged) return null; // Don't render plan if a log entry covers it

                return (
                    <div
                        key={plan.id}
                        className={`absolute left-1 right-1 p-2 rounded-lg cursor-pointer border-2 border-dashed ${colors.border} ${colors.text} bg-white/50 backdrop-blur-sm group`}
                        style={{ top, height, zIndex: 8 }}
                        onClick={() => handleEditPlanClick(plan)}
                    >
                        <p className="font-semibold text-sm truncate">{plan.activityDescription}</p>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={(e) => { e.stopPropagation(); onLogFromPlan(plan); }} className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-md hover:bg-green-600">
                            Log This
                          </button>
                        </div>
                    </div>
                );
            })}


            {/* Render Logged Entries */}
            {entries.map(entry => {
                const startIndex = timeToIndex(entry.startTime);
                const durationSlots = entry.duration / 15;
                const top = `${startIndex * 2.5}rem`;
                const height = `${durationSlots * 2.5}rem`;
                const category = categoryMap.get(entry.projectPurposeId);
                const person = entry.personId ? personMap.get(entry.personId) : null;
                const colors = category ? category.color : DEFAULT_COLOR;
                
                return (
                    <div
                        key={entry.id}
                        className={`absolute left-1 right-1 p-2 rounded-lg cursor-pointer ${colors.bg} ${colors.border} border-l-4 overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-center`}
                        style={{ top, height, zIndex: 10 }}
                        onClick={() => onEdit(entry)}
                    >
                        <p className={`font-semibold text-sm ${colors.text} truncate`}>{entry.activityDescription}</p>
                        {durationSlots > 1 && person && (
                           <p className={`text-xs ${colors.text} opacity-80 truncate`}>{person.name}</p>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
    {planModalState.isOpen && (
      <PlanModal 
        isOpen={planModalState.isOpen}
        onClose={handleClosePlanModal}
        onSave={onSavePlan}
        onDelete={onDeletePlan}
        selection={planModalState.selection}
        editingPlan={planModalState.editingPlan}
        purposeCategories={purposeCategories}
      />
    )}
    </>
  );
};

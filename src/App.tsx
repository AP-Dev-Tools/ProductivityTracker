import React, { useState, useEffect } from 'react';
import { DayView } from './components/DayView';
import { EntryModal } from './components/EntryModal';
import { ReportsView } from './components/ReportsView';
import { Login } from './components/Login';
import { LogEntry, NewLogEntry, Selection, PurposeCategory, Person, PlanEntry, NewPlanEntry } from './types';
import { format, addDays, subDays } from 'date-fns';
import { DEFAULT_PURPOSE_CATEGORIES, COLOR_PALETTE, DEFAULT_PEOPLE } from './constants';
import { supabaseService } from './services/supabaseService';

type View = 'day' | 'reports';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Record<string, LogEntry[]>>({});
  const [plans, setPlans] = useState<Record<string, PlanEntry[]>>({});
  const [selection, setSelection] = useState<Selection | null>(null);
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanEntry | null>(null);
  const [view, setView] = useState<View>('day');
  const [purposeCategories, setPurposeCategories] = useState<PurposeCategory[]>(DEFAULT_PURPOSE_CATEGORIES);
  const [people, setPeople] = useState<Person[]>(DEFAULT_PEOPLE);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [userEmail, setUserEmail] = useState<string>('');

  // Check initialization and auth on mount
  useEffect(() => {
    const checkSetup = async () => {
      // Supabase is always initialized now (hardcoded credentials)

      try {
        const session = await supabaseService.getSession();
        if (session) {
          setIsAuthenticated(true);
          const user = await supabaseService.getCurrentUser();
          setUserEmail(user?.email || '');
          
          const data = await supabaseService.loadUserData();
          setEntries(data.entries || {});
          setPlans(data.plans || {});
          setPurposeCategories(data.purposeCategories?.length > 0 ? data.purposeCategories : DEFAULT_PURPOSE_CATEGORIES);
          setPeople(data.people?.length > 0 ? data.people : DEFAULT_PEOPLE);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
      
      setIsLoading(false);
    };

    checkSetup();

    if (supabaseService.isInitialized()) {
      const { data: subscription } = supabaseService.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          const user = await supabaseService.getCurrentUser();
          setUserEmail(user?.email || '');
          
          const data = await supabaseService.loadUserData();
          setEntries(data.entries || {});
          setPlans(data.plans || {});
          setPurposeCategories(data.purposeCategories?.length > 0 ? data.purposeCategories : DEFAULT_PURPOSE_CATEGORIES);
          setPeople(data.people?.length > 0 ? data.people : DEFAULT_PEOPLE);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserEmail('');
        }
      });

      return () => {
        subscription?.subscription.unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const saveToSupabase = async () => {
      setSaveStatus('saving');
      try {
        await supabaseService.updateEntries(entries);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save entries:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    };
    const timeoutId = setTimeout(saveToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [entries, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const saveToSupabase = async () => {
      try {
        await supabaseService.updatePlans(plans);
      } catch (error) {
        console.error('Failed to save plans:', error);
      }
    };
    const timeoutId = setTimeout(saveToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [plans, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const saveToSupabase = async () => {
      try {
        await supabaseService.updatePurposeCategories(purposeCategories);
      } catch (error) {
        console.error('Failed to save purpose categories:', error);
      }
    };
    const timeoutId = setTimeout(saveToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [purposeCategories, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const saveToSupabase = async () => {
      try {
        await supabaseService.updatePeople(people);
      } catch (error) {
        console.error('Failed to save people:', error);
      }
    };
    const timeoutId = setTimeout(saveToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [people, isAuthenticated]);

  const handleAddCategory = (newCategoryData: Omit<PurposeCategory, 'id' | 'color'>): PurposeCategory => {
    const newCategory: PurposeCategory = {
      ...newCategoryData,
      id: newCategoryData.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now(),
      color: COLOR_PALETTE[purposeCategories.length % COLOR_PALETTE.length],
    };
    setPurposeCategories(prev => [...prev, newCategory]);
    return newCategory;
  };
  
  const handleAddPerson = (name: string): Person => {
    const newPerson: Person = {
      name,
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now(),
    };
    setPeople(prev => [...prev, newPerson]);
    return newPerson;
  };

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const todaysEntries = entries[dateKey] || [];
  const todaysPlans = plans[dateKey] || [];

  const handleSavePlan = (planData: NewPlanEntry | PlanEntry) => {
    const dateKey = planData.date;
    setPlans(currentPlans => {
      const newPlans = { ...currentPlans };
      const dayPlans = newPlans[dateKey] ? [...newPlans[dateKey]] : [];
      if ('id' in planData) {
        const index = dayPlans.findIndex(p => p.id === planData.id);
        if (index > -1) {
          dayPlans[index] = planData as PlanEntry;
        }
      } else {
        const newPlanWithId: PlanEntry = {
          ...planData,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        };
        dayPlans.push(newPlanWithId);
      }
      dayPlans.sort((a, b) => a.startTime.localeCompare(b.startTime));
      newPlans[dateKey] = dayPlans;
      return newPlans;
    });
    closeModal();
  };

  const handleDeletePlan = (planId: string) => {
    if (!editingPlan) return;
    const dateKey = editingPlan.date;
    setPlans(currentPlans => {
        const newPlans = { ...currentPlans };
        if (!newPlans[dateKey]) return newPlans;
        const dayPlans = newPlans[dateKey].filter(p => p.id !== planId);
        if (dayPlans.length > 0) {
            newPlans[dateKey] = dayPlans;
        } else {
            delete newPlans[dateKey];
        }
        return newPlans;
    });
    closeModal();
  };

  const handleSaveEntry = (entryData: NewLogEntry | LogEntry) => {
    const dateKey = typeof entryData.date === 'string' ? entryData.date : format(entryData.date, 'yyyy-MM-dd');
    const finalEntryData = { ...entryData, date: dateKey };
    setEntries(currentEntries => {
      const newEntries = { ...currentEntries };
      const dayEntries = newEntries[dateKey] ? [...newEntries[dateKey]] : [];
      if ('id' in finalEntryData) {
        const index = dayEntries.findIndex(e => e.id === finalEntryData.id);
        if (index > -1) {
          dayEntries[index] = finalEntryData as LogEntry;
        }
      } else {
        const newEntryWithId: LogEntry = {
          ...finalEntryData,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        };
        dayEntries.push(newEntryWithId);
      }
      dayEntries.sort((a, b) => a.startTime.localeCompare(b.startTime));
      newEntries[dateKey] = dayEntries;
      return newEntries;
    });
    closeModal();
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!editingEntry) return;
    const dateKey = editingEntry.date;
    setEntries(currentEntries => {
        const newEntries = { ...currentEntries };
        if (!newEntries[dateKey]) return newEntries;
        const dayEntries = newEntries[dateKey].filter(e => e.id !== entryId);
        if (dayEntries.length > 0) {
            newEntries[dateKey] = dayEntries;
        } else {
            delete newEntries[dateKey];
        }
        return newEntries;
    });
    closeModal();
  };
  
  const closeModal = () => {
    setSelection(null);
    setEditingEntry(null);
    setEditingPlan(null);
  };

  const handleSelect = (sel: Selection) => setSelection(sel);
  const handleEdit = (entry: LogEntry) => setEditingEntry(entry);
  const handleEditPlan = (plan: PlanEntry) => setEditingPlan(plan);
  const changeDay = (offset: number) => {
    setCurrentDate(current => offset > 0 ? addDays(current, offset) : subDays(current, Math.abs(offset)));
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await supabaseService.signOut();
    }
  };

  const isModalOpen = !!selection || !!editingEntry;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Productivity Time Block Analysis</h1>
              <p className="text-slate-600 mt-1">Plan your day, then track your focus.</p>
            </div>
            <div className="flex items-center gap-4">
              {saveStatus !== 'idle' && (
                <div className={`text-sm px-3 py-1 rounded-full ${
                  saveStatus === 'saving' ? 'bg-blue-100 text-blue-700' :
                  saveStatus === 'saved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save failed'}
                </div>
              )}
              <div className="text-right">
                <p className="text-xs text-slate-500">{userEmail}</p>
                <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700">Sign Out</button>
              </div>
            </div>
          </div>
        </header>
        <nav className="mb-6">
          <div className="border-b border-slate-200">
            <div className="-mb-px flex space-x-6">
              <button onClick={() => setView('day')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'day' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Schedule View</button>
              <button onClick={() => setView('reports')} className={`py-3 px-1 border-b-2 font-medium text-sm ${view === 'reports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Reports & Stats</button>
            </div>
          </div>
        </nav>
        <main>
          {view === 'day' ? (
            <DayView currentDate={currentDate} entries={todaysEntries} plans={todaysPlans} purposeCategories={purposeCategories} people={people} onSelect={handleSelect} onEdit={handleEdit} onEditPlan={handleEditPlan} onChangeDay={changeDay} onSavePlan={handleSavePlan} onDeletePlan={handleDeletePlan} onLogFromPlan={(plan) => {
                setEditingEntry(null);
                setEditingPlan(null);
                setSelection({ date: new Date(plan.date), startTime: plan.startTime, duration: plan.duration});
              }} />
          ) : (
            <ReportsView allEntries={entries} purposeCategories={purposeCategories} people={people} />
          )}
        </main>
      </div>
      {isModalOpen && (
        <EntryModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSaveEntry} onDelete={handleDeleteEntry} selection={selection} editingEntry={editingEntry} purposeCategories={purposeCategories} onAddCategory={handleAddCategory} people={people} onAddPerson={handleAddPerson} />
      )}
    </div>
  );
};

export default App;

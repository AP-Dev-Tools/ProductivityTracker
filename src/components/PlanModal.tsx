import React, { useState, useEffect, FormEvent } from 'react';
import { PlanEntry, NewPlanEntry, Selection, PurposeCategory } from '../types';
import { format } from 'date-fns';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: NewPlanEntry | PlanEntry) => void;
  onDelete: (planId: string) => void;
  selection: Selection | null;
  editingPlan: PlanEntry | null;
  purposeCategories: PurposeCategory[];
}

export const PlanModal: React.FC<PlanModalProps> = ({ 
  isOpen, onClose, onSave, onDelete, selection, editingPlan, purposeCategories 
}) => {
  const [formData, setFormData] = useState({
    activityDescription: '',
    projectPurposeId: purposeCategories[0]?.id || '',
  });
  
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        activityDescription: editingPlan.activityDescription,
        projectPurposeId: editingPlan.projectPurposeId,
      });
    } else if (selection) {
      setFormData({
        activityDescription: '',
        projectPurposeId: purposeCategories[0]?.id || '',
      });
    }
  }, [editingPlan, selection, purposeCategories]);

  if (!isOpen) return null;

  const data = editingPlan || selection;
  if (!data) return null;
    
  const isEditing = !!editingPlan;
  const date = 'date' in data ? (typeof data.date === 'string' ? data.date : format(data.date, 'yyyy-MM-dd')) : format(new Date(), 'yyyy-MM-dd');
  const duration = data.duration;
  const startTime = data.startTime;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.activityDescription.trim()) {
      setError('Activity description is required.');
      return;
    }

    const planData: Omit<NewPlanEntry, 'date' | 'startTime' | 'duration'> = {
      activityDescription: formData.activityDescription,
      projectPurposeId: formData.projectPurposeId,
    };
    
    const finalPlan = { ...planData, date, startTime, duration };

    if (isEditing) {
      onSave({ ...finalPlan, id: editingPlan.id });
    } else {
      onSave(finalPlan);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{isEditing ? 'Edit Plan' : 'Plan Activity'}</h2>
            <div className="flex items-center space-x-4 text-sm text-slate-500 mb-6">
                <span>{format(new Date(date), 'EEEE, MMMM d')}</span>
                <span className="font-mono bg-slate-100 px-2 py-1 rounded">{startTime}</span>
                <span>({duration} mins)</span>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label htmlFor="activityDescription" className="block text-sm font-medium text-slate-700 mb-1">Activity Description</label>
                    <input type="text" id="activityDescription" value={formData.activityDescription} onChange={(e) => setFormData(p => ({ ...p, activityDescription: e.target.value }))} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="What do you plan to do?" />
                </div>
                <div>
                    <label htmlFor="projectPurpose" className="block text-sm font-medium text-slate-700 mb-1">Project Purpose</label>
                    <select id="projectPurpose" value={formData.projectPurposeId} onChange={(e) => setFormData(p => ({ ...p, projectPurposeId: e.target.value}))} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        {purposeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                    </select>
                </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>
          
          <div className="bg-slate-50 px-6 sm:px-8 py-4 flex justify-between items-center rounded-b-xl">
            <div>
            {isEditing && (
              <button type="button" onClick={() => onDelete(editingPlan.id)} className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors">
                Delete Plan
              </button>
            )}
            </div>
            <div className="flex space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {isEditing ? 'Save Changes' : 'Add to Plan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

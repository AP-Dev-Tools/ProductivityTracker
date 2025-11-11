import React, { useState, useEffect, FormEvent } from 'react';
import { LogEntry, NewLogEntry, Selection, PurposeCategory, Person, PlanEntry } from '../types';
import { DELEGATION_POTENTIAL_OPTIONS, ALIGNMENT_OPTIONS } from '../constants';
import { DelegationPotential, Alignment } from '../enums';
import { format } from 'date-fns';
import { AddPurposeModal } from './AddPurposeModal';
import { AddPersonModal } from './AddPersonModal';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: NewLogEntry | LogEntry) => void;
  onDelete: (entryId: string) => void;
  selection: Selection | null;
  editingEntry: LogEntry | null;
  purposeCategories: PurposeCategory[];
  onAddCategory: (data: Omit<PurposeCategory, 'id' | 'color'>) => PurposeCategory;
  people: Person[];
  onAddPerson: (name: string) => Person;
  planForSelection?: PlanEntry | null;
}

export const EntryModal: React.FC<EntryModalProps> = ({ 
  isOpen, onClose, onSave, onDelete, selection, editingEntry, 
  purposeCategories, onAddCategory, people, onAddPerson, planForSelection
}) => {
  const [formData, setFormData] = useState({
    activityDescription: '',
    projectPurposeId: purposeCategories[0]?.id || '',
    purposeExtraInfo: '',
    personId: '',
    delegationPotential: DelegationPotential.ONLY_ME,
    alignment: Alignment.ALIGNED,
    disruptionReason: '',
  });
  
  const [error, setError] = useState<string>('');
  const [isAddingPurpose, setIsAddingPurpose] = useState(false);
  const [isAddingPerson, setIsAddingPerson] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        activityDescription: editingEntry.activityDescription,
        projectPurposeId: editingEntry.projectPurposeId,
        purposeExtraInfo: editingEntry.purposeExtraInfo || '',
        personId: editingEntry.personId || '',
        delegationPotential: editingEntry.delegationPotential,
        alignment: editingEntry.alignment,
        disruptionReason: editingEntry.disruptionReason || '',
      });
    } else if (selection) {
      // If a plan exists for this slot, pre-populate from it
      if (planForSelection) {
        setFormData({
          activityDescription: planForSelection.activityDescription,
          projectPurposeId: planForSelection.projectPurposeId,
          purposeExtraInfo: '',
          personId: '',
          delegationPotential: DelegationPotential.ONLY_ME,
          alignment: Alignment.ALIGNED, // It was planned
          disruptionReason: '',
        });
      } else {
        // Otherwise, it's a disruption by default
        setFormData({
          activityDescription: '',
          projectPurposeId: purposeCategories[0]?.id || '',
          purposeExtraInfo: '',
          personId: '',
          delegationPotential: DelegationPotential.ONLY_ME,
          alignment: Alignment.DISRUPTION, // It wasn't planned
          disruptionReason: '',
        });
      }
    }
  }, [editingEntry, selection, purposeCategories, planForSelection]);

  if (!isOpen) return null;

  const data = editingEntry || selection;
  if (!data) return null;
    
  const isEditing = !!editingEntry;
  const date = 'date' in data ? (typeof data.date === 'string' ? data.date : format(data.date, 'yyyy-MM-dd')) : format(new Date(), 'yyyy-MM-dd');
  const duration = data.duration;
  const startTime = data.startTime;

  const selectedCategory = purposeCategories.find(c => c.id === formData.projectPurposeId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.activityDescription.trim()) {
      setError('Activity description is required.');
      return;
    }
    if (formData.alignment === Alignment.DISRUPTION && !formData.disruptionReason?.trim()) {
      setError('Disruption reason is required when the activity is a disruption.');
      return;
    }
    if (selectedCategory?.extraInfoType === 'text' && !formData.purposeExtraInfo?.trim()) {
      setError(`${selectedCategory.extraInfoPrompt} is required for this purpose.`);
      return;
    }
    if (selectedCategory?.extraInfoType === 'person' && !formData.personId) {
      setError(`Selecting a person for '${selectedCategory.extraInfoPrompt}' is required.`);
      return;
    }

    const entryData: Omit<NewLogEntry, 'date' | 'startTime' | 'duration'> = {
      activityDescription: formData.activityDescription,
      projectPurposeId: formData.projectPurposeId,
      delegationPotential: formData.delegationPotential,
      alignment: formData.alignment,
      disruptionReason: formData.disruptionReason,
      purposeExtraInfo: selectedCategory?.extraInfoType === 'text' ? formData.purposeExtraInfo : '',
      personId: selectedCategory?.extraInfoType === 'person' ? formData.personId : '',
    };
    
    const finalEntry = { ...entryData, date, startTime, duration };

    if (isEditing) {
      onSave({ ...finalEntry, id: editingEntry.id });
    } else {
      onSave(finalEntry);
    }
  };
  
  const handlePurposeChange = (id: string) => {
    setFormData(prev => ({ ...prev, projectPurposeId: id, purposeExtraInfo: '', personId: '' }));
  };
  
  const handleDelegationChange = (value: DelegationPotential) => {
    setFormData(prev => ({ ...prev, delegationPotential: value }));
  };

  const handleAlignmentChange = (value: Alignment) => {
    setFormData(prev => ({ ...prev, alignment: value, disruptionReason: value === Alignment.ALIGNED ? '' : prev.disruptionReason }));
  };
  
  const handleAddNewPurpose = (data: Omit<PurposeCategory, 'id' | 'color'>) => {
    const newCategory = onAddCategory(data);
    setFormData(prev => ({ ...prev, projectPurposeId: newCategory.id }));
    setIsAddingPurpose(false);
  };

  const handleAddNewPerson = (name: string) => {
    const newPerson = onAddPerson(name);
    setFormData(prev => ({ ...prev, personId: newPerson.id }));
    setIsAddingPerson(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{isEditing ? 'Edit Activity' : 'Log New Activity'}</h2>
              <div className="flex items-center space-x-4 text-sm text-slate-500 mb-6">
                  <span>{format(new Date(date), 'EEEE, MMMM d')}</span>
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded">{startTime}</span>
                  <span>({duration} mins)</span>
              </div>
              
              <div className="space-y-6">
                  {/* Activity Description */}
                  <div>
                      <label htmlFor="activityDescription" className="block text-sm font-medium text-slate-700 mb-1">Activity Description</label>
                      <input type="text" id="activityDescription" value={formData.activityDescription} onChange={(e) => setFormData(p => ({ ...p, activityDescription: e.target.value }))} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="What exactly did you do?" />
                  </div>
                  {/* Project Purpose */}
                  <div>
                      <label htmlFor="projectPurpose" className="block text-sm font-medium text-slate-700 mb-1">Project Purpose</label>
                      <div className="flex items-center gap-2">
                        <select id="projectPurpose" value={formData.projectPurposeId} onChange={(e) => handlePurposeChange(e.target.value)} className="flex-grow w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            {purposeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsAddingPurpose(true)} className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200">
                          Add new...
                        </button>
                      </div>
                  </div>

                  {/* Conditional Extra Info for Purpose */}
                  {selectedCategory?.extraInfoType === 'text' && (
                      <div>
                          <label htmlFor="purposeExtraInfo" className="block text-sm font-medium text-slate-700 mb-1">{selectedCategory.extraInfoPrompt}</label>
                          <input type="text" id="purposeExtraInfo" value={formData.purposeExtraInfo} onChange={(e) => setFormData(p => ({ ...p, purposeExtraInfo: e.target.value }))} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                  )}

                  {selectedCategory?.extraInfoType === 'person' && (
                      <div>
                          <label htmlFor="personId" className="block text-sm font-medium text-slate-700 mb-1">{selectedCategory.extraInfoPrompt}</label>
                           <div className="flex items-center gap-2">
                              <select id="personId" value={formData.personId} onChange={(e) => setFormData(p => ({...p, personId: e.target.value}))} className="flex-grow w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                  <option value="">Select person...</option>
                                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <button type="button" onClick={() => setIsAddingPerson(true)} className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200">
                                Add new...
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Delegation Potential */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Delegation Potential</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {DELEGATION_POTENTIAL_OPTIONS.map(opt => (
                             <button key={opt.value} type="button" onClick={() => handleDelegationChange(opt.value)} className={`text-sm text-center p-3 rounded-md border transition-colors ${formData.delegationPotential === opt.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                                 {opt.label}
                             </button>
                          ))}
                      </div>
                  </div>
                  {/* Alignment with Plan */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Alignment with Plan</label>
                      <div className="grid grid-cols-2 gap-2">
                          {ALIGNMENT_OPTIONS.map(opt => (
                             <button key={opt.value} type="button" onClick={() => handleAlignmentChange(opt.value)} className={`text-sm text-center p-3 rounded-md border transition-colors ${formData.alignment === opt.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
                                 {opt.label}
                             </button>
                          ))}
                      </div>
                  </div>
                  {/* Disruption Reason */}
                  {formData.alignment === Alignment.DISRUPTION && (
                      <div>
                          <label htmlFor="disruptionReason" className="block text-sm font-medium text-slate-700 mb-1">Reason for Disruption</label>
                          <textarea id="disruptionReason" value={formData.disruptionReason} onChange={(e) => setFormData(p => ({ ...p, disruptionReason: e.target.value }))} rows={3} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Urgent client request, unexpected bug..."></textarea>
                      </div>
                  )}
              </div>

              {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
            </div>
            
            <div className="bg-slate-50 px-6 sm:px-8 py-4 flex justify-between items-center rounded-b-xl">
              <div>
              {isEditing && (
                <button type="button" onClick={() => onDelete(editingEntry.id)} className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors">
                  Delete Entry
                </button>
              )}
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {isEditing ? 'Save Changes' : 'Log Activity'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      {isAddingPurpose && (
        <AddPurposeModal
          onClose={() => setIsAddingPurpose(false)}
          onSave={handleAddNewPurpose}
        />
      )}
      {isAddingPerson && (
        <AddPersonModal 
          onClose={() => setIsAddingPerson(false)}
          onSave={handleAddNewPerson}
        />
      )}
    </>
  );
};

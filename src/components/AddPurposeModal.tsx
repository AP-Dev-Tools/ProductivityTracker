import React, { useState, FormEvent } from 'react';
import { PurposeCategory } from '../types';

interface AddPurposeModalProps {
  onClose: () => void;
  onSave: (data: Omit<PurposeCategory, 'id' | 'color'>) => void;
}

const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`${enabled ? 'bg-blue-600' : 'bg-slate-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      aria-hidden="true"
      className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
    />
  </button>
);


export const AddPurposeModal: React.FC<AddPurposeModalProps> = ({ onClose, onSave }) => {
  const [label, setLabel] = useState('');
  const [requiresExtraInfo, setRequiresExtraInfo] = useState(false);
  const [extraInfoType, setExtraInfoType] = useState<'text' | 'person'>('text');
  const [extraInfoPrompt, setExtraInfoPrompt] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!label.trim()) {
      setError('Purpose name is required.');
      return;
    }
    if (requiresExtraInfo && !extraInfoPrompt.trim()) {
      setError('Question to ask is required.');
      return;
    }
    onSave({
      label: label.trim(),
      extraInfoType: requiresExtraInfo ? extraInfoType : 'none',
      extraInfoPrompt: requiresExtraInfo ? extraInfoPrompt.trim() : '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Purpose</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="purposeLabel" className="block text-sm font-medium text-slate-700 mb-1">Purpose Name</label>
                <input
                  type="text"
                  id="purposeLabel"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Project Phoenix"
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="requiresExtraInfo" className="text-sm font-medium text-slate-700">Ask for extra info?</label>
                <Toggle enabled={requiresExtraInfo} onChange={setRequiresExtraInfo} />
              </div>
              {requiresExtraInfo && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div>
                    <label htmlFor="extraInfoType" className="block text-sm font-medium text-slate-700 mb-1">Type of Info</label>
                    <select
                      id="extraInfoType"
                      value={extraInfoType}
                      onChange={(e) => setExtraInfoType(e.target.value as 'text' | 'person')}
                      className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text">Text (e.g., a note)</option>
                      <option value="person">Person (from list)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="extraInfoPrompt" className="block text-sm font-medium text-slate-700 mb-1">Question to ask</label>
                    <input
                      type="text"
                      id="extraInfoPrompt"
                      value={extraInfoPrompt}
                      onChange={(e) => setExtraInfoPrompt(e.target.value)}
                      className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder={extraInfoType === 'person' ? "e.g., Who set the meeting?" : "e.g., What was the ticket number?"}
                    />
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
          <div className="bg-slate-50 px-6 py-4 flex justify-end items-center space-x-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Purpose
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
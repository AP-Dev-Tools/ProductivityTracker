import React, { useState, FormEvent } from 'react';

interface AddPersonModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Person\'s name is required.');
      return;
    }
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Person</h2>
            <div>
              <label htmlFor="personName" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                id="personName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., John Doe"
                autoFocus
              />
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
              Save Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
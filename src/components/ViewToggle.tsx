import React from 'react';

interface ViewToggleProps {
  view: '3d' | 'code' | 'split';
  onViewChange: (view: '3d' | 'code' | 'split') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        className={`px-4 py-2 rounded ${
          view === '3d' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
        }`}
        onClick={() => onViewChange('3d')}
      >
        3D View
      </button>
      <button
        className={`px-4 py-2 rounded ${
          view === 'code' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
        }`}
        onClick={() => onViewChange('code')}
      >
        Code Editor
      </button>
      <button
        className={`px-4 py-2 rounded ${
          view === 'split' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
        }`}
        onClick={() => onViewChange('split')}
      >
        Split View
      </button>
    </div>
  );
};
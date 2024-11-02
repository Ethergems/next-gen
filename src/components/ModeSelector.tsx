import React from 'react';

interface ModeSelectorProps {
  isDesktopMode: boolean;
  onModeChange: (mode: 'desktop' | 'browser') => void;
  isElectron: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ isDesktopMode, onModeChange, isElectron }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-white">Mode:</span>
      <div className="flex bg-gray-700 rounded-lg p-1">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            isDesktopMode
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
          onClick={() => onModeChange('desktop')}
          disabled={!isElectron}
          title={!isElectron ? 'Desktop mode requires Electron app' : ''}
        >
          Desktop
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            !isDesktopMode
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
          onClick={() => onModeChange('browser')}
        >
          Browser
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;
import React, { useState, useEffect } from 'react';
import { ValidationManager } from '../services/ValidationManager';
import { ValidationMode } from '../services/DependencyValidationService';

const ValidationPanel: React.FC = () => {
  const [mode, setMode] = useState<ValidationMode>('strict');
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [autoFix, setAutoFix] = useState(false);

  const validationManager = ValidationManager.getInstance();

  const handleValidation = async () => {
    setIsValidating(true);
    try {
      const results = await validationManager.validateEverything();
      setValidationResults(results);

      if (autoFix && !results.valid) {
        const fixed = await validationManager.fixAll();
        if (fixed) {
          // Validate again after fixes
          const finalResults = await validationManager.validateEverything();
          setValidationResults(finalResults);
        }
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
    setIsValidating(false);
  };

  // Auto-validate on component mount
  useEffect(() => {
    handleValidation();
  }, []);

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h2 className="text-xl text-white mb-4">Project Validation</h2>

      <div className="mb-4">
        <label className="block text-white mb-2">Validation Mode</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as ValidationMode)}
          className="w-full bg-gray-800 text-white p-2 rounded"
        >
          <option value="strict">Strict (Stop on Error)</option>
          <option value="auto-fix">Auto-fix</option>
          <option value="post-review">Post Review</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="flex items-center text-white">
          <input
            type="checkbox"
            checked={autoFix}
            onChange={(e) => setAutoFix(e.target.checked)}
            className="mr-2"
          />
          Auto-fix issues when possible
        </label>
      </div>

      <button
        onClick={handleValidation}
        disabled={isValidating}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-500"
      >
        {isValidating ? 'Validating...' : 'Validate Project'}
      </button>

      {validationResults && (
        <div className="mt-4">
          <h3 className="text-white mb-2">Validation Results</h3>
          <div className="bg-gray-800 p-4 rounded">
            {validationResults.valid ? (
              <p className="text-green-500">✓ All validations passed</p>
            ) : (
              <>
                <div className="mb-2">
                  <h4 className="text-white">Issues Found:</h4>
                  <ul className="list-disc list-inside text-red-400">
                    {validationResults.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="text-white">Recommended Fixes:</h4>
                  <ul className="list-disc list-inside text-yellow-400">
                    {validationResults.fixes.map((fix: string, i: number) => (
                      <li key={i}>{fix}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;
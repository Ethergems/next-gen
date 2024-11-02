import React, { useState } from 'react';
import { AIInstructionService } from '../services/AIInstructionService';
import { SupportedLanguage } from '../services/LanguageService';

const AIInstructionPanel: React.FC = () => {
  const [task, setTask] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [language, setLanguage] = useState<SupportedLanguage>('typescript');
  const [result, setResult] = useState<{ code: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const aiService = new AIInstructionService();

  const handleAddRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const handleAddConstraint = () => {
    setConstraints([...constraints, '']);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await aiService.executeInstruction({
        task,
        requirements,
        constraints,
        outputFormat: 'code',
        language
      });
      setResult(response);
    } catch (error) {
      console.error('Instruction execution failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h2 className="text-xl text-white mb-4">AI Instruction Panel</h2>
      
      <div className="mb-4">
        <label className="block text-white mb-2">Task Description</label>
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="w-full bg-gray-800 text-white p-2 rounded"
          rows={4}
        />
      </div>

      <div className="mb-4">
        <label className="block text-white mb-2">Requirements</label>
        {requirements.map((req, index) => (
          <input
            key={index}
            value={req}
            onChange={(e) => {
              const newReqs = [...requirements];
              newReqs[index] = e.target.value;
              setRequirements(newReqs);
            }}
            className="w-full bg-gray-800 text-white p-2 rounded mb-2"
          />
        ))}
        <button
          onClick={handleAddRequirement}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Requirement
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-white mb-2">Constraints</label>
        {constraints.map((con, index) => (
          <input
            key={index}
            value={con}
            onChange={(e) => {
              const newCons = [...constraints];
              newCons[index] = e.target.value;
              setConstraints(newCons);
            }}
            className="w-full bg-gray-800 text-white p-2 rounded mb-2"
          />
        ))}
        <button
          onClick={handleAddConstraint}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Constraint
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-white mb-2">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="w-full bg-gray-800 text-white p-2 rounded"
        >
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="css">CSS</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-500"
      >
        {loading ? 'Generating...' : 'Generate Code'}
      </button>

      {result && (
        <div className="mt-4">
          <h3 className="text-white mb-2">Result</h3>
          <pre className="bg-gray-800 p-4 rounded text-white overflow-auto">
            {result.code}
          </pre>
          <p className="text-white mt-2">{result.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default AIInstructionPanel;
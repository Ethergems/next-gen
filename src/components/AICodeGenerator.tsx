import React, { useState, useEffect } from 'react';
import { AIService, AIModelConfig } from '../services/AIService';
import { LanguageService, SupportedLanguage } from '../services/LanguageService';

const AICodeGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('typescript');
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  const [aiService] = useState(() => new AIService());
  const [languageService] = useState(() => new LanguageService());

  const languages: SupportedLanguage[] = ['typescript', 'javascript', 'python', 'cpp', 'java', 'css'];

  useEffect(() => {
    updateAvailableModels();
  }, [isOnline, selectedLanguage]);

  const updateAvailableModels = () => {
    aiService.setOnlineStatus(isOnline);
    const models = aiService.getAvailableModels()
      .filter(model => model.supportedLanguages.includes(selectedLanguage));
    setAvailableModels(models);
    
    if (!models.find(m => m.name === selectedModel)) {
      setSelectedModel(models[0]?.name || '');
    }
  };

  const generateCode = async () => {
    try {
      if (!selectedModel) {
        throw new Error('Please select a model');
      }

      const result = await languageService.generateCode(
        selectedLanguage,
        prompt,
        selectedModel
      );
      setGeneratedCode(result);
    } catch (error) {
      console.error('Code generation failed:', error);
      setGeneratedCode(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex-1 bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
          className="w-1/3 bg-gray-800 text-white p-2 rounded mr-2"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-1/3 bg-gray-800 text-white p-2 rounded"
        >
          <option value="">Select Model</option>
          {availableModels.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name} {!model.requiresInternet ? '(Offline Available)' : ''}
            </option>
          ))}
        </select>

        <div className="flex items-center">
          <span className="text-white mr-2">Online Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isOnline}
              onChange={(e) => setIsOnline(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-32 bg-gray-800 text-white p-2 rounded mb-4"
        placeholder={`Describe the ${selectedLanguage.toUpperCase()} code you want to generate...`}
      />

      <button
        onClick={generateCode}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
        disabled={!selectedModel}
      >
        Generate Code
      </button>

      <pre className="mt-4 bg-gray-800 p-4 rounded text-white overflow-auto">
        {generatedCode}
      </pre>
    </div>
  );
};

export default AICodeGenerator;
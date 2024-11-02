import React, { useState } from 'react';
import { OpenAI } from 'openai';

const CodeGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateCode = async () => {
    if (!process.env.OPENAI_API_KEY) {
      setGeneratedCode('Please configure your OpenAI API key');
      return;
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful coding assistant. Generate clean, well-documented code."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      setGeneratedCode(response.choices[0]?.message?.content || '');
    } catch (error) {
      setGeneratedCode('Error generating code. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-32 bg-gray-700 text-white p-2 rounded"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the code you want to generate..."
      />
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={generateCode}
      >
        Generate Code
      </button>
      <pre className="bg-gray-700 p-4 rounded text-white">
        {generatedCode}
      </pre>
    </div>
  );
};

export default CodeGenerator;
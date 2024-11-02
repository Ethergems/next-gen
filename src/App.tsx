import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Loader } from '@react-three/drei';
import { Editor } from '@monaco-editor/react';
import HolographicScene from './components/HolographicScene';
import CodeGenerator from './components/CodeGenerator';
import ProjectVisualizer from './components/ProjectVisualizer';
import AIInstructionPanel from './components/AIInstructionPanel';
import ModeSelector from './components/ModeSelector';
import ViewToggle from './components/ViewToggle';
import ModelViewer from './components/ModelViewer';
import DeepEngravingControls from './components/DeepEngravingControls';
import LaserControls from './components/LaserControls';

declare global {
  interface Window {
    electron?: {
      platform: string;
      versions: {
        node: string;
        electron: string;
      };
      isDesktop: boolean;
    };
  }
}

function App() {
  const [isDesktopMode, setIsDesktopMode] = useState(false);
  const [view, setView] = useState<'3d' | 'code' | 'split'>('split');
  const [activeTab, setActiveTab] = useState<'model' | 'engraving' | 'laser'>('model');

  useEffect(() => {
    const isElectron = window.electron?.isDesktop ?? false;
    setIsDesktopMode(isElectron);
  }, []);

  const renderContent = () => {
    switch (view) {
      case '3d':
        return (
          <div className="w-full h-full">
            <div className="mb-4 p-4 bg-gray-800">
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 rounded ${activeTab === 'model' ? 'bg-blue-500' : 'bg-gray-700'}`}
                  onClick={() => setActiveTab('model')}
                >
                  3D Model Viewer
                </button>
                <button
                  className={`px-4 py-2 rounded ${activeTab === 'engraving' ? 'bg-blue-500' : 'bg-gray-700'}`}
                  onClick={() => setActiveTab('engraving')}
                >
                  Deep Engraving
                </button>
                <button
                  className={`px-4 py-2 rounded ${activeTab === 'laser' ? 'bg-blue-500' : 'bg-gray-700'}`}
                  onClick={() => setActiveTab('laser')}
                >
                  Laser Controls
                </button>
              </div>
            </div>
            {activeTab === 'model' && <ModelViewer />}
            {activeTab === 'engraving' && <DeepEngravingControls />}
            {activeTab === 'laser' && <LaserControls />}
          </div>
        );
      case 'code':
        return (
          <div className="w-full h-full">
            <Editor
              height="70%"
              defaultLanguage="typescript"
              defaultValue="// Start coding here"
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
            />
            <div className="h-30% bg-gray-800 p-4 overflow-auto">
              <CodeGenerator />
              <AIInstructionPanel />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex h-full">
            <div className="w-1/2 h-full">
              <Canvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Suspense fallback={null}>
                  <HolographicScene />
                  <ProjectVisualizer />
                </Suspense>
                <OrbitControls />
              </Canvas>
            </div>
            <div className="w-1/2 h-full flex flex-col">
              <Editor
                height="70%"
                defaultLanguage="typescript"
                defaultValue="// Start coding here"
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
              <div className="h-30% bg-gray-800 p-4 overflow-auto">
                <CodeGenerator />
                <AIInstructionPanel />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="p-4 bg-gray-800 flex items-center justify-between">
        <h1 className="text-2xl text-white font-bold">Next Gen Dev Environment</h1>
        <div className="flex items-center space-x-4">
          <ViewToggle view={view} onViewChange={setView} />
          <ModeSelector 
            isDesktopMode={isDesktopMode} 
            onModeChange={(mode) => setIsDesktopMode(mode === 'desktop')}
            isElectron={!!window.electron}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import { DeepEngravingService } from '../services/DeepEngravingService';
import { ModelViewer } from './ModelViewer';

const DeepEngravingControls: React.FC = () => {
  const [settings, setSettings] = useState({
    maxDepth: 2.0,          // 2mm max depth
    passLayers: 20,         // 20 progressive layers
    powerRamp: {
      initial: 40,          // Start at 40% power
      increment: 3,         // Increase 3% per pass
      max: 95              // Max 95% power
    },
    speedProfile: {
      initial: 100,         // 100mm/s initial speed
      reduction: 0.9,       // 10% reduction per pass
      min: 20              // Minimum 20mm/s
    },
    beamProfile: {
      focusOffset: 0.05,    // 0.05mm focus offset per mm depth
      beamOverlap: 30,      // 30% beam overlap
      crosshatchAngle: 45   // 45° crosshatch
    },
    stereoscopicEffect: {
      enabled: true,
      depth: 1.5,          // Enhanced depth multiplier
      layers: 5,           // Number of stereoscopic layers
      separation: 0.2,     // Layer separation in mm
      intensity: 0.8       // Effect intensity
    },
    visualEffects: {
      showLaserTrail: true,
      trailColor: '#00ffff',
      trailIntensity: 0.8,
      pulseEffect: true
    }
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const engravingService = new DeepEngravingService();
        const result = await engravingService.generateDeepEngraving(imageData, settings);
        
        // Update preview with result
        // Preview handling would go here
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Deep Stereoscopic Engraving Controls</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max Depth (mm)</label>
            <input
              type="number"
              value={settings.maxDepth}
              onChange={(e) => setSettings({
                ...settings,
                maxDepth: parseFloat(e.target.value)
              })}
              className="w-full bg-gray-800 rounded px-3 py-2"
              step="0.1"
              min="0.1"
              max="5.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stereoscopic Layers</label>
            <input
              type="number"
              value={settings.stereoscopicEffect.layers}
              onChange={(e) => setSettings({
                ...settings,
                stereoscopicEffect: {
                  ...settings.stereoscopicEffect,
                  layers: parseInt(e.target.value)
                }
              })}
              className="w-full bg-gray-800 rounded px-3 py-2"
              min="3"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Layer Separation (mm)</label>
            <input
              type="number"
              value={settings.stereoscopicEffect.separation}
              onChange={(e) => setSettings({
                ...settings,
                stereoscopicEffect: {
                  ...settings.stereoscopicEffect,
                  separation: parseFloat(e.target.value)
                }
              })}
              className="w-full bg-gray-800 rounded px-3 py-2"
              step="0.05"
              min="0.1"
              max="1.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Effect Intensity</label>
            <input
              type="range"
              value={settings.stereoscopicEffect.intensity * 100}
              onChange={(e) => setSettings({
                ...settings,
                stereoscopicEffect: {
                  ...settings.stereoscopicEffect,
                  intensity: parseInt(e.target.value) / 100
                }
              })}
              className="w-full"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Initial Power (%)</label>
            <input
              type="number"
              value={settings.powerRamp.initial}
              onChange={(e) => setSettings({
                ...settings,
                powerRamp: {
                  ...settings.powerRamp,
                  initial: parseInt(e.target.value)
                }
              })}
              className="w-full bg-gray-800 rounded px-3 py-2"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beam Overlap (%)</label>
            <input
              type="number"
              value={settings.beamProfile.beamOverlap}
              onChange={(e) => setSettings({
                ...settings,
                beamProfile: {
                  ...settings.beamProfile,
                  beamOverlap: parseInt(e.target.value)
                }
              })}
              className="w-full bg-gray-800 rounded px-3 py-2"
              min="10"
              max="90"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full bg-gray-800 rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 h-96">
        <ModelViewer stereoscopic={true} />
      </div>

      <div className="mt-4">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Generate Deep Engraving
        </button>
      </div>
    </div>
  );
};

export default DeepEngravingControls;
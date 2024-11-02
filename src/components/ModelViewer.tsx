import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera,
  Effects,
  Text3D,
  useGLTF,
  Float,
  Environment,
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField,
  Glitch,
  Anaglyph,
  SMAA
} from '@react-three/drei';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

interface ModelViewerProps {
  modelUrl?: string;
  stereoscopic?: boolean;
  holographic?: boolean;
}

const ModelScene: React.FC<{ url?: string; holographic: boolean }> = ({ url, holographic }) => {
  const modelRef = useRef<THREE.Group>();
  const particlesRef = useRef<THREE.Points>();
  const { camera, scene } = useThree();

  // Enhanced camera settings for depth perception
  useEffect(() => {
    camera.position.set(0, 2, 5);
    camera.fov = 45;
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();
  }, [camera]);

  // Load and setup model
  useEffect(() => {
    if (url) {
      const { scene: modelScene } = useGLTF(url);
      if (modelRef.current) {
        modelRef.current.add(modelScene.clone());
      }
    }
  }, [url]);

  // Create holographic particles
  useEffect(() => {
    if (holographic) {
      const particleCount = 1000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
        colors[i * 3 + 2] = 1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, material);
      if (particlesRef.current) {
        scene.add(particles);
      }

      return () => {
        scene.remove(particles);
      };
    }
  }, [holographic, scene]);

  // Animate model and particles
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (modelRef.current) {
      modelRef.current.rotation.y = time * 0.1;
      modelRef.current.position.y = Math.sin(time * 0.5) * 0.1;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.05;
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.001;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <group ref={modelRef} />
      <group ref={particlesRef} />
      
      {/* Holographic Grid */}
      {holographic && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[20, 20, 20, 20]} />
          <meshStandardMaterial
            color="#00ffff"
            wireframe
            transparent
            opacity={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

const ModelViewer: React.FC<ModelViewerProps> = ({ 
  modelUrl, 
  stereoscopic = false,
  holographic = true
}) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{
          background: holographic 
            ? 'radial-gradient(circle at center, #000428 0%, #004e92 100%)'
            : '#000000'
        }}
      >
        <Environment preset="night" />
        
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          color="#00ffff"
          castShadow
        />

        <ModelScene url={modelUrl} holographic={holographic} />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.5}
          rotateSpeed={0.5}
          minDistance={2}
          maxDistance={20}
        />

        <Effects>
          <EffectComposer multisampling={8}>
            <DepthOfField
              focusDistance={0.01}
              focalLength={0.2}
              bokehScale={3}
            />
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.SCREEN}
            />
            {stereoscopic && <Anaglyph />}
            <ChromaticAberration
              offset={[0.004, 0.004]}
              blendFunction={BlendFunction.NORMAL}
              opacity={0.5}
            />
            <Glitch
              delay={[5, 10]}
              duration={[0.2, 0.4]}
              strength={[0.1, 0.2]}
            />
            <SMAA />
          </EffectComposer>
        </Effects>
      </Canvas>
    </div>
  );
};

export default ModelViewer;
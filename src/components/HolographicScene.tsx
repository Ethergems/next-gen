import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Text3D, 
  Float, 
  Environment, 
  Effects,
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField,
  Anaglyph,
  Glitch,
  SMAA
} from '@react-three/drei';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

const HolographicScene = () => {
  const sceneRef = useRef();
  const particlesRef = useRef();
  const { camera } = useThree();

  // Enhanced camera settings for depth perception
  useEffect(() => {
    camera.position.set(0, 2, 8);
    camera.fov = 45;
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();
  }, [camera]);

  // Create floating particles with enhanced depth
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 30; // Increased Z range for more depth
      temp.push({ 
        pos: [x, y, z], 
        scale: Math.random(),
        speed: Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (sceneRef.current) {
      // Add floating motion to entire scene
      sceneRef.current.position.y = Math.sin(time * 0.5) * 0.2;
      sceneRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
    }

    if (particlesRef.current) {
      particlesRef.current.children.forEach((particle, i) => {
        const { speed, offset } = particles[i];
        // Complex particle movement for enhanced depth perception
        particle.position.z += Math.sin(time + offset) * 0.02 * speed;
        particle.position.y += Math.cos(time + offset) * 0.02 * speed;
        particle.position.x += Math.sin(time * 0.5 + offset) * 0.01 * speed;

        // Reset particle position if it goes too far
        if (particle.position.z > 15) particle.position.z = -15;
        if (particle.position.z < -15) particle.position.z = 15;

        // Scale particles based on z-position for depth effect
        const scale = THREE.MathUtils.mapLinear(
          Math.abs(particle.position.z),
          0,
          15,
          1,
          0.3
        );
        particle.scale.setScalar(scale * particles[i].scale);
      });
    }
  });

  return (
    <>
      <Environment preset="night" />
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
          <ChromaticAberration
            offset={[0.004, 0.004]}
            blendFunction={BlendFunction.NORMAL}
            opacity={0.5}
          />
          <Anaglyph />
          <Glitch 
            delay={[5, 10]}
            duration={[0.2, 0.4]}
            strength={[0.1, 0.2]}
          />
          <SMAA />
        </EffectComposer>
      </Effects>

      <group ref={sceneRef}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} color="#00ffff" intensity={2} />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          color="#00ffff"
          castShadow
        />
        
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <Text3D
            font="/fonts/roboto-bold.json"
            size={0.8}
            height={0.4}
            curveSegments={32}
            bevelEnabled
            bevelSize={0.04}
            bevelThickness={0.04}
            position={[-3, 1, 2]}
          >
            NEXT GEN DEV
            <meshPhysicalMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={2}
              roughness={0.2}
              metalness={0.8}
              clearcoat={1}
              clearcoatRoughness={0.2}
              transmission={0.5}
              thickness={0.5}
              envMapIntensity={2}
            />
          </Text3D>
        </Float>

        {/* Enhanced Holographic Grid with Depth */}
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <gridHelper 
            args={[40, 40, "#00ffff", "#00ffff"]}
            position={[0, 0, 0]}
          />
          <mesh>
            <planeGeometry args={[40, 40, 40, 40]} />
            <meshStandardMaterial
              color="#00ffff"
              wireframe
              transparent
              opacity={0.1}
              emissive="#00ffff"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>

        {/* Enhanced Floating Particles with Depth */}
        <group ref={particlesRef}>
          {particles.map((particle, i) => (
            <mesh key={i} position={particle.pos}>
              <dodecahedronGeometry args={[0.15 * particle.scale, 0]} />
              <meshPhysicalMaterial
                color="#00ffff"
                emissive="#00ffff"
                emissiveIntensity={2}
                transparent
                opacity={0.6}
                roughness={0}
                metalness={1}
                envMapIntensity={2}
              />
            </mesh>
          ))}
        </group>

        {/* Energy Beams with Enhanced Depth */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const radius = 15;
          const height = 20;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
              ]}
            >
              <cylinderGeometry args={[0.05, 0.05, height, 8]} />
              <meshPhysicalMaterial
                color="#00ffff"
                emissive="#00ffff"
                emissiveIntensity={2}
                transparent
                opacity={0.3}
                roughness={0}
                metalness={1}
                envMapIntensity={2}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

export default HolographicScene;
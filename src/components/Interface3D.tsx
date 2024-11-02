import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Float } from '@react-three/drei';

const Interface3D: React.FC = () => {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <Text3D
          font="/fonts/roboto-bold.json"
          size={0.5}
          height={0.2}
          curveSegments={12}
          position={[-2, 1, 0]}
        >
          DEV ENV
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.5} />
        </Text3D>
      </Float>
      
      {/* Holographic Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshStandardMaterial
          color="#0088ff"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};

export default Interface3D;
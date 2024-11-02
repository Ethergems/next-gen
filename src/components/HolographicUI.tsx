import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Text3D, Float, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface HologramProps {
  position: [number, number, number];
  children: React.ReactNode;
}

const Hologram: React.FC<HologramProps> = ({ position, children }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {children}
      </Float>
      <gridHelper args={[4, 20]} position={[0, -2, 0]}>
        <meshStandardMaterial color="#00ffff" opacity={0.2} transparent />
      </gridHelper>
    </group>
  );
};

const HolographicUI: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 2, 8);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
      
      <Hologram position={[0, 0, 0]}>
        <Text3D
          font="/fonts/roboto-bold.json"
          size={0.5}
          height={0.2}
          curveSegments={12}
        >
          NEXT GEN DEV
          <meshStandardMaterial 
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={0.5}
          />
        </Text3D>
      </Hologram>

      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20, 20, 20]} />
        <meshStandardMaterial
          color="#00ffff"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </>
  );
};

export default HolographicUI;
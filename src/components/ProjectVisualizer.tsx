import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Line } from '@react-three/drei';

interface Node {
  position: [number, number, number];
  connections: number[];
}

const ProjectVisualizer: React.FC = () => {
  const graphRef = useRef<THREE.Group>(null);
  
  const nodes: Node[] = [
    { position: [-1, 0, 0], connections: [1, 2] },
    { position: [1, 0, 0], connections: [0, 2] },
    { position: [0, 1, 0], connections: [0, 1] }
  ];

  useFrame((state) => {
    if (graphRef.current) {
      graphRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={graphRef}>
      {nodes.map((node, i) => (
        <group key={i}>
          <Sphere position={node.position} args={[0.1, 16, 16]}>
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
          </Sphere>
          
          {node.connections.map((connectionIndex) => (
            <Line
              key={`${i}-${connectionIndex}`}
              points={[node.position, nodes[connectionIndex].position]}
              color="#00ffff"
              lineWidth={1}
              transparent
              opacity={0.5}
            />
          ))}
        </group>
      ))}
    </group>
  );
};

export default ProjectVisualizer;
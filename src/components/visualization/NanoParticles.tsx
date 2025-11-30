import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target: THREE.Vector3;
  color: THREE.Color;
  life: number;
}

interface NanoParticlesProps {
  negative: number;
  positive: number;
  targetOrgan: string;
}

export const NanoParticles = ({ negative, positive, targetOrgan }: NanoParticlesProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const organPositions: Record<string, [number, number, number]> = {
    face: [0, 2.3, 0.3],
    liver: [0.3, 1.2, 0],
    kidneys: [-0.25, 0.8, -0.1],
    stomach: [-0.15, 1.1, 0.1],
    skin: [0, 1.5, 0.42],
    head: [0, 2.5, 0],
    torso: [0, 1, 0],
    heart: [0, 1.3, 0.15],
    lungs: [0, 1.4, 0],
    brain: [0, 2.6, 0],
    intestines: [0, 0.7, 0.1],
  };

  // Optimize: Limit max particles for better performance
  const maxNegative = Math.min(negative, 25);
  const maxPositive = Math.min(positive, 20);
  const particleCount = maxNegative + maxPositive;
  
  const particles = useMemo(() => {
    const particleArray: Particle[] = [];
    const startPosition = new THREE.Vector3(0, 2.3, 0.5); // Face application point
    const targetPos = organPositions[targetOrgan] || [0, 1.5, 0];

    for (let i = 0; i < particleCount; i++) {
      const isNegative = i < maxNegative;
      const spread = 0.3;
      
      particleArray.push({
        position: startPosition.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
          )
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        target: new THREE.Vector3(...targetPos),
        color: new THREE.Color(isNegative ? '#ff4444' : '#44ff88'),
        life: Math.random() * 2 + 3,
      });
    }
    
    return particleArray;
  }, [maxNegative, maxPositive, targetOrgan]);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;

      colors[i * 3] = particle.color.r;
      colors[i * 3 + 1] = particle.color.g;
      colors[i * 3 + 2] = particle.color.b;

      sizes[i] = Math.random() * 0.05 + 0.03;
    });

    return { positions, colors, sizes };
  }, [particles, particleCount]);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    timeRef.current += delta;
    const positionsAttribute = particlesRef.current.geometry.attributes.position;
    const sizesAttribute = particlesRef.current.geometry.attributes.size;
    
    particles.forEach((particle, i) => {
      // Move towards target
      const direction = particle.target.clone().sub(particle.position).normalize();
      const speed = 0.015;
      
      particle.position.add(direction.multiplyScalar(speed));
      particle.position.add(particle.velocity);
      
      // Add some randomness
      particle.velocity.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.001,
          (Math.random() - 0.5) * 0.001,
          (Math.random() - 0.5) * 0.001
        )
      );
      
      // Update positions
      positionsAttribute.setXYZ(i, particle.position.x, particle.position.y, particle.position.z);
      
      // Pulse effect
      const pulseSize = Math.sin(timeRef.current * 3 + i) * 0.01 + 0.04;
      sizesAttribute.setX(i, pulseSize);
      
      // Reset if reached target
      const distance = particle.position.distanceTo(particle.target);
      if (distance < 0.2) {
        const startPosition = new THREE.Vector3(0, 2.3, 0.5);
        particle.position.copy(startPosition).add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
          )
        );
      }
    });
    
    positionsAttribute.needsUpdate = true;
    sizesAttribute.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

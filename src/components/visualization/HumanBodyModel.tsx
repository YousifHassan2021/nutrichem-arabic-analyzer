import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface OrganData {
  position: [number, number, number];
  scale: [number, number, number];
  name: string;
  affected: boolean;
  affectedBy: string[];
}

interface HumanBodyModelProps {
  affectedOrgans: string[];
  onOrganClick: (organ: string, position: THREE.Vector3) => void;
}

export const HumanBodyModel = ({ affectedOrgans, onOrganClick }: HumanBodyModelProps) => {
  const bodyRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (bodyRef.current) {
      bodyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  const organs: Record<string, OrganData> = {
    head: { 
      position: [0, 2.5, 0], 
      scale: [0.5, 0.6, 0.5], 
      name: 'الرأس',
      affected: affectedOrgans.includes('head'),
      affectedBy: []
    },
    face: { 
      position: [0, 2.3, 0.3], 
      scale: [0.4, 0.5, 0.2], 
      name: 'الوجه',
      affected: affectedOrgans.includes('face'),
      affectedBy: []
    },
    torso: { 
      position: [0, 1, 0], 
      scale: [0.6, 1.2, 0.4], 
      name: 'الجذع',
      affected: affectedOrgans.includes('torso'),
      affectedBy: []
    },
    liver: { 
      position: [0.3, 1.2, 0], 
      scale: [0.3, 0.25, 0.2], 
      name: 'الكبد',
      affected: affectedOrgans.includes('liver'),
      affectedBy: []
    },
    kidneys: { 
      position: [-0.25, 0.8, -0.1], 
      scale: [0.15, 0.2, 0.15], 
      name: 'الكلى',
      affected: affectedOrgans.includes('kidneys'),
      affectedBy: []
    },
    stomach: { 
      position: [-0.15, 1.1, 0.1], 
      scale: [0.25, 0.3, 0.2], 
      name: 'المعدة',
      affected: affectedOrgans.includes('stomach'),
      affectedBy: []
    },
    skin: { 
      position: [0, 1.5, 0.42], 
      scale: [0.55, 1, 0.05], 
      name: 'الجلد',
      affected: affectedOrgans.includes('skin'),
      affectedBy: []
    },
  };

  const getOrganColor = (affected: boolean) => {
    return affected ? '#ff4444' : '#4a90e2';
  };

  const getOrganEmissive = (affected: boolean) => {
    return affected ? '#ff0000' : '#0066cc';
  };

  return (
    <group ref={bodyRef}>
      {/* Head */}
      <Sphere 
        args={[1, 32, 32]} 
        position={organs.head.position}
        scale={organs.head.scale}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('head', new THREE.Vector3(...organs.head.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.head.affected)}
          emissive={getOrganEmissive(organs.head.affected)}
          emissiveIntensity={organs.head.affected ? 0.5 : 0.1}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Face overlay */}
      <Sphere 
        args={[1, 32, 32]} 
        position={organs.face.position}
        scale={organs.face.scale}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('face', new THREE.Vector3(...organs.face.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.face.affected)}
          emissive={getOrganEmissive(organs.face.affected)}
          emissiveIntensity={organs.face.affected ? 0.6 : 0.1}
          transparent
          opacity={0.7}
        />
      </Sphere>

      {/* Torso */}
      <Cylinder 
        args={[0.6, 0.7, 2, 32]}
        position={organs.torso.position}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('torso', new THREE.Vector3(...organs.torso.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.torso.affected)}
          emissive={getOrganEmissive(organs.torso.affected)}
          emissiveIntensity={organs.torso.affected ? 0.3 : 0.05}
          transparent
          opacity={0.6}
        />
      </Cylinder>

      {/* Liver */}
      <Sphere 
        args={[1, 32, 32]} 
        position={organs.liver.position}
        scale={organs.liver.scale}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('liver', new THREE.Vector3(...organs.liver.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.liver.affected)}
          emissive={getOrganEmissive(organs.liver.affected)}
          emissiveIntensity={organs.liver.affected ? 0.7 : 0.15}
          transparent
          opacity={0.85}
        />
      </Sphere>

      {/* Kidneys */}
      <group>
        <Sphere 
          args={[1, 32, 32]} 
          position={organs.kidneys.position}
          scale={organs.kidneys.scale}
          onClick={(e) => {
            e.stopPropagation();
            onOrganClick('kidneys', new THREE.Vector3(...organs.kidneys.position));
          }}
        >
          <meshStandardMaterial 
            color={getOrganColor(organs.kidneys.affected)}
            emissive={getOrganEmissive(organs.kidneys.affected)}
            emissiveIntensity={organs.kidneys.affected ? 0.7 : 0.15}
            transparent
            opacity={0.85}
          />
        </Sphere>
        <Sphere 
          args={[1, 32, 32]} 
          position={[0.25, 0.8, -0.1]}
          scale={organs.kidneys.scale}
          onClick={(e) => {
            e.stopPropagation();
            onOrganClick('kidneys', new THREE.Vector3(...organs.kidneys.position));
          }}
        >
          <meshStandardMaterial 
            color={getOrganColor(organs.kidneys.affected)}
            emissive={getOrganEmissive(organs.kidneys.affected)}
            emissiveIntensity={organs.kidneys.affected ? 0.7 : 0.15}
            transparent
            opacity={0.85}
          />
        </Sphere>
      </group>

      {/* Stomach */}
      <Sphere 
        args={[1, 32, 32]} 
        position={organs.stomach.position}
        scale={organs.stomach.scale}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('stomach', new THREE.Vector3(...organs.stomach.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.stomach.affected)}
          emissive={getOrganEmissive(organs.stomach.affected)}
          emissiveIntensity={organs.stomach.affected ? 0.7 : 0.15}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Skin layer */}
      <Cylinder 
        args={[0.65, 0.75, 2.1, 32]}
        position={organs.skin.position}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('skin', new THREE.Vector3(...organs.skin.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.skin.affected)}
          emissive={getOrganEmissive(organs.skin.affected)}
          emissiveIntensity={organs.skin.affected ? 0.4 : 0.05}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </Cylinder>
    </group>
  );
};

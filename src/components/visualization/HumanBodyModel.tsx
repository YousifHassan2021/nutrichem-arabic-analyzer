import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, useGLTF } from '@react-three/drei';
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
    brain: { 
      position: [0, 2.6, 0], 
      scale: [0.35, 0.4, 0.35], 
      name: 'الدماغ',
      affected: affectedOrgans.includes('brain'),
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
    heart: { 
      position: [0, 1.3, 0.15], 
      scale: [0.2, 0.25, 0.18], 
      name: 'القلب',
      affected: affectedOrgans.includes('heart'),
      affectedBy: []
    },
    lungs: { 
      position: [0, 1.4, 0], 
      scale: [0.45, 0.5, 0.3], 
      name: 'الرئتان',
      affected: affectedOrgans.includes('lungs'),
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
    intestines: { 
      position: [0, 0.7, 0.1], 
      scale: [0.35, 0.4, 0.25], 
      name: 'الأمعاء',
      affected: affectedOrgans.includes('intestines'),
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
      {/* Head - LOD optimized (16 segments instead of 32) */}
      <Sphere 
        args={[1, 20, 20]} 
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

      {/* Brain - detailed inner organ */}
      <Sphere 
        args={[1, 16, 16]} 
        position={organs.brain.position}
        scale={organs.brain.scale}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('brain', new THREE.Vector3(...organs.brain.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.brain.affected)}
          emissive={getOrganEmissive(organs.brain.affected)}
          emissiveIntensity={organs.brain.affected ? 0.7 : 0.15}
          transparent
          opacity={0.7}
          roughness={0.6}
        />
      </Sphere>

      {/* Face overlay - LOD optimized */}
      <Sphere 
        args={[1, 20, 20]} 
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

      {/* Torso - LOD optimized (16 segments) */}
      <Cylinder 
        args={[0.6, 0.7, 2, 20]}
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

      {/* Heart - detailed */}
      <Sphere 
        args={[1, 16, 16]} 
        position={organs.heart.position}
        scale={organs.heart.scale}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('heart', new THREE.Vector3(...organs.heart.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.heart.affected)}
          emissive={getOrganEmissive(organs.heart.affected)}
          emissiveIntensity={organs.heart.affected ? 0.8 : 0.2}
          transparent
          opacity={0.85}
          roughness={0.5}
        />
      </Sphere>

      {/* Lungs - detailed pair */}
      <group>
        <Sphere 
          args={[1, 16, 16]} 
          position={[organs.lungs.position[0] - 0.15, organs.lungs.position[1], organs.lungs.position[2]]}
          scale={[organs.lungs.scale[0] * 0.4, organs.lungs.scale[1], organs.lungs.scale[2]]}
          onClick={(e) => {
            e.stopPropagation();
            onOrganClick('lungs', new THREE.Vector3(...organs.lungs.position));
          }}
        >
          <meshStandardMaterial 
            color={getOrganColor(organs.lungs.affected)}
            emissive={getOrganEmissive(organs.lungs.affected)}
            emissiveIntensity={organs.lungs.affected ? 0.6 : 0.1}
            transparent
            opacity={0.75}
          />
        </Sphere>
        <Sphere 
          args={[1, 16, 16]} 
          position={[organs.lungs.position[0] + 0.15, organs.lungs.position[1], organs.lungs.position[2]]}
          scale={[organs.lungs.scale[0] * 0.4, organs.lungs.scale[1], organs.lungs.scale[2]]}
          onClick={(e) => {
            e.stopPropagation();
            onOrganClick('lungs', new THREE.Vector3(...organs.lungs.position));
          }}
        >
          <meshStandardMaterial 
            color={getOrganColor(organs.lungs.affected)}
            emissive={getOrganEmissive(organs.lungs.affected)}
            emissiveIntensity={organs.lungs.affected ? 0.6 : 0.1}
            transparent
            opacity={0.75}
          />
        </Sphere>
      </group>

      {/* Liver - LOD optimized */}
      <Sphere 
        args={[1, 16, 16]} 
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

      {/* Kidneys - LOD optimized */}
      <group>
        <Sphere 
          args={[1, 14, 14]} 
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
          args={[1, 14, 14]} 
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

      {/* Stomach - LOD optimized */}
      <Sphere 
        args={[1, 16, 16]} 
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

      {/* Intestines - new detailed organ */}
      <Cylinder 
        args={[0.18, 0.2, 0.5, 16]}
        position={organs.intestines.position}
        onClick={(e) => {
          e.stopPropagation();
          onOrganClick('intestines', new THREE.Vector3(...organs.intestines.position));
        }}
      >
        <meshStandardMaterial 
          color={getOrganColor(organs.intestines.affected)}
          emissive={getOrganEmissive(organs.intestines.affected)}
          emissiveIntensity={organs.intestines.affected ? 0.6 : 0.1}
          transparent
          opacity={0.8}
        />
      </Cylinder>

      {/* Skin layer - LOD optimized */}
      <Cylinder 
        args={[0.65, 0.75, 2.1, 20]}
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

      {/* Arms - improved detail with LOD */}
      <Cylinder 
        args={[0.1, 0.08, 0.9, 12]}
        position={[-0.75, 1.2, 0]}
        rotation={[0, 0, Math.PI / 4]}
      >
        <meshStandardMaterial color="#e0c9a6" roughness={0.7} />
      </Cylinder>
      <Cylinder 
        args={[0.1, 0.08, 0.9, 12]}
        position={[0.75, 1.2, 0]}
        rotation={[0, 0, -Math.PI / 4]}
      >
        <meshStandardMaterial color="#e0c9a6" roughness={0.7} />
      </Cylinder>

      {/* Legs - improved detail with LOD */}
      <Cylinder 
        args={[0.12, 0.1, 1.2, 12]}
        position={[-0.2, 0.1, 0]}
      >
        <meshStandardMaterial color="#e0c9a6" roughness={0.7} />
      </Cylinder>
      <Cylinder 
        args={[0.12, 0.1, 1.2, 12]}
        position={[0.2, 0.1, 0]}
      >
        <meshStandardMaterial color="#e0c9a6" roughness={0.7} />
      </Cylinder>
    </group>
  );
};

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useBuildingStore } from '../../store/buildingStore';
import Wall from './Wall';
import Roof from './Roof';
import WallFeature from './WallFeature';
import Gutter from './Gutter';

const Building: React.FC = () => {
  const { dimensions, features, color, roofColor, skylights } = useBuildingStore((state) => state.currentProject.building);
  
  const halfWidth = dimensions.width / 2;
  const halfLength = dimensions.length / 2;
  
  // Calculate total height including roof peak
  const roofHeight = (dimensions.width / 2) * (dimensions.roofPitch / 12);
  const totalHeight = dimensions.height + roofHeight;
  
  // Filter features by wall position for collision detection
  const getWallFeatures = (wallPosition: string) => {
    const wallFeatures = features.filter(feature => feature.position.wallPosition === wallPosition);
    console.log(`Wall ${wallPosition} has ${wallFeatures.length} features:`, wallFeatures.map(f => `${f.type} ${f.width}x${f.height} at ${f.position.alignment} ${f.position.xOffset}`));
    return wallFeatures;
  };
  
  return (
    <group>
      {/* Enhanced Foundation with better materials */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[dimensions.width, 0.2, dimensions.length]} />
        <meshStandardMaterial 
          color="#8B7355" 
          metalness={0.1}
          roughness={0.9}
          envMapIntensity={0.2}
        />
      </mesh>
      
      {/* Front wall */}
      <Wall 
        position={[0, dimensions.height/2, halfLength]} 
        width={dimensions.width}
        height={dimensions.height}
        color={color}
        wallPosition="front"
        roofPitch={dimensions.roofPitch}
        wallFeatures={getWallFeatures('front')}
      />
      
      {/* Back wall */}
      <Wall 
        position={[0, dimensions.height/2, -halfLength]} 
        width={dimensions.width}
        height={dimensions.height}
        color={color}
        wallPosition="back"
        roofPitch={dimensions.roofPitch}
        rotation={[0, Math.PI, 0]}
        wallFeatures={getWallFeatures('back')}
      />
      
      {/* Left wall */}
      <Wall 
        position={[-halfWidth, dimensions.height/2, 0]} 
        width={dimensions.length}
        height={dimensions.height}
        color={color}
        wallPosition="left"
        rotation={[0, Math.PI / 2, 0]}
        wallFeatures={getWallFeatures('left')}
      />
      
      {/* Right wall */}
      <Wall 
        position={[halfWidth, dimensions.height/2, 0]} 
        width={dimensions.length}
        height={dimensions.height}
        color={color}
        wallPosition="right"
        rotation={[0, -Math.PI / 2, 0]}
        wallFeatures={getWallFeatures('right')}
      />
      
      {/* Roof */}
      <Roof
        width={dimensions.width}
        length={dimensions.length}
        height={dimensions.height}
        pitch={dimensions.roofPitch}
        color={roofColor}
        skylights={skylights}
      />
      
      {/* Gutters on both sides */}
      <Gutter
        width={dimensions.width}
        length={dimensions.length}
        height={dimensions.height}
        pitch={dimensions.roofPitch}
        side="left"
      />
      
      <Gutter
        width={dimensions.width}
        length={dimensions.length}
        height={dimensions.height}
        pitch={dimensions.roofPitch}
        side="right"
      />
      
      {/* Wall Features (doors, windows, etc.) */}
      {features.map((feature) => (
        <WallFeature
          key={feature.id}
          feature={feature}
          buildingDimensions={dimensions}
        />
      ))}
    </group>
  );
};

export default Building;
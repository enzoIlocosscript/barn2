import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { WallFeature as WallFeatureType, BuildingDimensions } from '../../types';

interface WallFeatureProps {
  feature: WallFeatureType;
  buildingDimensions: BuildingDimensions;
}

const WallFeature: React.FC<WallFeatureProps> = ({ feature, buildingDimensions }) => {
  const { position, rotation, dimensions } = useMemo(() => {
    const { width, length, height } = buildingDimensions;
    const halfWidth = width / 2;
    const halfLength = length / 2;
    const halfHeight = height / 2;
    
    let x = 0;
    let y = feature.position.yOffset + (feature.height / 2);
    let z = 0;
    let rotY = 0;
    
    // Calculate position based on wall and alignment
    switch (feature.position.wallPosition) {
      case 'front':
        z = halfLength + 0.1; // Slight offset to prevent z-fighting
        
        if (feature.position.alignment === 'left') {
          x = -halfWidth + feature.width/2 + feature.position.xOffset;
        } else if (feature.position.alignment === 'right') {
          x = halfWidth - feature.width/2 - feature.position.xOffset;
        } else { // center
          x = feature.position.xOffset;
        }
        
        rotY = 0;
        break;
        
      case 'back':
        z = -halfLength - 0.1; // Slight offset to prevent z-fighting
        
        if (feature.position.alignment === 'left') {
          x = halfWidth - feature.width/2 - feature.position.xOffset;
        } else if (feature.position.alignment === 'right') {
          x = -halfWidth + feature.width/2 + feature.position.xOffset;
        } else { // center
          x = -feature.position.xOffset;
        }
        
        rotY = Math.PI;
        break;
        
      case 'left':
        x = -halfWidth - 0.1; // Slight offset to prevent z-fighting
        
        if (feature.position.alignment === 'left') {
          z = -halfLength + feature.width/2 + feature.position.xOffset;
        } else if (feature.position.alignment === 'right') {
          z = halfLength - feature.width/2 - feature.position.xOffset;
        } else { // center
          z = feature.position.xOffset;
        }
        
        rotY = Math.PI / 2;
        break;
        
      case 'right':
        x = halfWidth + 0.1; // Slight offset to prevent z-fighting
        
        if (feature.position.alignment === 'left') {
          z = halfLength - feature.width/2 - feature.position.xOffset;
        } else if (feature.position.alignment === 'right') {
          z = -halfLength + feature.width/2 + feature.position.xOffset;
        } else { // center
          z = -feature.position.xOffset;
        }
        
        rotY = -Math.PI / 2;
        break;
    }
    
    return {
      position: [x, y, z] as [number, number, number],
      rotation: [0, rotY, 0] as [number, number, number],
      dimensions: [feature.width, feature.height, 0.4] as [number, number, number]
    };
  }, [feature, buildingDimensions]);

  // Frame component for doors and windows
  const Frame: React.FC<{ dimensions: number[] }> = ({ dimensions }) => (
    <group>
      {/* Top frame */}
      <mesh position={[0, dimensions[1]/2 - 0.1, 0]} castShadow>
        <boxGeometry args={[dimensions[0], 0.2, dimensions[2]]} />
        <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -dimensions[1]/2 + 0.1, 0]} castShadow>
        <boxGeometry args={[dimensions[0], 0.2, dimensions[2]]} />
        <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Left frame */}
      <mesh position={[-dimensions[0]/2 + 0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.2, dimensions[1], dimensions[2]]} />
        <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Right frame */}
      <mesh position={[dimensions[0]/2 - 0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.2, dimensions[1], dimensions[2]]} />
        <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );

  // Render different feature types
  const renderFeature = () => {
    switch (feature.type) {
      case 'door':
        return (
          <group>
            <mesh castShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial color="#8B4513" metalness={0.1} roughness={0.8} />
            </mesh>
            <Frame dimensions={dimensions} />
            {/* Door handles */}
            <mesh position={[dimensions[0]/4, 0, dimensions[2]/2 - 0.05]} castShadow>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial color="#B7791F" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[dimensions[0]/4, 0, -dimensions[2]/2 + 0.05]} castShadow>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial color="#B7791F" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
        
      case 'window':
        return (
          <group>
            <mesh castShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#87CEEB" 
                transparent 
                opacity={0.4} 
                metalness={0.2}
                roughness={0}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            {/* Window cross */}
            <mesh castShadow>
              <boxGeometry args={[dimensions[0] - 0.2, 0.1, dimensions[2]]} />
              <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh castShadow>
              <boxGeometry args={[0.1, dimensions[1] - 0.2, dimensions[2]]} />
              <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
            </mesh>
          </group>
        );
        
      case 'rollupDoor':
        return (
          <group>
            {/* Main door panel */}
            <mesh castShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial color="#708090" metalness={0.4} roughness={0.6} />
            </mesh>
            
            {/* Horizontal panels */}
            {Array.from({ length: Math.floor(dimensions[1]) }).map((_, i) => (
              <React.Fragment key={i}>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, dimensions[2]/2 - 0.05]} castShadow>
                  <boxGeometry args={[dimensions[0], 0.1, 0.1]} />
                  <meshStandardMaterial color="#5A6374" metalness={0.6} roughness={0.4} />
                </mesh>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, -dimensions[2]/2 + 0.05]} castShadow>
                  <boxGeometry args={[dimensions[0], 0.1, 0.1]} />
                  <meshStandardMaterial color="#5A6374" metalness={0.6} roughness={0.4} />
                </mesh>
              </React.Fragment>
            ))}
            
            {/* Door tracks */}
            <mesh position={[-(dimensions[0]/2) - 0.15, 0, 0]} castShadow>
              <boxGeometry args={[0.1, dimensions[1] + 0.4, dimensions[2] + 0.2]} />
              <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[dimensions[0]/2 + 0.15, 0, 0]} castShadow>
              <boxGeometry args={[0.1, dimensions[1] + 0.4, dimensions[2] + 0.2]} />
              <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
            </mesh>
            
            {/* Top header */}
            <mesh position={[0, dimensions[1]/2 + 0.2, 0]} castShadow>
              <boxGeometry args={[dimensions[0] + 0.4, 0.2, dimensions[2] + 0.2]} />
              <meshStandardMaterial color="#4A5568" metalness={0.6} roughness={0.2} />
            </mesh>
          </group>
        );
        
      case 'walkDoor':
        return (
          <group>
            <mesh castShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial color="#696969" metalness={0.2} roughness={0.7} />
            </mesh>
            <Frame dimensions={dimensions} />
            {/* Door handles */}
            <mesh position={[dimensions[0]/3, 0, dimensions[2]/2 - 0.05]} castShadow>
              <boxGeometry args={[0.4, 0.1, 0.15]} />
              <meshStandardMaterial color="#B7791F" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[dimensions[0]/3, 0, -dimensions[2]/2 + 0.05]} castShadow>
              <boxGeometry args={[0.4, 0.1, 0.15]} />
              <meshStandardMaterial color="#B7791F" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
        
      default:
        return null;
    }
  };

  return (
    <group position={position} rotation={rotation}>
      {renderFeature()}
    </group>
  );
};

export default WallFeature;
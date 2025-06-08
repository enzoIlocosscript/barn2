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
    
    // CRITICAL FIX: Enhanced Z-offset positioning to prevent flickering
    const baseOffset = 0.15; // Base offset from wall surface
    const antiFlickerOffset = 0.05; // Additional offset to prevent z-fighting
    const totalOffset = baseOffset + antiFlickerOffset; // 0.2 total offset
    
    // Calculate position based on wall and alignment
    switch (feature.position.wallPosition) {
      case 'front':
        z = halfLength + totalOffset; // Enhanced offset to prevent z-fighting
        
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
        z = -halfLength - totalOffset; // Enhanced offset to prevent z-fighting
        
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
        x = -halfWidth - totalOffset; // Enhanced offset to prevent z-fighting
        
        if (feature.position.alignment === 'right') {
          z = -halfLength + feature.width/2 + feature.position.xOffset;
        } else if (feature.position.alignment === 'left') {
          z = halfLength - feature.width/2 - feature.position.xOffset;
        } else { // center
          z = feature.position.xOffset;
        }
        
        rotY = Math.PI / 2;
        break;
        
      case 'right':
        x = halfWidth + totalOffset; // Enhanced offset to prevent z-fighting
        
        if (feature.position.alignment === 'right') {
          z = halfLength - feature.width/2 - feature.position.xOffset;
        } else if (feature.position.alignment === 'left') {
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
      dimensions: [feature.width, feature.height, 0.3] as [number, number, number] // Reduced depth to prevent overlap
    };
  }, [feature, buildingDimensions]);

  // Enhanced frame component with anti-flickering properties
  const Frame: React.FC<{ dimensions: number[] }> = ({ dimensions }) => (
    <group>
      {/* Top frame */}
      <mesh position={[0, dimensions[1]/2 - 0.1, 0]} castShadow renderOrder={1}>
        <boxGeometry args={[dimensions[0], 0.2, dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -dimensions[1]/2 + 0.1, 0]} castShadow renderOrder={1}>
        <boxGeometry args={[dimensions[0], 0.2, dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
      {/* Left frame */}
      <mesh position={[-dimensions[0]/2 + 0.1, 0, 0]} castShadow renderOrder={1}>
        <boxGeometry args={[0.2, dimensions[1], dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
      {/* Right frame */}
      <mesh position={[dimensions[0]/2 - 0.1, 0, 0]} castShadow renderOrder={1}>
        <boxGeometry args={[0.2, dimensions[1], dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
    </group>
  );

  // Render different feature types with enhanced anti-flickering
  const renderFeature = () => {
    switch (feature.type) {
      case 'door':
        return (
          <group>
            {/* Main door panel with enhanced material properties */}
            <mesh castShadow renderOrder={2}>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#8B4513" 
                metalness={0.1} 
                roughness={0.8}
                depthWrite={true}
                depthTest={true}
                side={THREE.FrontSide}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Door handles with enhanced positioning */}
            <mesh position={[dimensions[0]/4, 0, dimensions[2]/2 - 0.02]} castShadow renderOrder={3}>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <mesh position={[dimensions[0]/4, 0, -dimensions[2]/2 + 0.02]} castShadow renderOrder={3}>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            
            {/* Door panels for visual detail */}
            <mesh position={[0, dimensions[1]/4, dimensions[2]/2 - 0.01]} castShadow renderOrder={2}>
              <boxGeometry args={[dimensions[0] - 0.4, dimensions[1]/2 - 0.2, 0.05]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <mesh position={[0, -dimensions[1]/4, dimensions[2]/2 - 0.01]} castShadow renderOrder={2}>
              <boxGeometry args={[dimensions[0] - 0.4, dimensions[1]/2 - 0.2, 0.05]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
          </group>
        );
        
      case 'window':
        return (
          <group>
            {/* Window glass with enhanced transparency */}
            <mesh castShadow renderOrder={2}>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#87CEEB" 
                transparent 
                opacity={0.4} 
                metalness={0.2}
                roughness={0}
                depthWrite={false}
                depthTest={true}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Window cross with enhanced positioning */}
            <mesh castShadow renderOrder={3}>
              <boxGeometry args={[dimensions[0] - 0.2, 0.1, dimensions[2]]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <mesh castShadow renderOrder={3}>
              <boxGeometry args={[0.1, dimensions[1] - 0.2, dimensions[2]]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
          </group>
        );
        
      case 'rollupDoor':
        return (
          <group>
            {/* Main door panel */}
            <mesh castShadow renderOrder={2}>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#708090" 
                metalness={0.4} 
                roughness={0.6}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            
            {/* Horizontal panels */}
            {Array.from({ length: Math.floor(dimensions[1]) }).map((_, i) => (
              <React.Fragment key={i}>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, dimensions[2]/2 - 0.02]} castShadow renderOrder={3}>
                  <boxGeometry args={[dimensions[0], 0.1, 0.1]} />
                  <meshStandardMaterial 
                    color="#5A6374" 
                    metalness={0.6} 
                    roughness={0.4}
                    depthWrite={true}
                    depthTest={true}
                  />
                </mesh>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, -dimensions[2]/2 + 0.02]} castShadow renderOrder={3}>
                  <boxGeometry args={[dimensions[0], 0.1, 0.1]} />
                  <meshStandardMaterial 
                    color="#5A6374" 
                    metalness={0.6} 
                    roughness={0.4}
                    depthWrite={true}
                    depthTest={true}
                  />
                </mesh>
              </React.Fragment>
            ))}
            
            {/* Door tracks */}
            <mesh position={[-(dimensions[0]/2) - 0.15, 0, 0]} castShadow renderOrder={1}>
              <boxGeometry args={[0.1, dimensions[1] + 0.4, dimensions[2] + 0.2]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <mesh position={[dimensions[0]/2 + 0.15, 0, 0]} castShadow renderOrder={1}>
              <boxGeometry args={[0.1, dimensions[1] + 0.4, dimensions[2] + 0.2]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            
            {/* Top header */}
            <mesh position={[0, dimensions[1]/2 + 0.2, 0]} castShadow renderOrder={1}>
              <boxGeometry args={[dimensions[0] + 0.4, 0.2, dimensions[2] + 0.2]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
          </group>
        );
        
      case 'walkDoor':
        return (
          <group>
            {/* Main door panel */}
            <mesh castShadow renderOrder={2}>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#696969" 
                metalness={0.2} 
                roughness={0.7}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Door handles */}
            <mesh position={[dimensions[0]/3, 0, dimensions[2]/2 - 0.02]} castShadow renderOrder={3}>
              <boxGeometry args={[0.4, 0.1, 0.15]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <mesh position={[dimensions[0]/3, 0, -dimensions[2]/2 + 0.02]} castShadow renderOrder={3}>
              <boxGeometry args={[0.4, 0.1, 0.15]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
                depthWrite={true}
                depthTest={true}
              />
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
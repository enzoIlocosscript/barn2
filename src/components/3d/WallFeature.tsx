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
    
    // CRITICAL FIX: Eliminate Z-fighting by positioning doors COMPLETELY WITHIN wall cutouts
    const wallThickness = 0.2; // Wall is 0.2 feet thick
    const doorThickness = wallThickness * 0.9; // Door is slightly thinner than wall
    const doorOffset = 0; // Position door flush with wall center - NO OFFSET
    
    console.log(`🚪 ANTI-FLICKER: Positioning ${feature.type} flush with wall (offset: ${doorOffset})`);
    
    // Calculate position based on wall and alignment
    switch (feature.position.wallPosition) {
      case 'front':
        z = halfLength + doorOffset; // Flush with wall surface
        
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
        z = -halfLength + doorOffset; // Flush with wall surface
        
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
        x = -halfWidth + doorOffset; // Flush with wall surface
        
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
        x = halfWidth + doorOffset; // Flush with wall surface
        
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
      dimensions: [feature.width, feature.height, doorThickness] as [number, number, number] // Thinner than wall
    };
  }, [feature, buildingDimensions]);

  // ANTI-FLICKER: Enhanced frame component with precise depth control
  const Frame: React.FC<{ dimensions: number[] }> = ({ dimensions }) => (
    <group>
      {/* Top frame - positioned to avoid Z-fighting */}
      <mesh position={[0, dimensions[1]/2 - 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions[0], 0.16, dimensions[2] + 0.02]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -dimensions[1]/2 + 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions[0], 0.16, dimensions[2] + 0.02]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Left frame */}
      <mesh position={[-dimensions[0]/2 + 0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, dimensions[1], dimensions[2] + 0.02]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Right frame */}
      <mesh position={[dimensions[0]/2 - 0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.16, dimensions[1], dimensions[2] + 0.02]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );

  // ANTI-FLICKER: Render features with precise depth control and no Z-fighting
  const renderFeature = () => {
    switch (feature.type) {
      case 'door':
        return (
          <group>
            {/* ANTI-FLICKER: Main door panel with controlled depth */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#8B4513" 
                metalness={0.1} 
                roughness={0.8}
                side={THREE.DoubleSide}
                transparent={false}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Door handles - positioned with precise offsets */}
            <mesh position={[dimensions[0]/4, 0, dimensions[2]/2 - 0.03]} castShadow receiveShadow>
              <sphereGeometry args={[0.1]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
            <mesh position={[dimensions[0]/4, 0, -dimensions[2]/2 + 0.03]} castShadow receiveShadow>
              <sphereGeometry args={[0.1]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
            
            {/* ANTI-FLICKER: Door panels with controlled Z-offsets */}
            <mesh position={[0, dimensions[1]/4, dimensions[2]/2 - 0.015]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.3, dimensions[1]/2 - 0.15, 0.02]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
            <mesh position={[0, -dimensions[1]/4, dimensions[2]/2 - 0.015]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.3, dimensions[1]/2 - 0.15, 0.02]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
            
            {/* Interior side panels with controlled offsets */}
            <mesh position={[0, dimensions[1]/4, -dimensions[2]/2 + 0.015]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.3, dimensions[1]/2 - 0.15, 0.02]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
            <mesh position={[0, -dimensions[1]/4, -dimensions[2]/2 + 0.015]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.3, dimensions[1]/2 - 0.15, 0.02]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
          </group>
        );
        
      case 'window':
        return (
          <group>
            {/* ANTI-FLICKER: Window glass with controlled transparency */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#87CEEB" 
                transparent 
                opacity={0.4} 
                metalness={0.2}
                roughness={0}
                side={THREE.DoubleSide}
                depthWrite={false}
                depthTest={true}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Window cross with precise positioning */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.16, 0.08, dimensions[2] + 0.01]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.08, dimensions[1] - 0.16, dimensions[2] + 0.01]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
          </group>
        );
        
      case 'rollupDoor':
        return (
          <group>
            {/* ANTI-FLICKER: Main door panel with controlled depth */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#708090" 
                metalness={0.4} 
                roughness={0.6}
                side={THREE.DoubleSide}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            
            {/* Horizontal panels with precise Z-offsets */}
            {Array.from({ length: Math.floor(dimensions[1]) }).map((_, i) => (
              <React.Fragment key={i}>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, dimensions[2]/2 - 0.02]} castShadow receiveShadow>
                  <boxGeometry args={[dimensions[0], 0.08, 0.04]} />
                  <meshStandardMaterial 
                    color="#5A6374" 
                    metalness={0.6} 
                    roughness={0.4}
                  />
                </mesh>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, -dimensions[2]/2 + 0.02]} castShadow receiveShadow>
                  <boxGeometry args={[dimensions[0], 0.08, 0.04]} />
                  <meshStandardMaterial 
                    color="#5A6374" 
                    metalness={0.6} 
                    roughness={0.4}
                  />
                </mesh>
              </React.Fragment>
            ))}
            
            {/* Door tracks with enhanced positioning */}
            <mesh position={[-(dimensions[0]/2) - 0.12, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.08, dimensions[1] + 0.3, dimensions[2] + 0.15]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
            <mesh position={[dimensions[0]/2 + 0.12, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.08, dimensions[1] + 0.3, dimensions[2] + 0.15]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
            
            {/* Top header */}
            <mesh position={[0, dimensions[1]/2 + 0.15, 0]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] + 0.3, 0.15, dimensions[2] + 0.15]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
          </group>
        );
        
      case 'walkDoor':
        return (
          <group>
            {/* ANTI-FLICKER: Main door panel with controlled depth */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#696969" 
                metalness={0.2} 
                roughness={0.7}
                side={THREE.DoubleSide}
                depthWrite={true}
                depthTest={true}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Door handles with precise positioning */}
            <mesh position={[dimensions[0]/3, 0, dimensions[2]/2 - 0.03]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 0.08, 0.08]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
            <mesh position={[dimensions[0]/3, 0, -dimensions[2]/2 + 0.03]} castShadow receiveShadow>
              <boxGeometry args={[0.3, 0.08, 0.08]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
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
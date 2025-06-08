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
    
    // CRITICAL FIX: Balanced positioning for interior/exterior visibility
    const wallThickness = 0.2; // Wall is 0.2 feet thick
    const doorOffset = wallThickness / 2; // Position door in center of wall thickness
    
    console.log(`🚪 Positioning ${feature.type} with balanced offset: ${doorOffset}`);
    
    // Calculate position based on wall and alignment
    switch (feature.position.wallPosition) {
      case 'front':
        z = halfLength + doorOffset; // Centered in wall thickness
        
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
        z = -halfLength - doorOffset; // Centered in wall thickness
        
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
        x = -halfWidth - doorOffset; // Centered in wall thickness
        
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
        x = halfWidth + doorOffset; // Centered in wall thickness
        
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
      dimensions: [feature.width, feature.height, wallThickness] as [number, number, number] // Match wall thickness
    };
  }, [feature, buildingDimensions]);

  // Enhanced frame component with proper depth
  const Frame: React.FC<{ dimensions: number[] }> = ({ dimensions }) => (
    <group>
      {/* Top frame */}
      <mesh position={[0, dimensions[1]/2 - 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions[0], 0.2, dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
        />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -dimensions[1]/2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions[0], 0.2, dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
        />
      </mesh>
      {/* Left frame */}
      <mesh position={[-dimensions[0]/2 + 0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, dimensions[1], dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
        />
      </mesh>
      {/* Right frame */}
      <mesh position={[dimensions[0]/2 - 0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, dimensions[1], dimensions[2]]} />
        <meshStandardMaterial 
          color="#4A5568" 
          metalness={0.6} 
          roughness={0.2}
        />
      </mesh>
    </group>
  );

  // Render different feature types with balanced visibility
  const renderFeature = () => {
    switch (feature.type) {
      case 'door':
        return (
          <group>
            {/* Main door panel - visible from both sides */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#8B4513" 
                metalness={0.1} 
                roughness={0.8}
                side={THREE.DoubleSide} // Visible from both sides
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Door handles - positioned for interior access */}
            <mesh position={[dimensions[0]/4, 0, dimensions[2]/2 - 0.05]} castShadow receiveShadow>
              <sphereGeometry args={[0.12]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
            <mesh position={[dimensions[0]/4, 0, -dimensions[2]/2 + 0.05]} castShadow receiveShadow>
              <sphereGeometry args={[0.12]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
            
            {/* Door panels for visual detail - both sides */}
            <mesh position={[0, dimensions[1]/4, dimensions[2]/2 - 0.02]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.4, dimensions[1]/2 - 0.2, 0.03]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
            <mesh position={[0, -dimensions[1]/4, dimensions[2]/2 - 0.02]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.4, dimensions[1]/2 - 0.2, 0.03]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
            
            {/* Interior side panels */}
            <mesh position={[0, dimensions[1]/4, -dimensions[2]/2 + 0.02]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.4, dimensions[1]/2 - 0.2, 0.03]} />
              <meshStandardMaterial 
                color="#7A3F0F" 
                metalness={0.1} 
                roughness={0.9}
              />
            </mesh>
            <mesh position={[0, -dimensions[1]/4, -dimensions[2]/2 + 0.02]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.4, dimensions[1]/2 - 0.2, 0.03]} />
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
            {/* Window glass - visible from both sides */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#87CEEB" 
                transparent 
                opacity={0.4} 
                metalness={0.2}
                roughness={0}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Window cross */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] - 0.2, 0.1, dimensions[2]]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.1, dimensions[1] - 0.2, dimensions[2]]} />
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
            {/* Main door panel - visible from both sides */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#708090" 
                metalness={0.4} 
                roughness={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* Horizontal panels */}
            {Array.from({ length: Math.floor(dimensions[1]) }).map((_, i) => (
              <React.Fragment key={i}>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, dimensions[2]/2 - 0.03]} castShadow receiveShadow>
                  <boxGeometry args={[dimensions[0], 0.1, 0.06]} />
                  <meshStandardMaterial 
                    color="#5A6374" 
                    metalness={0.6} 
                    roughness={0.4}
                  />
                </mesh>
                <mesh position={[0, -dimensions[1]/2 + i + 0.5, -dimensions[2]/2 + 0.03]} castShadow receiveShadow>
                  <boxGeometry args={[dimensions[0], 0.1, 0.06]} />
                  <meshStandardMaterial 
                    color="#5A6374" 
                    metalness={0.6} 
                    roughness={0.4}
                  />
                </mesh>
              </React.Fragment>
            ))}
            
            {/* Door tracks */}
            <mesh position={[-(dimensions[0]/2) - 0.15, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.1, dimensions[1] + 0.4, dimensions[2] + 0.2]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
            <mesh position={[dimensions[0]/2 + 0.15, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.1, dimensions[1] + 0.4, dimensions[2] + 0.2]} />
              <meshStandardMaterial 
                color="#4A5568" 
                metalness={0.6} 
                roughness={0.2}
              />
            </mesh>
            
            {/* Top header */}
            <mesh position={[0, dimensions[1]/2 + 0.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[dimensions[0] + 0.4, 0.2, dimensions[2] + 0.2]} />
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
            {/* Main door panel - visible from both sides */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={dimensions} />
              <meshStandardMaterial 
                color="#696969" 
                metalness={0.2} 
                roughness={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Frame dimensions={dimensions} />
            
            {/* Door handles */}
            <mesh position={[dimensions[0]/3, 0, dimensions[2]/2 - 0.05]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.1, 0.1]} />
              <meshStandardMaterial 
                color="#B7791F" 
                metalness={0.8} 
                roughness={0.2}
              />
            </mesh>
            <mesh position={[dimensions[0]/3, 0, -dimensions[2]/2 + 0.05]} castShadow receiveShadow>
              <boxGeometry args={[0.4, 0.1, 0.1]} />
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
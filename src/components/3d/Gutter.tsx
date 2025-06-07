import React, { useMemo } from 'react';
import * as THREE from 'three';

interface GutterProps {
  width: number;
  length: number;
  height: number;
  pitch: number;
  side: 'left' | 'right';
}

const Gutter: React.FC<GutterProps> = ({ width, length, height, pitch, side }) => {
  const roofHeight = useMemo(() => {
    return (width / 2) * (pitch / 12);
  }, [width, pitch]);
  
  const pitchAngle = Math.atan2(roofHeight, width / 2);
  
  // Gutter dimensions
  const gutterWidth = 0.5; // 6 inches wide
  const gutterDepth = 0.4; // 5 inches deep
  const gutterThickness = 0.05; // Wall thickness
  
  // Position gutter at the edge of the roof
  const gutterX = side === 'left' ? -width/2 - 0.25 : width/2 + 0.25;
  const gutterY = height + 0.3; // Position at roof edge height
  
  // Create U-shaped gutter channel geometry
  const gutterGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Create U-shape profile for the gutter channel
    const halfWidth = gutterWidth / 2;
    const depth = gutterDepth;
    
    // Outer profile
    shape.moveTo(-halfWidth, 0);
    shape.lineTo(-halfWidth, -depth);
    shape.lineTo(halfWidth, -depth);
    shape.lineTo(halfWidth, 0);
    
    // Inner profile (creates the hollow channel)
    const hole = new THREE.Path();
    const innerHalfWidth = halfWidth - gutterThickness;
    const innerDepth = depth - gutterThickness;
    
    hole.moveTo(-innerHalfWidth, -gutterThickness);
    hole.lineTo(-innerHalfWidth, -innerDepth);
    hole.lineTo(innerHalfWidth, -innerDepth);
    hole.lineTo(innerHalfWidth, -gutterThickness);
    
    shape.holes.push(hole);
    
    const extrudeSettings = {
      steps: 1,
      depth: length,
      bevelEnabled: false
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [gutterWidth, gutterDepth, gutterThickness, length]);
  
  // Gutter material - galvanized steel appearance
  const gutterMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#B8B8B8', // Galvanized steel color
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.0,
    });
  }, []);
  
  // Downspout geometry and material
  const downspoutGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.18, 0.18, height + 1, 8); // 3.6" diameter
  }, [height]);
  
  const downspoutMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#B8B8B8',
      metalness: 0.8,
      roughness: 0.3,
      envMapIntensity: 1.0,
    });
  }, []);
  
  // Gutter mounting brackets
  const createBracket = (position: number) => {
    const bracketGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.1);
    const bracketMaterial = new THREE.MeshStandardMaterial({
      color: '#808080',
      metalness: 0.9,
      roughness: 0.1,
    });
    
    return (
      <mesh
        key={`bracket-${position}`}
        position={[0, gutterDepth/2 + 0.1, position]}
        castShadow
        receiveShadow
      >
        <primitive object={bracketGeometry} />
        <primitive object={bracketMaterial} attach="material" />
      </mesh>
    );
  };
  
  // Generate bracket positions every 4 feet for proper support
  const bracketPositions = useMemo(() => {
    const positions = [];
    const spacing = 4;
    for (let pos = -length/2 + spacing/2; pos <= length/2 - spacing/2; pos += spacing) {
      positions.push(pos);
    }
    return positions;
  }, [length]);
  
  return (
    <group position={[gutterX, gutterY, 0]}>
      {/* Main gutter channel - this is the actual gutter! */}
      <mesh
        position={[0, 0, 0]}
        rotation={[Math.PI/2, 0, 0]}
        castShadow
        receiveShadow
      >
        <primitive object={gutterGeometry} />
        <primitive object={gutterMaterial} attach="material" />
      </mesh>
      
      {/* Gutter mounting brackets spaced every 4 feet */}
      {bracketPositions.map(pos => createBracket(pos))}
      
      {/* Downspouts at both ends of the gutter */}
      <mesh
        position={[0, -(height + 1)/2, length/2 - 1]}
        castShadow
        receiveShadow
      >
        <primitive object={downspoutGeometry} />
        <primitive object={downspoutMaterial} attach="material" />
      </mesh>
      
      <mesh
        position={[0, -(height + 1)/2, -length/2 + 1]}
        castShadow
        receiveShadow
      >
        <primitive object={downspoutGeometry} />
        <primitive object={downspoutMaterial} attach="material" />
      </mesh>
      
      {/* Gutter end caps to seal the channel */}
      <mesh
        position={[0, -gutterDepth/2, length/2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[gutterWidth, gutterDepth, 0.1]} />
        <primitive object={gutterMaterial} attach="material" />
      </mesh>
      
      <mesh
        position={[0, -gutterDepth/2, -length/2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[gutterWidth, gutterDepth, 0.1]} />
        <primitive object={gutterMaterial} attach="material" />
      </mesh>
      
      {/* Gutter outlet connections where downspouts attach */}
      <mesh
        position={[0, -gutterDepth + 0.1, length/2 - 1]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.2, 0.18, 0.2, 8]} />
        <primitive object={gutterMaterial} attach="material" />
      </mesh>
      
      <mesh
        position={[0, -gutterDepth + 0.1, -length/2 + 1]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.2, 0.18, 0.2, 8]} />
        <primitive object={gutterMaterial} attach="material" />
      </mesh>
    </group>
  );
};

export default Gutter;
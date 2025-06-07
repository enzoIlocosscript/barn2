import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Skylight } from '../../types';

interface RoofProps {
  width: number;
  length: number;
  height: number;
  pitch: number;
  color: string;
  skylights?: Skylight[];
}

const Roof: React.FC<RoofProps> = ({ width, length, height, pitch, color, skylights = [] }) => {
  const roofHeight = useMemo(() => {
    return (width / 2) * (pitch / 12);
  }, [width, pitch]);
  
  const pitchAngle = Math.atan2(roofHeight, width / 2);
  const panelLength = Math.sqrt(Math.pow(width/2, 2) + Math.pow(roofHeight, 2));

  // Create roof materials and geometries with cutouts for skylights
  const { leftRoofGeometry, rightRoofGeometry, leftRoofMaterial, rightRoofMaterial } = useMemo(() => {
    const createRoofTexture = (panelSide: 'left' | 'right') => {
      const textureWidth = 512;
      const textureHeight = 512;
      const canvas = document.createElement('canvas');
      canvas.width = textureWidth;
      canvas.height = textureHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, textureWidth, textureHeight);
        
        // Create ribbed pattern with special handling for white
        const ribWidth = textureWidth / 24;
        const gradient = ctx.createLinearGradient(0, 0, ribWidth, 0);
        
        // Special handling for pure white to maintain brightness
        const isWhite = color === '#FFFFFF';
        const shadowOpacity = isWhite ? 0.08 : 0.25;
        const highlightOpacity = isWhite ? 0.05 : 0.15;
        
        gradient.addColorStop(0, `rgba(255,255,255,${highlightOpacity})`);
        gradient.addColorStop(0.2, `rgba(255,255,255,${highlightOpacity * 0.5})`);
        gradient.addColorStop(0.4, `rgba(0,0,0,${shadowOpacity})`);
        gradient.addColorStop(0.6, `rgba(0,0,0,${shadowOpacity})`);
        gradient.addColorStop(0.8, `rgba(255,255,255,${highlightOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255,255,255,${highlightOpacity})`);
        
        ctx.fillStyle = gradient;
        
        for (let x = 0; x < textureWidth; x += ribWidth) {
          ctx.fillRect(x, 0, ribWidth, textureHeight);
        }
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, length/2);
      
      return texture;
    };

    // Create roof geometries with skylight cutouts
    const createRoofGeometryWithCutouts = (isLeftPanel: boolean) => {
      // Filter skylights for this panel
      const panelSkylights = skylights.filter(s => 
        isLeftPanel ? s.xOffset < 0 : s.xOffset >= 0
      );

      if (panelSkylights.length === 0) {
        // No skylights, return simple box geometry
        return new THREE.BoxGeometry(panelLength, 0.2, length);
      }

      // Create a shape for the roof panel in the XY plane (will be rotated later)
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-panelLength/2, -length/2);
      roofShape.lineTo(panelLength/2, -length/2);
      roofShape.lineTo(panelLength/2, length/2);
      roofShape.lineTo(-panelLength/2, length/2);
      roofShape.closePath();

      // Create holes for each skylight
      panelSkylights.forEach(skylight => {
        const skylightHole = new THREE.Path();
        
        // Convert skylight position to roof panel coordinates
        // For the extruded geometry, we work in the XY plane
        const localX = Math.abs(skylight.xOffset) * (panelLength / (width/2));
        const localY = skylight.yOffset;
        
        const holeWidth = skylight.width * (panelLength / (width/2));
        const holeLength = skylight.length;
        
        // Create rectangular hole
        skylightHole.moveTo(localX - holeWidth/2, localY - holeLength/2);
        skylightHole.lineTo(localX + holeWidth/2, localY - holeLength/2);
        skylightHole.lineTo(localX + holeWidth/2, localY + holeLength/2);
        skylightHole.lineTo(localX - holeWidth/2, localY + holeLength/2);
        skylightHole.closePath();
        
        roofShape.holes.push(skylightHole);
      });

      const extrudeSettings = {
        steps: 1,
        depth: 0.2,
        bevelEnabled: false
      };

      const geometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
      
      // Rotate the geometry to align with the roof pitch
      // The extruded geometry is created in XY plane, we need to rotate it to XZ plane
      geometry.rotateX(-Math.PI / 2); // Rotate to lie flat in XZ plane
      
      return geometry;
    };

    // Create separate textures for each panel
    const leftTexture = createRoofTexture('left');
    const rightTexture = createRoofTexture('right');
    
    // Special material properties for white vs other colors
    const isWhite = color === '#FFFFFF';
    const materialProps = isWhite ? {
      metalness: 0.3,
      roughness: 0.6,
      envMapIntensity: 0.8,
    } : {
      metalness: 0.7,
      roughness: 0.3,
      envMapIntensity: 0.5,
    };
    
    // Create geometries with cutouts
    const leftGeometry = createRoofGeometryWithCutouts(true);
    const rightGeometry = createRoofGeometryWithCutouts(false);
    
    // Create separate materials with optimized properties for white
    const leftMaterial = new THREE.MeshStandardMaterial({
      map: leftTexture,
      ...materialProps,
      side: THREE.DoubleSide,
    });

    const rightMaterial = new THREE.MeshStandardMaterial({
      map: rightTexture,
      ...materialProps,
      side: THREE.DoubleSide,
    });
    
    return { 
      leftRoofGeometry: leftGeometry,
      rightRoofGeometry: rightGeometry,
      leftRoofMaterial: leftMaterial, 
      rightRoofMaterial: rightMaterial 
    };
  }, [color, length, width, panelLength, skylights]);

  const skylightMaterial = new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const createSkylight = (skylight: Skylight, isLeftPanel: boolean) => {
    const skylightWidth = skylight.width;
    const skylightLength = skylight.length;
    
    // Calculate position in roof panel coordinates
    const localX = Math.abs(skylight.xOffset) * (panelLength / (width/2));
    const localY = skylight.yOffset;
    
    // Position the skylight to sit flush in the cutout
    // The skylight should be positioned relative to the roof panel's coordinate system
    const skylightX = localX;
    const skylightY = 0.05; // Slightly above the roof surface to prevent z-fighting
    const skylightZ = localY;
    
    return (
      <mesh
        key={`${isLeftPanel ? 'left' : 'right'}-${skylight.xOffset}-${skylight.yOffset}`}
        position={[skylightX, skylightY, skylightZ]}
        rotation={[0, 0, 0]} // No additional rotation needed since it's in panel space
        castShadow
        receiveShadow
      >
        <boxGeometry args={[skylightWidth * (panelLength / (width/2)), 0.1, skylightLength]} />
        <primitive object={skylightMaterial} attach="material" />
      </mesh>
    );
  };
  
  return (
    <group position={[0, height, 0]}>
      {/* Left roof panel with cutouts */}
      <group 
        position={[-width / 4, roofHeight / 2, 0]}
        rotation={[0, 0, pitchAngle]}
      >
        <mesh castShadow receiveShadow>
          <primitive object={leftRoofGeometry} />
          <primitive object={leftRoofMaterial} attach="material" />
        </mesh>
        
        {/* Skylights positioned in the cutouts for left panel */}
        {skylights.filter(s => s.xOffset < 0).map(s => createSkylight(s, true))}
      </group>
      
      {/* Right roof panel with cutouts */}
      <group
        position={[width / 4, roofHeight / 2, 0]}
        rotation={[0, 0, -pitchAngle]}
      >
        <mesh castShadow receiveShadow>
          <primitive object={rightRoofGeometry} />
          <primitive object={rightRoofMaterial} attach="material" />
        </mesh>
        
        {/* Skylights positioned in the cutouts for right panel */}
        {skylights.filter(s => s.xOffset >= 0).map(s => createSkylight(s, false))}
      </group>
      
      {/* Ridge cap with special white handling */}
      <mesh 
        position={[0, roofHeight, 0]} 
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[0.4, 0.3, length]} />
        <meshStandardMaterial 
          color={color} 
          metalness={color === '#FFFFFF' ? 0.2 : 0.8} 
          roughness={color === '#FFFFFF' ? 0.7 : 0.2}
          envMapIntensity={color === '#FFFFFF' ? 0.6 : 1.0}
        />
      </mesh>
    </group>
  );
};

export default Roof;
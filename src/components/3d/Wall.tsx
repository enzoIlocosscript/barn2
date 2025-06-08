import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { WallPosition, WallFeature, BeamSegment } from '../../types';
import { generateBeamPositions, generateHorizontalBeamPositions } from '../../utils/collisionDetection';

interface WallProps {
  position: [number, number, number];
  width: number;
  height: number;
  color: string;
  wallPosition: WallPosition;
  rotation?: [number, number, number];
  roofPitch?: number;
  wallFeatures?: WallFeature[];
}

const Wall: React.FC<WallProps> = ({ 
  position, 
  width, 
  height, 
  color, 
  wallPosition, 
  rotation = [0, 0, 0],
  roofPitch = 0,
  wallFeatures = []
}) => {
  // Increased wall thickness to better hide beams
  const wallThickness = 0.8; // Further increased for complete beam hiding
  
  // Create ribbed texture with special handling for white
  const wallMaterial = useMemo(() => {
    const textureWidth = 512;
    const textureHeight = 512;
    const canvas = document.createElement('canvas');
    canvas.width = textureWidth;
    canvas.height = textureHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, textureWidth, textureHeight);
      
      // Create ribbed pattern with special handling for pure white
      const ribWidth = textureWidth / 16;
      const gradient = ctx.createLinearGradient(0, 0, ribWidth, 0);
      
      // Special handling for pure white to maintain brightness
      const isWhite = color === '#FFFFFF';
      const shadowOpacity = isWhite ? 0.06 : 0.15;
      const highlightOpacity = isWhite ? 0.04 : 0.12;
      
      gradient.addColorStop(0, `rgba(255,255,255,${highlightOpacity})`);
      gradient.addColorStop(0.3, `rgba(255,255,255,${highlightOpacity * 0.5})`);
      gradient.addColorStop(0.5, `rgba(0,0,0,${shadowOpacity})`);
      gradient.addColorStop(0.7, `rgba(255,255,255,${highlightOpacity * 0.5})`);
      gradient.addColorStop(1, `rgba(255,255,255,${highlightOpacity})`);
      
      ctx.fillStyle = gradient;
      
      for (let x = 0; x < textureWidth; x += ribWidth) {
        ctx.fillRect(x, 0, ribWidth, textureHeight);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width/2, height/2);
    
    // Special material properties for white vs other colors
    const isWhite = color === '#FFFFFF';
    const materialProps = isWhite ? {
      metalness: 0.2,
      roughness: 0.7,
      envMapIntensity: 0.4,
    } : {
      metalness: 0.6,
      roughness: 0.4,
      envMapIntensity: 0.3,
    };
    
    return new THREE.MeshStandardMaterial({
      map: texture,
      ...materialProps,
      side: THREE.DoubleSide,
    });
  }, [color, width, height]);

  // Create wall geometry with cutouts for windows and doors
  const wallGeometry = useMemo(() => {
    // Filter features that are actually on this wall and are windows (need cutouts)
    const windowFeatures = wallFeatures.filter(feature => 
      feature.position.wallPosition === wallPosition && feature.type === 'window'
    );

    // If it's a gabled wall (front/back) with roof pitch, create the gabled shape
    if ((wallPosition === 'front' || wallPosition === 'back') && roofPitch > 0) {
      const roofHeight = (width / 2) * (roofPitch / 12);
      const totalHeight = height + roofHeight;
      
      // Create the gabled wall shape
      const wallShape = new THREE.Shape();
      wallShape.moveTo(-width/2, -height/2);
      wallShape.lineTo(width/2, -height/2);
      wallShape.lineTo(width/2, height/2);
      wallShape.lineTo(0, height/2 + roofHeight);
      wallShape.lineTo(-width/2, height/2);
      wallShape.lineTo(-width/2, -height/2);

      // Add window cutouts as holes
      windowFeatures.forEach(feature => {
        const windowHole = new THREE.Path();
        
        // Calculate window position based on alignment
        let windowX = 0;
        switch (feature.position.alignment) {
          case 'left':
            windowX = -width/2 + feature.position.xOffset + feature.width/2;
            break;
          case 'right':
            windowX = width/2 - feature.position.xOffset - feature.width/2;
            break;
          case 'center':
          default:
            windowX = feature.position.xOffset;
            break;
        }
        
        const windowY = -height/2 + feature.position.yOffset + feature.height/2;
        
        // Create rectangular hole for window
        const halfWidth = feature.width / 2;
        const halfHeight = feature.height / 2;
        
        windowHole.moveTo(windowX - halfWidth, windowY - halfHeight);
        windowHole.lineTo(windowX + halfWidth, windowY - halfHeight);
        windowHole.lineTo(windowX + halfWidth, windowY + halfHeight);
        windowHole.lineTo(windowX - halfWidth, windowY + halfHeight);
        windowHole.closePath();
        
        wallShape.holes.push(windowHole);
      });

      const extrudeSettings = {
        steps: 1,
        depth: wallThickness, // Use increased wall thickness
        bevelEnabled: false
      };

      const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
      
      // Calculate UV coordinates for the extruded geometry
      const uvs = geometry.attributes.uv.array;
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        
        // Calculate UV coordinates based on position
        const u = (x + width/2) / width;
        const v = (y + height/2) / totalHeight;
        
        const uvIndex = (i / 3) * 2;
        uvs[uvIndex] = u;
        uvs[uvIndex + 1] = v;
      }
      
      geometry.attributes.uv.needsUpdate = true;
      return geometry;
    } else {
      // Regular rectangular wall with window cutouts
      if (windowFeatures.length === 0) {
        // No windows, return simple box geometry with increased thickness
        return new THREE.BoxGeometry(width, height, wallThickness);
      }

      // Create wall shape with window cutouts
      const wallShape = new THREE.Shape();
      wallShape.moveTo(-width/2, -height/2);
      wallShape.lineTo(width/2, -height/2);
      wallShape.lineTo(width/2, height/2);
      wallShape.lineTo(-width/2, height/2);
      wallShape.closePath();

      // Add window cutouts as holes
      windowFeatures.forEach(feature => {
        const windowHole = new THREE.Path();
        
        // Calculate window position based on alignment
        let windowX = 0;
        switch (feature.position.alignment) {
          case 'left':
            windowX = -width/2 + feature.position.xOffset + feature.width/2;
            break;
          case 'right':
            windowX = width/2 - feature.position.xOffset - feature.width/2;
            break;
          case 'center':
          default:
            windowX = feature.position.xOffset;
            break;
        }
        
        const windowY = -height/2 + feature.position.yOffset + feature.height/2;
        
        // Create rectangular hole for window
        const halfWidth = feature.width / 2;
        const halfHeight = feature.height / 2;
        
        windowHole.moveTo(windowX - halfWidth, windowY - halfHeight);
        windowHole.lineTo(windowX + halfWidth, windowY - halfHeight);
        windowHole.lineTo(windowX + halfWidth, windowY + halfHeight);
        windowHole.lineTo(windowX - halfWidth, windowY + halfHeight);
        windowHole.closePath();
        
        wallShape.holes.push(windowHole);
      });

      const extrudeSettings = {
        steps: 1,
        depth: wallThickness, // Use increased wall thickness
        bevelEnabled: false
      };

      const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
      
      // Set up UV mapping for the extruded geometry
      const uvs = geometry.attributes.uv.array;
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        
        // Calculate UV coordinates based on position
        const u = (x + width/2) / width;
        const v = (y + height/2) / height;
        
        const uvIndex = (i / 3) * 2;
        uvs[uvIndex] = u;
        uvs[uvIndex + 1] = v;
      }
      
      geometry.attributes.uv.needsUpdate = true;
      return geometry;
    }
  }, [width, height, wallPosition, roofPitch, wallFeatures, wallThickness]);

  // Calculate beam segments using enhanced precision cutting around features
  const beamSegments = useMemo(() => {
    console.log(`\n🏗️  ENHANCED BEAM GENERATION for ${wallPosition} wall (${width}x${height}) with ${wallFeatures.length} features`);
    
    // Filter features that are actually on this wall
    const relevantFeatures = wallFeatures.filter(feature => 
      feature.position.wallPosition === wallPosition
    );
    
    console.log(`Relevant features for ${wallPosition} wall:`, relevantFeatures.map(f => 
      `${f.type} (${f.width}x${f.height}) at ${f.position.alignment} offset ${f.position.xOffset}, yOffset ${f.position.yOffset}`
    ));
    
    return generateBeamPositions(width, height, relevantFeatures, {
      maxSpacing: 8,
      minSpacing: 4,
      margin: 2,
      beamWidth: 0.3,
      minBeams: 3
    });
  }, [width, height, wallFeatures, wallPosition]);

  // Calculate horizontal beam segments using enhanced precision cutting around features
  const horizontalBeamSegments = useMemo(() => {
    console.log(`\n🏗️  ENHANCED HORIZONTAL BEAM GENERATION for ${wallPosition} wall`);
    
    // Filter features that are actually on this wall
    const relevantFeatures = wallFeatures.filter(feature => 
      feature.position.wallPosition === wallPosition
    );
    
    return generateHorizontalBeamPositions(
      width, 
      height, 
      relevantFeatures, 
      [0.25, 0.5, 0.75], // Height ratios for horizontal beams
      0.3 // Beam height
    );
  }, [width, height, wallFeatures, wallPosition]);

  // Create enhanced steel beam segment with improved structural visualization
  const createSteelBeamSegment = (segment: BeamSegment, segmentIndex: number) => {
    const beamWidth = segment.width;
    const beamDepth = 0.25; // Slightly increased for better visibility
    const beamHeight = segment.topY - segment.bottomY;
    const beamCenterY = (segment.topY + segment.bottomY) / 2;
    
    const flangeWidth = 0.4;
    const flangeHeight = 0.15;
    const flangeSpacing = Math.min(6, beamHeight / 4);
    
    // CRITICAL FIX: Position beams ONLY on the interior side of walls
    // Wall thickness is 0.8, so wall extends from -0.4 to +0.4
    // Position beams deep inside the wall, closer to the interior surface
    let zOffset = 0;
    switch (wallPosition) {
      case 'front':
        zOffset = -0.35; // Interior side of front wall (inside the building)
        break;
      case 'back':
        zOffset = 0.35; // Interior side of back wall (inside the building)
        break;
      case 'left':
        zOffset = 0.35; // Interior side of left wall (inside the building)
        break;
      case 'right':
        zOffset = 0.35; // Interior side of right wall (inside the building)
        break;
    }
    
    // Enhanced steel material for better lighting response and structural appearance
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: "#808080",
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
    });
    
    const key = `${segment.x}-${segment.bottomY}-${segment.topY}-${segmentIndex}`;
    
    return (
      <group key={key} position={[segment.x, beamCenterY, zOffset]}>
        {/* Main vertical beam segment with enhanced structural appearance */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[beamWidth, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        
        {/* Enhanced flanges along the beam - only add if beam segment is tall enough */}
        {beamHeight > 2 && Array.from({ length: Math.max(1, Math.ceil(beamHeight / flangeSpacing)) }).map((_, i) => {
          const flangeY = -beamHeight/2 + i * flangeSpacing;
          // Don't place flange outside the beam bounds
          if (Math.abs(flangeY) > beamHeight/2) return null;
          
          return (
            <mesh key={i} castShadow receiveShadow position={[0, flangeY, 0]}>
              <boxGeometry args={[flangeWidth, flangeHeight, beamDepth * 1.2]} />
              <primitive object={steelMaterial} attach="material" />
            </mesh>
          );
        })}
        
        {/* Structural connection points at segment ends for visual continuity */}
        <mesh castShadow receiveShadow position={[0, -beamHeight/2, 0]}>
          <cylinderGeometry args={[beamWidth/3, beamWidth/3, 0.1, 8]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        <mesh castShadow receiveShadow position={[0, beamHeight/2, 0]}>
          <cylinderGeometry args={[beamWidth/3, beamWidth/3, 0.1, 8]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
      </group>
    );
  };

  // Create enhanced horizontal beam segment with improved structural visualization
  const createHorizontalBeamSegment = (segment: BeamSegment, segmentIndex: number) => {
    const beamWidth = segment.width;
    const beamHeight = segment.topY - segment.bottomY;
    const beamDepth = 0.25; // Slightly increased for better visibility
    const beamCenterY = (segment.topY + segment.bottomY) / 2;
    
    // CRITICAL FIX: Position horizontal beams ONLY on the interior side
    let zOffset = 0;
    switch (wallPosition) {
      case 'front':
        zOffset = -0.35; // Interior side of front wall
        break;
      case 'back':
        zOffset = 0.35; // Interior side of back wall
        break;
      case 'left':
        zOffset = 0.35; // Interior side of left wall
        break;
      case 'right':
        zOffset = 0.35; // Interior side of right wall
        break;
    }
    
    // Enhanced steel material for better lighting response
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: "#808080",
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
    });
    
    const key = `h-${segment.x}-${segment.bottomY}-${segment.topY}-${segment.width}-${segmentIndex}`;
    
    return (
      <group key={key} position={[segment.x, beamCenterY, zOffset]}>
        {/* Main horizontal beam segment with enhanced structural appearance */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[beamWidth, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        
        {/* Enhanced end caps for horizontal beams with structural detailing */}
        <mesh castShadow receiveShadow position={[-beamWidth/2, 0, 0]}>
          <boxGeometry args={[beamHeight, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        <mesh castShadow receiveShadow position={[beamWidth/2, 0, 0]}>
          <boxGeometry args={[beamHeight, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        
        {/* Structural connection points for visual continuity */}
        <mesh castShadow receiveShadow position={[-beamWidth/2, 0, 0]}>
          <cylinderGeometry args={[beamHeight/4, beamHeight/4, 0.1, 6]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        <mesh castShadow receiveShadow position={[beamWidth/2, 0, 0]}>
          <cylinderGeometry args={[beamHeight/4, beamHeight/4, 0.1, 6]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
      </group>
    );
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Wall with window cutouts - now much thicker */}
      <mesh castShadow receiveShadow>
        <primitive object={wallGeometry} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* Render enhanced precision-cut vertical beam segments with structural continuity */}
      {beamSegments.map((segment, index) => createSteelBeamSegment(segment, index))}
      
      {/* Render enhanced precision-cut horizontal beam segments with structural continuity */}
      {horizontalBeamSegments.map((segment, index) => createHorizontalBeamSegment(segment, index))}
    </group>
  );
};

export default Wall;
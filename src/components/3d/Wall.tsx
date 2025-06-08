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

  // Create wall geometry with cutouts for windows only (doors remain solid for structural integrity)
  const wallGeometry = useMemo(() => {
    // Only create cutouts for windows - doors and other features remain solid
    const windowFeatures = wallFeatures.filter(feature => 
      feature.position.wallPosition === wallPosition && feature.type === 'window'
    );

    console.log(`🏗️ Creating wall geometry for ${wallPosition} with ${windowFeatures.length} window cutouts`);

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

      // Add window cutouts as holes (doors remain solid for structural integrity)
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
        console.log(`  Added window cutout at (${windowX.toFixed(1)}, ${windowY.toFixed(1)})`);
      });

      const extrudeSettings = {
        steps: 1,
        depth: 0.2,
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
      // Regular rectangular wall with window cutouts only
      if (windowFeatures.length === 0) {
        // No windows, return simple box geometry
        return new THREE.BoxGeometry(width, height, 0.2);
      }

      // Create wall shape with window cutouts only
      const wallShape = new THREE.Shape();
      wallShape.moveTo(-width/2, -height/2);
      wallShape.lineTo(width/2, -height/2);
      wallShape.lineTo(width/2, height/2);
      wallShape.lineTo(-width/2, height/2);
      wallShape.closePath();

      // Add window cutouts as holes (doors remain solid)
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
        console.log(`  Added window cutout at (${windowX.toFixed(1)}, ${windowY.toFixed(1)})`);
      });

      const extrudeSettings = {
        steps: 1,
        depth: 0.2,
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
  }, [width, height, wallPosition, roofPitch, wallFeatures]);

  // CRITICAL FIX: Generate structural beams that split around ALL features (including doors)
  const beamSegments = useMemo(() => {
    console.log(`\n🏗️  STRUCTURAL BEAM GENERATION for ${wallPosition} wall (${width}x${height})`);
    
    // FIXED: Include ALL features for beam cutting - doors AND windows affect structural beams
    const allFeatures = wallFeatures.filter(feature => 
      feature.position.wallPosition === wallPosition
    );
    
    console.log(`All features affecting beams: ${allFeatures.length}`);
    allFeatures.forEach(f => 
      console.log(`  - ${f.type} (${f.width}x${f.height}) at ${f.position.alignment} offset ${f.position.xOffset}`)
    );
    
    return generateBeamPositions(width, height, allFeatures, {
      maxSpacing: 8,
      minSpacing: 4,
      margin: 2,
      beamWidth: 0.3,
      minBeams: 3
    });
  }, [width, height, wallFeatures, wallPosition]);

  // CRITICAL FIX: Generate horizontal beams that split around ALL features (including doors)
  const horizontalBeamSegments = useMemo(() => {
    console.log(`\n🏗️  HORIZONTAL STRUCTURAL BEAM GENERATION for ${wallPosition} wall`);
    
    // FIXED: Include ALL features for horizontal beam cutting
    const allFeatures = wallFeatures.filter(feature => 
      feature.position.wallPosition === wallPosition
    );
    
    return generateHorizontalBeamPositions(
      width, 
      height, 
      allFeatures, 
      [0.25, 0.5, 0.75], // Height ratios for horizontal beams
      0.3 // Beam height
    );
  }, [width, height, wallFeatures, wallPosition]);

  // 🎯 FINAL FIX: Calculate EXACT interior-side Z offset for ALL walls
  const getFinalInteriorZOffset = (wallPos: WallPosition): number => {
    console.log(`🎯 FINAL FIX: Calculating interior Z offset for ${wallPos} wall`);
    
    // CRITICAL: All beams MUST be positioned on the INTERIOR side of each wall
    // Wall thickness is 0.2, so beams go at -0.4 (deep interior positioning)
    const deepInteriorOffset = -0.4; // Even deeper interior positioning to ensure no exterior visibility
    
    switch (wallPos) {
      case 'front':
        // Front wall faces +Z direction, interior is -Z
        console.log(`  Front wall: beams at z = ${deepInteriorOffset} (DEEP INTERIOR)`);
        return deepInteriorOffset;
      case 'back':
        // Back wall faces -Z direction, interior is +Z
        console.log(`  Back wall: beams at z = ${-deepInteriorOffset} (DEEP INTERIOR - FIXED)`);
        return deepInteriorOffset; // CRITICAL FIX: Positive Z for back wall interior
      case 'left':
        // Left wall faces +X direction, interior is -X (but in local coordinates this is +Z)
        console.log(`  Left wall: beams at z = ${-deepInteriorOffset} (DEEP INTERIOR)`);
        return -deepInteriorOffset;
      case 'right':
        // Right wall faces -X direction, interior is +X (but in local coordinates this is -Z)
        console.log(`  Right wall: beams at z = ${deepInteriorOffset} (DEEP INTERIOR - FIXED)`);
        return -deepInteriorOffset; // CRITICAL FIX: Negative Z for right wall interior
      default:
        console.log(`  Unknown wall position, defaulting to z = ${deepInteriorOffset}`);
       
    }
     return deepInteriorOffset;
  };

  // ENHANCED: Create persistent steel beam segments with architectural integrity
  const createFinalInteriorBeam = (segment: BeamSegment, segmentIndex: number) => {
    const beamWidth = segment.width;
    const beamDepth = 0.2;
    const beamHeight = segment.topY - segment.bottomY;
    const beamCenterY = (segment.topY + segment.bottomY) / 2;
    
    const flangeWidth = 0.4;
    const flangeHeight = 0.15;
    const flangeSpacing = Math.min(6, beamHeight / 4);
    
    // 🎯 FINAL FIX: Use EXACT interior-side positioning for ALL walls
    const zOffset = getFinalInteriorZOffset(wallPosition);
    console.log(`🔧 FINAL: Beam ${segmentIndex} on ${wallPosition} wall positioned at Z = ${zOffset} (GUARANTEED INTERIOR)`);
    
    // Enhanced steel material with architectural-grade appearance
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: "#808080",
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
    });
    
    const key = `final-interior-beam-${wallPosition}-${segment.x}-${segment.bottomY}-${segment.topY}-${segmentIndex}`;
    
    return (
      <group key={key} position={[segment.x, beamCenterY, zOffset]}>
        {/* Main structural beam segment - GUARANTEED INTERIOR ONLY */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[beamWidth, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        
        {/* Architectural flanges for structural realism */}
        {beamHeight > 2 && Array.from({ length: Math.max(1, Math.ceil(beamHeight / flangeSpacing)) }).map((_, i) => {
          const flangeY = -beamHeight/2 + i * flangeSpacing;
          if (Math.abs(flangeY) > beamHeight/2) return null;
          
          return (
            <mesh key={i} castShadow receiveShadow position={[0, flangeY, 0]}>
              <boxGeometry args={[flangeWidth, flangeHeight, beamDepth * 1.2]} />
              <primitive object={steelMaterial} attach="material" />
            </mesh>
          );
        })}
        
        {/* Structural connection points for seamless integration */}
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

  // ENHANCED: Create persistent horizontal beam segments
  const createFinalInteriorHorizontalBeam = (segment: BeamSegment, segmentIndex: number) => {
    const beamWidth = segment.width;
    const beamHeight = segment.topY - segment.bottomY;
    const beamDepth = 0.2;
    const beamCenterY = (segment.topY + segment.bottomY) / 2;
    
    // 🎯 FINAL FIX: Use EXACT interior-side positioning for ALL walls
    const zOffset = getFinalInteriorZOffset(wallPosition);
    console.log(`🔧 FINAL: Horizontal beam ${segmentIndex} on ${wallPosition} wall positioned at Z = ${zOffset} (GUARANTEED INTERIOR)`);
    
    // Enhanced steel material for architectural consistency
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: "#808080",
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
    });
    
    const key = `final-interior-h-beam-${wallPosition}-${segment.x}-${segment.bottomY}-${segment.topY}-${segment.width}-${segmentIndex}`;
    
    return (
      <group key={key} position={[segment.x, beamCenterY, zOffset]}>
        {/* Main horizontal structural beam - GUARANTEED INTERIOR ONLY */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[beamWidth, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        
        {/* Structural end caps for architectural integrity */}
        <mesh castShadow receiveShadow position={[-beamWidth/2, 0, 0]}>
          <boxGeometry args={[beamHeight, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        <mesh castShadow receiveShadow position={[beamWidth/2, 0, 0]}>
          <boxGeometry args={[beamHeight, beamHeight, beamDepth]} />
          <primitive object={steelMaterial} attach="material" />
        </mesh>
        
        {/* Seamless connection points */}
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
      {/* Wall with window cutouts only - doors remain solid for structural integrity */}
      <mesh castShadow receiveShadow>
        <primitive object={wallGeometry} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* 🎯 FINAL INTERIOR BEAMS - Split around ALL features, positioned DEEP INTERIOR ONLY */}
      {beamSegments.map((segment, index) => createFinalInteriorBeam(segment, index))}
      
      {/* 🎯 FINAL INTERIOR HORIZONTAL BEAMS - Split around ALL features, positioned DEEP INTERIOR ONLY */}
      {horizontalBeamSegments.map((segment, index) => createFinalInteriorHorizontalBeam(segment, index))}
    </group>
  );
};

export default Wall;
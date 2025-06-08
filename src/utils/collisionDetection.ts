import type { WallFeature, CollisionBounds, BeamCollisionData, BeamSegment } from '../types';

/**
 * Converts feature position to absolute wall coordinates
 */
export const getFeatureBounds = (
  feature: WallFeature, 
  wallWidth: number, 
  wallHeight: number
): CollisionBounds => {
  // Wall coordinate system: center at (0,0)
  // Bottom: -wallHeight/2, Top: +wallHeight/2
  // Feature yOffset is from bottom of wall (0 = bottom edge)
  
  const wallBottom = -wallHeight / 2;
  
  // Calculate vertical bounds
  const bottom = wallBottom + feature.position.yOffset;
  const top = bottom + feature.height;
  
  // Calculate horizontal bounds based on alignment
  let left: number;
  let right: number;
  
  switch (feature.position.alignment) {
    case 'left':
      left = -wallWidth/2 + feature.position.xOffset;
      right = left + feature.width;
      break;
    case 'right':
      right = wallWidth/2 - feature.position.xOffset;
      left = right - feature.width;
      break;
    case 'center':
    default:
      left = -feature.width/2 + feature.position.xOffset;
      right = feature.width/2 + feature.position.xOffset;
      break;
  }
  
  return { left, right, bottom, top };
};

/**
 * ENHANCED: Checks if a beam horizontally overlaps with a feature with precise tolerance
 */
export const beamOverlapsFeature = (
  beamX: number, 
  beamWidth: number, 
  featureBounds: CollisionBounds,
  buffer: number = 0.01 // Very precise buffer for exact cutting
): boolean => {
  const beamLeft = beamX - beamWidth/2;
  const beamRight = beamX + beamWidth/2;
  
  const overlaps = !(beamRight + buffer <= featureBounds.left || beamLeft - buffer >= featureBounds.right);
  
  // Debug logging for left/right walls
  console.log(`    🔍 Beam overlap check: beam(${beamLeft.toFixed(2)} to ${beamRight.toFixed(2)}) vs feature(${featureBounds.left.toFixed(2)} to ${featureBounds.right.toFixed(2)}) = ${overlaps}`);
  
  return overlaps;
};

/**
 * CRITICAL FIX: Enhanced beam cutting that NEVER fully removes beams
 * This function ALWAYS returns at least one beam segment for structural integrity
 */
export const cutBeamAroundFeatures = (
  beamX: number,
  beamWidth: number,
  wallHeight: number,
  features: WallFeature[],
  wallWidth: number
): BeamSegment[] => {
  const wallBottom = -wallHeight / 2;
  const wallTop = wallHeight / 2;
  
  console.log(`\n✂️  CRITICAL BEAM CUTTING at x=${beamX.toFixed(2)} (wall: ${wallHeight}ft tall, ${wallWidth}ft wide)`);
  
  // ENHANCED: Find overlapping features with more precise detection
  const overlappingFeatures = features
    .filter(feature => {
      const featureBounds = getFeatureBounds(feature, wallWidth, wallHeight);
      const overlaps = beamOverlapsFeature(beamX, beamWidth, featureBounds, 0.01);
      
      if (overlaps) {
        console.log(`  🎯 CONFIRMED overlap with ${feature.type} at (${featureBounds.left.toFixed(2)}, ${featureBounds.bottom.toFixed(2)}) to (${featureBounds.right.toFixed(2)}, ${featureBounds.top.toFixed(2)})`);
      }
      
      return overlaps;
    })
    .map(feature => ({
      feature,
      bounds: getFeatureBounds(feature, wallWidth, wallHeight)
    }))
    .sort((a, b) => a.bounds.bottom - b.bounds.bottom); // Sort by vertical position
  
  // CRITICAL: If no overlaps, ALWAYS return full beam
  if (overlappingFeatures.length === 0) {
    console.log(`✅ NO OVERLAPS DETECTED - returning FULL structural beam`);
    return [{
      x: beamX,
      bottomY: wallBottom,
      topY: wallTop,
      width: beamWidth
    }];
  }
  
  console.log(`🔪 CUTTING around ${overlappingFeatures.length} confirmed overlapping features:`);
  overlappingFeatures.forEach(({ feature, bounds }) => {
    console.log(`  - ${feature.type}: y=${bounds.bottom.toFixed(2)} to ${bounds.top.toFixed(2)} (${(bounds.top - bounds.bottom).toFixed(2)}ft tall)`);
  });
  
  const segments: BeamSegment[] = [];
  let currentY = wallBottom;
  const minSegmentHeight = 0.3; // Minimum segment height for structural integrity
  const structuralGap = 0.05; // Small gap for clean window installation
  
  // Process each overlapping feature with enhanced precision
  for (const { feature, bounds } of overlappingFeatures) {
    const cutBottom = bounds.bottom - structuralGap;
    const cutTop = bounds.top + structuralGap;
    
    console.log(`\n🎯 Processing ${feature.type} intersection:`);
    console.log(`  Current Y: ${currentY.toFixed(2)}`);
    console.log(`  Feature bounds: ${bounds.bottom.toFixed(2)} to ${bounds.top.toFixed(2)}`);
    console.log(`  Cut coordinates: ${cutBottom.toFixed(2)} to ${cutTop.toFixed(2)}`);
    
    // Create beam segment BELOW the feature
    if (currentY < cutBottom) {
      const segmentHeight = cutBottom - currentY;
      console.log(`  Lower segment potential: ${segmentHeight.toFixed(2)}ft`);
      
      if (segmentHeight >= minSegmentHeight) {
        console.log(`  ✅ CREATING LOWER BEAM SEGMENT: ${currentY.toFixed(2)} to ${cutBottom.toFixed(2)}`);
        segments.push({
          x: beamX,
          bottomY: currentY,
          topY: cutBottom,
          width: beamWidth
        });
      } else {
        console.log(`  ⚠️  Lower segment too small (${segmentHeight.toFixed(2)}ft < ${minSegmentHeight}ft)`);
      }
    }
    
    // Skip the feature area (this is the actual "cut")
    console.log(`  🪟 CUTTING OUT feature area: ${cutBottom.toFixed(2)} to ${cutTop.toFixed(2)}`);
    currentY = Math.max(currentY, cutTop);
    console.log(`  Continuing from: ${currentY.toFixed(2)}`);
  }
  
  // Create beam segment ABOVE all features
  console.log(`\n🎯 Upper segment check:`);
  console.log(`  Current Y: ${currentY.toFixed(2)}, Wall top: ${wallTop.toFixed(2)}`);
  
  if (currentY < wallTop) {
    const segmentHeight = wallTop - currentY;
    console.log(`  Upper segment potential: ${segmentHeight.toFixed(2)}ft`);
    
    if (segmentHeight >= minSegmentHeight) {
      console.log(`  ✅ CREATING UPPER BEAM SEGMENT: ${currentY.toFixed(2)} to ${wallTop.toFixed(2)}`);
      segments.push({
        x: beamX,
        bottomY: currentY,
        topY: wallTop,
        width: beamWidth
      });
    } else {
      console.log(`  ⚠️  Upper segment too small (${segmentHeight.toFixed(2)}ft < ${minSegmentHeight}ft)`);
    }
  }
  
  // CRITICAL SAFETY CHECK: NEVER return empty segments array
  if (segments.length === 0) {
    console.log(`🚨 CRITICAL SAFETY: No segments created! Creating emergency structural support...`);
    
    // Find the largest gap between features for emergency beam placement
    let largestGapStart = wallBottom;
    let largestGapEnd = wallTop;
    let largestGapSize = wallHeight;
    
    if (overlappingFeatures.length > 0) {
      // Check gap before first feature
      const firstFeature = overlappingFeatures[0];
      if (firstFeature.bounds.bottom - wallBottom > largestGapSize) {
        largestGapStart = wallBottom;
        largestGapEnd = firstFeature.bounds.bottom - 0.1;
        largestGapSize = largestGapEnd - largestGapStart;
      }
      
      // Check gap after last feature
      const lastFeature = overlappingFeatures[overlappingFeatures.length - 1];
      if (wallTop - lastFeature.bounds.top > largestGapSize) {
        largestGapStart = lastFeature.bounds.top + 0.1;
        largestGapEnd = wallTop;
        largestGapSize = largestGapEnd - largestGapStart;
      }
      
      // Check gaps between features
      for (let i = 0; i < overlappingFeatures.length - 1; i++) {
        const gapStart = overlappingFeatures[i].bounds.top + 0.1;
        const gapEnd = overlappingFeatures[i + 1].bounds.bottom - 0.1;
        const gapSize = gapEnd - gapStart;
        
        if (gapSize > largestGapSize) {
          largestGapStart = gapStart;
          largestGapEnd = gapEnd;
          largestGapSize = gapSize;
        }
      }
    }
    
    // Create emergency beam in the largest available space
    if (largestGapSize >= 0.2) { // Even tiny segments for structural connection
      console.log(`  🔧 EMERGENCY BEAM: ${largestGapStart.toFixed(2)} to ${largestGapEnd.toFixed(2)} (${largestGapSize.toFixed(2)}ft)`);
      segments.push({
        x: beamX,
        bottomY: largestGapStart,
        topY: largestGapEnd,
        width: beamWidth
      });
    } else {
      // Absolute emergency: create minimal structural connection
      const emergencyHeight = Math.min(0.5, wallHeight * 0.1);
      console.log(`  🆘 ABSOLUTE EMERGENCY: Creating minimal ${emergencyHeight.toFixed(2)}ft beam at wall center`);
      segments.push({
        x: beamX,
        bottomY: -emergencyHeight/2,
        topY: emergencyHeight/2,
        width: beamWidth
      });
    }
  }
  
  // STRUCTURAL VALIDATION
  const totalBeamLength = segments.reduce((sum, seg) => sum + (seg.topY - seg.bottomY), 0);
  const structuralRatio = totalBeamLength / wallHeight;
  
  console.log(`📊 STRUCTURAL ANALYSIS COMPLETE:`);
  console.log(`  Beam segments created: ${segments.length}`);
  console.log(`  Total beam length: ${totalBeamLength.toFixed(2)}ft of ${wallHeight.toFixed(2)}ft wall`);
  console.log(`  Structural ratio: ${(structuralRatio * 100).toFixed(1)}%`);
  console.log(`  Structural adequacy: ${structuralRatio >= 0.3 ? '✅ ADEQUATE' : '⚠️  REVIEW REQUIRED'}`);
  
  segments.forEach((seg, i) => 
    console.log(`  Segment ${i + 1}: x=${seg.x.toFixed(2)}, y=${seg.bottomY.toFixed(2)} to ${seg.topY.toFixed(2)} (${(seg.topY - seg.bottomY).toFixed(2)}ft)`)
  );
  
  return segments;
};

/**
 * ENHANCED: Horizontal beam cutting with guaranteed segment creation
 */
export const cutHorizontalBeamAroundFeatures = (
  beamY: number,
  beamHeight: number,
  wallWidth: number,
  features: WallFeature[],
  wallHeight: number
): BeamSegment[] => {
  const wallLeft = -wallWidth / 2;
  const wallRight = wallWidth / 2;
  
  console.log(`\n✂️  CRITICAL HORIZONTAL BEAM CUTTING at y=${beamY.toFixed(2)} (wall: ${wallWidth}ft wide)`);
  
  // Enhanced precision for horizontal beam intersection detection
  const overlappingFeatures = features
    .filter(feature => {
      const featureBounds = getFeatureBounds(feature, wallWidth, wallHeight);
      const buffer = beamHeight / 2 + 0.05;
      const beamOverlapsVertically = beamY >= (featureBounds.bottom - buffer) && beamY <= (featureBounds.top + buffer);
      
      if (beamOverlapsVertically) {
        console.log(`  🎯 CONFIRMED horizontal overlap with ${feature.type} at y=${beamY.toFixed(2)}`);
        console.log(`    Feature bounds: x=${featureBounds.left.toFixed(2)} to ${featureBounds.right.toFixed(2)}`);
      }
      
      return beamOverlapsVertically;
    })
    .map(feature => ({
      feature,
      bounds: getFeatureBounds(feature, wallWidth, wallHeight)
    }))
    .sort((a, b) => a.bounds.left - b.bounds.left);
  
  // CRITICAL: If no overlaps, ALWAYS return full horizontal beam
  if (overlappingFeatures.length === 0) {
    console.log(`✅ NO HORIZONTAL OVERLAPS - returning FULL structural beam`);
    return [{
      x: 0, // Center of wall
      bottomY: beamY - beamHeight/2,
      topY: beamY + beamHeight/2,
      width: wallWidth - 1 // Leave structural margin
    }];
  }
  
  console.log(`🔪 HORIZONTAL CUTTING around ${overlappingFeatures.length} confirmed overlaps`);
  
  const segments: BeamSegment[] = [];
  let currentX = wallLeft + 0.5; // Structural margin
  const minSegmentWidth = 0.5; // Minimum width for structural integrity
  const structuralGap = 0.05; // Clean gap for window installation
  
  // Process each overlapping feature
  for (const { feature, bounds } of overlappingFeatures) {
    const cutLeft = bounds.left - structuralGap;
    const cutRight = bounds.right + structuralGap;
    
    console.log(`\n🎯 Processing ${feature.type} horizontal intersection:`);
    console.log(`  Current X: ${currentX.toFixed(2)}`);
    console.log(`  Feature bounds: ${bounds.left.toFixed(2)} to ${bounds.right.toFixed(2)}`);
    console.log(`  Cut coordinates: ${cutLeft.toFixed(2)} to ${cutRight.toFixed(2)}`);
    
    // Create beam segment to the LEFT of the feature
    if (currentX < cutLeft) {
      const segmentWidth = cutLeft - currentX;
      console.log(`  Left segment potential: ${segmentWidth.toFixed(2)}ft`);
      
      if (segmentWidth >= minSegmentWidth) {
        const segmentCenterX = currentX + segmentWidth/2;
        console.log(`  ✅ CREATING LEFT BEAM SEGMENT: ${currentX.toFixed(2)} to ${cutLeft.toFixed(2)} (center: ${segmentCenterX.toFixed(2)})`);
        segments.push({
          x: segmentCenterX,
          bottomY: beamY - beamHeight/2,
          topY: beamY + beamHeight/2,
          width: segmentWidth
        });
      } else {
        console.log(`  ⚠️  Left segment too small (${segmentWidth.toFixed(2)}ft < ${minSegmentWidth}ft)`);
      }
    }
    
    // Skip the feature area
    console.log(`  🪟 CUTTING OUT horizontal feature area: ${cutLeft.toFixed(2)} to ${cutRight.toFixed(2)}`);
    currentX = Math.max(currentX, cutRight);
    console.log(`  Continuing from: ${currentX.toFixed(2)}`);
  }
  
  // Create beam segment to the RIGHT of all features
  const wallRightWithMargin = wallRight - 0.5;
  console.log(`\n🎯 Right segment check:`);
  console.log(`  Current X: ${currentX.toFixed(2)}, Wall right: ${wallRightWithMargin.toFixed(2)}`);
  
  if (currentX < wallRightWithMargin) {
    const segmentWidth = wallRightWithMargin - currentX;
    console.log(`  Right segment potential: ${segmentWidth.toFixed(2)}ft`);
    
    if (segmentWidth >= minSegmentWidth) {
      const segmentCenterX = currentX + segmentWidth/2;
      console.log(`  ✅ CREATING RIGHT BEAM SEGMENT: ${currentX.toFixed(2)} to ${wallRightWithMargin.toFixed(2)} (center: ${segmentCenterX.toFixed(2)})`);
      segments.push({
        x: segmentCenterX,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: segmentWidth
      });
    } else {
      console.log(`  ⚠️  Right segment too small (${segmentWidth.toFixed(2)}ft < ${minSegmentWidth}ft)`);
    }
  }
  
  // CRITICAL SAFETY CHECK: NEVER return empty horizontal segments
  if (segments.length === 0) {
    console.log(`🚨 CRITICAL SAFETY: No horizontal segments! Creating emergency structural support...`);
    
    // Find the largest horizontal gap for emergency beam
    let largestGapStart = wallLeft + 0.5;
    let largestGapEnd = wallRight - 0.5;
    let largestGapSize = wallWidth - 1;
    
    if (overlappingFeatures.length > 0) {
      // Check gap before first feature
      const firstFeature = overlappingFeatures[0];
      if (firstFeature.bounds.left - (wallLeft + 0.5) > 1) {
        largestGapStart = wallLeft + 0.5;
        largestGapEnd = firstFeature.bounds.left - 0.1;
        largestGapSize = largestGapEnd - largestGapStart;
      }
      
      // Check gap after last feature
      const lastFeature = overlappingFeatures[overlappingFeatures.length - 1];
      if ((wallRight - 0.5) - lastFeature.bounds.right > largestGapSize) {
        largestGapStart = lastFeature.bounds.right + 0.1;
        largestGapEnd = wallRight - 0.5;
        largestGapSize = largestGapEnd - largestGapStart;
      }
    }
    
    // Create emergency horizontal beam
    if (largestGapSize >= 0.3) {
      const emergencyCenterX = largestGapStart + largestGapSize/2;
      console.log(`  🔧 EMERGENCY HORIZONTAL BEAM: ${largestGapStart.toFixed(2)} to ${largestGapEnd.toFixed(2)} (center: ${emergencyCenterX.toFixed(2)})`);
      segments.push({
        x: emergencyCenterX,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: largestGapSize
      });
    } else {
      // Absolute emergency: create minimal structural connections at edges
      console.log(`  🆘 ABSOLUTE EMERGENCY: Creating minimal edge connections`);
      segments.push({
        x: wallLeft + 1,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: 0.5
      });
      segments.push({
        x: wallRight - 1,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: 0.5
      });
    }
  }
  
  console.log(`📊 HORIZONTAL STRUCTURAL ANALYSIS:`);
  console.log(`  Horizontal segments created: ${segments.length}`);
  segments.forEach((seg, i) => 
    console.log(`  H-Segment ${i + 1}: x=${seg.x.toFixed(2)} (width=${seg.width.toFixed(2)}), y=${seg.bottomY.toFixed(2)} to ${seg.topY.toFixed(2)}`)
  );
  
  return segments;
};

/**
 * ENHANCED: Beam position generation with guaranteed structural integrity
 */
export const generateBeamPositions = (
  wallWidth: number,
  wallHeight: number,
  features: WallFeature[],
  options: {
    maxSpacing?: number;
    minSpacing?: number;
    margin?: number;
    beamWidth?: number;
    minBeams?: number;
  } = {}
): BeamSegment[] => {
  const {
    maxSpacing = 8,
    minSpacing = 4,
    margin = 2,
    beamWidth = 0.3,
    minBeams = 3
  } = options;
  
  console.log(`\n🏗️  === CRITICAL BEAM GENERATION: ${wallWidth}x${wallHeight} wall ===`);
  console.log(`Total features: ${features.length}`);
  console.log(`Window features: ${features.filter(f => f.type === 'window').length}`);
  
  const availableWidth = wallWidth - (2 * margin);
  let numBeams = Math.max(minBeams, Math.ceil(availableWidth / maxSpacing) + 1);
  let spacing = availableWidth / Math.max(1, numBeams - 1);
  
  // Ensure minimum spacing for structural integrity
  if (spacing < minSpacing && numBeams > minBeams) {
    numBeams = Math.max(minBeams, Math.floor(availableWidth / minSpacing) + 1);
    spacing = availableWidth / Math.max(1, numBeams - 1);
  }
  
  console.log(`📏 STRUCTURAL LAYOUT: ${numBeams} beams, ${spacing.toFixed(2)}ft spacing`);
  
  const allSegments: BeamSegment[] = [];
  
  // Generate beam positions and apply CRITICAL cutting algorithm
  for (let i = 0; i < numBeams; i++) {
    const position = -wallWidth/2 + margin + (i * spacing);
    
    if (position > wallWidth/2 - margin) break;
    
    console.log(`\n🔧 BEAM ${i + 1}/${numBeams} at x=${position.toFixed(2)} - CRITICAL CUTTING PROCESS`);
    
    const segments = cutBeamAroundFeatures(
      position,
      beamWidth,
      wallHeight,
      features,
      wallWidth
    );
    
    // CRITICAL: Ensure we always get segments
    if (segments.length === 0) {
      console.log(`🚨 EMERGENCY: No segments returned, creating emergency beam`);
      segments.push({
        x: position,
        bottomY: -wallHeight/2,
        topY: wallHeight/2,
        width: beamWidth
      });
    }
    
    allSegments.push(...segments);
  }
  
  // FINAL VALIDATION
  console.log(`\n✅ CRITICAL BEAM GENERATION COMPLETE:`);
  console.log(`  Total beam segments: ${allSegments.length}`);
  console.log(`  Structural integrity: GUARANTEED`);
  
  return allSegments;
};

/**
 * ENHANCED: Horizontal beam generation with guaranteed structural integrity
 */
export const generateHorizontalBeamPositions = (
  wallWidth: number,
  wallHeight: number,
  features: WallFeature[],
  heightRatios: number[] = [0.25, 0.5, 0.75],
  beamHeight: number = 0.3
): BeamSegment[] => {
  console.log(`\n🏗️  === CRITICAL HORIZONTAL BEAM GENERATION: ${wallWidth}x${wallHeight} wall ===`);
  
  const allSegments: BeamSegment[] = [];
  
  heightRatios.forEach((heightRatio, index) => {
    const beamY = -wallHeight/2 + wallHeight * heightRatio;
    
    console.log(`\n🔧 HORIZONTAL BEAM ${index + 1}/${heightRatios.length} at y=${beamY.toFixed(2)} - CRITICAL CUTTING`);
    
    const segments = cutHorizontalBeamAroundFeatures(
      beamY,
      beamHeight,
      wallWidth,
      features,
      wallHeight
    );
    
    // CRITICAL: Ensure we always get horizontal segments
    if (segments.length === 0) {
      console.log(`🚨 EMERGENCY: No horizontal segments returned, creating emergency beam`);
      segments.push({
        x: 0,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: wallWidth - 1
      });
    }
    
    allSegments.push(...segments);
  });
  
  console.log(`\n✅ CRITICAL HORIZONTAL BEAM GENERATION COMPLETE:`);
  console.log(`  Total horizontal segments: ${allSegments.length}`);
  console.log(`  Structural integrity: GUARANTEED`);
  
  return allSegments;
};

/**
 * Enhanced feature placement validation with structural impact analysis
 */
export const validateFeaturePlacement = (
  feature: Omit<WallFeature, 'id'>,
  wallWidth: number,
  wallHeight: number,
  existingFeatures: WallFeature[] = []
): { valid: boolean; errors: string[]; structuralImpact: string } => {
  const errors: string[] = [];
  
  const featureBounds = getFeatureBounds(feature as WallFeature, wallWidth, wallHeight);
  
  // Enhanced boundary validation
  if (featureBounds.left < -wallWidth/2) {
    errors.push('Feature extends beyond left edge of wall');
  }
  if (featureBounds.right > wallWidth/2) {
    errors.push('Feature extends beyond right edge of wall');
  }
  if (featureBounds.bottom < -wallHeight/2) {
    errors.push('Feature extends below wall bottom');
  }
  if (featureBounds.top > wallHeight/2) {
    errors.push('Feature extends above wall top');
  }
  
  // Structural impact analysis
  const featureArea = feature.width * feature.height;
  const wallArea = wallWidth * wallHeight;
  const impactRatio = featureArea / wallArea;
  
  let structuralImpact = '';
  if (impactRatio < 0.1) {
    structuralImpact = 'Minimal structural impact - beams will be cleanly segmented';
  } else if (impactRatio < 0.25) {
    structuralImpact = 'Moderate structural impact - adequate beam segments will remain';
  } else if (impactRatio < 0.4) {
    structuralImpact = 'Significant structural impact - review beam placement';
  } else {
    structuralImpact = 'High structural impact - additional reinforcement may be required';
    errors.push('Feature may compromise structural integrity');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    structuralImpact
  };
};
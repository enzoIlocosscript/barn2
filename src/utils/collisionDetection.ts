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
 * Checks if a beam horizontally overlaps with a feature
 */
export const beamOverlapsFeature = (
  beamX: number, 
  beamWidth: number, 
  featureBounds: CollisionBounds,
  buffer: number = 0.05 // Reduced buffer for more precise cutting
): boolean => {
  const beamLeft = beamX - beamWidth/2;
  const beamRight = beamX + beamWidth/2;
  
  return !(beamRight + buffer <= featureBounds.left || beamLeft - buffer >= featureBounds.right);
};

/**
 * Enhanced beam cutting with precise window intersection handling
 * CRITICAL: This function SPLITS beams at exact window coordinates, maintaining structural integrity
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
  
  console.log(`\n✂️  ENHANCED BEAM CUTTING at x=${beamX.toFixed(1)} (wall: ${wallHeight}ft tall)`);
  
  // Find overlapping features and get their bounds with enhanced precision
  const overlappingFeatures = features
    .filter(feature => {
      const featureBounds = getFeatureBounds(feature, wallWidth, wallHeight);
      return beamOverlapsFeature(beamX, beamWidth, featureBounds, 0.01); // Very precise overlap detection
    })
    .map(feature => ({
      feature,
      bounds: getFeatureBounds(feature, wallWidth, wallHeight)
    }))
    .sort((a, b) => a.bounds.bottom - b.bounds.bottom); // Sort by vertical position
  
  if (overlappingFeatures.length === 0) {
    console.log(`✅ No intersections - returning full structural beam`);
    return [{
      x: beamX,
      bottomY: wallBottom,
      topY: wallTop,
      width: beamWidth
    }];
  }
  
  console.log(`🔪 PRECISE CUTTING around ${overlappingFeatures.length} window intersections:`);
  overlappingFeatures.forEach(({ feature, bounds }) => {
    console.log(`  - ${feature.type}: EXACT cut from y=${bounds.bottom.toFixed(2)} to ${bounds.top.toFixed(2)}`);
  });
  
  const segments: BeamSegment[] = [];
  let currentY = wallBottom;
  const minSegmentHeight = 0.5; // Reduced minimum for more precise cutting
  const structuralGap = 0.1; // Small gap for clean window frame installation
  
  // Process each window intersection with enhanced precision
  for (const { feature, bounds } of overlappingFeatures) {
    const cutBottom = bounds.bottom - structuralGap; // Clean break above window
    const cutTop = bounds.top + structuralGap; // Clean break below window
    
    console.log(`\n🎯 PRECISE ${feature.type} intersection processing:`);
    console.log(`  Current beam position: ${currentY.toFixed(2)}`);
    console.log(`  Window bounds: ${bounds.bottom.toFixed(2)} to ${bounds.top.toFixed(2)}`);
    console.log(`  Cut coordinates: ${cutBottom.toFixed(2)} to ${cutTop.toFixed(2)}`);
    
    // Create beam segment BELOW the window with exact coordinates
    if (currentY < cutBottom) {
      const segmentHeight = cutBottom - currentY;
      console.log(`  Lower segment height: ${segmentHeight.toFixed(2)}ft`);
      
      if (segmentHeight >= minSegmentHeight) {
        console.log(`  ✅ CREATING LOWER BEAM SEGMENT: ${currentY.toFixed(2)} to ${cutBottom.toFixed(2)}`);
        segments.push({
          x: beamX,
          bottomY: currentY,
          topY: cutBottom,
          width: beamWidth
        });
      } else {
        console.log(`  ⚠️  Lower segment too small (${segmentHeight.toFixed(2)}ft), merging with adjacent`);
      }
    }
    
    // PRECISE WINDOW CUTOUT - this maintains exact window opening dimensions
    console.log(`  🪟 WINDOW OPENING: ${cutBottom.toFixed(2)} to ${cutTop.toFixed(2)} (${(cutTop - cutBottom).toFixed(2)}ft clear)`);
    currentY = Math.max(currentY, cutTop);
    console.log(`  Beam continues from: ${currentY.toFixed(2)}`);
  }
  
  // Create beam segment ABOVE all windows with exact coordinates
  console.log(`\n🎯 UPPER BEAM SEGMENT check:`);
  console.log(`  Current position: ${currentY.toFixed(2)}, Wall top: ${wallTop.toFixed(2)}`);
  
  if (currentY < wallTop) {
    const segmentHeight = wallTop - currentY;
    console.log(`  Upper segment height: ${segmentHeight.toFixed(2)}ft`);
    
    if (segmentHeight >= minSegmentHeight) {
      console.log(`  ✅ CREATING UPPER BEAM SEGMENT: ${currentY.toFixed(2)} to ${wallTop.toFixed(2)}`);
      segments.push({
        x: beamX,
        bottomY: currentY,
        topY: wallTop,
        width: beamWidth
      });
    } else {
      console.log(`  ⚠️  Upper segment too small, extending previous segment`);
      // Extend the last segment if possible
      if (segments.length > 0) {
        segments[segments.length - 1].topY = wallTop;
        console.log(`  📏 Extended last segment to wall top`);
      }
    }
  }
  
  // ENHANCED STRUCTURAL INTEGRITY CHECK
  if (segments.length === 0) {
    console.log(`🚨 CRITICAL: No beam segments created! Implementing emergency structural support...`);
    
    // Create minimal structural elements to maintain load-bearing capacity
    const emergencySegmentHeight = Math.min(1.5, wallHeight * 0.12); // 12% of wall height
    
    // Emergency bottom segment for foundation connection
    if (wallBottom + emergencySegmentHeight < overlappingFeatures[0].bounds.bottom - 0.2) {
      segments.push({
        x: beamX,
        bottomY: wallBottom,
        topY: wallBottom + emergencySegmentHeight,
        width: beamWidth
      });
      console.log(`  🔧 EMERGENCY foundation connection: ${wallBottom.toFixed(2)} to ${(wallBottom + emergencySegmentHeight).toFixed(2)}`);
    }
    
    // Emergency top segment for roof connection
    const lastFeature = overlappingFeatures[overlappingFeatures.length - 1];
    if (lastFeature.bounds.top + 0.2 + emergencySegmentHeight < wallTop) {
      segments.push({
        x: beamX,
        bottomY: wallTop - emergencySegmentHeight,
        topY: wallTop,
        width: beamWidth
      });
      console.log(`  🔧 EMERGENCY roof connection: ${(wallTop - emergencySegmentHeight).toFixed(2)} to ${wallTop.toFixed(2)}`);
    }
  }
  
  // STRUCTURAL VALIDATION
  const totalBeamLength = segments.reduce((sum, seg) => sum + (seg.topY - seg.bottomY), 0);
  const structuralRatio = totalBeamLength / wallHeight;
  
  console.log(`📊 STRUCTURAL ANALYSIS:`);
  console.log(`  Total segments: ${segments.length}`);
  console.log(`  Total beam length: ${totalBeamLength.toFixed(2)}ft`);
  console.log(`  Wall height: ${wallHeight.toFixed(2)}ft`);
  console.log(`  Structural ratio: ${(structuralRatio * 100).toFixed(1)}%`);
  
  if (structuralRatio < 0.4) {
    console.log(`  ⚠️  WARNING: Low structural ratio (${(structuralRatio * 100).toFixed(1)}% < 40%)`);
  } else {
    console.log(`  ✅ ADEQUATE structural support maintained`);
  }
  
  segments.forEach((seg, i) => 
    console.log(`  Segment ${i + 1}: x=${seg.x.toFixed(2)}, y=${seg.bottomY.toFixed(2)} to ${seg.topY.toFixed(2)} (${(seg.topY - seg.bottomY).toFixed(2)}ft)`)
  );
  
  return segments;
};

/**
 * Enhanced horizontal beam cutting with precise window intersection handling
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
  
  console.log(`\n✂️  ENHANCED HORIZONTAL BEAM CUTTING at y=${beamY.toFixed(2)} (wall: ${wallWidth}ft wide)`);
  
  // Enhanced precision for horizontal beam intersection detection
  const overlappingFeatures = features
    .filter(feature => {
      const featureBounds = getFeatureBounds(feature, wallWidth, wallHeight);
      const buffer = beamHeight / 2 + 0.05; // Precise buffer for clean cuts
      const beamOverlapsVertically = beamY >= (featureBounds.bottom - buffer) && beamY <= (featureBounds.top + buffer);
      
      if (beamOverlapsVertically) {
        console.log(`  🎯 Horizontal intersection with ${feature.type} at y=${beamY.toFixed(2)}`);
      }
      
      return beamOverlapsVertically;
    })
    .map(feature => ({
      feature,
      bounds: getFeatureBounds(feature, wallWidth, wallHeight)
    }))
    .sort((a, b) => a.bounds.left - b.bounds.left); // Sort by horizontal position
  
  if (overlappingFeatures.length === 0) {
    console.log(`✅ No horizontal intersections - returning full structural beam`);
    return [{
      x: 0, // Center of wall
      bottomY: beamY - beamHeight/2,
      topY: beamY + beamHeight/2,
      width: wallWidth - 1 // Leave structural margin on sides
    }];
  }
  
  console.log(`🔪 PRECISE HORIZONTAL CUTTING around ${overlappingFeatures.length} window intersections`);
  
  const segments: BeamSegment[] = [];
  let currentX = wallLeft + 0.5; // Structural margin from wall edge
  const minSegmentWidth = 1.0; // Minimum width for structural integrity
  const structuralGap = 0.1; // Clean gap for window frame installation
  
  // Process each window intersection with enhanced precision
  for (const { feature, bounds } of overlappingFeatures) {
    const cutLeft = bounds.left - structuralGap; // Clean break before window
    const cutRight = bounds.right + structuralGap; // Clean break after window
    
    console.log(`\n🎯 PRECISE ${feature.type} horizontal intersection:`);
    console.log(`  Current beam position: ${currentX.toFixed(2)}`);
    console.log(`  Window bounds: ${bounds.left.toFixed(2)} to ${bounds.right.toFixed(2)}`);
    console.log(`  Cut coordinates: ${cutLeft.toFixed(2)} to ${cutRight.toFixed(2)}`);
    
    // Create beam segment to the LEFT of the window with exact coordinates
    if (currentX < cutLeft) {
      const segmentWidth = cutLeft - currentX;
      console.log(`  Left segment width: ${segmentWidth.toFixed(2)}ft`);
      
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
        console.log(`  ⚠️  Left segment too small (${segmentWidth.toFixed(2)}ft), merging with adjacent`);
      }
    }
    
    // PRECISE WINDOW CUTOUT - maintains exact window opening dimensions
    console.log(`  🪟 WINDOW OPENING: ${cutLeft.toFixed(2)} to ${cutRight.toFixed(2)} (${(cutRight - cutLeft).toFixed(2)}ft clear)`);
    currentX = Math.max(currentX, cutRight);
    console.log(`  Beam continues from: ${currentX.toFixed(2)}`);
  }
  
  // Create beam segment to the RIGHT of all windows with exact coordinates
  const wallRightWithMargin = wallRight - 0.5; // Structural margin
  console.log(`\n🎯 RIGHT BEAM SEGMENT check:`);
  console.log(`  Current position: ${currentX.toFixed(2)}, Wall right: ${wallRightWithMargin.toFixed(2)}`);
  
  if (currentX < wallRightWithMargin) {
    const segmentWidth = wallRightWithMargin - currentX;
    console.log(`  Right segment width: ${segmentWidth.toFixed(2)}ft`);
    
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
      console.log(`  ⚠️  Right segment too small, extending previous segment`);
      // Extend the last segment if possible
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        const newWidth = wallRightWithMargin - (lastSegment.x - lastSegment.width/2);
        lastSegment.width = newWidth;
        lastSegment.x = (lastSegment.x - lastSegment.width/2) + newWidth/2;
        console.log(`  📏 Extended last segment to wall edge`);
      }
    }
  }
  
  // ENHANCED STRUCTURAL INTEGRITY CHECK for horizontal beams
  if (segments.length === 0) {
    console.log(`🚨 CRITICAL: No horizontal beam segments created! Implementing emergency structural support...`);
    
    // Create minimal structural elements at wall edges
    const emergencySegmentWidth = Math.min(2.5, wallWidth * 0.15); // 15% of wall width
    
    // Emergency left edge segment
    if (wallLeft + emergencySegmentWidth < overlappingFeatures[0].bounds.left - 0.2) {
      segments.push({
        x: wallLeft + emergencySegmentWidth/2 + 0.5,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: emergencySegmentWidth
      });
      console.log(`  🔧 EMERGENCY left structural support`);
    }
    
    // Emergency right edge segment
    const lastFeature = overlappingFeatures[overlappingFeatures.length - 1];
    if (lastFeature.bounds.right + 0.2 + emergencySegmentWidth < wallRight) {
      segments.push({
        x: wallRight - emergencySegmentWidth/2 - 0.5,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: emergencySegmentWidth
      });
      console.log(`  🔧 EMERGENCY right structural support`);
    }
  }
  
  // STRUCTURAL VALIDATION for horizontal beams
  const totalBeamWidth = segments.reduce((sum, seg) => sum + seg.width, 0);
  const structuralRatio = totalBeamWidth / (wallWidth - 1); // Account for margins
  
  console.log(`📊 HORIZONTAL STRUCTURAL ANALYSIS:`);
  console.log(`  Total segments: ${segments.length}`);
  console.log(`  Total beam width: ${totalBeamWidth.toFixed(2)}ft`);
  console.log(`  Available width: ${(wallWidth - 1).toFixed(2)}ft`);
  console.log(`  Structural ratio: ${(structuralRatio * 100).toFixed(1)}%`);
  
  segments.forEach((seg, i) => 
    console.log(`  H-Segment ${i + 1}: x=${seg.x.toFixed(2)} (width=${seg.width.toFixed(2)}), y=${seg.bottomY.toFixed(2)} to ${seg.topY.toFixed(2)}`)
  );
  
  return segments;
};

/**
 * Enhanced beam position generation with precise window intersection handling
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
  
  console.log(`\n🏗️  === ENHANCED BEAM GENERATION: ${wallWidth}x${wallHeight} wall ===`);
  console.log(`Window features: ${features.filter(f => f.type === 'window').length}`);
  console.log(`All features: ${features.length}`);
  
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
  
  // Generate beam positions and apply enhanced cutting algorithm
  for (let i = 0; i < numBeams; i++) {
    const position = -wallWidth/2 + margin + (i * spacing);
    
    if (position > wallWidth/2 - margin) break;
    
    console.log(`\n🔧 BEAM ${i + 1}/${numBeams} at x=${position.toFixed(2)} - ENHANCED CUTTING`);
    
    const segments = cutBeamAroundFeatures(
      position,
      beamWidth,
      wallHeight,
      features,
      wallWidth
    );
    
    allSegments.push(...segments);
  }
  
  // FINAL STRUCTURAL VALIDATION
  const totalStructuralLength = allSegments.reduce((sum, seg) => sum + (seg.topY - seg.bottomY), 0);
  const totalPossibleLength = numBeams * wallHeight;
  const overallStructuralRatio = totalStructuralLength / totalPossibleLength;
  
  console.log(`\n✅ ENHANCED BEAM GENERATION COMPLETE:`);
  console.log(`  Total beam segments: ${allSegments.length}`);
  console.log(`  Total structural length: ${totalStructuralLength.toFixed(2)}ft`);
  console.log(`  Overall structural ratio: ${(overallStructuralRatio * 100).toFixed(1)}%`);
  console.log(`  Load-bearing capacity: ${overallStructuralRatio >= 0.6 ? 'ADEQUATE' : 'REVIEW REQUIRED'}`);
  
  return allSegments;
};

/**
 * Enhanced horizontal beam generation with precise window intersection handling
 */
export const generateHorizontalBeamPositions = (
  wallWidth: number,
  wallHeight: number,
  features: WallFeature[],
  heightRatios: number[] = [0.25, 0.5, 0.75],
  beamHeight: number = 0.3
): BeamSegment[] => {
  console.log(`\n🏗️  === ENHANCED HORIZONTAL BEAM GENERATION: ${wallWidth}x${wallHeight} wall ===`);
  console.log(`Window features: ${features.filter(f => f.type === 'window').length}`);
  
  const allSegments: BeamSegment[] = [];
  
  heightRatios.forEach((heightRatio, index) => {
    const beamY = -wallHeight/2 + wallHeight * heightRatio;
    
    console.log(`\n🔧 HORIZONTAL BEAM ${index + 1}/${heightRatios.length} at y=${beamY.toFixed(2)} (${(heightRatio * 100).toFixed(0)}% height) - ENHANCED CUTTING`);
    
    const segments = cutHorizontalBeamAroundFeatures(
      beamY,
      beamHeight,
      wallWidth,
      features,
      wallHeight
    );
    
    allSegments.push(...segments);
  });
  
  // FINAL HORIZONTAL STRUCTURAL VALIDATION
  const totalHorizontalWidth = allSegments.reduce((sum, seg) => sum + seg.width, 0);
  const totalPossibleWidth = heightRatios.length * (wallWidth - 1);
  const horizontalStructuralRatio = totalHorizontalWidth / totalPossibleWidth;
  
  console.log(`\n✅ ENHANCED HORIZONTAL BEAM GENERATION COMPLETE:`);
  console.log(`  Total horizontal segments: ${allSegments.length}`);
  console.log(`  Total structural width: ${totalHorizontalWidth.toFixed(2)}ft`);
  console.log(`  Horizontal structural ratio: ${(horizontalStructuralRatio * 100).toFixed(1)}%`);
  console.log(`  Lateral stability: ${horizontalStructuralRatio >= 0.5 ? 'ADEQUATE' : 'REVIEW REQUIRED'}`);
  
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
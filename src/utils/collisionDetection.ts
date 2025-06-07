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
  buffer: number = 0.1
): boolean => {
  const beamLeft = beamX - beamWidth/2;
  const beamRight = beamX + beamWidth/2;
  
  return !(beamRight + buffer <= featureBounds.left || beamLeft - buffer >= featureBounds.right);
};

/**
 * Creates beam segments by cutting out overlapping feature areas
 * CRITICAL: This function SPLITS beams, never removes them entirely
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
  
  console.log(`\n✂️  CUTTING BEAM at x=${beamX.toFixed(1)} (wall: ${wallHeight}ft tall)`);
  
  // Find overlapping features and get their bounds
  const overlappingFeatures = features
    .filter(feature => {
      const featureBounds = getFeatureBounds(feature, wallWidth, wallHeight);
      return beamOverlapsFeature(beamX, beamWidth, featureBounds);
    })
    .map(feature => ({
      feature,
      bounds: getFeatureBounds(feature, wallWidth, wallHeight)
    }))
    .sort((a, b) => a.bounds.bottom - b.bounds.bottom); // Sort by vertical position
  
  if (overlappingFeatures.length === 0) {
    console.log(`✅ No cuts needed - returning full beam`);
    return [{
      x: beamX,
      bottomY: wallBottom,
      topY: wallTop,
      width: beamWidth
    }];
  }
  
  console.log(`🔪 Cutting around ${overlappingFeatures.length} features:`);
  overlappingFeatures.forEach(({ feature, bounds }) => {
    console.log(`  - ${feature.type}: y=${bounds.bottom.toFixed(1)} to ${bounds.top.toFixed(1)}`);
  });
  
  const segments: BeamSegment[] = [];
  let currentY = wallBottom;
  const minSegmentHeight = 1.0; // Minimum 1 foot for structural integrity
  
  // Process each overlapping feature
  for (const { feature, bounds } of overlappingFeatures) {
    const cutBottom = bounds.bottom;
    const cutTop = bounds.top;
    
    console.log(`\n🔍 Processing ${feature.type} cut:`);
    console.log(`  Current Y: ${currentY.toFixed(1)}`);
    console.log(`  Cut from: ${cutBottom.toFixed(1)} to ${cutTop.toFixed(1)}`);
    
    // Add segment BELOW the feature if there's enough space
    if (currentY < cutBottom) {
      const segmentHeight = cutBottom - currentY;
      console.log(`  Gap below: ${segmentHeight.toFixed(1)}ft`);
      
      if (segmentHeight >= minSegmentHeight) {
        console.log(`  ✅ Adding BOTTOM segment: ${currentY.toFixed(1)} to ${cutBottom.toFixed(1)}`);
        segments.push({
          x: beamX,
          bottomY: currentY,
          topY: cutBottom,
          width: beamWidth
        });
      } else {
        console.log(`  ❌ Bottom segment too small (${segmentHeight.toFixed(1)}ft < ${minSegmentHeight}ft)`);
      }
    }
    
    // Skip the feature area (this is the "cut")
    console.log(`  🚪 CUTTING OUT feature area: ${cutBottom.toFixed(1)} to ${cutTop.toFixed(1)}`);
    currentY = Math.max(currentY, cutTop);
    console.log(`  Moving to Y: ${currentY.toFixed(1)}`);
  }
  
  // Add segment ABOVE all features if there's space
  console.log(`\n🔍 Checking for TOP segment:`);
  console.log(`  Current Y: ${currentY.toFixed(1)}, Wall top: ${wallTop.toFixed(1)}`);
  
  if (currentY < wallTop) {
    const segmentHeight = wallTop - currentY;
    console.log(`  Gap above: ${segmentHeight.toFixed(1)}ft`);
    
    if (segmentHeight >= minSegmentHeight) {
      console.log(`  ✅ Adding TOP segment: ${currentY.toFixed(1)} to ${wallTop.toFixed(1)}`);
      segments.push({
        x: beamX,
        bottomY: currentY,
        topY: wallTop,
        width: beamWidth
      });
    } else {
      console.log(`  ❌ Top segment too small (${segmentHeight.toFixed(1)}ft < ${minSegmentHeight}ft)`);
    }
  }
  
  // CRITICAL: If no segments were created, we MUST create at least partial segments
  if (segments.length === 0) {
    console.log(`⚠️  WARNING: No segments created! Creating minimal structural elements...`);
    
    // Create small segments at top and bottom for structural integrity
    const topSegmentHeight = Math.min(2, wallHeight * 0.15); // 15% of wall height or 2ft max
    const bottomSegmentHeight = Math.min(2, wallHeight * 0.15);
    
    // Bottom segment
    if (wallBottom + bottomSegmentHeight < overlappingFeatures[0].bounds.bottom) {
      segments.push({
        x: beamX,
        bottomY: wallBottom,
        topY: wallBottom + bottomSegmentHeight,
        width: beamWidth
      });
      console.log(`  🔧 Emergency bottom segment: ${wallBottom.toFixed(1)} to ${(wallBottom + bottomSegmentHeight).toFixed(1)}`);
    }
    
    // Top segment
    const lastFeature = overlappingFeatures[overlappingFeatures.length - 1];
    if (lastFeature.bounds.top + topSegmentHeight < wallTop) {
      segments.push({
        x: beamX,
        bottomY: wallTop - topSegmentHeight,
        topY: wallTop,
        width: beamWidth
      });
      console.log(`  🔧 Emergency top segment: ${(wallTop - topSegmentHeight).toFixed(1)} to ${wallTop.toFixed(1)}`);
    }
  }
  
  console.log(`📊 RESULT: ${segments.length} beam segments created`);
  segments.forEach((seg, i) => 
    console.log(`  ${i + 1}. x=${seg.x.toFixed(1)}, y=${seg.bottomY.toFixed(1)} to ${seg.topY.toFixed(1)} (${(seg.topY - seg.bottomY).toFixed(1)}ft)`)
  );
  
  return segments;
};

/**
 * Creates horizontal beam segments by cutting around features
 * NEW: Splits horizontal beams instead of removing them entirely
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
  
  console.log(`\n✂️  CUTTING HORIZONTAL BEAM at y=${beamY.toFixed(1)} (wall: ${wallWidth}ft wide)`);
  
  // Find features that vertically overlap with this horizontal beam
  const overlappingFeatures = features
    .filter(feature => {
      const featureBounds = getFeatureBounds(feature, wallWidth, wallHeight);
      const buffer = beamHeight / 2 + 0.1; // Half beam height plus small buffer
      return beamY >= (featureBounds.bottom - buffer) && beamY <= (featureBounds.top + buffer);
    })
    .map(feature => ({
      feature,
      bounds: getFeatureBounds(feature, wallWidth, wallHeight)
    }))
    .sort((a, b) => a.bounds.left - b.bounds.left); // Sort by horizontal position
  
  if (overlappingFeatures.length === 0) {
    console.log(`✅ No horizontal cuts needed - returning full beam`);
    return [{
      x: 0, // Center of wall
      bottomY: beamY - beamHeight/2,
      topY: beamY + beamHeight/2,
      width: wallWidth - 1 // Leave margin on sides
    }];
  }
  
  console.log(`🔪 Cutting horizontal beam around ${overlappingFeatures.length} features:`);
  overlappingFeatures.forEach(({ feature, bounds }) => {
    console.log(`  - ${feature.type}: x=${bounds.left.toFixed(1)} to ${bounds.right.toFixed(1)}`);
  });
  
  const segments: BeamSegment[] = [];
  let currentX = wallLeft + 0.5; // Start with small margin
  const minSegmentWidth = 2.0; // Minimum 2 feet for structural integrity
  
  // Process each overlapping feature
  for (const { feature, bounds } of overlappingFeatures) {
    const cutLeft = bounds.left;
    const cutRight = bounds.right;
    
    console.log(`\n🔍 Processing ${feature.type} horizontal cut:`);
    console.log(`  Current X: ${currentX.toFixed(1)}`);
    console.log(`  Cut from: ${cutLeft.toFixed(1)} to ${cutRight.toFixed(1)}`);
    
    // Add segment to the LEFT of the feature if there's enough space
    if (currentX < cutLeft) {
      const segmentWidth = cutLeft - currentX;
      console.log(`  Gap to left: ${segmentWidth.toFixed(1)}ft`);
      
      if (segmentWidth >= minSegmentWidth) {
        const segmentCenterX = currentX + segmentWidth/2;
        console.log(`  ✅ Adding LEFT segment: ${currentX.toFixed(1)} to ${cutLeft.toFixed(1)} (center: ${segmentCenterX.toFixed(1)})`);
        segments.push({
          x: segmentCenterX,
          bottomY: beamY - beamHeight/2,
          topY: beamY + beamHeight/2,
          width: segmentWidth
        });
      } else {
        console.log(`  ❌ Left segment too small (${segmentWidth.toFixed(1)}ft < ${minSegmentWidth}ft)`);
      }
    }
    
    // Skip the feature area (this is the "cut")
    console.log(`  🚪 CUTTING OUT feature area: ${cutLeft.toFixed(1)} to ${cutRight.toFixed(1)}`);
    currentX = Math.max(currentX, cutRight);
    console.log(`  Moving to X: ${currentX.toFixed(1)}`);
  }
  
  // Add segment to the RIGHT of all features if there's space
  const wallRightWithMargin = wallRight - 0.5;
  console.log(`\n🔍 Checking for RIGHT segment:`);
  console.log(`  Current X: ${currentX.toFixed(1)}, Wall right: ${wallRightWithMargin.toFixed(1)}`);
  
  if (currentX < wallRightWithMargin) {
    const segmentWidth = wallRightWithMargin - currentX;
    console.log(`  Gap to right: ${segmentWidth.toFixed(1)}ft`);
    
    if (segmentWidth >= minSegmentWidth) {
      const segmentCenterX = currentX + segmentWidth/2;
      console.log(`  ✅ Adding RIGHT segment: ${currentX.toFixed(1)} to ${wallRightWithMargin.toFixed(1)} (center: ${segmentCenterX.toFixed(1)})`);
      segments.push({
        x: segmentCenterX,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: segmentWidth
      });
    } else {
      console.log(`  ❌ Right segment too small (${segmentWidth.toFixed(1)}ft < ${minSegmentWidth}ft)`);
    }
  }
  
  // CRITICAL: If no segments were created, create minimal structural elements
  if (segments.length === 0) {
    console.log(`⚠️  WARNING: No horizontal segments created! Creating minimal structural elements...`);
    
    // Create small segments at left and right edges for structural integrity
    const edgeSegmentWidth = Math.min(3, wallWidth * 0.15); // 15% of wall width or 3ft max
    
    // Left edge segment
    if (wallLeft + edgeSegmentWidth < overlappingFeatures[0].bounds.left) {
      segments.push({
        x: wallLeft + edgeSegmentWidth/2,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: edgeSegmentWidth
      });
      console.log(`  🔧 Emergency left segment: ${wallLeft.toFixed(1)} to ${(wallLeft + edgeSegmentWidth).toFixed(1)}`);
    }
    
    // Right edge segment
    const lastFeature = overlappingFeatures[overlappingFeatures.length - 1];
    if (lastFeature.bounds.right + edgeSegmentWidth < wallRight) {
      segments.push({
        x: wallRight - edgeSegmentWidth/2,
        bottomY: beamY - beamHeight/2,
        topY: beamY + beamHeight/2,
        width: edgeSegmentWidth
      });
      console.log(`  🔧 Emergency right segment: ${(wallRight - edgeSegmentWidth).toFixed(1)} to ${wallRight.toFixed(1)}`);
    }
  }
  
  console.log(`📊 HORIZONTAL RESULT: ${segments.length} beam segments created`);
  segments.forEach((seg, i) => 
    console.log(`  ${i + 1}. x=${seg.x.toFixed(1)} (width=${seg.width.toFixed(1)}), y=${seg.bottomY.toFixed(1)} to ${seg.topY.toFixed(1)}`)
  );
  
  return segments;
};

/**
 * Generates optimal beam positions with precise cutting around features
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
  
  console.log(`\n🏗️  === BEAM GENERATION: ${wallWidth}x${wallHeight} wall ===`);
  console.log(`Features: ${features.length}`);
  
  const availableWidth = wallWidth - (2 * margin);
  let numBeams = Math.max(minBeams, Math.ceil(availableWidth / maxSpacing) + 1);
  let spacing = availableWidth / Math.max(1, numBeams - 1);
  
  // Ensure minimum spacing
  if (spacing < minSpacing && numBeams > minBeams) {
    numBeams = Math.max(minBeams, Math.floor(availableWidth / minSpacing) + 1);
    spacing = availableWidth / Math.max(1, numBeams - 1);
  }
  
  console.log(`📏 Layout: ${numBeams} beams, ${spacing.toFixed(1)}ft spacing`);
  
  const allSegments: BeamSegment[] = [];
  
  // Generate beam positions and cut them around features
  for (let i = 0; i < numBeams; i++) {
    const position = -wallWidth/2 + margin + (i * spacing);
    
    if (position > wallWidth/2 - margin) break;
    
    console.log(`\n🔧 Beam ${i + 1}/${numBeams} at x=${position.toFixed(1)}`);
    
    const segments = cutBeamAroundFeatures(
      position,
      beamWidth,
      wallHeight,
      features,
      wallWidth
    );
    
    allSegments.push(...segments);
  }
  
  console.log(`\n✅ TOTAL: ${allSegments.length} beam segments generated`);
  return allSegments;
};

/**
 * Generates horizontal beam segments with precise cutting around features
 */
export const generateHorizontalBeamPositions = (
  wallWidth: number,
  wallHeight: number,
  features: WallFeature[],
  heightRatios: number[] = [0.25, 0.5, 0.75],
  beamHeight: number = 0.3
): BeamSegment[] => {
  console.log(`\n🏗️  === HORIZONTAL BEAM GENERATION: ${wallWidth}x${wallHeight} wall ===`);
  
  const allSegments: BeamSegment[] = [];
  
  heightRatios.forEach((heightRatio, index) => {
    const beamY = -wallHeight/2 + wallHeight * heightRatio;
    
    console.log(`\n🔧 Horizontal Beam ${index + 1}/${heightRatios.length} at y=${beamY.toFixed(1)} (${(heightRatio * 100).toFixed(0)}% height)`);
    
    const segments = cutHorizontalBeamAroundFeatures(
      beamY,
      beamHeight,
      wallWidth,
      features,
      wallHeight
    );
    
    allSegments.push(...segments);
  });
  
  console.log(`\n✅ TOTAL HORIZONTAL: ${allSegments.length} beam segments generated`);
  return allSegments;
};

/**
 * Validates feature placement
 */
export const validateFeaturePlacement = (
  feature: Omit<WallFeature, 'id'>,
  wallWidth: number,
  wallHeight: number,
  existingFeatures: WallFeature[] = []
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const featureBounds = getFeatureBounds(feature as WallFeature, wallWidth, wallHeight);
  
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
  
  return {
    valid: errors.length === 0,
    errors
  };
};
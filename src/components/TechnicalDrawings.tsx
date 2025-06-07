import { jsPDF } from 'jspdf';
import type { BuildingDimensions, WallFeature } from '../types';

// Fixed canvas dimensions
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 240;

const drawFloorPlan = (ctx: CanvasRenderingContext2D, dimensions: BuildingDimensions, features: WallFeature[]) => {
  // Calculate scale to fit the drawing
  const maxDimension = Math.max(dimensions.width, dimensions.length);
  const scale = Math.min((CANVAS_WIDTH - 100) / maxDimension, (CANVAS_HEIGHT - 100) / maxDimension);
  
  const width = dimensions.width * scale;
  const length = dimensions.length * scale;
  
  // Clear and set background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-CANVAS_WIDTH/2, -CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw grid (fixed spacing)
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 0.5;
  const gridSpacing = 20; // Fixed grid spacing
  
  for (let x = -width/2; x <= width/2; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, -length/2);
    ctx.lineTo(x, length/2);
    ctx.stroke();
  }
  
  for (let y = -length/2; y <= length/2; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(-width/2, y);
    ctx.lineTo(width/2, y);
    ctx.stroke();
  }
  
  // Draw walls with improved thickness and shadow
  const wallThickness = 6; // Increased wall thickness
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#1F2937';
  
  // Outer walls
  ctx.fillRect(-width/2 - wallThickness, -length/2 - wallThickness, width + wallThickness * 2, wallThickness);
  ctx.fillRect(-width/2 - wallThickness, length/2, width + wallThickness * 2, wallThickness);
  ctx.fillRect(-width/2 - wallThickness, -length/2 - wallThickness, wallThickness, length + wallThickness * 2);
  ctx.fillRect(width/2, -length/2 - wallThickness, wallThickness, length + wallThickness * 2);
  
  // Reset shadow for other elements
  ctx.shadowColor = 'transparent';
  
  // Draw features with improved visibility
  features.forEach(feature => {
    const featureWidth = feature.width * scale;
    const featureDepth = 8; // Increased feature depth
    let x = 0;
    let y = 0;
    
    switch (feature.position.wallPosition) {
      case 'front':
        x = (feature.position.alignment === 'left')
          ? -width/2 + feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? width/2 - (feature.position.xOffset * scale) - featureWidth
            : -featureWidth/2 + (feature.position.xOffset * scale);
        y = length/2 - featureDepth;
        break;
      case 'back':
        x = (feature.position.alignment === 'left')
          ? -width/2 + feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? width/2 - (feature.position.xOffset * scale) - featureWidth
            : -featureWidth/2 + (feature.position.xOffset * scale);
        y = -length/2;
        break;
      case 'left':
        y = (feature.position.alignment === 'left')
          ? -length/2 + feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? length/2 - (feature.position.xOffset * scale) - featureWidth
            : -featureWidth/2 + (feature.position.xOffset * scale);
        x = -width/2;
        break;
      case 'right':
        y = (feature.position.alignment === 'left')
          ? -length/2 + feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? length/2 - (feature.position.xOffset * scale) - featureWidth
            : -featureWidth/2 + (feature.position.xOffset * scale);
        x = width/2 - featureDepth;
        break;
    }
    
    // Draw feature with shadow and highlight
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#2563EB';
    
    if (feature.position.wallPosition === 'front' || feature.position.wallPosition === 'back') {
      ctx.fillRect(x, y, featureWidth, featureDepth);
    } else {
      ctx.fillRect(x, y, featureDepth, featureWidth);
    }
    
    // Add feature label
    ctx.shadowColor = 'transparent';
    ctx.font = '8px Arial';
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    const label = `${feature.type} (${feature.width}'×${feature.height}')`;
    
    if (feature.position.wallPosition === 'front' || feature.position.wallPosition === 'back') {
      ctx.fillText(label, x + featureWidth/2, y + featureDepth/2);
    } else {
      ctx.fillText(label, x + featureDepth/2, y + featureWidth/2);
    }
  });
  
  // Draw dimensions with improved visibility
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  
  // Width dimension with improved arrows
  const widthY = length/2 + 20;
  ctx.beginPath();
  ctx.moveTo(-width/2, widthY);
  ctx.lineTo(width/2, widthY);
  ctx.stroke();
  
  // Arrow heads
  const arrowSize = 6;
  ctx.beginPath();
  ctx.moveTo(-width/2 - arrowSize, widthY - arrowSize);
  ctx.lineTo(-width/2, widthY);
  ctx.lineTo(-width/2 - arrowSize, widthY + arrowSize);
  ctx.moveTo(width/2 + arrowSize, widthY - arrowSize);
  ctx.lineTo(width/2, widthY);
  ctx.lineTo(width/2 + arrowSize, widthY + arrowSize);
  ctx.stroke();
  
  // Dimension text with background
  const widthText = `${dimensions.width}'`;
  const textMetrics = ctx.measureText(widthText);
  const padding = 4;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    -textMetrics.width/2 - padding,
    widthY + 5,
    textMetrics.width + padding * 2,
    16
  );
  
  ctx.fillStyle = '#000000';
  ctx.fillText(widthText, 0, widthY + 15);
  
  // Length dimension with improved arrows
  const lengthX = width/2 + 20;
  ctx.save();
  ctx.translate(lengthX, 0);
  ctx.rotate(Math.PI/2);
  
  ctx.beginPath();
  ctx.moveTo(-length/2, 0);
  ctx.lineTo(length/2, 0);
  ctx.stroke();
  
  // Arrow heads
  ctx.beginPath();
  ctx.moveTo(-length/2 - arrowSize, -arrowSize);
  ctx.lineTo(-length/2, 0);
  ctx.lineTo(-length/2 - arrowSize, arrowSize);
  ctx.moveTo(length/2 + arrowSize, -arrowSize);
  ctx.lineTo(length/2, 0);
  ctx.lineTo(length/2 + arrowSize, arrowSize);
  ctx.stroke();
  
  // Dimension text with background
  const lengthText = `${dimensions.length}'`;
  const lengthMetrics = ctx.measureText(lengthText);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    -lengthMetrics.width/2 - padding,
    5,
    lengthMetrics.width + padding * 2,
    16
  );
  
  ctx.fillStyle = '#000000';
  ctx.fillText(lengthText, 0, 15);
  
  ctx.restore();
};

const drawFrontElevation = (ctx: CanvasRenderingContext2D, dimensions: BuildingDimensions, features: WallFeature[]) => {
  // Calculate scale to fit the drawing
  const maxDimension = Math.max(dimensions.width, dimensions.height + (dimensions.width/2) * (dimensions.roofPitch/12));
  const scale = Math.min((CANVAS_WIDTH - 100) / maxDimension, (CANVAS_HEIGHT - 100) / maxDimension);
  
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;
  const roofHeight = (dimensions.width / 2) * (dimensions.roofPitch / 12) * scale;
  
  // Clear and set background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-CANVAS_WIDTH/2, -CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw grid with improved visibility
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 0.5;
  const gridSpacing = 20;
  
  for (let x = -width/2; x <= width/2; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, -(height + roofHeight));
    ctx.stroke();
  }
  
  for (let y = 0; y >= -(height + roofHeight); y -= gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(-width/2, y);
    ctx.lineTo(width/2, y);
    ctx.stroke();
  }
  
  // Draw walls and roof with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = '#1F2937';
  ctx.fillStyle = '#F3F4F6';
  ctx.lineWidth = 2;
  
  // Main wall
  ctx.beginPath();
  ctx.moveTo(-width/2, 0);
  ctx.lineTo(-width/2, -height);
  ctx.lineTo(0, -(height + roofHeight));
  ctx.lineTo(width/2, -height);
  ctx.lineTo(width/2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Reset shadow for features
  ctx.shadowColor = 'transparent';
  
  // Draw features with improved visibility
  features.filter(f => f.position.wallPosition === 'front').forEach(feature => {
    const featureWidth = feature.width * scale;
    const featureHeight = feature.height * scale;
    let x = (feature.position.alignment === 'left')
      ? -width/2 + feature.position.xOffset * scale
      : (feature.position.alignment === 'right')
        ? width/2 - (feature.position.xOffset * scale) - featureWidth
        : -featureWidth/2 + (feature.position.xOffset * scale);
    let y = -(feature.position.yOffset * scale + featureHeight);
    
    // Draw feature with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(x, y, featureWidth, featureHeight);
    
    // Add feature label
    ctx.shadowColor = 'transparent';
    ctx.font = '8px Arial';
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${feature.type} (${feature.width}'×${feature.height}')`,
      x + featureWidth/2,
      y + featureHeight/2
    );
  });
  
  // Draw dimensions with improved visibility
  const drawDimensionLine = (
    start: [number, number],
    end: [number, number],
    text: string,
    offset: number = 10
  ) => {
    const arrowSize = 6;
    const padding = 4; // Define padding here within the function scope
    
    // Draw dimension line
    ctx.beginPath();
    ctx.moveTo(...start);
    ctx.lineTo(...end);
    ctx.stroke();
    
    // Draw arrow heads
    ctx.beginPath();
    ctx.moveTo(start[0] - arrowSize, start[1] - arrowSize);
    ctx.lineTo(start[0], start[1]);
    ctx.lineTo(start[0] - arrowSize, start[1] + arrowSize);
    ctx.moveTo(end[0] + arrowSize, end[1] - arrowSize);
    ctx.lineTo(end[0], end[1]);
    ctx.lineTo(end[0] + arrowSize, end[1] + arrowSize);
    ctx.stroke();
    
    // Draw text with background
    const textMetrics = ctx.measureText(text);
    const textX = (start[0] + end[0]) / 2;
    const textY = start[1] + offset;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(
      textX - textMetrics.width/2 - padding,
      textY - 8,
      textMetrics.width + padding * 2,
      16
    );
    
    ctx.fillStyle = '#000000';
    ctx.fillText(text, textX, textY);
  };
  
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  
  // Width dimension
  drawDimensionLine(
    [-width/2, 20],
    [width/2, 20],
    `${dimensions.width}'`
  );
  
  // Height dimension
  drawDimensionLine(
    [width/2 + 20, 0],
    [width/2 + 20, -height],
    `${dimensions.height}'`,
    15
  );
  
  // Total height dimension
  drawDimensionLine(
    [width/2 + 40, 0],
    [width/2 + 40, -(height + roofHeight)],
    `${(dimensions.height + (dimensions.width/2) * (dimensions.roofPitch/12)).toFixed(1)}'`,
    15
  );
  
  // Roof pitch label with improved visibility
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = '#1F2937';
  const pitchText = `${dimensions.roofPitch}:12 pitch`;
  const pitchMetrics = ctx.measureText(pitchText);
  const padding = 4; // Define padding here for the roof pitch label
  
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    -pitchMetrics.width/2 - padding,
    -(height + roofHeight/2) - 8,
    pitchMetrics.width + padding * 2,
    16
  );
  
  ctx.fillStyle = '#1F2937';
  ctx.fillText(
    pitchText,
    0,
    -(height + roofHeight/2)
  );
};

const drawSideElevation = (ctx: CanvasRenderingContext2D, dimensions: BuildingDimensions, features: WallFeature[]) => {
  // Calculate scale to fit the drawing
  const maxDimension = Math.max(dimensions.length, dimensions.height + (dimensions.width/2) * (dimensions.roofPitch/12));
  const scale = Math.min((CANVAS_WIDTH - 100) / maxDimension, (CANVAS_HEIGHT - 100) / maxDimension);
  
  const length = dimensions.length * scale;
  const height = dimensions.height * scale;
  const roofHeight = (dimensions.width / 2) * (dimensions.roofPitch / 12) * scale;
  
  // Clear and set background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(-CANVAS_WIDTH/2, -CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw grid
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 0.5;
  const gridSpacing = 20;
  
  for (let x = -length/2; x <= length/2; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, -(height + roofHeight));
    ctx.stroke();
  }
  
  for (let y = 0; y >= -(height + roofHeight); y -= gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(-length/2, y);
    ctx.lineTo(length/2, y);
    ctx.stroke();
  }
  
  // Draw walls and roof
  ctx.strokeStyle = '#1F2937';
  ctx.fillStyle = '#F3F4F6';
  ctx.lineWidth = 2;
  
  // Main wall
  ctx.beginPath();
  ctx.moveTo(-length/2, 0);
  ctx.lineTo(-length/2, -height);
  ctx.lineTo(-length/2, -(height + roofHeight));
  ctx.lineTo(length/2, -(height + roofHeight));
  ctx.lineTo(length/2, -height);
  ctx.lineTo(length/2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Draw features
  features.filter(f => f.position.wallPosition === 'left').forEach(feature => {
    const featureWidth = feature.width * scale;
    const featureHeight = feature.height * scale;
    let x = (feature.position.alignment === 'left')
      ? -length/2 + feature.position.xOffset * scale
      : (feature.position.alignment === 'right')
        ? length/2 - (feature.position.xOffset * scale) - featureWidth
        : -featureWidth/2 + (feature.position.xOffset * scale);
    let y = -(feature.position.yOffset * scale + featureHeight);
    
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(x, y, featureWidth, featureHeight);
  });
  
  // Draw dimensions
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  
  // Length dimension
  const lengthY = 20;
  ctx.beginPath();
  ctx.moveTo(-length/2, lengthY);
  ctx.lineTo(length/2, lengthY);
  ctx.stroke();
  ctx.fillText(`${dimensions.length}'`, 0, lengthY + 15);
  
  // Height dimension
  const heightX = length/2 + 20;
  ctx.beginPath();
  ctx.moveTo(heightX, 0);
  ctx.lineTo(heightX, -height);
  ctx.stroke();
  ctx.fillText(`${dimensions.height}'`, heightX + 15, -height/2);
  
  // Total height dimension
  const totalHeightX = length/2 + 40;
  ctx.beginPath();
  ctx.moveTo(totalHeightX, 0);
  ctx.lineTo(totalHeightX, -(height + roofHeight));
  ctx.stroke();
  ctx.fillText(`${(dimensions.height + (dimensions.width/2) * (dimensions.roofPitch/12)).toFixed(1)}'`, 
    totalHeightX + 15, -(height + roofHeight)/2);
};

const createDrawing = (drawFn: (ctx: CanvasRenderingContext2D) => void): string => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Set up coordinate system
  ctx.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  
  // Draw
  drawFn(ctx);
  
  return canvas.toDataURL('image/png');
};

export const exportTechnicalDrawings = (dimensions: BuildingDimensions, features: WallFeature[]) => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [800, 600]
  });
  
  // Add title and border
  pdf.setFillColor(255, 255, 255);
  pdf.rect(20, 20, 760, 560, 'F');
  pdf.setDrawColor(0);
  pdf.setLineWidth(1);
  pdf.rect(20, 20, 760, 560, 'S');
  
  pdf.setFontSize(16);
  pdf.text('Barn Technical Drawings', 400, 40, { align: 'center' });
  
  // Floor Plan (top left)
  const floorPlan = createDrawing((ctx) => drawFloorPlan(ctx, dimensions, features));
  pdf.addImage(floorPlan, 'PNG', 40, 60, CANVAS_WIDTH, CANVAS_HEIGHT);
  pdf.setFontSize(12);
  pdf.text('Floor Plan', 190, 320);
  
  // Front Elevation (top right)
  const frontElevation = createDrawing((ctx) => drawFrontElevation(ctx, dimensions, features));
  pdf.addImage(frontElevation, 'PNG', 460, 60, CANVAS_WIDTH, CANVAS_HEIGHT);
  pdf.text('Front Elevation', 610, 320);
  
  // Side Elevation (bottom left)
  const sideElevation = createDrawing((ctx) => drawSideElevation(ctx, dimensions, features));
  pdf.addImage(sideElevation, 'PNG', 40, 340, CANVAS_WIDTH, CANVAS_HEIGHT);
  pdf.text('Side Elevation', 190, 540);
  
  // Add specifications table (bottom right)
  pdf.setFontSize(14);
  pdf.text('Building Specifications', 460, 360);
  
  pdf.setFontSize(12);
  const specs = [
    ['Width:', `${dimensions.width} ft`],
    ['Length:', `${dimensions.length} ft`],
    ['Wall Height:', `${dimensions.height} ft`],
    ['Roof Pitch:', `${dimensions.roofPitch}:12`],
    ['Peak Height:', `${(dimensions.height + (dimensions.width/2) * (dimensions.roofPitch/12)).toFixed(1)} ft`],
    ['Floor Area:', `${dimensions.width * dimensions.length} sq ft`]
  ];
  
  specs.forEach((spec, i) => {
    pdf.text(spec[0], 480, 390 + (i * 25));
    pdf.text(spec[1], 580, 390 + (i * 25));
  });
  
  // Add footer
  const today = new Date();
  pdf.setFontSize(10);
  pdf.text(`Generated on ${today.toLocaleDateString()}`, 400, 565, { align: 'center' });
  
  pdf.save('barn-technical-drawings.pdf');
};
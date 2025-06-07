import React, { useRef, useEffect, useState } from 'react';
import { useBuildingStore } from '../store/buildingStore';
import type { WallFeature } from '../types';

const FloorPlan: React.FC = () => {
  const { dimensions, features, color } = useBuildingStore((state) => state.currentProject.building);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(20); // pixels per foot
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const width = dimensions.width * scale;
  const length = dimensions.length * scale;
  const margin = 120; // Increased margin for better label spacing
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      setScale(prevScale => {
        const newScale = prevScale * (1 + delta * 0.001);
        return Math.min(Math.max(newScale, 5), 50);
      });
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const renderFeature = (feature: WallFeature) => {
    const featureWidth = feature.width * scale;
    const featureDepth = 2 * scale;
    let x = 0;
    let y = 0;
    
    switch (feature.position.wallPosition) {
      case 'front':
        x = (feature.position.alignment === 'left')
          ? feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? width - (feature.position.xOffset * scale) - featureWidth
            : (width / 2) - (featureWidth / 2) + (feature.position.xOffset * scale);
        y = length - featureDepth;
        break;
      case 'back':
        x = (feature.position.alignment === 'left')
          ? feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? width - (feature.position.xOffset * scale) - featureWidth
            : (width / 2) - (featureWidth / 2) + (feature.position.xOffset * scale);
        y = 0;
        break;
      case 'left':
        y = (feature.position.alignment === 'left')
          ? feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? length - (feature.position.xOffset * scale) - featureWidth
            : (length / 2) - (featureWidth / 2) + (feature.position.xOffset * scale);
        x = 0;
        break;
      case 'right':
        y = (feature.position.alignment === 'left')
          ? feature.position.xOffset * scale
          : (feature.position.alignment === 'right')
            ? length - (feature.position.xOffset * scale) - featureWidth
            : (length / 2) - (featureWidth / 2) + (feature.position.xOffset * scale);
        x = width - featureDepth;
        break;
    }
    
    const isHorizontal = feature.position.wallPosition === 'front' || feature.position.wallPosition === 'back';
    const featureStyle = {
      position: 'absolute' as const,
      left: `${x}px`,
      top: `${y}px`,
      width: isHorizontal ? `${featureWidth}px` : `${featureDepth}px`,
      height: isHorizontal ? `${featureDepth}px` : `${featureWidth}px`,
      backgroundColor: '#2563eb',
      border: '1px solid #1d4ed8'
    };
    
    return (
      <div
        key={feature.id}
        style={featureStyle}
        className="shadow-sm"
        title={`${feature.type} (${feature.width}'x${feature.height}')`}
      />
    );
  };

  const renderDimensionLine = (start: number, length: number, isHorizontal: boolean) => {
    const style = {
      position: 'absolute' as const,
      backgroundColor: '#1f2937',
      [isHorizontal ? 'width' : 'height']: `${length}px`,
      [isHorizontal ? 'height' : 'width']: '2px',
      left: isHorizontal ? `${start}px` : undefined,
      top: !isHorizontal ? `${start}px` : undefined,
    };

    const markerStyle = {
      position: 'absolute' as const,
      width: '8px',
      height: '8px',
      backgroundColor: '#1f2937',
      transform: 'rotate(45deg)',
    };

    return (
      <div style={style}>
        <div style={{ ...markerStyle, left: '-3px', top: '-3px' }} />
        <div style={{ ...markerStyle, right: '-3px', bottom: '-3px' }} />
      </div>
    );
  };

  const renderWallLabel = (text: string, position: 'top' | 'bottom' | 'left' | 'right') => {
    const baseStyle = {
      position: 'absolute' as const,
      backgroundColor: '#f3f4f6',
      padding: '4px 12px',
      borderRadius: '4px',
      fontWeight: 500,
      color: '#1f2937',
      border: '1px solid #e5e7eb',
      fontSize: '0.875rem',
      letterSpacing: '0.05em',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    };

    const positionStyles = {
      top: {
        left: '60px',
        width: `${width}px`,
        textAlign: 'center' as const,
        top: '10px',
      },
      bottom: {
        left: '60px',
        width: `${width}px`,
        textAlign: 'center' as const,
        bottom: '10px',
      },
      left: {
        left: '10px',
        top: '60px',
        height: `${length}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        writingMode: 'vertical-rl' as const,
        transform: 'rotate(180deg)',
      },
      right: {
        right: '10px',
        top: '60px',
        height: `${length}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        writingMode: 'vertical-rl' as const,
      },
    };

    return (
      <div style={{ ...baseStyle, ...positionStyles[position] }}>
        {text}
      </div>
    );
  };
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gray-100 cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: `${width + margin}px`,
          height: `${length + margin}px`,
          margin: '2rem auto'
        }}
      >
        {/* Main building outline */}
        <div 
          className="absolute"
          style={{ 
            left: '60px',
            top: '60px',
            width: `${width}px`,
            height: `${length}px`,
            border: '8px solid #1f2937',
            backgroundColor: color
          }}
        >
          {features.map(renderFeature)}
        </div>

        {/* Dimension lines */}
        <div className="absolute" style={{ left: '60px', top: '20px' }}>
          {renderDimensionLine(0, width, true)}
          <div 
            className="absolute bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200"
            style={{ 
              width: 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
              top: '-30px',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#1f2937'
            }}
          >
            {dimensions.width} ft
          </div>
        </div>

        <div className="absolute" style={{ left: '20px', top: '60px' }}>
          {renderDimensionLine(0, length, false)}
          <div 
            className="absolute bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200"
            style={{ 
              transform: 'rotate(-90deg) translateX(-50%)',
              transformOrigin: '0 0',
              left: '-30px',
              top: '50%',
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#1f2937'
            }}
          >
            {dimensions.length} ft
          </div>
        </div>

        {/* Wall labels */}
        {renderWallLabel('BACK', 'top')}
        {renderWallLabel('FRONT', 'bottom')}
        {renderWallLabel('LEFT', 'left')}
        {renderWallLabel('RIGHT', 'right')}
      </div>
    </div>
  );
};

export default FloorPlan;
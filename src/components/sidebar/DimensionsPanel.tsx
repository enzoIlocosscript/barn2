import React from 'react';
import { motion } from 'framer-motion';
import { useBuildingStore } from '../../store/buildingStore';

const DimensionsPanel: React.FC = () => {
  const { dimensions, updateDimensions } = useBuildingStore((state) => ({
    dimensions: state.currentProject.building.dimensions,
    updateDimensions: state.updateDimensions
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, dimension: keyof typeof dimensions) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateDimensions({ [dimension]: value });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-4">
        <label htmlFor="width" className="form-label">Width (ft)</label>
        <div className="flex items-center">
          <input
            type="range"
            id="width-range"
            min="10"
            max="60"
            step="1"
            value={dimensions.width}
            onChange={(e) => handleChange(e, 'width')}
            className="flex-1 mr-3"
          />
          <input
            type="number"
            id="width"
            min="10"
            max="60"
            value={dimensions.width}
            onChange={(e) => handleChange(e, 'width')}
            className="w-20 form-input"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="length" className="form-label">Length (ft)</label>
        <div className="flex items-center">
          <input
            type="range"
            id="length-range"
            min="10"
            max="100"
            step="1"
            value={dimensions.length}
            onChange={(e) => handleChange(e, 'length')}
            className="flex-1 mr-3"
          />
          <input
            type="number"
            id="length"
            min="10"
            max="100"
            value={dimensions.length}
            onChange={(e) => handleChange(e, 'length')}
            className="w-20 form-input"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="height" className="form-label">Wall Height (ft)</label>
        <div className="flex items-center">
          <input
            type="range"
            id="height-range"
            min="8"
            max="20"
            step="1"
            value={dimensions.height}
            onChange={(e) => handleChange(e, 'height')}
            className="flex-1 mr-3"
          />
          <input
            type="number"
            id="height"
            min="8"
            max="20"
            value={dimensions.height}
            onChange={(e) => handleChange(e, 'height')}
            className="w-20 form-input"
          />
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
        <p className="text-sm text-blue-800">
          Building footprint: {dimensions.width} x {dimensions.length} ft
          <br />
          Total area: {dimensions.width * dimensions.length} sq ft
        </p>
      </div>
    </motion.div>
  );
};

export default DimensionsPanel;
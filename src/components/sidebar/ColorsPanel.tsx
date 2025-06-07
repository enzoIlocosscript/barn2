import React from 'react';
import { motion } from 'framer-motion';
import { useBuildingStore } from '../../store/buildingStore';

const colorOptions = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#E5E7EB' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Desert Tan', value: '#E7D3AD' },
  { name: 'Forest Green', value: '#2D6A4F' },
  { name: 'Barn Red', value: '#9B2226' },
  { name: 'Navy Blue', value: '#1E3A8A' },
  { name: 'Black', value: '#1F2937' },
];

const roofColorOptions = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Medium Gray', value: '#9CA3AF' },
  { name: 'Dark Gray', value: '#4B5563' },
  { name: 'Brown', value: '#7C3AED' },
  { name: 'Black', value: '#1F2937' },
  { name: 'Green', value: '#059669' },
  { name: 'Red', value: '#B91C1C' },
];

const ColorsPanel: React.FC = () => {
  const { color, roofColor, setColor, setRoofColor } = useBuildingStore((state) => ({
    color: state.currentProject.building.color,
    roofColor: state.currentProject.building.roofColor,
    setColor: state.setColor,
    setRoofColor: state.setRoofColor
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-4">
        <label className="form-label">Exterior Color</label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              className={`h-8 rounded overflow-hidden border-2 ${
                color === option.value ? 'border-primary' : 'border-gray-200'
              }`}
              style={{ backgroundColor: option.value }}
              onClick={() => setColor(option.value)}
              title={option.name}
            />
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="form-label">Roof Color</label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {roofColorOptions.map((option) => (
            <button
              key={option.value}
              className={`h-8 rounded overflow-hidden border-2 ${
                roofColor === option.value ? 'border-primary' : 'border-gray-200'
              }`}
              style={{ backgroundColor: option.value }}
              onClick={() => setRoofColor(option.value)}
              title={option.name}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Material Options</h3>
        
        <div className="mb-3">
          <label htmlFor="exteriorMaterial" className="text-xs text-gray-600 block mb-1">Exterior Material</label>
          <select
            id="exteriorMaterial"
            className="form-input text-sm"
            defaultValue="metal"
          >
            <option value="metal">Metal Siding</option>
            <option value="vinyl">Vinyl Siding</option>
            <option value="wood">Wood Siding</option>
            <option value="brick">Brick</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="roofMaterial" className="text-xs text-gray-600 block mb-1">Roof Material</label>
          <select
            id="roofMaterial"
            className="form-input text-sm"
            defaultValue="metal"
          >
            <option value="metal">Metal</option>
            <option value="shingle">Asphalt Shingles</option>
            <option value="tile">Concrete Tiles</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default ColorsPanel;
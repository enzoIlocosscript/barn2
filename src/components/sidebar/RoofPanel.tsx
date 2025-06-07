import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useBuildingStore } from '../../store/buildingStore';
import type { Skylight } from '../../types';

const RoofPanel: React.FC = () => {
  const { dimensions, skylights, updateDimensions, addSkylight, removeSkylight } = useBuildingStore((state) => ({
    dimensions: state.currentProject.building.dimensions,
    skylights: state.currentProject.building.skylights,
    updateDimensions: state.updateDimensions,
    addSkylight: state.addSkylight,
    removeSkylight: state.removeSkylight
  }));

  const [newSkylight, setNewSkylight] = useState<Skylight>({
    width: 4,
    length: 4,
    xOffset: 0,
    yOffset: 0
  });

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateDimensions({ roofPitch: value });
    }
  };

  const handleAddSkylight = () => {
    addSkylight(newSkylight);
    setNewSkylight({ width: 4, length: 4, xOffset: 0, yOffset: 0 });
  };

  // Calculate roof rise based on pitch
  const roofRise = (dimensions.width / 2) * (dimensions.roofPitch / 12);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-4">
        <label htmlFor="roofPitch" className="form-label">Roof Pitch (rise:12)</label>
        <div className="flex items-center">
          <input
            type="range"
            id="roofPitch-range"
            min="1"
            max="12"
            step="0.5"
            value={dimensions.roofPitch}
            onChange={handlePitchChange}
            className="flex-1 mr-3"
          />
          <input
            type="number"
            id="roofPitch"
            min="1"
            max="12"
            step="0.5"
            value={dimensions.roofPitch}
            onChange={handlePitchChange}
            className="w-20 form-input"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {dimensions.roofPitch}:12 pitch ({dimensions.roofPitch} inches of rise per 12 inches of run)
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Skylights</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Width (ft)</label>
              <input
                type="number"
                className="form-input"
                min="2"
                max="8"
                step="0.5"
                value={newSkylight.width}
                onChange={(e) => setNewSkylight({ ...newSkylight, width: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label">Length (ft)</label>
              <input
                type="number"
                className="form-input"
                min="2"
                max="8"
                step="0.5"
                value={newSkylight.length}
                onChange={(e) => setNewSkylight({ ...newSkylight, length: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Left/Right (ft)</label>
              <input
                type="number"
                className="form-input"
                min={-dimensions.width/2 + newSkylight.width}
                max={dimensions.width/2 - newSkylight.width}
                step="0.5"
                value={newSkylight.xOffset}
                onChange={(e) => setNewSkylight({ ...newSkylight, xOffset: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label">Up/Down (ft)</label>
              <input
                type="number"
                className="form-input"
                min={0}
                max={dimensions.length/2 - newSkylight.length}
                step="0.5"
                value={newSkylight.yOffset}
                onChange={(e) => setNewSkylight({ ...newSkylight, yOffset: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          
          <button
            className="w-full btn"
            onClick={handleAddSkylight}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Skylight
          </button>
        </div>

        {skylights.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Skylights</h4>
            <div className="space-y-2">
              {skylights.map((skylight, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {skylight.width}' × {skylight.length}'
                    </p>
                    <p className="text-xs text-gray-500">
                      Offset: {skylight.xOffset}'L/R, {skylight.yOffset}'U/D
                    </p>
                  </div>
                  <button
                    className="p-1 text-gray-400 hover:text-error rounded-full hover:bg-gray-100"
                    onClick={() => removeSkylight(index)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RoofPanel;
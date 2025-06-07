import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Move, Edit2 } from 'lucide-react';
import { useBuildingStore } from '../../store/buildingStore';
import type { FeatureType, WallPosition } from '../../types';

const WallFeaturesPanel: React.FC = () => {
  const { features, addFeature, removeFeature, updateFeature } = useBuildingStore((state) => ({
    features: state.currentProject.building.features,
    addFeature: state.addFeature,
    removeFeature: state.removeFeature,
    updateFeature: state.updateFeature
  }));
  
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState({
    type: 'door' as FeatureType,
    width: 3,
    height: 7,
    wallPosition: 'front' as WallPosition,
    xOffset: 0,
    alignment: 'center' as 'left' | 'center' | 'right',
    yOffset: 0
  });
  
  const handleAddFeature = () => {
    addFeature({
      type: newFeature.type,
      width: newFeature.width,
      height: newFeature.height,
      position: {
        wallPosition: newFeature.wallPosition,
        xOffset: newFeature.xOffset,
        yOffset: newFeature.yOffset,
        alignment: newFeature.alignment
      }
    });
    
    setNewFeature({
      ...newFeature,
      xOffset: 0,
      yOffset: 0
    });
  };

  const handleUpdateFeature = (id: string) => {
    const feature = features.find(f => f.id === id);
    if (!feature) return;

    updateFeature(id, {
      type: newFeature.type,
      width: newFeature.width,
      height: newFeature.height,
      position: {
        wallPosition: newFeature.wallPosition,
        xOffset: newFeature.xOffset,
        yOffset: newFeature.yOffset,
        alignment: newFeature.alignment
      }
    });
    setEditingFeature(null);
  };

  const startEditing = (id: string) => {
    const feature = features.find(f => f.id === id);
    if (!feature) return;

    setNewFeature({
      type: feature.type,
      width: feature.width,
      height: feature.height,
      wallPosition: feature.position.wallPosition,
      xOffset: feature.position.xOffset,
      yOffset: feature.position.yOffset,
      alignment: feature.position.alignment
    });
    setEditingFeature(id);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="featureType" className="form-label">Feature Type</label>
        <select
          id="featureType"
          className="form-input"
          value={newFeature.type}
          onChange={(e) => setNewFeature({ ...newFeature, type: e.target.value as FeatureType })}
        >
          <option value="door">Standard Door</option>
          <option value="window">Window</option>
          <option value="rollupDoor">Roll-up Door</option>
          <option value="walkDoor">Walk Door</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="featureWidth" className="form-label">Width (ft)</label>
          <input
            type="number"
            id="featureWidth"
            className="form-input"
            min="1"
            max="20"
            step="0.5"
            value={newFeature.width}
            onChange={(e) => setNewFeature({ ...newFeature, width: parseFloat(e.target.value) })}
          />
        </div>
        
        <div>
          <label htmlFor="featureHeight" className="form-label">Height (ft)</label>
          <input
            type="number"
            id="featureHeight"
            className="form-input"
            min="1"
            max="10"
            step="0.5"
            value={newFeature.height}
            onChange={(e) => setNewFeature({ ...newFeature, height: parseFloat(e.target.value) })}
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="wallPosition" className="form-label">Wall</label>
        <select
          id="wallPosition"
          className="form-input"
          value={newFeature.wallPosition}
          onChange={(e) => setNewFeature({ ...newFeature, wallPosition: e.target.value as WallPosition })}
        >
          <option value="front">Front</option>
          <option value="back">Back</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="alignment" className="form-label">Alignment</label>
        <select
          id="alignment"
          className="form-input"
          value={newFeature.alignment}
          onChange={(e) => setNewFeature({ ...newFeature, alignment: e.target.value as 'left' | 'center' | 'right' })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="xOffset" className="form-label">Position Offset (ft)</label>
        <input
          type="number"
          id="xOffset"
          className="form-input"
          min="0"
          step="0.5"
          value={newFeature.xOffset}
          onChange={(e) => setNewFeature({ ...newFeature, xOffset: parseFloat(e.target.value) })}
        />
      </div>
      
      <div>
        <label htmlFor="yOffset" className="form-label">Height From Bottom (ft)</label>
        <input
          type="number"
          id="yOffset"
          className="form-input"
          min="0"
          step="0.5"
          value={newFeature.yOffset}
          onChange={(e) => setNewFeature({ ...newFeature, yOffset: parseFloat(e.target.value) })}
        />
      </div>
      
      <button
        className="w-full btn"
        onClick={editingFeature ? () => handleUpdateFeature(editingFeature) : handleAddFeature}
      >
        {editingFeature ? (
          <>
            <Edit2 className="w-4 h-4 mr-1" />
            Update Feature
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-1" />
            Add Feature
          </>
        )}
      </button>
      
      {features.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Features</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {features.map((feature) => (
              <div 
                key={feature.id} 
                className={`flex items-center justify-between p-2 rounded border ${
                  editingFeature === feature.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <Move className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {feature.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      {feature.position.wallPosition} wall, {feature.width}x{feature.height}ft
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className={`p-1 rounded-full hover:bg-gray-100 ${
                      editingFeature === feature.id ? 'text-blue-500' : 'text-gray-400'
                    }`}
                    onClick={() => {
                      if (editingFeature === feature.id) {
                        setEditingFeature(null);
                      } else {
                        startEditing(feature.id);
                      }
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-error rounded-full hover:bg-gray-100"
                    onClick={() => removeFeature(feature.id)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WallFeaturesPanel;
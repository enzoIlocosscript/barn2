import React from 'react';
import { motion } from 'framer-motion';
import { Cuboid as Cube, Grid, Grid2X2, Plus, Minus, Download, Image } from 'lucide-react';
import { useBuildingStore } from '../store/buildingStore';
import type { ViewMode } from '../types';

const ViewControls: React.FC = () => {
  const { currentView, setCurrentView } = useBuildingStore();
  
  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
  };

  return (
    <>
      {/* View type controls */}
      <motion.div 
        className="absolute top-4 right-4 bg-white rounded-md shadow-control overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col">
          <button
            className={`p-3 flex justify-center items-center ${currentView === '3d' ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => handleViewChange('3d')}
            title="3D View"
          >
            <Cube className="w-5 h-5" />
          </button>
          
          <button
            className={`p-3 flex justify-center items-center ${currentView === 'plan' ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => handleViewChange('plan')}
            title="Plan View"
          >
            <Grid className="w-5 h-5" />
          </button>
          
          <button
            className={`p-3 flex justify-center items-center ${currentView === 'floor' ? 'bg-gray-100 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => handleViewChange('floor')}
            title="Floor View"
          >
            <Grid2X2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
      
      {/* Screenshot/Export */}
      <motion.div 
        className="absolute bottom-4 left-4 bg-white rounded-md shadow-control"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex">
          <button
            className="p-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            title="Save Image"
          >
            <Image className="w-5 h-5" />
          </button>
          
          <div className="border-l border-gray-200"></div>
          
          <button
            className="p-3 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            title="Export Model"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default ViewControls;
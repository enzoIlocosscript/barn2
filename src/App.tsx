import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ViewControls from './components/ViewControls';
import Canvas3D from './components/Canvas3D';
import { useBuildingStore } from './store/buildingStore';

function App() {
  const currentView = useBuildingStore((state) => state.currentView);
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Toolbar />
        
        <motion.div 
          className="flex-1 relative bg-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          <Canvas3D view={currentView} />
          <ViewControls />
        </motion.div>
      </main>
    </div>
  );
}

export default App;
// Building dimensions and properties
export interface BuildingDimensions {
  width: number;
  length: number;
  height: number;
  roofPitch: number; // in degrees
}

// Wall feature types
export type FeatureType = 'door' | 'window' | 'rollupDoor' | 'walkDoor';

// Wall positions
export type WallPosition = 'front' | 'back' | 'left' | 'right';

// Feature positioning
export interface FeaturePosition {
  wallPosition: WallPosition;
  xOffset: number;  // Distance from left edge of wall
  yOffset: number;  // Distance from bottom of wall
  alignment: 'left' | 'center' | 'right';
}

// Wall feature (door, window, etc.)
export interface WallFeature {
  id: string;
  type: FeatureType;
  width: number;
  height: number;
  position: FeaturePosition;
  color?: string;
}

// Skylight feature
export interface Skylight {
  width: number;
  length: number;
  xOffset: number; // Distance from center
  yOffset: number; // Distance from ridge
}

// View modes
export type ViewMode = '3d' | 'plan' | 'floor';

// Building state
export interface Building {
  dimensions: BuildingDimensions;
  features: WallFeature[];
  skylights: Skylight[];
  color: string;
  roofColor: string;
}

// Project info
export interface Project {
  id: string;
  name: string;
  created: Date;
  lastModified: Date;
  building: Building;
}

// Collision detection utilities
export interface CollisionBounds {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

export interface BeamCollisionData {
  x: number;
  width: number;
  height: number;
  bounds: CollisionBounds;
}

// Beam segment for split beams
export interface BeamSegment {
  x: number;
  bottomY: number;
  topY: number;
  width: number;
}

// Store state
export interface BuildingStore {
  currentProject: Project;
  savedProjects: Project[];
  currentView: ViewMode;
  
  // Actions
  updateDimensions: (dimensions: Partial<BuildingDimensions>) => void;
  addFeature: (feature: Omit<WallFeature, 'id'>) => void;
  removeFeature: (id: string) => void;
  updateFeature: (id: string, updates: Partial<Omit<WallFeature, 'id'>>) => void;
  addSkylight: (skylight: Skylight) => void;
  removeSkylight: (index: number) => void;
  setColor: (color: string) => void;
  setRoofColor: (color: string) => void;
  setCurrentView: (view: ViewMode) => void;
  saveProject: () => void;
  loadProject: (id: string) => void;
  createNewProject: (name?: string) => void;
}
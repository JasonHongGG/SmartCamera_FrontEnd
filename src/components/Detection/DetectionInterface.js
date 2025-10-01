import React from 'react';
import MotionDetection from './MotionDetection';
import FaceDetection from './FaceDetection';
import CrosslineDetection from './CrosslineDetection';
import PipelineDetection from './PipelineDetection';

const DetectionInterface = () => {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100"
      style={{ 
        scrollBehavior: 'smooth',
        overflowAnchor: 'none' // 防止自動滾動錨點
      }}
    >
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-12">
          <MotionDetection />
          <FaceDetection />
          <CrosslineDetection />
          <PipelineDetection />
        </div>
      </div>
    </div>
  );
};

export default DetectionInterface;
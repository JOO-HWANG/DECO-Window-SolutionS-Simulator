
import React from 'react';

interface LoaderProps {
  text: string;
}

const Loader: React.FC<LoaderProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 bg-opacity-75 rounded-lg">
      <div className="w-12 h-12 border-4 border-t-transparent border-blue-400 border-solid rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-white">{text}</p>
    </div>
  );
};

export default Loader;

import React from 'react';
import { Loader } from '../components/Loader';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <Loader label="Concord Pipeline Initializing..." />
    </div>
  );
}

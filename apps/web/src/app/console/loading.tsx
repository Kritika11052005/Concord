import React from 'react';
import { Loader } from '../../components/Loader';

export default function ConsoleLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Loader label="Streaming Merchant Ops Telemetry..." />
    </div>
  );
}

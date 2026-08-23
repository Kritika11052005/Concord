import React from 'react';
import { Loader } from '../../components/Loader';

export default function ShopLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <Loader label="Loading Demo Store Catalog..." />
    </div>
  );
}

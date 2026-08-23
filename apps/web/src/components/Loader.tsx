'use client';

import React from 'react';

interface LoaderProps {
  label?: string;
  color?: string;
}

export function Loader({ label = 'Verifying & Loading...', color = '#c81b1c' }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[220px] w-full select-none">
      <div className="concord-bouncing-loader">
        <style jsx>{`
          .concord-bouncing-loader {
            position: relative;
            width: 120px;
            height: 90px;
            margin: 0 auto;
          }

          .concord-bouncing-loader:before {
            content: '';
            position: absolute;
            bottom: 30px;
            left: 50px;
            height: 30px;
            width: 30px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 16px ${color}80;
            animation: concord-loading-bounce 0.5s ease-in-out infinite alternate;
          }

          .concord-bouncing-loader:after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            height: 7px;
            width: 45px;
            border-radius: 4px;
            box-shadow: 0 5px 0 #f2f2f2, -35px 50px 0 #f2f2f2, -70px 95px 0 #f2f2f2;
            animation: concord-loading-step 1s ease-in-out infinite;
          }

          @keyframes concord-loading-bounce {
            0% {
              transform: scale(1, 0.7);
            }
            40% {
              transform: scale(0.8, 1.2);
            }
            60% {
              transform: scale(1, 1);
            }
            100% {
              bottom: 140px;
            }
          }

          @keyframes concord-loading-step {
            0% {
              box-shadow: 0 10px 0 rgba(0, 0, 0, 0),
                0 10px 0 #f2f2f2,
                -35px 50px 0 #f2f2f2,
                -70px 90px 0 #f2f2f2;
            }
            100% {
              box-shadow: 0 10px 0 #f2f2f2,
                -35px 50px 0 #f2f2f2,
                -70px 90px 0 #f2f2f2,
                -70px 90px 0 rgba(0, 0, 0, 0);
            }
          }
        `}</style>
      </div>
      {label && (
        <div className="mt-8 text-xs font-mono text-zinc-400 tracking-wider uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#c81b1c] animate-ping inline-block"></span>
          {label}
        </div>
      )}
    </div>
  );
}

export default Loader;

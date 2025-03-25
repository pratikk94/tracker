'use client';

import { Spin } from 'antd';
import { useEffect, useState } from 'react';

export default function Loading() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
    }}>
      <div style={{
        padding: '32px',
        borderRadius: '12px',
        background: '#1f1f1f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        minWidth: '200px',
      }}>
        <Spin size="large" />
        <div style={{ 
          color: '#fff', 
          marginTop: '8px',
          fontSize: '16px',
          fontWeight: 500,
          textAlign: 'center',
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          Loading
          <span style={{ 
            minWidth: '24px', 
            display: 'inline-block',
            textAlign: 'left' 
          }}>
            {dots}
          </span>
        </div>
      </div>
    </div>
  );
} 
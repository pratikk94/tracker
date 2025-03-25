import 'react';

declare module 'react' {
  interface CSSProperties {
    [key: string]: any;
  }
}

declare module 'chart.js';
declare module 'react-chartjs-2';
declare module 'react-beautiful-dnd'; 
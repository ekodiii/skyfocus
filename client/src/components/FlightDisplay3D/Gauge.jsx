import { useEffect, useRef } from 'react';
import { RadialGauge, LinearGauge } from 'canvas-gauges';

export default function Gauge({ value, max, label, type = 'linear' }) {
  const canvasRef = useRef(null);
  const gaugeRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const commonOptions = {
      renderTo: canvasRef.current,
      width: 150,
      height: 150,
      colorPlate: '#222',
      colorMajorTicks: '#f5f5f5',
      colorMinorTicks: '#ddd',
      colorTitle: '#fff',
      colorUnits: '#ccc',
      colorNumbers: '#eee',
      colorNeedle: 'rgba(240, 128, 128, 1)',
      colorNeedleEnd: 'rgba(255, 160, 122, .9)',
      valueBox: false,
      animationRule: 'bounce',
      animationDuration: 500,
      fontValue: 'Led',
      fontNumbers: 'Led',
      fontTitle: 'Led',
      fontUnits: 'Led',
    };

    if (type === 'circular') {
      // Hearing/Compass style
      gaugeRef.current = new RadialGauge({
        ...commonOptions,
        title: label.toUpperCase(),
        minValue: 0,
        maxValue: 360,
        majorTicks: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'],
        minorTicks: 2,
        ticksAngle: 360,
        startAngle: 180,
        strokeTicks: false,
        highlights: false,
        colorPlate: '#333',
        colorMajorTicks: '#FFD700',
        colorMinorTicks: '#B8860B',
        colorNumbers: '#FFD700',
        colorNeedle: '#FFD700',
        colorNeedleEnd: '#B8860B',
        valueBox: false,
        valueInt: 1,
        valueDec: 0,
        borderShadowWidth: 0,
        borders: false,
        needleType: 'line',
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: 'linear',
      }).draw();
    } else {
      // Speed/Altitude style
      gaugeRef.current = new RadialGauge({
        ...commonOptions,
        title: label.toUpperCase(),
        minValue: 0,
        maxValue: max,
        majorTicks: getMajorTicks(max),
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
          { from: max * 0.8, to: max, color: 'rgba(200, 50, 50, .75)' }
        ],
        colorPlate: '#333',
        colorMajorTicks: '#FFD700',
        colorMinorTicks: '#B8860B',
        colorNumbers: '#F0F0F0',
        colorNeedle: '#FFD700',
        colorNeedleEnd: '#B8860B',
        colorTitle: '#FFD700',
        colorUnits: '#B8860B',
        borderShadowWidth: 0,
        borders: false,
        needleType: 'arrow',
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
      }).draw();
    }

    return () => {
      // destroy gauge instance to prevent memory leaks? 
      // canvas-gauges doesn't have a clear destroy method but we should clear references
      // actually re-rendering might be tricky with this lib, but useRef should hold it.
    };
  }, [type, max, label]);

  // Update value
  useEffect(() => {
    if (gaugeRef.current) {
      gaugeRef.current.value = value;
    }
  }, [value]);

  return <canvas ref={canvasRef} className="mx-auto" />;
}

function getMajorTicks(max) {
  const steps = 5; // roughly
  const interval = max / steps;
  const ticks = [];
  for (let i = 0; i <= max; i += interval) {
    ticks.push(Math.round(i).toString());
  }
  return ticks;
}

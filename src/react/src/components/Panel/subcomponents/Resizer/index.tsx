import React, { useState, useEffect } from 'react';

import { Direction } from './constants';
import './styles.css';

const Resizer = ({ onResize }) => {
  const [direction, setDirection] = useState('');
  const [mouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: { movementX: number; movementY: number; }) => {
      if (!direction)
        return;
      const ratio = window.devicePixelRatio
      onResize(direction, e.movementX / ratio, e.movementY / ratio);
    };

    if (mouseDown) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseDown, direction, onResize]);

  useEffect(() => {
    const handleMouseUp = () => setMouseDown(false)

    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (direction: React.SetStateAction<string>) => () => {
    setDirection(direction);
    setMouseDown(true);
  };

  return (
    <>
      <div className="right" onMouseDown={handleMouseDown(Direction.Right)}></div>
    </>
  );
};

export default Resizer;


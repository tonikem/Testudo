import React, { useRef } from 'react';
import Resizer from './subcomponents/Resizer';
import { Direction } from './subcomponents/Resizer/constants';
import './styles.css';


const Panel = ({ children }) => {
  const panelRef = useRef(null);

  const handleDrag = (movementX, movementY) => {
    const panel = panelRef.current;

    if (!panel)
      return;

    const { x, y } = panel.getBoundingClientRect()

    panel.style.left = `${x + movementX}px`
    //panel.style.top = `${y + movementY}px`;
  };

  const handleResize = (direction, movementX, movementY) => {
    const panel = panelRef.current
    
    if (!panel)
      return

    const { width, height, x, y } = panel.getBoundingClientRect()

    const resizeRight = () => {
      
      // Paneelin liikuttelu
      panel.style.width = `${width + movementX}px`

      // Sisäisen laatikon liikuttelu
      document.getElementById('inner-container').style.marginLeft = `${width + movementX}px`

      // Tilan muokkaaminen
      localStorage.setItem("panelWidth", panel.style.width)
    };

    switch (direction) {
      case Direction.Right:
        resizeRight();
        break;

      default:
        break;
      }
  };

  const initialStyle = {
    width: localStorage.getItem("panelWidth")
  }

  return (
    <div id="panel" className="panel prevent-select" style={initialStyle} ref={panelRef}>
      <div className="panel__container">
        <Resizer onResize={handleResize} />
        <div className="panel__content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Panel;


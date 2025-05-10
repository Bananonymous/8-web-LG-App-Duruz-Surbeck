import React from 'react';

const DefaultImage = () => {
  return (
    <svg 
      width="200" 
      height="200" 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="200" height="200" fill="#f0f0f0" />
      <text 
        x="100" 
        y="100" 
        fontFamily="Arial" 
        fontSize="16" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fill="#666"
      >
        Image non disponible
      </text>
      <path 
        d="M60,60 L140,140 M140,60 L60,140" 
        stroke="#999" 
        strokeWidth="2" 
      />
    </svg>
  );
};

export default DefaultImage;

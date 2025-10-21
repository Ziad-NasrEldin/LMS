import React, { useEffect, useState } from 'react';

const WaveBackground = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let animationFrame;
    const animate = () => {
      setOffset(prev => (prev + 0.8) % 360);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

    const generateWavePath = (amplitude = 8, frequency = 0.25, verticalOffset = 60) => {
      let path = `M -200 ${verticalOffset + amplitude * Math.sin((-200 * frequency + offset) * Math.PI / 180)}`;
      
      for (let x = -200; x <= 1200; x += 5) {
        const y = verticalOffset + 
          amplitude * Math.sin((x * frequency + offset) * Math.PI / 180) +
          amplitude * 0.4 * Math.cos((x * frequency * 1.3 + offset * 0.7) * Math.PI / 180);
        path += ` L ${x} ${y}`;
      }
      
      path += ` L 1200 ${verticalOffset + 40} L -200 ${verticalOffset + 40} Z`;
      return path;
    };

    return (
      <div className="absolute w-full h-[30vh]  bottom-[50%] translate-y-[30%] md:translate-y-[55%] z-0">
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 1000 100"
          className="text-primary"
          preserveAspectRatio="none"
        >
         {[
            
            { amp: 7, freq: 0.22, y: 63, stroke: 1.6, opacity: 0.8 },
            { amp: 6.5, freq: 0.25, y: 66, stroke: 1.4, opacity: 0.7 },
            { amp: 6, freq: 0.28, y: 69, stroke: 1.3, opacity: 0.6 },
            { amp: 5.5, freq: 0.32, y: 72, stroke: 1.2, opacity: 0.5 },
            { amp: 5, freq: 0.35, y: 75, stroke: 1.1, opacity: 0.4 },
            { amp: 4.5, freq: 0.38, y: 78, stroke: 1.0, opacity: 0.3 },
            { amp: 4, freq: 0.42, y: 81, stroke: 0.9, opacity: 0.25 },
          ].map((wave, i) => (
            <path
              key={i}
              d={generateWavePath(wave.amp, wave.freq, wave.y)}
              fill="none"
              stroke="currentColor"
              strokeWidth={wave.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={wave.opacity}
              style={{ 
                transform: `translateY(${i * 2}px)`,
                willChange: 'transform'
              }}
            />
          ))}
        </svg>
      </div>

);
};

export default WaveBackground;
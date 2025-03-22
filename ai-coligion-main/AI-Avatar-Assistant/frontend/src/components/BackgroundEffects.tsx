import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface BackgroundEffectsProps {
  particleCount?: number;
  isDarkMode?: boolean;
}

const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  particleCount = 30,
  isDarkMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Set up the canvas and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas properties for better rendering
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: true
    });
    if (!ctx) return;

    // Add this to prevent memory leaks on Vercel deployment
    let isActive = true;

    // Set canvas size to match window
    const resizeCanvas = () => {
      if (!isActive) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize particles
    const initParticles = () => {
      particles.current = [];
      for (let i = 0; i < particleCount; i++) {
        const size = Math.random() * 4 + 1; // Slightly smaller particles
        const particleColors = isDarkMode 
          ? ['#4A5568', '#2D3748', '#1A202C', '#4299E1', '#3182CE'] 
          : ['#EBF4FF', '#C3DAFE', '#A3BFFA', '#7F9CF5', '#667EEA'];
        
        particles.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size,
          speedX: (Math.random() - 0.5) * 0.3, // Slower movement
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.4 + 0.1, // More subtle opacity
          color: particleColors[Math.floor(Math.random() * particleColors.length)]
        });
      }
    };

    // Animation loop
    const animate = () => {
      if (!isActive) return;
      
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particles.current.forEach((p, index) => {
          // Update position
          p.x += p.speedX;
          p.y += p.speedY;

          // Boundary checks with wrap-around
          if (p.x < -p.size) p.x = canvas.width + p.size;
          if (p.x > canvas.width + p.size) p.x = -p.size;
          if (p.y < -p.size) p.y = canvas.height + p.size;
          if (p.y > canvas.height + p.size) p.y = -p.size;

          // Draw particle - using simpler rendering to prevent tainting
          try {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
            ctx.fill();
          } catch (err) {
            // Silent fail for particle drawing
          }

          // Draw connections with reduced frequency to avoid potential canvas issues
          if (index % 3 === 0) { 
            particles.current.slice(index + 1).forEach((p2, i) => {
              if (i % 3 === 0) { 
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 80) { 
                  try {
                    ctx.beginPath();
                    ctx.strokeStyle = isDarkMode 
                      ? `rgba(255, 255, 255, ${0.03 * (1 - distance / 80)})` 
                      : `rgba(0, 0, 0, ${0.03 * (1 - distance / 80)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                  } catch (err) {
                    // Silently catch any potential stroke errors
                  }
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("Canvas error:", error);
        // Don't break the animation loop on error
      }

      if (isActive) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };

    // Set up and start animation
    resizeCanvas();
    initParticles();
    animate();

    // Add listener for window resize
    const handleResize = () => {
      resizeCanvas();
      initParticles();
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      isActive = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount, isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }} // Make background effects more subtle
    />
  );
};

export default BackgroundEffects;
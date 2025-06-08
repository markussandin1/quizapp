import React, { useState, useEffect, useRef, useCallback } from 'react';
import './DynamicBackground.css';

interface DynamicBackgroundProps {
  children: React.ReactNode;
}

function DynamicBackground({ children }: DynamicBackgroundProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllImages();
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      const cleanup = setupImageTransition();
      return cleanup;
    }
  }, [images]); // setupImageTransition is stable

  useEffect(() => {
    setupParallax();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // setupParallax and handleScroll are stable

  const fetchAllImages = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/quiz/images/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const imageUrls = await response.json();
      setImages(imageUrls);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupImageTransition = () => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // Efter 1.5 sekunder (när crossfade är klar), byt till nästa bild
      setTimeout(() => {
        setCurrentImageIndex((prevCurrent) => (prevCurrent + 1) % images.length);
        setIsTransitioning(false);
      }, 1500);
    }, 7000); // Byt bild var 7:e sekund (5.5s visning + 1.5s övergång)

    return () => clearInterval(interval);
  };

  const setupParallax = () => {
    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const handleScroll = () => {
    if (heroRef.current) {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5; // Mjuk parallax för hero-bilderna
      heroRef.current.style.transform = `translate3d(0, ${parallax}px, 0) scale(1.1)`;
    }
  };

  if (loading || images.length === 0) {
    return (
      <div className="dynamic-background">
        <div className="background-overlay"></div>
        <div className="background-content">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-background">
      <div className="hero-container" ref={heroRef}>
        {images.map((imageUrl, index) => {
          const nextIndex = (currentImageIndex + 1) % images.length;
          let className = 'hero-image inactive';
          
          if (index === currentImageIndex) {
            className = `hero-image ${isTransitioning ? 'fading-out' : 'active'}`;
          } else if (index === nextIndex && isTransitioning) {
            className = 'hero-image fading-in';
          }
          
          return (
            <div key={imageUrl} className={className}>
              <img
                src={imageUrl}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.opacity = '0';
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="background-overlay"></div>
      <div className="background-content">
        {children}
      </div>
    </div>
  );
}

export default DynamicBackground;
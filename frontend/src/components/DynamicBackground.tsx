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
    // Only enable parallax on desktop to avoid mobile performance issues
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      setupParallax();
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []); // setupParallax and handleScroll are stable

  const fetchAllImages = async () => {
    try {
      const { getAllImages } = await import('../lib/supabase');
      const imageUrls = await getAllImages();
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
      
      // Efter 2 sekunder (när crossfade är klar), byt till nästa bild
      setTimeout(() => {
        setCurrentImageIndex((prevCurrent) => (prevCurrent + 1) % images.length);
        setIsTransitioning(false);
      }, 2000);
    }, 8000); // Byt bild var 8:e sekund (6s visning + 2s övergång)

    return () => clearInterval(interval);
  };

  const setupParallax = () => {
    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const handleScroll = useCallback(() => {
    if (heroRef.current) {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.3; // Reducerad parallax för smoothare känsla
      requestAnimationFrame(() => {
        if (heroRef.current) {
          heroRef.current.style.transform = `translate3d(0, ${parallax}px, 0) scale(1.1)`;
        }
      });
    }
  }, []);

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
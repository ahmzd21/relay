"use client";

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useCallback } from 'react';

// Dynamic import for client-side rendering only
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function PinkGlobe() {
  const globeEl = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
    // Fetch GeoJSON for the dot matrix effect
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data.features);
      })
      .catch(err => console.error("Could not load countries", err));
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (globeEl.current) {
        // Set initial camera angle
        globeEl.current.pointOfView({ lat: 20, lng: -30, altitude: 2.0 }, 0);

        const controls = globeEl.current.controls();
        // Use Three.js autoRotate — this rotates the entire scene (globe + arcs + markers)
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8; // Slow, cinematic rotation
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = false; // No user interaction

        // Set the globe material to be very dark
        const globeMaterial = globeEl.current.globeMaterial();
        if (globeMaterial) {
          globeMaterial.color.set('#080010');
          globeMaterial.emissive.set('#080010');
          globeMaterial.emissiveIntensity = 0.1;
          globeMaterial.shininess = 0;
        }
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isClient]);

  // Animated arcs connecting major cities
  const arcsData = [
    { startLat: 31.5204, startLng: 74.3587, endLat: 51.5074, endLng: -0.1278, color: ['#FF416C', '#FF4B2B'] },   // Lahore → London
    { startLat: 37.7595, startLng: -122.4367, endLat: 31.2304, endLng: 121.4737, color: ['#FF4B2B', '#FF416C'] }, // San Francisco → Shanghai
    { startLat: 24.7136, startLng: 46.6753, endLat: 48.1351, endLng: 11.5820, color: ['#FF416C', '#FF4B2B'] },    // Riyadh → Munich
  ];

  // City markers — only the 6 arc cities
  const pointsData = [
    { lat: 31.5204, lng: 74.3587, size: 0.4, color: '#FF416C' },   // Lahore
    { lat: 51.5074, lng: -0.1278, size: 0.4, color: '#FF4B2B' },   // London
    { lat: 37.7595, lng: -122.4367, size: 0.4, color: '#FF416C' }, // San Francisco
    { lat: 31.2304, lng: 121.4737, size: 0.4, color: '#FF4B2B' },  // Shanghai
    { lat: 24.7136, lng: 46.6753, size: 0.4, color: '#FF416C' },   // Riyadh
    { lat: 48.1351, lng: 11.5820, size: 0.4, color: '#FF4B2B' },   // Munich
  ];

  // Ring data — pulsing rings at the 6 cities
  const ringsData = [
    { lat: 31.5204, lng: 74.3587, maxR: 3, propagationSpeed: 1, repeatPeriod: 1400, color: 'rgba(255,65,108,0.7)' },
    { lat: 51.5074, lng: -0.1278, maxR: 3, propagationSpeed: 1, repeatPeriod: 1400, color: 'rgba(255,75,43,0.7)' },
    { lat: 37.7595, lng: -122.4367, maxR: 3, propagationSpeed: 1, repeatPeriod: 1400, color: 'rgba(255,65,108,0.7)' },
    { lat: 31.2304, lng: 121.4737, maxR: 3, propagationSpeed: 1, repeatPeriod: 1400, color: 'rgba(255,75,43,0.7)' },
    { lat: 24.7136, lng: 46.6753, maxR: 3, propagationSpeed: 1, repeatPeriod: 1400, color: 'rgba(255,65,108,0.7)' },
    { lat: 48.1351, lng: 11.5820, maxR: 3, propagationSpeed: 1, repeatPeriod: 1400, color: 'rgba(255,75,43,0.7)' },
  ];

  const hexPolygonColor = useCallback(() => 'rgba(255, 65, 108, 0.8)', []);

  if (!isClient) return <div className="w-full aspect-square min-h-[500px]" />;

  return (
    <div className="relative w-full aspect-square max-w-[650px] mx-auto flex items-center justify-center ml-4 lg:ml-10">
      <div className="w-full h-full pointer-events-none">
        <Globe
          ref={globeEl}
          width={650}
          height={650}
          backgroundColor="rgba(0,0,0,0)"
          showGlobe={true}
          // Dot-matrix land rendering
          hexPolygonsData={countries}
          hexPolygonResolution={3}
          hexPolygonMargin={0.62}
          hexPolygonColor={hexPolygonColor}
          hexPolygonCurvatureResolution={5}
          // Atmosphere — tight pink halo
          showAtmosphere={true}
          atmosphereColor="#FF416C"
          atmosphereAltitude={0.18}
          // Animated arcs
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={0.75}
          arcDashGap={0.85}
          arcDashAnimateTime={6000}
          arcsTransitionDuration={0}
          arcStroke={0.8}
          arcAltitudeAutoScale={0.3}
          // City dots
          pointsData={pointsData}
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          // Rings emanating from cities
          ringsData={ringsData}
          ringColor="color"
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
        />
      </div>
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BASE_URL } from '../api';



// Replace with your actual Mapbox access token
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFyYWlyYXRvIiwiYSI6ImNtZTRyNW1nZTBiZmkyaXNhdmxxeXI2aWgifQ.PyorjUh2CoYpflZGj9xPeg";



const containerStyle = {
  width: '100%',
  height: '24rem',
};



const defaultCenter = { lng: 31.047974, lat: -17.784655 };



interface ApiParkingZone {
  id: string;
  name: string;
  latitude: number;
  logitude: number | null;
  zone_type: string;
}



interface ParkingZone {
  id: string;
  name: string;
  position: { lng: number; lat: number };
}



type RouteStep = {
  maneuver: {
    instruction: string;
    type: string;
    modifier?: string;
  };
  distance: number;
  duration: number;
};



const ParkingMap: React.FC = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);



  const [userPosition, setUserPosition] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [parkingZones, setParkingZones] = useState<ParkingZone[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'fallback'>('loading');
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');



  const speakDirections = (steps: RouteStep[]) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported by this browser.');
      return;
    }
    if (steps.length === 0) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const step = steps[0];
    const utterance = new SpeechSynthesisUtterance(step.maneuver.instruction);
    utterance.rate = 1;
    synth.speak(utterance);
  };



  const getRoute = async (
    start: { lng: number; lat: number },
    end: { lng: number; lat: number },
    mode: 'driving' | 'walking'
  ): Promise<{ distance: string; duration: string; steps: RouteStep[] } | null> => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${start.lng},${start.lat};${end.lng},${end.lat}` +
        `?steps=true&geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;
      const response = await fetch(url);
      const json = await response.json();



      if (!json.routes || json.routes.length === 0) return null;



      const steps = json.routes[0].legs[0]?.steps || [];
      const data = json.routes[0];
      const route = data.geometry.coordinates;



      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route,
          },
        }],
      };



      if (mapRef.current?.getLayer('route')) {
        (mapRef.current.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        mapRef.current?.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 6,
            'line-opacity': 0.75,
          },
        });
      }



      const distanceKm = (data.distance / 1000).toFixed(1);
      const durationMins = (data.duration / 60).toFixed(0);



      return { distance: `${distanceKm} km`, duration: `${durationMins} mins`, steps };
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  };



  useEffect(() => {
    if (!mapContainerRef.current) return;



    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;



    const storedZone = localStorage.getItem('selectedZone');
    let destinationZone: ParkingZone | null = null;



    if (storedZone) {
      const parsedZone = JSON.parse(storedZone);
      if (parsedZone && typeof parsedZone.latitude === 'number' && typeof parsedZone.longitude === 'number') {
        destinationZone = {
          id: parsedZone.id || 'destination',
          name: parsedZone.name,
          position: { lng: parsedZone.longitude, lat: parsedZone.latitude },
        };
        setSelectedZone(destinationZone);
      }
    }



    const initialCenter = destinationZone ? [destinationZone.position.lng, destinationZone.position.lat] : [defaultCenter.lng, defaultCenter.lat];
    const initialZoom = 15;



    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: initialCenter as mapboxgl.LngLatLike,
      zoom: initialZoom,
    });



    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');



    fetch(`${BASE_URL}/spots/zones/`)
      .then(res => res.json())
      .then((data: ApiParkingZone[]) => {
        const zones = data.filter(z => z.logitude !== null).map(z => ({
          id: z.id,
          name: z.name,
          position: { lng: z.logitude as number, lat: z.latitude },
        }));
        setParkingZones(zones);
        zones.forEach(addZoneMarker);
      })
      .catch(error => {
        console.error("Failed to fetch parking zones:", error);
      });



    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = { lng: pos.coords.longitude, lat: pos.coords.latitude };
          setUserPosition(userPos);
          addUserMarker(userPos.lng, userPos.lat, false);
          setLocationStatus('success');
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setUserPosition(defaultCenter);
          addUserMarker(defaultCenter.lng, defaultCenter.lat, true);
          setLocationStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setUserPosition(defaultCenter);
      addUserMarker(defaultCenter.lng, defaultCenter.lat, true);
      setLocationStatus('fallback');
    }



    return () => {
      if (mapRef.current) mapRef.current.remove();
      window.speechSynthesis.cancel();
    };
  }, []);



  useEffect(() => {
    const updateRoute = async () => {
      if (selectedZone && userPosition) {
        const data = await getRoute(userPosition, selectedZone.position, travelMode);
        if (data) {
          setRouteInfo({ distance: data.distance, duration: data.duration });
          setRouteSteps(data.steps);
        } else {
          setRouteInfo(null);
          setRouteSteps([]);
        }
      } else {
        setRouteInfo(null);
        setRouteSteps([]);
        if (mapRef.current?.getLayer('route')) {
          mapRef.current.removeLayer('route');
          mapRef.current.removeSource('route');
        }
      }
    };



    updateRoute();
  }, [selectedZone, userPosition, travelMode]);



  useEffect(() => {
    if (routeSteps.length > 0) {
      speakDirections(routeSteps);
    }
  }, [routeSteps]);



  const addUserMarker = (lng: number, lat: number, isFallback: boolean) => {
    if (!mapRef.current) return;
    markersRef.current = markersRef.current.filter(m => {
      if ((m.getElement().id ?? '') === 'user-marker') {
        m.remove();
        return false;
      }
      return true;
    });



    const el = document.createElement('div');
    el.id = 'user-marker';
    el.className = 'user-marker';
    el.title = isFallback ? 'Your location (default)' : 'Your location';
    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.3"/>
        <circle cx="12" cy="12" r="6" fill="#3b82f6" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    `;



    const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current);
    markersRef.current.push(marker);
  };



  const addZoneMarker = (zone: ParkingZone) => {
    if (!mapRef.current) return;



    const markerContainer = document.createElement('div');
    markerContainer.className = 'flex flex-col items-center';
    markerContainer.title = zone.name;
    markerContainer.style.cursor = 'pointer';



    const iconEl = document.createElement('div');
    iconEl.className = 'marker-icon';
    iconEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
    `;



    const nameEl = document.createElement('div');
    nameEl.className = 'zone-name-label';
    nameEl.textContent = zone.name;



    markerContainer.appendChild(iconEl);
    markerContainer.appendChild(nameEl);



    const marker = new mapboxgl.Marker({
      element: markerContainer,
      anchor: 'bottom',
    })
      .setLngLat([zone.position.lng, zone.position.lat])
      .addTo(mapRef.current);



    markerContainer.addEventListener('click', () => handleZoneClick(zone));
    markersRef.current.push(marker);
  };



  const handleZoneClick = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setCountdown(10);



    if (popupRef.current) {
      popupRef.current.remove();
    }
    if (!mapRef.current) return;



    const popupContent = document.createElement('div');
    popupContent.className = 'space-y-2';



    const title = document.createElement('h2');
    title.className = 'font-semibold text-gray-800';
    title.textContent = zone.name;
    popupContent.appendChild(title);



    // Route info will be updated by the useEffect hook
    const distanceEl = document.createElement('p');
    distanceEl.className = 'text-sm text-gray-600';
    distanceEl.id = 'popup-distance';
    popupContent.appendChild(distanceEl);



    const durationEl = document.createElement('p');
    durationEl.className = 'text-sm text-gray-600';
    durationEl.id = 'popup-duration';
    popupContent.appendChild(durationEl);



    if (userPosition) {
      const navLink = document.createElement('a');
      navLink.href = `https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${zone.position.lat},${zone.position.lng}`;
      navLink.target = '_blank';
      navLink.rel = 'noopener noreferrer';
      navLink.className = 'text-sm text-blue-600 underline';
      navLink.textContent = 'Navigate Here';
      popupContent.appendChild(navLink);
    }



    const countdownEl = document.createElement('p');
    countdownEl.className = 'text-xs text-gray-600';
    popupContent.appendChild(countdownEl);



    popupRef.current = new mapboxgl.Popup({ offset: 25 })
      .setLngLat([zone.position.lng, zone.position.lat])
      .setDOMContent(popupContent)
      .addTo(mapRef.current);



    const countdownInterval = setInterval(() => {
      if (countdown !== null && countdown > 0) {
        countdownEl.textContent = `Closing in ${countdown}s...`;
      } else {
        countdownEl.textContent = '';
        clearInterval(countdownInterval);
      }
    }, 500);



    popupRef.current.on('close', () => {
      setSelectedZone(null);
      setCountdown(null);
      clearInterval(countdownInterval);
    });
  };



  useEffect(() => {
    if (!selectedZone) {
      setCountdown(null);
      return;
    }
    setCountdown(10);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 0) return prev - 1;
        if (popupRef.current) popupRef.current.remove();
        return null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedZone]);



  return (
    <div className="relative">
      {/* Selected spot overlay */}
      {(() => {
        try {
          const raw = localStorage.getItem('selectedSpot');
          if (!raw) return null;
          const spot = JSON.parse(raw) as { lot_name: string; spot_number: string; is_vip?: boolean };
          return (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 text-sm text-gray-700">
                <div className="font-semibold text-gray-900">Selected Spot</div>
                <div>{spot.lot_name} • Spot {spot.spot_number} {spot.is_vip ? '(VIP)' : ''}</div>
              </div>
            </div>
          );
        } catch {
          return null;
        }
      })()}
      {locationStatus === 'loading' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-lg font-semibold bg-white p-4 rounded-lg shadow-md">
          Fetching your location...
        </div>
      )}



      {/* Beautiful ETA and Distance overlay at top of map */}
      {routeInfo && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 flex gap-6 items-center">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500">DISTANCE</div>
              <div className="text-xl font-bold text-blue-600">{routeInfo.distance}</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500">ETA</div>
              <div className="text-xl font-bold text-green-600">{routeInfo.duration}</div>
            </div>
          </div>
        </div>
      )}



      <div style={containerStyle} ref={mapContainerRef} />



      {/* Marker styles */}
      <style>{`
        .user-marker svg {
          filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.3));
          width: 32px;
          height: 32px;
          cursor: pointer;
        }
        .marker-icon svg {
          cursor: pointer;
          filter: drop-shadow(0 0 3px rgba(0,0,0,0.4));
          width: 32px;
          height: 32px;
          color: #2563EB;
        }
        .zone-name-label {
          background-color: white;
          color: #1e40af;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 9999px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          border: 1px solid #93c5fd;
          margin-top: 4px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};



export default ParkingMap;

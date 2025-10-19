import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, MapPin, Users, Calendar, ParkingCircle, CarFront, Gauge, Mic, Search, ChevronDown, Clock, Compass, Navigation2, SlidersHorizontal, Map as MapIcon } from 'lucide-react';
import Button from './ui/button';
import { useAuth } from '../authentication/AuthProvider';
import { BASE_URL } from '../api';

// --- Global type declarations to fix TypeScript errors ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly resultIndex: number;
  }
}

// --- API Data Interfaces ---
interface ApiEvent {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  event_location: string;
  latitude: number;
  longitude: number;
  allowed_parking_lots: string[];
  event_type: string;
}

interface ZoneOccupancy {
  id: string;
  name: string;
  total_spots: number;
  reserved_spots: number;
  occupied_spots: number;
  occupancy_rate: number;
  latitude: number;
  longitude: number;
}

interface EmptySpot {
  spot_number: string;
  lot_name: string;
  is_vip: boolean;
  parking_zone_id: string;
  id: string;
  status: 'empty';
}

interface Reservation {
  id: string;
  user_id: string;
  spot_id: string;
  event_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

// --- Component ---
const ParkingDashboard: React.FC = () => {
  const { userRole: role, userId } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortBy, setSortBy] = useState<'nearest' | 'availability' | 'occupancy'>('nearest');
  const [onlyWithSpace, setOnlyWithSpace] = useState(true);

  // New state for custom alerts/messages
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

  // --- API-driven State ---
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [allSpots, setAllSpots] = useState<EmptySpot[]>([]);
  const [allZones, setAllZones] = useState<ZoneOccupancy[]>([]); // Store all zones
  const [availableZones, setAvailableZones] = useState<ZoneOccupancy[]>([]); // Filtered zones for display
  const [emptySpots, setEmptySpots] = useState<EmptySpot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // --- Reservation Form State ---
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const fetchData = async () => {
    try {
      const [eventsRes, zonesRes, emptySpotsRes, reservationsRes] = await Promise.all([
        fetch(`${BASE_URL}/events/`),
        fetch(`${BASE_URL}/spots/zones_with_occupancy`),
        fetch(`${BASE_URL}/spots/empty-spots`),
        fetch(`${BASE_URL}/reservations/details`),
      ]);

      const eventsRaw = await eventsRes.json();
      const zonesRaw = await zonesRes.json();
      const emptySpotsRaw = await emptySpotsRes.json();
      const reservationsRaw = await reservationsRes.json();

      const eventsData: ApiEvent[] = Array.isArray(eventsRaw) ? eventsRaw : [];
      const zonesData: ZoneOccupancy[] = Array.isArray(zonesRaw) ? zonesRaw : [];
      const emptySpotsData: EmptySpot[] = Array.isArray(emptySpotsRaw) ? emptySpotsRaw : [];
      const reservationsData: Reservation[] = Array.isArray(reservationsRaw) ? reservationsRaw : [];

      setEvents(eventsData);
      setAllSpots(emptySpotsData);
      setAllZones(zonesData); // Store all zones in a new state variable
      setAvailableZones(zonesData); // Initially, show all zones
      setEmptySpots(emptySpotsData);

      if (userId) {
        const filteredReservations = reservationsData
          .filter(res => res.user_id === userId)
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
          .slice(0, 2);

        setReservations(filteredReservations);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setMessage({ text: "Failed to fetch data from the server.", type: 'error' });
    }
  };


  useEffect(() => {
    if (userId && role !== 'guest') {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // lightweight polling for live occupancy
    return () => clearInterval(interval);
  }, [userId, role]);

  // --- Geolocation (for "Nearest" sorting and distance display) ---
  const requestUserLocation = () => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const computeDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- Reservation Logic ---
  const handleReserveSpot = async () => {
    if (!userId) {
      setMessage({ text: "You must be logged in to reserve a spot.", type: 'error' });
      return;
    }
    if (!selectedEventId || !selectedSpotId || !startTime || !endTime) {
      setMessage({ text: "Please fill out all reservation details.", type: 'error' });
      return;
    }

    const reservationPayload = {
      user_id: userId,
      spot_id: selectedSpotId,
      event_id: selectedEventId,
      start_time: startTime,
      end_time: endTime,
    };

    try {
      const response = await fetch(`${BASE_URL}/reservations/reserve-spot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(reservationPayload),
      });

      if (response.ok) {
        setMessage({ text: 'Spot reserved successfully!', type: 'success' });
        fetchData();
      } else {
        const errorData = await response.json();
        console.error("Reservation failed:", errorData);
        setMessage({ text: `Failed to reserve spot: ${errorData.detail}`, type: 'error' });
      }
    } catch (error) {
      console.error("Reservation failed:", error);
      setMessage({ text: "An error occurred while reserving the spot.", type: 'error' });
    }

    setShowReserveModal(false);
  };

  // --- Navigation Logic ---
  const handleNavigate = (zone: ZoneOccupancy) => {
    const zoneData = {
      name: zone.name,
      latitude: zone.latitude,
      longitude: zone.longitude,
    };
    localStorage.setItem('selectedZone', JSON.stringify(zoneData));
    console.log(`Navigating to zone: ${zone.name} at (${zone.latitude}, ${zone.longitude})`, zone);
    navigate('/dashboard/map');
  };

  const handleViewSpots = (zone: ZoneOccupancy) => {
    navigate(`/dashboard/zones/${zone.id}`);
  };

  // --- UI Logic ---
  const handleEventSelect = (event: ApiEvent) => {
    setEventSearchQuery(event.name);
    setSelectedEventId(event.id);

    // Updated logic: Filter the available zones to only include those that have a name
    // that includes one of the event's allowed parking lot names.
    const filteredByEvent = allZones.filter(zone =>
      event.allowed_parking_lots.some(lotName =>
        zone.name.toLowerCase().includes(lotName.toLowerCase())
      )
    );
    setAvailableZones(filteredByEvent);

    // Clear the zone search query so it doesn't conflict with the event filter
    setSearchQuery('');

    setShowEventDropdown(false);
  };

  // The displayed zones now depend on both the `availableZones` (filtered by event)
  // and the `searchQuery` (for text search).
  const filteredAndSearchedZones = availableZones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const zonesAfterAvailability = onlyWithSpace
    ? filteredAndSearchedZones.filter(zone => (zone.total_spots - zone.reserved_spots - zone.occupied_spots) > 0)
    : filteredAndSearchedZones;

  const zonesWithMeta = useMemo(() => zonesAfterAvailability.map(zone => {
    const available = zone.total_spots - zone.reserved_spots - zone.occupied_spots;
    const occupancy = ((zone.reserved_spots + zone.occupied_spots) / zone.total_spots) * 100;
    const distanceKm = userPosition
      ? computeDistanceKm(userPosition.lat, userPosition.lng, zone.latitude, zone.longitude)
      : null;
    return { zone, available, occupancy, distanceKm };
  }), [zonesAfterAvailability, userPosition]);

  const sortedZones = useMemo(() => {
    const copy = [...zonesWithMeta];
    if (sortBy === 'nearest') {
      copy.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'availability') {
      copy.sort((a, b) => b.available - a.available);
    } else if (sortBy === 'occupancy') {
      copy.sort((a, b) => a.occupancy - b.occupancy);
    }
    return copy;
  }, [zonesWithMeta, sortBy]);

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.event_location.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  const handleVoiceNavigation = (transcript: string) => {
    const command = transcript.toLowerCase();
    if (command.includes("navigate to")) {
      const zoneName = command.replace("navigate to", "").trim();
      setSearchQuery(zoneName);
      const zoneElement = document.getElementById(`zone-${zoneName.replace(' ', '-')}`);
      if (zoneElement) {
        zoneElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log(`Could not find zone: ${zoneName}`);
      }
    } else {
      setSearchQuery(command);
    }
  };

  const startVoiceNavigation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage({ text: "Web Speech API is not supported in this browser. Please use Chrome or a similar browser.", type: 'error' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Listening for voice commands...");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log(`Voice Command Received: "${transcript}"`);
      handleVoiceNavigation(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionEvent) => {
      setIsListening(false);
      console.error('Speech recognition error', event);
    };

    recognition.onend = () => {
      console.log('Speech recognition service disconnected.');
      setIsListening(false);
    };

    recognition.start();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setEventSearchQuery('');
    setAvailableZones(allZones);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Parking Dashboard
      </h2>

      {/* Custom Message Box */}
      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <div className="flex justify-between items-center">
            <p>{message.text}</p>
            <button onClick={() => setMessage({ text: '', type: null })} className="text-sm font-semibold">
              &times;
            </button>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="default" onClick={() => setShowReserveModal(true)}>Reserve a Spot</Button>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reserve a Parking Spot</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Event</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedEventId || ''}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="" disabled>Select an event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Empty Spot</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedSpotId || ''}
                  onChange={(e) => setSelectedSpotId(e.target.value)}
                >
                  <option value="" disabled>Select a spot</option>
                  {emptySpots.map((spot) => (
                    <option key={spot.id} value={spot.id}>{spot.lot_name} - Spot {spot.spot_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReserveModal(false)}>Cancel</Button>
                <Button onClick={handleReserveSpot}>Confirm Reservation</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Search Section */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Search by Events</h3>
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 w-full"
              value={eventSearchQuery}
              onChange={(e) => {
                setEventSearchQuery(e.target.value);
                setShowEventDropdown(true);
              }}
              onFocus={() => setShowEventDropdown(true)}
              onBlur={() => setTimeout(() => setShowEventDropdown(false), 200)}
            />
          </div>

          {showEventDropdown && filteredEvents.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                  onClick={() => handleEventSelect(event)}
                >
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{event.name}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatDate(event.start_time)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{event.event_location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone Search Section */
      {/* Controls: search, sort, availability toggle, locate, map view */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">Parking Zones</h3>
              {(eventSearchQuery || selectedEventId) && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">Filtered by event</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/map')} className="text-gray-700">
                <MapIcon className="h-4 w-4 mr-1" /> Map view
              </Button>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sort</label>
                <select
                  className="border rounded-md px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="nearest">Nearest</option>
                  <option value="availability">Most available</option>
                  <option value="occupancy">Lowest occupancy</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
                <input type="checkbox" className="rounded" checked={onlyWithSpace} onChange={(e) => setOnlyWithSpace(e.target.checked)} />
                Only with space
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={requestUserLocation}
                disabled={isLocating}
                className="text-gray-700"
              >
                <Compass className={`h-4 w-4 mr-1 ${isLocating ? 'animate-spin' : ''}`} />
                {userPosition ? 'Update location' : 'Use my location'}
              </Button>
            </div>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search zones..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={startVoiceNavigation}
              disabled={isListening}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
            </Button>
            {/* Added a button to reset the filters */}
            {(eventSearchQuery || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 text-gray-500 hover:bg-gray-100"
                onClick={resetFilters}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {sortedZones.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedZones.map(({ zone, available, occupancy, distanceKm }) => {
              const occupancyColor = occupancy < 50 ? '#34d399' : occupancy < 80 ? '#fbbf24' : '#f87171';
              const buttonColor = occupancyColor === '#34d399' ? 'bg-green-500 hover:bg-green-600 text-white' :
                occupancyColor === '#fbbf24' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                  'bg-red-500 hover:bg-red-600 text-white';

              return (
                <div
                  key={zone.id}
                  id={`zone-${zone.name.replace(' ', '-')}`}
                  className={`rounded-xl p-4 shadow-sm flex flex-col space-y-3 bg-gray-50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ParkingCircle className="text-gray-700" />
                      <h4 className="text-lg font-bold text-gray-800">{zone.name}</h4>
                    </div>
                    {typeof distanceKm === 'number' && (
                      <div className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">
                        {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} away
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CarFront className="w-4 h-4" />
                    <span>Spots Available: {available}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Gauge className="w-4 h-4" />
                    <span>Occupancy: {occupancy.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${occupancy}%`,
                        backgroundColor: occupancyColor,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      className={`${buttonColor} w-full`}
                      onClick={() => handleViewSpots(zone)}
                    >
                      Select Spot
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleNavigate(zone)}
                    >
                      <Navigation2 className="h-4 w-4 mr-1" /> Navigate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-lg text-gray-500 py-8">
            No available space in any parking zone.
          </div>
        )}
      </div>

      {isLoggedIn && (
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <ul className="space-y-2">
            {reservations.length > 0 ? (
              reservations.map((reservation) => {
                const event = events.find(e => e.id === reservation.event_id);
                const spot = allSpots.find(s => s.id === reservation.spot_id);
                const eventName = event?.name || 'Unknown Event';
                const spotName = spot ? `${spot.lot_name} - Spot ${spot.spot_number}` : 'Unknown Spot';

                return (
                  <li key={reservation.id} className="flex flex-col sm:flex-row justify-between text-sm text-gray-700">
                    <span className="font-medium">
                      Reserved spot {spotName} for event {eventName}
                    </span>
                    <time className="text-gray-500 mt-1 sm:mt-0">{formatDate(reservation.start_time)}</time>
                  </li>
                );
              })
            ) : (
              <li className="text-sm text-gray-500">No recent reservations found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ParkingDashboard;
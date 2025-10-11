import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import NavigationHeader from '../../components/NavigationHeader'; // Your existing header
import { Car, MapPin, Calendar, CalendarCheck, CalendarDays } from 'lucide-react';
import { useAuth } from '../../authentication/AuthProvider';
import mapboxgl from 'mapbox-gl';
import { BASE_URL } from '../../api';

const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Car, path: '/dashboard/dashboard' },
    { id: 'map', label: 'Campus Map', icon: MapPin, path: '/dashboard/map' },
    { id: 'events', label: 'Events', icon: CalendarDays, path: '/dashboard/events' },
    { id: 'reservations', label: 'Reservations', icon: CalendarCheck, path: '/dashboard/reservations' }
];

const Dashboard: React.FC = () => {
    const [userType, setUserType] = useState<'staff' | 'visitor' | 'student' | null>(null);
    const [showUserSelection, setShowUserSelection] = useState(false);
    const [stats, setStats] = useState({
        availableSpots: 0,
        parkingZones: 0,
        eventsCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { isAuthenticated, logout, userRole } = useAuth();

    useEffect(() => {
        const storedUserType = localStorage.getItem('campassCampusUserType') as 'staff' | 'visitor' | 'student' | null;
        if (storedUserType) {
            setUserType(storedUserType);
            setShowUserSelection(false);
        } else {
            setShowUserSelection(true);
        }

        // Fetch all statistics
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Fetch available spots
                const spotsResponse = await fetch(`${BASE_URL}/analytics/spots/unoccupied_count`, {
                    headers: {
                        'accept': 'application/json'
                    }
                });
                const spotsCount = await spotsResponse.json();

                // Fetch zones count
                const zonesResponse = await fetch(`${BASE_URL}/analytics/zones_count`, {
                    headers: {
                        'accept': 'application/json'
                    }
                });
                const zonesCount = await zonesResponse.json();

                // Fetch events count
                const eventsResponse = await fetch(`${BASE_URL}/analytics/api/analytics/events/count`, {
                    headers: {
                        'accept': 'application/json'
                    }
                });
                const eventsData = await eventsResponse.json();

                setStats({
                    availableSpots: spotsCount,
                    parkingZones: zonesCount,
                    eventsCount: eventsData.total_events
                });
            } catch (err) {
                console.error('Failed to fetch statistics:', err);
                setError('Failed to load statistics. Please try again later.');
                // Set default values if API fails
                setStats({
                    availableSpots: 0,
                    parkingZones: 0,
                    eventsCount: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleUserTypeSelection = (type: 'staff' | 'visitor' | 'student') => {
        setUserType(type);
        localStorage.setItem('campassCampusUserType', type);
        setShowUserSelection(false);
    };

    const handleSkip = () => {
        setUserType('visitor');
        localStorage.setItem('campassCampusUserType', 'visitor');
        setShowUserSelection(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <NavigationHeader
                userRole={userRole}
                isLoggedIn={isAuthenticated}
                onLogin={() => navigate('/login')}
                onLogout={handleLogout}
                onSettings={() => navigate('/settings')}
            />

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-green-800 text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Parklee</h1>
                    <p className="text-xl md:text-2xl text-blue-100 mb-6">
                        Smart Parking for University of Zimbabwe
                    </p>
                    <p className="text-lg text-blue-200 max-w-2xl mx-auto">
                        Find parking spots instantly, get event updates, and navigate campus with ease
                    </p>
                    {userType && (
                        <div className="mt-4">
                            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">
                                Welcome, {userRole}!
                            </span>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-10">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                        <Car className="h-8 w-8 mx-auto mb-2 text-green-300" />
                        {loading ? (
                            <div className="animate-pulse h-8 w-full bg-white/20 rounded"></div>
                        ) : error ? (
                            <div className="text-sm text-red-300">Error</div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.availableSpots}</div>
                                <div className="text-sm text-blue-200">Available Spots</div>
                            </>
                        )}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                        {loading ? (
                            <div className="animate-pulse h-8 w-full bg-white/20 rounded"></div>
                        ) : error ? (
                            <div className="text-sm text-red-300">Error</div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.parkingZones}</div>
                                <div className="text-sm text-blue-200">Parking Zones</div>
                            </>
                        )}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                        {loading ? (
                            <div className="animate-pulse h-8 w-full bg-white/20 rounded"></div>
                        ) : error ? (
                            <div className="text-sm text-red-300">Error</div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats.eventsCount}</div>
                                <div className="text-sm text-blue-200">Events Today</div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Nested routes render here */}
            <div className="container mx-auto px-4 py-6 pb-24 animate-in fade-in-50 duration-300">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                <div className="grid grid-cols-4 h-16">
                    {tabs.map(({ id, label, icon: Icon, path }) => (
                        <NavLink
                            key={id}
                            to={path}
                            end={id === 'dashboard'}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`
                            }
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium">{label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
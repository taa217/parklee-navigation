import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, MapPin, Car, Trash2, Edit, Plus, X } from 'lucide-react';
import { useAuth } from '../authentication/AuthProvider';
import { BASE_URL } from '../api';

interface Reservation {
    id: string;
    spot_number: string;
    lot_name: string;
    event_name: string;
    zone_name: string;
    start_time: string;
    end_time: string;
    status: 'confirmed' | 'pending' | 'cancelled';
}

interface Spot {
    id: string;
    spot_number: string;
    lot_name: string;
    is_vip: boolean;
    parking_zone_id: string;
    status: string;
}

interface Event {
    id: string;
    name: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    event_location: string;
    allowed_parking_lots: string[];
}

interface NewReservationModalProps {
    spots: Spot[];
    events: Event[];
    onClose: () => void;
    onCreate: (newReservation: any) => void;
}

const NewReservationModal: React.FC<NewReservationModalProps> = ({
    events,
    spots,
    onClose,
    onCreate
}) => {
    const { userId } = useAuth();
    const [formData, setFormData] = useState({
        event_id: '',
        spot_id: '',
        start_time: '',
        end_time: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_URL}/reservations/reserve-spot`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    spot_id: formData.spot_id,
                    event_id: formData.event_id,
                    start_time: formData.start_time,
                    end_time: formData.end_time
                })
            });
            console.log('1 formData:', formData, userId); // Debugging line

            if (!response.ok) {
                throw new Error('Failed to create reservation');
            }

            const newReservation = await response.json();
            onCreate(newReservation);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error creating reservation:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-lg font-semibold">New Reservation</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                        <select
                            name="event_id"
                            value={formData.event_id}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">Select an event</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parking Spot</label>
                        <select
                            name="spot_id"
                            value={formData.spot_id}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">Select a spot</option>
                            {spots.map(spot => (
                                <option key={spot.id} value={spot.id}>
                                    {spot.lot_name} - Spot {spot.spot_number} {spot.is_vip ? "(VIP)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                            type="datetime-local"
                            name="start_time"
                            value={formData.start_time}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                            type="datetime-local"
                            name="end_time"
                            value={formData.end_time}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                            disabled={loading || !formData.spot_id || !formData.start_time || !formData.end_time}
                        >
                            {loading ? 'Creating...' : 'Create Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Reservations: React.FC = () => {
    // We now initialize reservations to an empty array to avoid the TypeError
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [emptySpots, setEmptySpots] = useState<Spot[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { userRole, userId } = useAuth(); // Destructure userId directly from useAuth
    const navigate = useNavigate();

    useEffect(() => {
        // IMPORTANT: Only fetch data if userId exists
        if (!userId) {
            setLoading(false);
            setReservations([]);
            return;
        }

        const fetchData = async () => {
            try {
                const [reservationsRes, emptySpotsRes, eventsRes] = await Promise.all([
                    fetch(`${BASE_URL}/reservations/reservations/details/${userId}`, {
                        headers: { 'accept': 'application/json' }
                    }),
                    fetch(`${BASE_URL}/spots/empty-spots`, {
                        headers: { 'accept': 'application/json' }
                    }),
                    fetch(`${BASE_URL}/events/`, {
                        headers: { 'accept': 'application/json' }
                    })
                ]);

                // Check if responses are okay before parsing JSON
                if (!reservationsRes.ok || !emptySpotsRes.ok || !eventsRes.ok) {
                    throw new Error('Failed to fetch data from one or more endpoints.');
                }

                const reservationsData = await reservationsRes.json();
                const emptySpotsData = await emptySpotsRes.json();
                const eventsData = await eventsRes.json();

                console.log('Reservations data:', reservationsData);
                console.log('Empty spots data:', emptySpotsData);
                console.log('Events data:', eventsData);

                setReservations(reservationsData);
                setEmptySpots(emptySpotsData);
                setEvents(eventsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Handle the error state in the UI if needed
                setReservations([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    const handleCancel = async (id: string) => {
        // TODO: Implement cancel API if available
        setReservations(reservations.filter(res => res.id !== id));
    };

    const handleEdit = (id: string) => {
        const reservation = reservations.find(res => res.id === id);
        if (reservation) {
            navigate(`/dashboard/reservations/edit/${id}`, {
                state: {
                    reservation,
                    spots: emptySpots
                }
            });
        }
    };

    const handleCreateReservation = (newReservation: any) => {
        // The API should return the complete reservation with all fields
        setReservations(prev => [...prev, newReservation]);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diff = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
        }
        return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-6 text-center">
                <div className="text-gray-400 text-6xl my-8">
                    <Clock className="mx-auto" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Please log in to view your reservations.</h3>
                <p className="mt-1 text-sm text-gray-500">
                    You'll need to be authenticated to see your parking reservations.
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">My Reservations</h2>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Reservation
                </button>
            </div>

            {reservations.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No reservations found</h3>
                    <p className="mt-1 text-gray-500">Get started by making a new reservation</p>
                    {userRole === 'staff' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            New Reservation
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {reservations.map((reservation) => (
                        <div
                            key={reservation.id}
                            className={`border rounded-lg p-4 transition-all ${reservation.status === 'confirmed'
                                ? 'border-green-200 bg-green-50'
                                : reservation.status === 'pending'
                                    ? 'border-yellow-200 bg-yellow-50'
                                    : 'border-red-200 bg-red-50'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {reservation.zone_name} - Spot {reservation.spot_number}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">Event: {reservation.event_name}</p>
                                    <div className="mt-2 grid grid-cols-2 gap-4">
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            <span>{formatDate(reservation.start_time)}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Clock className="mr-2 h-4 w-4" />
                                            <span>{formatTime(reservation.start_time)}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            <span>{reservation.lot_name}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Car className="mr-2 h-4 w-4" />
                                            <span>{calculateDuration(reservation.start_time, reservation.end_time)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(reservation.id)}
                                        className="p-2 text-blue-600 hover:text-blue-800"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleCancel(reservation.id)}
                                        className="p-2 text-red-600 hover:text-red-800"
                                        title="Cancel"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${reservation.status === 'confirmed'
                                        ? 'bg-green-100 text-green-800'
                                        : reservation.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                >
                                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <NewReservationModal
                    spots={emptySpots}
                    events={events}
                    onClose={() => setShowModal(false)}
                    onCreate={handleCreateReservation}
                />
            )}
        </div>
    );
};

export default Reservations;

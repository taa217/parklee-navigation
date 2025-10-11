import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../authentication/AuthProvider';
import { BASE_URL } from '../api';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  event_location: string;
  latitude: number;
  longitude: number;
  allowed_parking_lots: string[];
  event_type: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${BASE_URL}/events/`, {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let results = events;

    if (searchTerm) {
      results = results.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter) {
      results = results.filter(event =>
        event.date.startsWith(dateFilter)
      );
    }

    if (typeFilter) {
      results = results.filter(event =>
        event.event_type.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    setFilteredEvents(results);
  }, [searchTerm, dateFilter, typeFilter, events]);

  const handleDelete = async (id: string) => {
    try {
      // Add API call to delete event
      // await fetch(`http://localhost:8000/events/${id}`, { method: 'DELETE' });
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/dashboard/events/edit/${id}`);
  };

  const handleNewEvent = () => {
    navigate('/dashboard/events/new');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setTypeFilter('');
  };

  const getEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'ongoing';
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">University Events</h1>
          <p className="mt-1 text-gray-500">Discover and manage upcoming events</p>
        </div>
        {userRole === 'staff' && (
          <button
            onClick={handleNewEvent}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm w-full md:w-auto justify-center"
          >
            <Plus size={18} />
            Create Event
          </button>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter className="mr-2 text-indigo-500" />
            <h3 className="text-lg font-medium text-gray-700">Search & Filter</h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showFilters ? (
              <>
                <span>Hide</span>
                <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                <span>Filters</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Search Bar - Always Visible */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search events by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
            />
          </div>
        </div>

        {/* Filters - Collapsible on Mobile */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
              >
                <option value="">All Types</option>
                <option value="academia">Academia</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="social">Social</option>
                <option value="conference">Conference</option>
              </select>
            </div>
          </div>

          {(searchTerm || dateFilter || typeFilter) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <X size={16} className="mr-1" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="mx-auto h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center">
            <Calendar className="h-12 w-12 text-indigo-500" />
          </div>
          <h3 className="mt-4 text-xl font-medium text-gray-900">
            {events.length === 0 ? 'No events scheduled yet' : 'No matching events found'}
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            {events.length === 0
              ? 'Check back later or create a new event to get started'
              : 'Try adjusting your search criteria or filters'}
          </p>
          {userRole === 'staff' && (
            <button
              onClick={handleNewEvent}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Create New Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEvents.map((event) => {
            const status = getEventStatus(event);
            const statusColor = getStatusColor(status);

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Tag className="h-3.5 w-3.5 mr-1" />
                          {event.event_type}
                        </span>
                      </div>

                      <h3 className="mt-2 text-xl font-semibold text-gray-900">{event.name}</h3>
                      <p className="mt-2 text-gray-600 line-clamp-2">{event.description}</p>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(event.date)}</p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <MapPin className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="text-sm font-medium text-gray-900">{event.event_location}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {userRole === 'staff' && (
                      <div className="flex sm:flex-col gap-2 sm:gap-1">
                        <button
                          onClick={() => handleEdit(event.id)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      View details
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
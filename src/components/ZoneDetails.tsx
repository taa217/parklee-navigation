import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from './ui/button';
import { BASE_URL } from '../api';

type SpotStatus = 'empty' | 'occupied' | 'reserved';

interface Spot {
  id: string;
  spot_number: string;
  lot_name: string;
  is_vip: boolean;
  parking_zone_id: string;
  status: SpotStatus;
}

interface ApiZoneShort {
  id: string;
  name: string;
  latitude: number;
  longitude?: number;
  logitude?: number; // backend provides both to preserve legacy typo
}

const ZoneDetails: React.FC = () => {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [zone, setZone] = useState<{ id: string; name: string; latitude: number; longitude: number } | null>(null);

  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);

  const loadAll = async () => {
    if (!zoneId) return;
    try {
      setLoading(true);
      setError(null);
      const [spotsRes, zonesRes] = await Promise.all([
        fetch(`${BASE_URL}/spots/zones/${zoneId}/spots`),
        fetch(`${BASE_URL}/spots/zones/`),
      ]);

      const spotsJson = await spotsRes.json();
      const zonesJson: ApiZoneShort[] = await zonesRes.json();

      const z = zonesJson.find((z) => z.id === zoneId);
      if (z) {
        setZone({ id: z.id, name: z.name, latitude: z.latitude, longitude: (z.longitude ?? z.logitude ?? 0) });
      } else {
        setZone(null);
      }

      const parsedSpots: Spot[] = Array.isArray(spotsJson) ? spotsJson : [];
      setSpots(parsedSpots);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load zone details:', e);
      setError('Failed to load zone details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  // Lightweight polling for live status updates
  useEffect(() => {
    if (!zoneId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/spots/zones/${zoneId}/spots`);
        const data = await res.json();
        const parsedSpots: Spot[] = Array.isArray(data) ? data : [];
        setSpots(parsedSpots);
      } catch (e) {
        // ignore intermittent polling errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [zoneId]);

  const totals = useMemo(() => {
    const total = spots.length;
    const empty = spots.filter((s) => s.status === 'empty').length;
    const reserved = spots.filter((s) => s.status === 'reserved').length;
    const occupied = spots.filter((s) => s.status === 'occupied').length;
    return { total, empty, reserved, occupied };
  }, [spots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spots
      .filter((s) => (availableOnly ? s.status === 'empty' : true))
      .filter((s) => {
        if (!q) return true;
        return (
          s.spot_number.toLowerCase().includes(q) ||
          s.lot_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.lot_name !== b.lot_name) return a.lot_name.localeCompare(b.lot_name);
        return a.spot_number.localeCompare(b.spot_number);
      });
  }, [spots, search, availableOnly]);

  const handleNavigateToSpot = (spot: Spot) => {
    if (!zone) return;
    localStorage.setItem('selectedZone', JSON.stringify({
      id: zone.id,
      name: zone.name,
      latitude: zone.latitude,
      longitude: zone.longitude,
    }));
    localStorage.setItem('selectedSpot', JSON.stringify({
      id: spot.id,
      lot_name: spot.lot_name,
      spot_number: spot.spot_number,
      is_vip: spot.is_vip,
    }));
    navigate('/dashboard/map');
  };

  const StatusBadge: React.FC<{ status: SpotStatus }> = ({ status }) => {
    const style =
      status === 'empty'
        ? 'bg-green-100 text-green-700'
        : status === 'reserved'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">{zone ? `Zone: ${zone.name}` : 'Zone'}</h2>
          <p className="text-sm text-gray-500">{totals.total} spots • {totals.empty} available • {totals.reserved} reserved • {totals.occupied} occupied</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="link" onClick={() => navigate('/dashboard/dashboard')}>Back to dashboard</Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full">
            <input
              type="text"
              placeholder="Search by spot number or lot name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
            <input type="checkbox" className="rounded" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
            Only show available
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading spots...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No spots match your filters.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((spot) => (
            <div key={spot.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-gray-800">Spot {spot.spot_number}</h4>
                  {spot.is_vip && (<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">VIP</span>)}
                </div>
                <StatusBadge status={spot.status} />
              </div>
              <div className="text-sm text-gray-600">{spot.lot_name}</div>
              <Button
                className="mt-1"
                onClick={() => handleNavigateToSpot(spot)}
                disabled={spot.status === 'occupied'}
              >
                {spot.status === 'occupied' ? 'Occupied' : 'Navigate to this spot'}
              </Button>
              <p className="text-xs text-gray-500">Navigation guides you to the zone entrance. Follow signage to your spot.</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZoneDetails;



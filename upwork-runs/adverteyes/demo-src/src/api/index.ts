import axios from 'axios';

const BASE = (import.meta.env.VITE_API_URL as string) ?? 'https://api.michaelwegter.com/adverteyes';

export const api = axios.create({ baseURL: BASE });

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ae_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → clear token and reload to login ONLY if a token existed (session expired).
// If there was no token (user is unauthenticated / on login page), do NOT redirect —
// that would create an infinite reload loop when AlertsContext fires unauthenticated requests.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const hadToken = !!localStorage.getItem('ae_token');
      localStorage.removeItem('ae_token');
      if (hadToken) {
        window.location.href = '/demos/adverteyes/';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'sales' | 'ops' | 'client';
  active?: number;
}

export interface Unit {
  id: number;
  name: string;
  type: 'billboard' | 'dooh' | 'truckside';
  subtype?: string;
  location_desc?: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  width_ft?: number;
  height_ft?: number;
  illuminated?: number;
  digital?: number;
  monthly_rate: number;
  weekly_impressions?: number;
  status: 'available' | 'booked' | 'maintenance';
  notes?: string;
}

export interface Campaign {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  budget?: number;
  notes?: string;
  booking_count?: number;
  booked_value?: number;
}

export interface Booking {
  id: number;
  campaign_id: number;
  campaign_name?: string;
  client_name?: string;
  unit_id: number;
  unit_name?: string;
  unit_type?: string;
  city?: string;
  location_desc?: string;
  start_date: string;
  end_date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  monthly_rate: number;
  notes?: string;
}

export interface WeatherData {
  unit: { id: number; name: string; city: string; lat: number; lng: number };
  current: {
    temperature: number;
    wind_speed: number;
    wind_gusts: number;
    precipitation: number;
    weather_code: number;
    weather_desc: string;
    install_risk: 'HIGH' | 'LOW';
    install_risk_reason: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    precipitation: number[];
    weather_code: number[];
    visibility: number[];
  };
  timezone: string;
  fetched_at: string;
  _isMock?: boolean;
}

export interface TrafficData {
  currentSpeed: number;
  freeFlowSpeed: number;
  congestionPct: number;
  confidence: number;
  roadClosure: boolean;
  trafficScore: number;
  impression_multiplier: number;
  source: 'tomtom' | 'mock';
  unit: { id: number; name: string };
}

export interface TrafficBatch {
  id: number;
  name: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  congestionPct: number;
  trafficScore: number;
  impression_multiplier: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_UNITS: Unit[] = [
  { id: 1, name: 'I-275 North Gateway', type: 'billboard', city: 'Tampa', state: 'FL', lat: 28.0854, lng: -82.4374, monthly_rate: 4200, weekly_impressions: 185000, status: 'booked', illuminated: 1, digital: 0, width_ft: 14, height_ft: 48 },
  { id: 2, name: 'I-4 West Corridor', type: 'billboard', city: 'Tampa', state: 'FL', lat: 27.9834, lng: -82.3521, monthly_rate: 3800, weekly_impressions: 162000, status: 'available', illuminated: 1, digital: 0, width_ft: 14, height_ft: 48 },
  { id: 3, name: 'Dale Mabry & Kennedy', type: 'billboard', city: 'Tampa', state: 'FL', lat: 27.9502, lng: -82.5071, monthly_rate: 5100, weekly_impressions: 210000, status: 'booked', illuminated: 1, digital: 0, width_ft: 14, height_ft: 48 },
  { id: 4, name: 'Westshore Blvd North', type: 'billboard', city: 'Tampa', state: 'FL', lat: 27.9651, lng: -82.5137, monthly_rate: 3600, weekly_impressions: 145000, status: 'available', illuminated: 1, digital: 0, width_ft: 12, height_ft: 24 },
  { id: 5, name: 'SR-60 Causeway East', type: 'billboard', city: 'Clearwater', state: 'FL', lat: 27.9654, lng: -82.7282, monthly_rate: 2900, weekly_impressions: 98000, status: 'maintenance', illuminated: 0, digital: 0, width_ft: 12, height_ft: 24 },
  { id: 9, name: 'Channelside Bay Plaza Digital', type: 'dooh', city: 'Tampa', state: 'FL', lat: 27.9435, lng: -82.4521, monthly_rate: 6500, weekly_impressions: 280000, status: 'booked', illuminated: 1, digital: 1, width_ft: 10, height_ft: 20 },
  { id: 11, name: 'Amalie Arena North Facade', type: 'dooh', city: 'Tampa', state: 'FL', lat: 27.9428, lng: -82.4512, monthly_rate: 8200, weekly_impressions: 350000, status: 'available', illuminated: 1, digital: 1, width_ft: 20, height_ft: 15 },
  { id: 12, name: "Tampa Int'l Airport Arrivals", type: 'dooh', city: 'Tampa', state: 'FL', lat: 27.9763, lng: -82.5326, monthly_rate: 9100, weekly_impressions: 420000, status: 'booked', illuminated: 1, digital: 1, width_ft: 16, height_ft: 9 },
  { id: 16, name: 'City Route Alpha: Tampa Core', type: 'truckside', city: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, monthly_rate: 2200, weekly_impressions: 75000, status: 'available', illuminated: 0, digital: 0 },
  { id: 17, name: 'Route Beta: Clearwater Beach', type: 'truckside', city: 'Clearwater', state: 'FL', lat: 27.9659, lng: -82.8001, monthly_rate: 1900, weekly_impressions: 68000, status: 'booked', illuminated: 0, digital: 0 },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'Ford Summer Sales Event', client_id: 1, client_name: 'Ford of Tampa', status: 'active', start_date: '2026-06-01', end_date: '2026-08-31', budget: 45000, booking_count: 4, booked_value: 18200 },
  { id: 2, name: 'Busch Gardens Summer Launch', client_id: 2, client_name: 'Busch Gardens', status: 'active', start_date: '2026-05-15', end_date: '2026-09-01', budget: 62000, booking_count: 6, booked_value: 31400 },
  { id: 3, name: 'Tampa General Health Q3', client_id: 3, client_name: 'Tampa General Hospital', status: 'upcoming', start_date: '2026-07-01', end_date: '2026-09-30', budget: 28000, booking_count: 3, booked_value: 12600 },
  { id: 4, name: 'Visit St. Pete Fall Push', client_id: 4, client_name: 'Visit St. Pete-Clearwater', status: 'upcoming', start_date: '2026-09-01', end_date: '2026-11-30', budget: 38000, booking_count: 2, booked_value: 9400 },
  { id: 5, name: 'Spectrum Spring 2026', client_id: 5, client_name: 'Spectrum', status: 'completed', start_date: '2026-03-01', end_date: '2026-05-31', budget: 19000, booking_count: 3, booked_value: 11700 },
];

export const MOCK_BOOKINGS: Booking[] = [
  { id: 1, campaign_id: 1, campaign_name: 'Ford Summer Sales Event', client_name: 'Ford of Tampa', unit_id: 3, unit_name: 'Dale Mabry & Kennedy', unit_type: 'billboard', city: 'Tampa', location_desc: 'SW corner', start_date: '2026-06-01', end_date: '2026-08-31', status: 'confirmed', monthly_rate: 5100 },
  { id: 2, campaign_id: 1, campaign_name: 'Ford Summer Sales Event', client_name: 'Ford of Tampa', unit_id: 1, unit_name: 'I-275 North Gateway', unit_type: 'billboard', city: 'Tampa', start_date: '2026-06-01', end_date: '2026-08-31', status: 'confirmed', monthly_rate: 4200 },
  { id: 3, campaign_id: 2, campaign_name: 'Busch Gardens Summer Launch', client_name: 'Busch Gardens', unit_id: 9, unit_name: 'Channelside Bay Plaza Digital', unit_type: 'dooh', city: 'Tampa', start_date: '2026-05-15', end_date: '2026-09-01', status: 'confirmed', monthly_rate: 6500 },
  { id: 4, campaign_id: 2, campaign_name: 'Busch Gardens Summer Launch', client_name: 'Busch Gardens', unit_id: 12, unit_name: "Tampa Int'l Airport Arrivals", unit_type: 'dooh', city: 'Tampa', start_date: '2026-05-15', end_date: '2026-09-01', status: 'confirmed', monthly_rate: 9100 },
];

export const MOCK_USERS: User[] = [
  { id: 1, email: 'admin@adverteyes.com', name: 'Alex Rivera', role: 'admin', active: 1 },
  { id: 2, email: 'sarah@adverteyes.com', name: 'Sarah Chen', role: 'sales', active: 1 },
  { id: 3, email: 'ops@adverteyes.com', name: 'Marcus Williams', role: 'ops', active: 1 },
  { id: 4, email: 'client@forddealer.com', name: 'Ford of Tampa', role: 'client', active: 1 },
];

// ─── API calls ───────────────────────────────────────────────────────────────

export const authLogin = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data as { token: string; user: User };
};

export const authMe = async (): Promise<User> => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch {
    throw new Error('unauthorized');
  }
};

export const fetchInventory = async (params?: { type?: string; status?: string; search?: string }): Promise<Unit[]> => {
  try {
    const res = await api.get('/inventory', { params });
    return res.data.inventory;
  } catch {
    return MOCK_UNITS;
  }
};

export const fetchUnit = async (id: number): Promise<{ unit: Unit; bookings: Booking[] }> => {
  try {
    const res = await api.get(`/inventory/${id}`);
    return res.data;
  } catch {
    const unit = MOCK_UNITS.find((u) => u.id === id) ?? MOCK_UNITS[0];
    return { unit, bookings: MOCK_BOOKINGS.filter((b) => b.unit_id === id) };
  }
};

export const createUnit = async (data: Partial<Unit>): Promise<Unit> => {
  const res = await api.post('/inventory', data);
  return res.data;
};

export const updateUnit = async (id: number, data: Partial<Unit>): Promise<Unit> => {
  const res = await api.put(`/inventory/${id}`, data);
  return res.data;
};

export const deleteUnit = async (id: number): Promise<void> => {
  await api.delete(`/inventory/${id}`);
};

export const fetchCampaigns = async (params?: { client_id?: number; status?: string }): Promise<Campaign[]> => {
  try {
    const res = await api.get('/campaigns', { params });
    return res.data.campaigns;
  } catch {
    return MOCK_CAMPAIGNS;
  }
};

export const fetchCampaign = async (id: number): Promise<{ campaign: Campaign; bookings: Booking[] }> => {
  try {
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  } catch {
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id) ?? MOCK_CAMPAIGNS[0];
    return { campaign, bookings: MOCK_BOOKINGS.filter((b) => b.campaign_id === id) };
  }
};

export const createCampaign = async (data: Partial<Campaign>): Promise<Campaign> => {
  const res = await api.post('/campaigns', data);
  return res.data;
};

export const updateCampaign = async (id: number, data: Partial<Campaign>): Promise<Campaign> => {
  const res = await api.put(`/campaigns/${id}`, data);
  return res.data;
};

export const fetchBookings = async (params?: { campaign_id?: number; unit_id?: number; status?: string }): Promise<Booking[]> => {
  try {
    const res = await api.get('/bookings', { params });
    return res.data.bookings;
  } catch {
    return MOCK_BOOKINGS;
  }
};

export const checkConflict = async (unit_id: number, start_date: string, end_date: string): Promise<{ conflict: boolean; detail: string | null }> => {
  try {
    const res = await api.post('/bookings/check-conflict', { unit_id, start_date, end_date });
    return res.data;
  } catch {
    return { conflict: false, detail: null };
  }
};

export const createBooking = async (data: Partial<Booking>): Promise<Booking> => {
  const res = await api.post('/bookings', data);
  return res.data;
};

export const updateBooking = async (id: number, data: Partial<Booking>): Promise<Booking> => {
  const res = await api.put(`/bookings/${id}`, data);
  return res.data;
};

export const cancelBooking = async (id: number): Promise<void> => {
  await api.delete(`/bookings/${id}`);
};

export const approveBooking = async (id: number): Promise<void> => {
  await api.put(`/bookings/${id}`, { status: 'confirmed' });
};

export const rejectBooking = async (id: number): Promise<void> => {
  await api.put(`/bookings/${id}`, { status: 'cancelled' });
};

export const fetchWeather = async (unitId: number): Promise<WeatherData> => {
  try {
    const res = await api.get(`/weather/${unitId}`);
    return res.data;
  } catch {
    return {
      unit: { id: unitId, name: 'I-275 North Gateway', city: 'Tampa', lat: 28.0854, lng: -82.4374 },
      current: { temperature: 87, wind_speed: 12, wind_gusts: 18, precipitation: 0, weather_code: 1, weather_desc: 'Mainly Clear', install_risk: 'LOW', install_risk_reason: 'Conditions favorable for installation work' },
      hourly: { time: [], temperature_2m: [], wind_speed_10m: [], precipitation: [], weather_code: [], visibility: [] },
      timezone: 'America/New_York',
      fetched_at: new Date().toISOString(),
      _isMock: true,
    };
  }
};

export const fetchTraffic = async (unitId: number): Promise<TrafficData> => {
  try {
    const res = await api.get(`/traffic/${unitId}`);
    return res.data;
  } catch {
    return { currentSpeed: 38, freeFlowSpeed: 65, congestionPct: 42, confidence: 0.85, roadClosure: false, trafficScore: 72, impression_multiplier: 1.18, source: 'mock', unit: { id: unitId, name: 'Unit' } };
  }
};

export const fetchTrafficBatch = async (): Promise<TrafficBatch[]> => {
  try {
    const res = await api.get('/traffic');
    return res.data.traffic;
  } catch {
    return MOCK_UNITS.map((u) => ({
      id: u.id,
      name: u.name,
      currentSpeed: 30 + Math.floor(Math.random() * 40),
      freeFlowSpeed: 65,
      congestionPct: 20 + Math.floor(Math.random() * 50),
      trafficScore: 60 + Math.floor(Math.random() * 35),
      impression_multiplier: 1 + Math.random() * 0.5,
    }));
  }
};

// ─── Client type + mock data ─────────────────────────────────────────────────

export interface Client {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  industry: string;
}

export const MOCK_CLIENTS: Client[] = [
  { id: 1, name: 'Ford Dealer Group Tampa',   contact: 'Jim Patterson',  email: 'jim@fordtampa.com',      phone: '813-555-0101', industry: 'Automotive' },
  { id: 2, name: 'Metro Health Network',       contact: 'Dr. Lisa Wu',    email: 'lisa@metrohealth.com',   phone: '813-555-0202', industry: 'Healthcare' },
  { id: 3, name: 'Pepsi Regional Southeast',   contact: 'Carlos Reyes',   email: 'creyes@pepsi.com',       phone: '813-555-0303', industry: 'CPG'        },
  { id: 4, name: 'Coastal Credit Union',       contact: 'Amanda Brooks',  email: 'abrooks@coastalcu.com',  phone: '813-555-0404', industry: 'Finance'    },
  { id: 5, name: 'FitCore Gym',                contact: 'Ryan Torres',    email: 'ryan@fitcore.com',       phone: '813-555-0505', industry: 'Fitness'    },
];

export const fetchClients = async (): Promise<Client[]> => {
  try { const res = await api.get('/clients'); return res.data.clients; }
  catch { return MOCK_CLIENTS; }
};

export const createClient = async (data: Partial<Client>): Promise<Client> => {
  const res = await api.post('/clients', data);
  return res.data;
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const res = await api.get('/users');
    return res.data.users;
  } catch {
    return MOCK_USERS;
  }
};

export const createUser = async (data: { email: string; password: string; name: string; role: string }): Promise<User> => {
  const res = await api.post('/users', data);
  return res.data;
};

export const updateUser = async (id: number, data: Partial<User & { password?: string }>): Promise<User> => {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
};

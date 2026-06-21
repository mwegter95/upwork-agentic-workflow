import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchBookings, fetchCampaigns } from '../api';
import { useAuth } from './AuthContext';

export interface AlertsValue {
  pendingBookings: number;
  highRiskUnits: number;      // weather HIGH risk, from static fleet quick data
  expiringSoon: number;       // active campaigns ending within 30 days
  maintenanceUnits: number;   // set by Dashboard
  total: number;
  setMaintenanceUnits: (n: number) => void;
}

const AlertsContext = createContext<AlertsValue>({
  pendingBookings: 0, highRiskUnits: 2, expiringSoon: 0, maintenanceUnits: 0, total: 2,
  setMaintenanceUnits: () => {},
});

export function useAlerts() { return useContext(AlertsContext); }

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pendingBookings, setPending] = useState(0);
  const [expiringSoon, setExpiring] = useState(0);
  const [maintenanceUnits, setMaintenanceUnits] = useState(0);
  const HIGH_RISK = 2; // SR-60 Causeway East + Clearwater Beachfront (from Weather fleet)

  useEffect(() => {
    // Only fetch when authenticated — avoids 401s on the login page
    if (!user) return;
    Promise.all([fetchBookings(), fetchCampaigns()]).then(([bookings, campaigns]) => {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setPending(bookings.filter((b) => b.status === 'pending').length);
      setExpiring(
        campaigns.filter((c) => {
          const end = new Date(c.end_date);
          return c.status === 'active' && end >= now && end <= in30;
        }).length
      );
    }).catch(() => {});
  }, [user]);

  const total = pendingBookings + HIGH_RISK + expiringSoon + maintenanceUnits;

  return (
    <AlertsContext.Provider value={{
      pendingBookings, highRiskUnits: HIGH_RISK, expiringSoon, maintenanceUnits,
      total, setMaintenanceUnits,
    }}>
      {children}
    </AlertsContext.Provider>
  );
}

import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { get } from "./api";
import type { Me, User } from "./types";
import { NotificationsProvider } from "./components/Notifications";
import { ClientLayout, TeamLayout } from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import Help from "./pages/Help";
import Revisions from "./pages/Revisions";
import More from "./pages/More";
import Plan from "./pages/Plan";
import Refer from "./pages/Refer";
import Inbox from "./pages/team/Inbox";
import Clients from "./pages/team/Clients";
import ClientDetail from "./pages/team/ClientDetail";
import NewClient from "./pages/team/NewClient";

const MeCtx = createContext<{ me: User | null; info: Me | null; setMe: (u: User | null) => void; reload: () => void }>(null!);
export const useMe = () => useContext(MeCtx);

export default function App() {
  const [info, setInfo] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = () => get<Me>("/me").then(setInfo).catch(() => setInfo({ user: null })).finally(() => setLoading(false));
  useEffect(() => { reload(); }, []);

  if (loading) return <div className="login"><div className="empty">Loading…</div></div>;
  const me = info?.user ?? null;
  const setMe = (u: User | null) => (u ? reload() : setInfo({ user: null }));

  return (
    <MeCtx.Provider value={{ me, info, setMe, reload }}>
      {!me ? (
        <Login />
      ) : (
        <NotificationsProvider key={me.id}>
          {me.role === "team" ? (
            <Routes>
              <Route path="/team" element={<TeamLayout />}>
                <Route index element={<Inbox />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/:id" element={<ClientDetail />} />
                <Route path="new" element={<NewClient />} />
              </Route>
              <Route path="*" element={<Navigate to="/team" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route element={<ClientLayout />}>
                <Route index element={<Home />} />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="help" element={<Help />} />
                <Route path="revisions" element={<Revisions />} />
                <Route path="more" element={<More />} />
                <Route path="plan" element={<Plan />} />
                <Route path="refer" element={<Refer />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </NotificationsProvider>
      )}
    </MeCtx.Provider>
  );
}

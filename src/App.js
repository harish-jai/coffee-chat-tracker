import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Home from './pages/Home';
import NewChat from './pages/NewChat';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import ChatNotes from './pages/ChatNotes';
import './styles/base.css';

function App() {
  const [session, setSession] = useState(null);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkPreferences() {
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('first_name')
            .eq('user_id', session.user.id)
            .single();

          if (error) throw error;
          setHasPreferences(!!data?.first_name);
        } catch (error) {
          console.error('Error checking preferences:', error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    checkPreferences();
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {!session ? (
          <Route path="*" element={<Login />} />
        ) : !hasPreferences ? (
          <Route path="*" element={<Onboarding session={session} />} />
        ) : (
          <>
            <Route path="/" element={<Home session={session} />} />
            <Route path="/new-chat" element={<NewChat session={session} />} />
            <Route path="/chat/:chatId" element={<ChatNotes session={session} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;

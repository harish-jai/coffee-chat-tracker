import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../styles/Home.module.css';

export default function Home({ session }) {
  const [chats, setChats] = useState([]);
  const [firstName, setFirstName] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user preferences to get the first name
        const { data: preferences, error: prefsError } = await supabase
          .from('user_preferences')
          .select('first_name')
          .eq('user_id', session.user.id)
          .single();

        if (prefsError) throw prefsError;
        if (preferences?.first_name) {
          setFirstName(preferences.first_name);
        }

        // Fetch chats
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select(`
            chat_id,
            datetime,
            location,
            status,
            person:people (
              name,
              role,
              custom_company_name,
              company:companies(name)
            )
          `)
          .eq('user_id', session.user.id)
          .order('datetime', { ascending: true });

        if (chatsError) throw chatsError;
        setChats(chatsData);
      } catch (error) {
        console.error('Error loading data:', error.message);
      }
    };

    fetchUserData();
  }, [session.user.id]);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.header}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome back{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className={styles.welcomeSubtitle}>Here are your upcoming coffee chats</p>
        </div>
        <button onClick={handleLogout} className="button button-secondary">Logout</button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{chats.length}</div>
          <div className={styles.statLabel}>Upcoming Chats</div>
        </div>
      </div>

      <div className={styles.addChatButtonContainer}>
        <Link to="/new-chat" className={styles.addChatButton}>
          <span>+</span> Schedule New Chat
        </Link>
      </div>

      <h2 className={styles.sectionTitle}>Upcoming Chats</h2>
      <div className={styles.chatsList}>
        {chats.map(chat => {
          const p = chat.person;
          const company = p?.company?.name || p?.custom_company_name || 'Unknown';

          return (
            <Link
              to={`/chat/${chat.chat_id}`}
              key={chat.chat_id}
              className={`${styles.chatCard} ${styles.clickable}`}
            >
              <div className={styles.chatInfo}>
                <div className={styles.chatPerson}>{p?.name}</div>
                <div className={styles.chatCompany}>{p?.role || 'Unknown role'} at {company}</div>
                <div className={styles.chatMeta}>
                  <span>{chat.datetime}</span>
                  <span>•</span>
                  <span>{chat.location || 'Virtual'}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

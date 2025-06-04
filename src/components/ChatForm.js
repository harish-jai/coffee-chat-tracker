import { useState } from 'react';
import { supabase } from '../supabaseClient';
import PersonSelect from './PersonSelect';
import styles from '../styles/components/ChatForm.module.css';

export default function ChatForm({ onChatCreated, session }) {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [chatDetails, setChatDetails] = useState({
    datetime: '',
    location: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPerson) {
      alert('Please select a person');
      return;
    }

    if (!chatDetails.datetime) {
      alert('Please select a date and time');
      return;
    }

    if (!session?.user) {
      alert('Please sign in to create a chat');
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: session.user.id,
        person_id: selectedPerson.person_id,
        ...chatDetails,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      onChatCreated(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.chatForm}>
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Who are you meeting with?</h3>
        <PersonSelect
          onSelect={setSelectedPerson}
          userId={session?.user?.id}
        />
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>When and where?</h3>
        <div className={styles.dateTimeGroup}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Date & Time</label>
            <input
              type="datetime-local"
              value={chatDetails.datetime}
              onChange={(e) => setChatDetails({ ...chatDetails, datetime: e.target.value })}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              value={chatDetails.location}
              onChange={(e) => setChatDetails({ ...chatDetails, location: e.target.value })}
              placeholder="e.g. Zoom, Coffee Shop, etc."
              className={styles.input}
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Additional Notes</h3>
        <div className={styles.formGroup}>
          <textarea
            value={chatDetails.notes}
            onChange={(e) => setChatDetails({ ...chatDetails, notes: e.target.value })}
            placeholder="Add any preparation notes, topics to discuss, or follow-up items..."
            className={`${styles.input} ${styles.textarea}`}
          />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" onClick={() => window.history.back()} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" className={styles.submitButton}>
          Schedule Chat
        </button>
      </div>
    </form>
  );
}

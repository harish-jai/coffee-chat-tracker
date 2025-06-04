import ChatForm from '../components/ChatForm';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/NewChat.module.css';

export default function NewChat({ session }) {
  const navigate = useNavigate();

  return (
    <div className={styles.newChatContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Schedule a New Chat</h1>
        <p className={styles.pageDescription}>Fill in the details to schedule your coffee chat</p>
      </div>
      <ChatForm
        session={session}
        onChatCreated={(chat) => {
          alert('Chat created successfully!');
          navigate('/');
        }}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/ChatNotes.css';

const ChatNotes = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [chatData, setChatData] = useState(null);
    const [notes, setNotes] = useState({
        background: '',
        dayToDay: '',
        advice: '',
        culture: '',
        keyQuotes: '',
        personalTakeaways: ''
    });
    const [tags, setTags] = useState([]);
    const [isInterviewRelevant, setIsInterviewRelevant] = useState(false);
    const [summary, setSummary] = useState('');

    useEffect(() => {
        fetchChatData();
    }, [chatId]);

    const fetchChatData = async () => {
        try {
            // Fetch chat data with person and note details
            const { data: chat, error } = await supabase
                .from('chats')
                .select(`
                    *,
                    person:person_id (
                        name,
                        linkedin,
                        role,
                        company:company_id (
                            name
                        )
                    ),
                    note:note_id (
                        sections,
                        tags,
                        is_interview_relevant,
                        summary
                    )
                `)
                .eq('chat_id', chatId)
                .single();

            if (error) throw error;
            setChatData(chat);

            // Set notes data if it exists
            if (chat.note) {
                setNotes(chat.note.sections || {});
                setTags(chat.note.tags || []);
                setIsInterviewRelevant(chat.note.is_interview_relevant || false);
                setSummary(chat.note.summary || '');
            } else {
                // Create a new note if one doesn't exist
                const { data: newNote, error: noteError } = await supabase
                    .from('notes')
                    .insert({
                        chat_id: chatId,
                        person_id: chat.person_id,
                        company_id: chat.person.company.company_id,
                        sections: notes,
                        tags: [],
                        is_interview_relevant: false
                    })
                    .select()
                    .single();

                if (noteError) throw noteError;

                // Update the chat with the new note_id
                const { error: updateError } = await supabase
                    .from('chats')
                    .update({ note_id: newNote.note_id })
                    .eq('chat_id', chatId);

                if (updateError) throw updateError;
            }
        } catch (error) {
            console.error('Error fetching chat data:', error);
        }
    };

    const handleNotesChange = async (section, value) => {
        const updatedNotes = { ...notes, [section]: value };
        setNotes(updatedNotes);

        try {
            const { error } = await supabase
                .from('notes')
                .update({
                    sections: updatedNotes,
                    tags,
                    is_interview_relevant: isInterviewRelevant,
                })
                .eq('chat_id', chatId);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    };

    const toggleInterviewRelevant = async (value) => {
        setIsInterviewRelevant(value);
        try {
            const { error } = await supabase
                .from('notes')
                .update({
                    is_interview_relevant: value
                })
                .eq('chat_id', chatId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating interview relevance:', error);
        }
    };

    if (!chatData) return <div>Loading...</div>;

    const { person } = chatData;

    return (
        <div className="chat-notes-container">
            {/* Header Section */}
            <header className="chat-notes-header">
                <div className="person-info">
                    <h1>
                        <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
                            {person.name}
                        </a>
                    </h1>
                    <h2>{person.role} • {person.company?.name}</h2>
                    <div className="chat-metadata">
                        <span>{new Date(chatData.datetime).toLocaleString()}</span>
                        <span>{chatData.location || 'Virtual'}</span>
                        <span>Status: {chatData.status}</span>
                    </div>
                </div>
            </header>

            {/* Main Notes Section */}
            <div className="notes-sections">
                <section>
                    <h3>Background</h3>
                    <textarea
                        value={notes.background || ''}
                        onChange={(e) => handleNotesChange('background', e.target.value)}
                        placeholder="How did they get into their current role/company?"
                    />
                </section>

                <section>
                    <h3>Day-to-Day</h3>
                    <textarea
                        value={notes.dayToDay || ''}
                        onChange={(e) => handleNotesChange('dayToDay', e.target.value)}
                        placeholder="What are their main responsibilities and challenges?"
                    />
                </section>

                <section>
                    <h3>Advice</h3>
                    <textarea
                        value={notes.advice || ''}
                        onChange={(e) => handleNotesChange('advice', e.target.value)}
                        placeholder="What career advice or interview tips did they share?"
                    />
                </section>

                <section>
                    <h3>Culture</h3>
                    <textarea
                        value={notes.culture || ''}
                        onChange={(e) => handleNotesChange('culture', e.target.value)}
                        placeholder="What's the team culture and work environment like?"
                    />
                </section>

                <section>
                    <h3>Key Quotes</h3>
                    <textarea
                        value={notes.keyQuotes || ''}
                        onChange={(e) => handleNotesChange('keyQuotes', e.target.value)}
                        placeholder="Any memorable quotes or specific insights?"
                    />
                </section>

                <section>
                    <h3>Personal Takeaways</h3>
                    <textarea
                        value={notes.personalTakeaways || ''}
                        onChange={(e) => handleNotesChange('personalTakeaways', e.target.value)}
                        placeholder="What are your main reflections from this conversation?"
                    />
                </section>
            </div>

            {/* AI Summary Section */}
            <div className="ai-summary-section">
                <h3>AI Summary</h3>
                {summary ? (
                    <p>{summary}</p>
                ) : (
                    <p className="placeholder-text">
                        Your summary will appear here after the chat is transcribed and processed.
                    </p>
                )}
            </div>

            {/* Footer Actions */}
            <footer className="chat-notes-footer">
                <div className="footer-actions">
                    <label>
                        <input
                            type="checkbox"
                            checked={isInterviewRelevant}
                            onChange={(e) => toggleInterviewRelevant(e.target.checked)}
                        />
                        Relevant for Interviews
                    </label>
                    <button onClick={() => navigate('/')}>Back to Dashboard</button>
                </div>
            </footer>
        </div>
    );
};

export default ChatNotes; 
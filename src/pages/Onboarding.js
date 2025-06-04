import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from '../styles/Onboarding.module.css';

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Consulting',
    'Manufacturing', 'Retail', 'Media', 'Non-profit', 'Real Estate',
    'Energy', 'Transportation', 'Entertainment', 'Agriculture', 'Other'
];

const ROLES = [
    'Software Engineer', 'Product Manager', 'Data Scientist',
    'Designer', 'Marketing', 'Sales', 'Operations', 'Finance',
    'Human Resources', 'Business Development', 'Consulting',
    'Research', 'Engineering Manager', 'Executive', 'Other'
];

export default function Onboarding({ session }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        first_name: '',
        last_name: '',
        interests: [],
        goals: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferred_roles: [],
        preferred_industries: [],
        weekly_target: 1,
    });

    const handleInterestAdd = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newInterest = e.target.value.trim();
            if (newInterest && !preferences.interests.includes(newInterest)) {
                setPreferences(prev => ({
                    ...prev,
                    interests: [...prev.interests, newInterest]
                }));
                e.target.value = '';
            }
        }
    };

    const handleInterestRemove = (interest) => {
        setPreferences(prev => ({
            ...prev,
            interests: prev.interests.filter(i => i !== interest)
        }));
    };

    const toggleSelection = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value]
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!preferences.first_name || !preferences.last_name) {
                throw new Error('Please provide your first and last name');
            }

            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: session.user.id,
                    ...preferences
                })
                .eq('user_id', session.user.id);

            if (error) throw error;

            alert('Setup completed successfully! Welcome to Coffee Chat Tracker.');
            navigate('/');
        } catch (error) {
            alert('Error saving preferences: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const validateStep = () => {
        switch (step) {
            case 1:
                if (!preferences.first_name.trim() || !preferences.last_name.trim()) {
                    alert('Please enter both your first and last name');
                    return false;
                }
                return true;
            case 2:
                if (!preferences.goals.trim()) {
                    alert('Please describe your career goals');
                    return false;
                }
                if (preferences.interests.length === 0) {
                    alert('Please add at least one interest');
                    return false;
                }
                return true;
            case 3:
                if (preferences.preferred_roles.length === 0) {
                    alert('Please select at least one role that interests you');
                    return false;
                }
                return true;
            case 4:
                if (preferences.preferred_industries.length === 0) {
                    alert('Please select at least one industry that interests you');
                    return false;
                }
                return true;
            case 5:
                if (!preferences.weekly_target || preferences.weekly_target < 1) {
                    alert('Please set a valid weekly target (minimum 1)');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className={styles.step}>
                        <h2>Welcome! Let's get to know you</h2>
                        <div className={styles.formGroup}>
                            <label>First Name</label>
                            <input
                                type="text"
                                value={preferences.first_name}
                                onChange={(e) => setPreferences(prev => ({ ...prev, first_name: e.target.value }))}
                                placeholder="Your first name"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={preferences.last_name}
                                onChange={(e) => setPreferences(prev => ({ ...prev, last_name: e.target.value }))}
                                placeholder="Your last name"
                                required
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className={styles.step}>
                        <h2>What are your career interests?</h2>
                        <div className={styles.formGroup}>
                            <label>Add your interests (press Enter to add)</label>
                            <input
                                type="text"
                                placeholder="e.g. Machine Learning, Product Strategy, UX Design"
                                onKeyDown={handleInterestAdd}
                                autoComplete="off"
                                name="interests-input"
                                form=""
                            />
                            <div className={styles.tagContainer}>
                                {preferences.interests.map(interest => (
                                    <span key={interest} className={styles.tag}>
                                        {interest}
                                        <button onClick={() => handleInterestRemove(interest)}>&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>What are your career goals?</label>
                            <textarea
                                value={preferences.goals}
                                onChange={(e) => setPreferences(prev => ({ ...prev, goals: e.target.value }))}
                                placeholder="Describe your career goals and what you hope to achieve through networking"
                                rows={4}
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className={styles.step}>
                        <h2>What roles interest you?</h2>
                        <div className={styles.selectionGrid}>
                            {ROLES.map(role => (
                                <button
                                    key={role}
                                    className={`${styles.selectionButton} ${preferences.preferred_roles.includes(role) ? styles.selected : ''}`}
                                    onClick={() => toggleSelection('preferred_roles', role)}
                                    type="button"
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className={styles.step}>
                        <h2>Which industries interest you?</h2>
                        <div className={styles.selectionGrid}>
                            {INDUSTRIES.map(industry => (
                                <button
                                    key={industry}
                                    className={`${styles.selectionButton} ${preferences.preferred_industries.includes(industry) ? styles.selected : ''}`}
                                    onClick={() => toggleSelection('preferred_industries', industry)}
                                    type="button"
                                >
                                    {industry}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className={styles.step}>
                        <h2>Set your networking goals</h2>
                        <div className={styles.formGroup}>
                            <label>How many coffee chats would you like to have per week?</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={preferences.weekly_target}
                                onChange={(e) => setPreferences(prev => ({ ...prev, weekly_target: parseInt(e.target.value) }))}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Your timezone</label>
                            <select
                                value={preferences.timezone}
                                onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                            >
                                {Intl.supportedValuesOf('timeZone').map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${(step / 5) * 100}%` }} />
            </div>

            <form onSubmit={(e) => {
                e.preventDefault();
                if (!validateStep()) {
                    return;
                }
                if (step < 5) {
                    setStep(step + 1);
                } else {
                    handleSubmit();
                }
            }}>
                {renderStep()}

                <div className={styles.buttons}>
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className={styles.backButton}
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="submit"
                        className={styles.nextButton}
                        disabled={loading}
                    >
                        {step === 5 ? (loading ? 'Saving...' : 'Complete Setup') : 'Next'}
                    </button>
                </div>
            </form>
        </div>
    );
} 
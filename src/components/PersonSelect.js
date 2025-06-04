import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import CompanySelectDropdown from './CompanySelectDropdown';
import styles from '../styles/components/PersonSelect.module.css';

export default function PersonSelect({ onSelect, userId }) {
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPerson, setNewPerson] = useState({
    name: '',
    role: '',
    company_id: null,
    custom_company_name: null,
    linkedin_url: '',
  });
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [urlError, setUrlError] = useState('');

  // Validate LinkedIn URL
  const validateLinkedInUrl = (url) => {
    if (!url) return true; // Empty URL is valid
    const linkedInPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
    return linkedInPattern.test(url);
  };

  // Handle LinkedIn URL change
  const handleLinkedInChange = (e) => {
    const url = e.target.value;
    setNewPerson(prev => ({ ...prev, linkedin_url: url }));

    if (url && !validateLinkedInUrl(url)) {
      setUrlError('Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)');
    } else {
      setUrlError('');
    }
  };

  // Fetch all people belonging to the current user
  useEffect(() => {
    if (!userId) return;

    const fetchPeople = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase
          .from('people')
          .select('*, companies(name)')
          .eq('user_id', userId);
        setPeople(data || []);
      } catch (error) {
        console.error('Error fetching people:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPeople();
  }, [userId]);

  // Filter people based on search term
  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.custom_company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle creating a new person
  const handleCreate = async () => {
    if (!newPerson.name.trim()) {
      alert('Name is required');
      return;
    }

    if (newPerson.linkedin_url && !validateLinkedInUrl(newPerson.linkedin_url)) {
      alert('Please enter a valid LinkedIn URL');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('people')
        .insert({ ...newPerson, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      setPeople([...people, data]);
      setSelectedId(data.person_id);
      onSelect(data);
      setNewPerson({
        name: '',
        role: '',
        company_id: null,
        custom_company_name: null,
        linkedin_url: '',
      });
      setUrlError('');
    } catch (error) {
      alert(error?.message || 'Error creating person');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.personSelect}>
        <div className={styles.loadingState}>
          <div className={styles.skeleton} style={{ width: '60%' }} />
          <div className={styles.skeleton} style={{ width: '80%' }} />
          <div className={styles.skeleton} style={{ width: '70%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.personSelect}>
      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name, role, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.dropdown}>
        {filteredPeople.length > 0 ? (
          filteredPeople.map(p => (
            <div
              key={p.person_id}
              className={`${styles.option} ${selectedId === p.person_id ? styles.selected : ''}`}
              onClick={() => {
                setSelectedId(p.person_id);
                onSelect(p);
              }}
            >
              <div className={styles.personInfo}>
                <div className={styles.personName}>{p.name}</div>
                <div className={styles.personMeta}>
                  {p.role || 'Unknown'} @ {p.companies?.name || p.custom_company_name || 'Unknown'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <span className={styles.noResultsIcon}>👤</span>
            <div>
              {searchTerm
                ? 'No people found matching your search.'
                : 'No people found. Add someone new below.'}
            </div>
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <input
          className={styles.input}
          value={newPerson.name}
          onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
          placeholder="Name"
        />
        <input
          className={styles.input}
          value={newPerson.role}
          onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
          placeholder="Role"
        />

        <CompanySelectDropdown
          onChange={({ company_id, custom_company_name }) =>
            setNewPerson(prev => ({
              ...prev,
              company_id,
              custom_company_name,
            }))
          }
        />

        <div className={styles.linkedinField}>
          <input
            className={`${styles.input} ${urlError ? styles.inputError : ''}`}
            value={newPerson.linkedin_url}
            onChange={handleLinkedInChange}
            placeholder="LinkedIn URL (optional, needed for AI-generated questions)"
          />
          {urlError && <div className={styles.errorMessage}>{urlError}</div>}
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className={styles.addButton}
          disabled={!newPerson.name.trim() || (newPerson.linkedin_url && !validateLinkedInUrl(newPerson.linkedin_url))}
        >
          <span>➕</span> Add Person
        </button>
      </div>
    </div>
  );
}

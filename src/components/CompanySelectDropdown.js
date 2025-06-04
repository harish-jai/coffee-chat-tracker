import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from '../styles/components/CompanySelectDropdown.module.css';

export default function CompanySelectDropdown({ onChange }) {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [customCompany, setCustomCompany] = useState('');

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .then(({ data }) => setCompanies(data || []));
  }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (company) => {
    setSelectedCompany(company);
    setIsOpen(false);
    onChange({ company_id: company.company_id, custom_company_name: null });
  };

  const handleCustomCompany = () => {
    setSelectedCompany(null);
    setIsOpen(false);
    onChange({ company_id: null, custom_company_name: customCompany });
  };

  return (
    <div className={styles.companySelect}>
      <button
        type="button"
        className={styles.selectButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCompany ? selectedCompany.name : customCompany || 'Select Company'}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {filteredCompanies.map(company => (
            <div
              key={company.company_id}
              className={`${styles.option} ${selectedCompany?.company_id === company.company_id ? styles.selected : ''}`}
              onClick={() => handleSelect(company)}
            >
              {company.logo_url && (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className={styles.companyLogo}
                />
              )}
              <div>
                <div className={styles.companyName}>{company.name}</div>
                {company.industry && (
                  <div className={styles.companyMeta}>{company.industry}</div>
                )}
              </div>
            </div>
          ))}

          <div className={styles.option}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Or enter custom company..."
              value={customCompany}
              onChange={(e) => setCustomCompany(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomCompany()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import EmployeeList from './EmployeeList';
import BookingModal from './BookingModal';
import { getEmployees } from '../services/api';

function Home({ user, isAuthenticated, onLogout }) {
  const navigate = useNavigate();
  const [allEmployees, setAllEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expertType, setExpertType] = useState('Psychologists');
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setAllEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Filter employees based on expertType
  useEffect(() => {
    if (allEmployees.length === 0) {
      setFilteredEmployees([]);
      return;
    }
    
    // Map expert types to employee name patterns
    const expertTypeMap = {
      'Psychiatrist': ['Priyanka'],
      'Psychologists': ['Psychologist'],
      'Child and Youth Expert': ['Mitali', 'Prithvi', 'Priyanka', 'Ramandeep'],
      'Couples Therapist': ['Sunil', 'Ritu', 'Mitali', 'Vanita'],
      'Career Counseling': ['Mitali', 'Priyanka', 'Ramandeep']
    };
    
    const namePatterns = expertTypeMap[expertType] || [];
    
    const filtered = allEmployees.filter(employee => {
      if (!employee.name) return false;
      
      // For Psychologists, check title (backward compatibility)
      if (expertType === 'Psychologists') {
        return employee.title && employee.title.toLowerCase().includes('psychologist');
      }
      
      // For other categories, check if employee name matches any pattern
      return namePatterns.some(pattern => 
        employee.name.toLowerCase().includes(pattern.toLowerCase())
      );
    });
    
    console.log(`Filtered ${filtered.length} employees for expert type: ${expertType}`);
    console.log('Name patterns:', namePatterns);
    console.log('Filtered employees:', filtered.map(e => e.name + ' - ' + e.title));
    setFilteredEmployees(filtered);
  }, [expertType, allEmployees]);

  const handleBookClick = (employee) => {
    if (!isAuthenticated) {
      // Redirect to login with return path
      navigate(`/login?redirect=/employee/${employee._id}`, {
        state: {
          from: `/employee/${employee._id}`,
          message: 'Please login to book a session'
        }
      });
      return;
    }
    setSelectedEmployee(employee);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedEmployee(null);
    loadEmployees();
  };

  return (
    <div className="app">
      <main className="main-content">
        <div className="breadcrumbs">
          <span>Home / Employees</span>
        </div>

        <div className="hero-section">
          <h2 className="hero-title">Find an expert who understands your needs.</h2>
          
          <div className="expert-type-selector">
            <button 
              className={expertType === 'Psychiatrist' ? 'active' : ''}
              onClick={() => setExpertType('Psychiatrist')}
            >
              Psychiatrist
            </button>
            <button 
              className={expertType === 'Psychologists' ? 'active' : ''}
              onClick={() => setExpertType('Psychologists')}
            >
              Psychologists
            </button>
            <button 
              className={expertType === 'Child and Youth Expert' ? 'active' : ''}
              onClick={() => setExpertType('Child and Youth Expert')}
            >
              Child and Youth Expert
            </button>
            <button 
              className={expertType === 'Couples Therapist' ? 'active' : ''}
              onClick={() => setExpertType('Couples Therapist')}
            >
              Couples Therapist
            </button>
            <button 
              className={expertType === 'Career Counseling' ? 'active' : ''}
              onClick={() => setExpertType('Career Counseling')}
            >
              Career Counseling
            </button>
          </div>
        </div>

        <div className="employees-section">
          {loading ? (
            <div className="skeleton-loading">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-subtitle"></div>
                    <div className="skeleton-line skeleton-text"></div>
                    <div className="skeleton-line skeleton-text short"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmployeeList 
              employees={filteredEmployees}
              onBookClick={handleBookClick}
            />
          )}
        </div>
      </main>

      {showBookingModal && selectedEmployee && (
        <BookingModal
          employee={selectedEmployee}
          onClose={() => setShowBookingModal(false)}
          onBookingSuccess={handleBookingSuccess}
          isAuthenticated={isAuthenticated}
          user={user}
        />
      )}
    </div>
  );
}

export default Home;

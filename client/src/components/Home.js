import React, { useState, useEffect } from 'react';
import '../App.css';
import EmployeeList from './EmployeeList';
import EmployeeCard from './EmployeeCard';
import BookingModal from './BookingModal';
import { getEmployees, getAuthToken } from '../services/api';

function Home({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filters, setFilters] = useState({
    center: '',
    expertise: '',
    languages: '',
    price: '',
    gender: ''
  });
  const [expertType, setExpertType] = useState('Psychiatrist');

  useEffect(() => {
    loadEmployees();
  }, [filters]);

  const loadEmployees = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const data = await getEmployees(queryParams.toString());
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleBookClick = (employee) => {
    setSelectedEmployee(employee);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedEmployee(null);
    loadEmployees();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
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
              className={expertType === 'Therapist' ? 'active' : ''}
              onClick={() => setExpertType('Therapist')}
            >
              Therapist
            </button>
            <button 
              className={expertType === 'Psychiatrist' ? 'active' : ''}
              onClick={() => setExpertType('Psychiatrist')}
            >
              Psychiatrist
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
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-row">
            <select 
              className="filter-select"
              value={filters.center}
              onChange={(e) => handleFilterChange('center', e.target.value)}
            >
              <option value="">Select Centre</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chandigarh">Chandigarh</option>
            </select>

            <select 
              className="filter-select"
              value={filters.expertise}
              onChange={(e) => handleFilterChange('expertise', e.target.value)}
            >
              <option value="">Expertise</option>
              <option value="Anxiety disorders">Anxiety disorders</option>
              <option value="Depressive disorders">Depressive disorders</option>
              <option value="Bipolar disorder">Bipolar disorder</option>
              <option value="OCD">OCD</option>
              <option value="Schizophrenia">Schizophrenia</option>
              <option value="Sleep disorders">Sleep disorders</option>
            </select>

            <select 
              className="filter-select"
              value={filters.languages}
              onChange={(e) => handleFilterChange('languages', e.target.value)}
            >
              <option value="">Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
              <option value="Kannada">Kannada</option>
              <option value="Malayalam">Malayalam</option>
            </select>

            <select 
              className="filter-select"
              value={filters.price}
              onChange={(e) => handleFilterChange('price', e.target.value)}
            >
              <option value="">Price</option>
              <option value="0-1500">₹0 - ₹1500</option>
              <option value="1500-2000">₹1500 - ₹2000</option>
              <option value="2000-2500">₹2000 - ₹2500</option>
              <option value="2500-3000">₹2500+</option>
            </select>

            <select 
              className="filter-select"
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="employees-section">
          <EmployeeList 
            employees={filteredEmployees}
            onBookClick={handleBookClick}
          />
        </div>
      </main>

      {showBookingModal && selectedEmployee && (
        <BookingModal
          employee={selectedEmployee}
          onClose={() => setShowBookingModal(false)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

export default Home;

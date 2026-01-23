import React from 'react';
import EmployeeCard from './EmployeeCard';
import './EmployeeList.css';

function EmployeeList({ employees, onBookClick }) {
  if (employees.length === 0) {
    return (
      <div className="no-employees">
        <p>No employees found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="employee-list">
      {employees.map(employee => (
        <EmployeeCard
          key={employee._id}
          employee={employee}
          onBookClick={onBookClick}
        />
      ))}
    </div>
  );
}

export default EmployeeList;

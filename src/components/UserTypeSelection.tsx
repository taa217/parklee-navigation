import React from 'react';

interface UserTypeSelectionProps {
  isOpen: boolean;
  onSelectUserType: (type: 'staff' | 'visitor' | 'student') => void;
  onSkip: () => void;
}

const UserTypeSelection: React.FC<UserTypeSelectionProps> = ({ isOpen, onSelectUserType, onSkip }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Select Your Role</h2>
        <div className="space-y-3">
          <button
            onClick={() => onSelectUserType('staff')}
            className="w-full py-2 px-4 bg-blue-100 hover:bg-blue-200 rounded-lg"
          >
            Staff
          </button>
          <button
            onClick={() => onSelectUserType('student')}
            className="w-full py-2 px-4 bg-green-100 hover:bg-green-200 rounded-lg"
          >
            Student
          </button>
          <button
            onClick={() => onSelectUserType('visitor')}
            className="w-full py-2 px-4 bg-purple-100 hover:bg-purple-200 rounded-lg"
          >
            Visitor
          </button>
        </div>
        <button
          onClick={onSkip}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Skip and continue as visitor
        </button>
      </div>
    </div>
  );
};

export default UserTypeSelection;
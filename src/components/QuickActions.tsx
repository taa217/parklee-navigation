import React from 'react';
import Button from './ui/button';
import { Car, Calendar } from 'lucide-react';

interface QuickActionsProps {}

const QuickActions: React.FC<QuickActionsProps> = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button className="flex items-center justify-center space-x-2 py-3">
          <Car className="h-5 w-5" />
          <span>Find Nearest Spot</span>
        </Button>
        <Button className="flex items-center justify-center space-x-2 py-3">
          <Calendar className="h-5 w-5" />
          <span>View My Reservations</span>
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;


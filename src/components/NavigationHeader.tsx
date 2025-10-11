import React from 'react';
import Button from './ui/button';

interface NavigationHeaderProps {
  userRole: string;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  userRole,
  isLoggedIn,
  onLogin,
  onLogout,
  onSettings
}) => {
  return (
    <header className="flex items-center justify-between bg-white shadow-md px-6 py-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
          Parklee
        </h1>
        {userRole && (
          <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          userRole === 'guest' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Exit Guest Mode
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="text-gray-600 hover:text-blue-600"
              >
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </>
          )
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default NavigationHeader;
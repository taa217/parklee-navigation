import { ArrowLeft, Settings, User, Lock, Bell, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Arrow */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-800">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Profile Section */}
          <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-700">Account</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              <li>
                <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <User className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Profile Information</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <Lock className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Change Password</span>
                </button>
              </li>
            </ul>
          </section>

          {/* Preferences Section */}
          <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-700">Preferences</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              <li>
                <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <Bell className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Notifications</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <Settings className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Parking Preferences</span>
                </button>
              </li>
            </ul>
          </section>

          {/* Support Section */}
          <section className="mb-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-700">Support</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              <li>
                <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <HelpCircle className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Help Center</span>
                </button>
              </li>
              <li>
                <button className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors">
                  <Settings className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="text-gray-700">Terms & Privacy</span>
                </button>
              </li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
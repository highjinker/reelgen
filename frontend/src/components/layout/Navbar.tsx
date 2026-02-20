import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Film, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Film className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">ReelGen</span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
                {user.full_name}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

import { Outlet } from 'react-router-dom';
import { Film } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Film className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-3 text-center text-3xl font-bold text-gray-900">
          ReelGen
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          AI-powered Instagram Reels for Doctors
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

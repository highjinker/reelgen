import { ReelForm } from '../components/features/ReelForm';

export function CreateReelPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Reel</h1>
      <p className="text-gray-600 mb-8">
        Enter a topic and we'll generate a script for your Instagram reel.
      </p>
      <div className="bg-white rounded-lg shadow p-6">
        <ReelForm />
      </div>
    </div>
  );
}

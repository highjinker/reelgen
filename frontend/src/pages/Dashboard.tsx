import { Link } from 'react-router-dom';
import { Plus, Film } from 'lucide-react';
import { useReels } from '../hooks/useReels';
import { ReelCard } from '../components/features/ReelCard';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const { reels, total, page, loading, setPage } = useReels();
  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reels</h1>
          <p className="text-sm text-gray-600">{total} total reels</p>
        </div>
        <Link to="/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Reel
          </Button>
        </Link>
      </div>

      {loading && reels.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-12">
          <Film className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No reels yet</h3>
          <p className="text-gray-500 mb-4">Create your first AI-generated reel</p>
          <Link to="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Reel
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { 
  Lightbulb, 
  Sparkles,
  AlertCircle,
  Folder,
  Loader2
} from 'lucide-react';

interface Idea {
  id: string;
  content: string;
  category?: string;
  title?: string;
  notes?: string;
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIdeas() {
      try {
        const res = await fetch('/api/vm/ideas');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load ideas');
        }
        const data = await res.json();
        setIdeas(data.ideas || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ideas');
      } finally {
        setLoading(false);
      }
    }
    fetchIdeas();
  }, []);

  // Group ideas by category
  const categories = ideas.reduce((acc, idea) => {
    const cat = idea.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(idea);
    return acc;
  }, {} as Record<string, Idea[]>);

  const categoryNames = Object.keys(categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ideas</h1>
        <p className="text-slate-500">Your idea backlog and inspiration</p>
      </div>

      {/* Stats */}
      {ideas.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Folder className="w-4 h-4 text-slate-400" />
            {categoryNames.length} {categoryNames.length === 1 ? 'category' : 'categories'}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && ideas.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No ideas yet</h2>
          <p className="text-slate-500">
            Share your ideas with your assistant and they&apos;ll appear here!
          </p>
        </div>
      )}

      {/* Ideas by Category */}
      {categoryNames.map((category) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-600">
            <Folder className="w-4 h-4 text-amber-500" />
            {category} ({categories[category].length})
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {categories[category].map((idea) => (
              <div key={idea.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-800 font-medium">{idea.title || idea.content}</p>
                    {idea.notes && (
                      <p className="text-sm text-slate-500 mt-1">{idea.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Help text */}
      {ideas.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          💡 Ask your assistant to help you develop these ideas into projects!
        </p>
      )}
    </div>
  );
}

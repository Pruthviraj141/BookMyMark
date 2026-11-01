import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Cpu,
  Brain,
  GraduationCap,
  BookOpen,
  Film,
  Smile,
  Flame,
  Dumbbell,
  Compass,
  Briefcase,
  Coins,
  Music,
  Gamepad2,
  Palette,
  Newspaper,
  Utensils,
  Shirt,
  Home,
  Camera,
  HeartPulse,
  Sparkles,
  TrendingUp,
  Folder,
  Loader2
} from 'lucide-react';
import { MasonryFeed } from '../components/MasonryFeed.js';
import { api } from '../services/api.js';
import { LocalDbService } from '../services/local-db.service.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../components/ui/Toast.js';
import { bookmarkEvents } from '../services/bookmarkEvents.js';
import type { Bookmark, CategoryCount } from '../types/index.js';

interface CategoriesScreenProps {
  onSelectBookmark: (bookmark: Bookmark) => void;
  onBackToHome: () => void;
}

interface CategoryCardData {
  category: string;
  count: number;
  previewImageUrl: string | null;
}

// Deterministic vibrant palettes for custom AI categories
const DYNAMIC_PALETTES = [
  { gradient: 'from-violet-600/90 to-indigo-950/95', badgeBg: 'bg-violet-500 text-white shadow-violet-500/30' },
  { gradient: 'from-pink-600/90 to-rose-950/95', badgeBg: 'bg-pink-500 text-white shadow-pink-500/30' },
  { gradient: 'from-emerald-600/90 to-green-950/95', badgeBg: 'bg-emerald-500 text-white shadow-emerald-500/30' },
  { gradient: 'from-cyan-600/90 to-blue-950/95', badgeBg: 'bg-cyan-500 text-white shadow-cyan-500/30' },
  { gradient: 'from-amber-600/90 to-orange-950/95', badgeBg: 'bg-amber-500 text-white shadow-amber-500/30' },
  { gradient: 'from-fuchsia-600/90 to-purple-950/95', badgeBg: 'bg-fuchsia-500 text-white shadow-fuchsia-500/30' },
  { gradient: 'from-rose-600/90 to-red-950/95', badgeBg: 'bg-rose-500 text-white shadow-rose-500/30' },
  { gradient: 'from-teal-600/90 to-cyan-950/95', badgeBg: 'bg-teal-500 text-white shadow-teal-500/30' },
  { gradient: 'from-sky-600/90 to-indigo-950/95', badgeBg: 'bg-sky-500 text-white shadow-sky-500/30' },
  { gradient: 'from-orange-600/90 to-amber-950/95', badgeBg: 'bg-orange-500 text-white shadow-orange-500/30' }
];

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Comprehensive topic & domain mapping for all possible categories
function getCategoryTheme(name: string): {
  icon: React.FC<{ className?: string }>;
  gradient: string;
  badgeBg: string;
} {
  const lower = name.toLowerCase();

  // Technology & Development
  if (lower.includes('tech') || lower.includes('code') || lower.includes('dev') || lower.includes('software') || lower.includes('computer')) {
    return { icon: Cpu, gradient: 'from-blue-600/90 to-indigo-950/95', badgeBg: 'bg-blue-500 text-white shadow-blue-500/30' };
  }

  // Artificial Intelligence & Science
  if (lower.includes('ai') || lower.includes('science') || lower.includes('data') || lower.includes('robot') || lower.includes('physics') || lower.includes('space')) {
    return { icon: Brain, gradient: 'from-purple-600/90 to-fuchsia-950/95', badgeBg: 'bg-purple-500 text-white shadow-purple-500/30' };
  }

  // Business, Startups & Careers
  if (lower.includes('business') || lower.includes('startup') || lower.includes('career') || lower.includes('job') || lower.includes('entrepreneur') || lower.includes('market')) {
    return { icon: Briefcase, gradient: 'from-sky-700/90 to-slate-900/95', badgeBg: 'bg-sky-600 text-white shadow-sky-600/30' };
  }

  // Finance, Money & Crypto
  if (lower.includes('finance') || lower.includes('money') || lower.includes('crypto') || lower.includes('invest') || lower.includes('stock') || lower.includes('bitcoin')) {
    return { icon: Coins, gradient: 'from-emerald-600/90 to-teal-950/95', badgeBg: 'bg-emerald-500 text-white shadow-emerald-500/30' };
  }

  // Education & Learning
  if (lower.includes('edu') || lower.includes('learn') || lower.includes('school') || lower.includes('course') || lower.includes('study') || lower.includes('college')) {
    return { icon: GraduationCap, gradient: 'from-teal-600/90 to-emerald-950/95', badgeBg: 'bg-teal-500 text-white shadow-teal-500/30' };
  }

  // Knowledge, Books & Literature
  if (lower.includes('knowledge') || lower.includes('book') || lower.includes('read') || lower.includes('history') || lower.includes('philosophy')) {
    return { icon: BookOpen, gradient: 'from-amber-700/90 to-stone-900/95', badgeBg: 'bg-amber-600 text-white shadow-amber-600/30' };
  }

  // Movies, Cinema, TV & Entertainment
  if (lower.includes('movie') || lower.includes('film') || lower.includes('enter') || lower.includes('cinema') || lower.includes('series') || lower.includes('show') || lower.includes('anime')) {
    return { icon: Film, gradient: 'from-rose-600/90 to-red-950/95', badgeBg: 'bg-rose-500 text-white shadow-rose-500/30' };
  }

  // Music, Audio & Podcasts
  if (lower.includes('music') || lower.includes('song') || lower.includes('audio') || lower.includes('podcast') || lower.includes('band') || lower.includes('beat')) {
    return { icon: Music, gradient: 'from-pink-600/90 to-purple-950/95', badgeBg: 'bg-pink-500 text-white shadow-pink-500/30' };
  }

  // Gaming & Esports
  if (lower.includes('game') || lower.includes('gaming') || lower.includes('esport') || lower.includes('playstation') || lower.includes('xbox') || lower.includes('nintendo')) {
    return { icon: Gamepad2, gradient: 'from-indigo-600/90 to-violet-950/95', badgeBg: 'bg-indigo-500 text-white shadow-indigo-500/30' };
  }

  // Humor, Memes & Comedy
  if (lower.includes('funny') || lower.includes('meme') || lower.includes('humor') || lower.includes('comedy') || lower.includes('joke')) {
    return { icon: Smile, gradient: 'from-yellow-500/90 to-amber-900/95', badgeBg: 'bg-amber-400 text-zinc-950 shadow-amber-400/30' };
  }

  // Motivation & Self-Improvement
  if (lower.includes('motiv') || lower.includes('insp') || lower.includes('quote') || lower.includes('mindset') || lower.includes('habit')) {
    return { icon: Flame, gradient: 'from-orange-600/90 to-red-900/95', badgeBg: 'bg-orange-500 text-white shadow-orange-500/30' };
  }

  // Productivity & Growth
  if (lower.includes('productiv') || lower.includes('growth') || lower.includes('strategy') || lower.includes('goal')) {
    return { icon: TrendingUp, gradient: 'from-cyan-600/90 to-blue-950/95', badgeBg: 'bg-cyan-500 text-white shadow-cyan-500/30' };
  }

  // Fitness, Gym & Workouts
  if (lower.includes('fit') || lower.includes('gym') || lower.includes('workout') || lower.includes('sport') || lower.includes('bodybuilding') || lower.includes('athlete')) {
    return { icon: Dumbbell, gradient: 'from-teal-600/90 to-emerald-950/95', badgeBg: 'bg-teal-500 text-white shadow-teal-500/30' };
  }

  // Health, Wellness & Nutrition
  if (lower.includes('health') || lower.includes('wellness') || lower.includes('nutri') || lower.includes('diet') || lower.includes('yoga') || lower.includes('meditat')) {
    return { icon: HeartPulse, gradient: 'from-red-600/90 to-rose-950/95', badgeBg: 'bg-red-500 text-white shadow-red-500/30' };
  }

  // Travel, Adventure & Tourism
  if (lower.includes('travel') || lower.includes('place') || lower.includes('world') || lower.includes('trip') || lower.includes('hotel') || lower.includes('vacation')) {
    return { icon: Compass, gradient: 'from-cyan-600/90 to-blue-950/95', badgeBg: 'bg-cyan-500 text-white shadow-cyan-500/30' };
  }

  // Food, Cooking & Recipes
  if (lower.includes('food') || lower.includes('cook') || lower.includes('recipe') || lower.includes('restaurant') || lower.includes('coffee') || lower.includes('baking') || lower.includes('dish')) {
    return { icon: Utensils, gradient: 'from-amber-600/90 to-orange-950/95', badgeBg: 'bg-amber-500 text-white shadow-amber-500/30' };
  }

  // Art, UI/UX & Design
  if (lower.includes('art') || lower.includes('design') || lower.includes('ui') || lower.includes('creative') || lower.includes('draw') || lower.includes('paint')) {
    return { icon: Palette, gradient: 'from-fuchsia-600/90 to-pink-950/95', badgeBg: 'bg-fuchsia-500 text-white shadow-fuchsia-500/30' };
  }

  // Photography & Visuals
  if (lower.includes('photo') || lower.includes('camera') || lower.includes('picture')) {
    return { icon: Camera, gradient: 'from-slate-600/90 to-zinc-950/95', badgeBg: 'bg-slate-500 text-white shadow-slate-500/30' };
  }

  // News, Politics & World Affairs
  if (lower.includes('news') || lower.includes('politic') || lower.includes('affair') || lower.includes('press')) {
    return { icon: Newspaper, gradient: 'from-zinc-700/90 to-slate-950/95', badgeBg: 'bg-zinc-600 text-white shadow-zinc-600/30' };
  }

  // Fashion & Style
  if (lower.includes('fashion') || lower.includes('style') || lower.includes('clothing') || lower.includes('outfit')) {
    return { icon: Shirt, gradient: 'from-pink-600/90 to-rose-950/95', badgeBg: 'bg-pink-500 text-white shadow-pink-500/30' };
  }

  // Home & Architecture
  if (lower.includes('home') || lower.includes('house') || lower.includes('architect') || lower.includes('interior') || lower.includes('diy')) {
    return { icon: Home, gradient: 'from-stone-700/90 to-neutral-950/95', badgeBg: 'bg-stone-600 text-white shadow-stone-600/30' };
  }

  // Lifestyle & Aesthetics
  if (lower.includes('lifestyle') || lower.includes('vibe') || lower.includes('aesthetic')) {
    return { icon: Sparkles, gradient: 'from-violet-600/90 to-fuchsia-950/95', badgeBg: 'bg-violet-500 text-white shadow-violet-500/30' };
  }

  // Deterministic fallback for completely novel categories created by AI
  const fallback = DYNAMIC_PALETTES[stringHash(name) % DYNAMIC_PALETTES.length];
  return {
    icon: Folder,
    gradient: fallback.gradient,
    badgeBg: fallback.badgeBg
  };
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  onSelectBookmark,
  onBackToHome
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryCardData[]>(() => {
    if (!user?.id) return [];
    try {
      const cached = LocalDbService.getBookmarks(user.id);
      if (!cached || cached.length === 0) return [];
      const countsMap: Record<string, number> = {};
      cached.forEach((b) => {
        const cat = b.category || 'Other';
        countsMap[cat] = (countsMap[cat] || 0) + 1;
      });
      return Object.entries(countsMap)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => {
          const match = cached.find(
            (b) => b.category?.toLowerCase() === category.toLowerCase() && b.thumbnail_url
          );
          return {
            category,
            count,
            previewImageUrl: match?.thumbnail_url || null
          };
        });
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryBookmarks, setCategoryBookmarks] = useState<Bookmark[]>([]);
  const [loadingCategoryBookmarks, setLoadingCategoryBookmarks] = useState(false);

  // Load dynamic categories with preview images from bookmarks in parallel
  const loadCategories = useCallback(async () => {
    try {
      const cached = user?.id ? LocalDbService.getBookmarks(user.id) : [];
      const [counts, listRes] = await Promise.all([
        api.bookmarks.getCategories().catch(() => []),
        cached.length === 0 ? api.bookmarks.list({ limit: 100 }).catch(() => ({ bookmarks: [] })) : Promise.resolve({ bookmarks: cached })
      ]);

      const validCounts = counts.filter((c) => c.count > 0);
      const allItems = cached.length > 0 ? cached : (listRes?.bookmarks || []);

      const cards: CategoryCardData[] = validCounts.map((cat) => {
        const match = allItems.find(
          (b) => b.category?.toLowerCase() === cat.category.toLowerCase() && b.thumbnail_url
        );
        return {
          category: cat.category,
          count: cat.count,
          previewImageUrl: match?.thumbnail_url || null
        };
      });

      setCategories(cards);
    } catch (err) {
      console.warn('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Synchronize with global bookmark mutations
  useEffect(() => {
    const unsubDeleted = bookmarkEvents.on('deleted', (deletedId) => {
      setCategoryBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
      loadCategories();
    });

    const unsubCreated = bookmarkEvents.on('created', () => {
      loadCategories();
    });

    const unsubUpdated = bookmarkEvents.on('updated', (updated) => {
      setCategoryBookmarks((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
      loadCategories();
    });

    return () => {
      unsubDeleted();
      unsubCreated();
      unsubUpdated();
    };
  }, [loadCategories]);

  const handleSelectCategory = async (catName: string) => {
    setSelectedCategory(catName);
    setLoadingCategoryBookmarks(true);
    try {
      const res = await api.bookmarks.list({ category: catName, limit: 60 });
      setCategoryBookmarks(res.bookmarks);
    } catch (err) {
      console.warn('Failed to load category bookmarks:', err);
    } finally {
      setLoadingCategoryBookmarks(false);
    }
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    const newFav = !bookmark.is_favorite;
    setCategoryBookmarks((prev) =>
      prev.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: newFav } : b))
    );
    try {
      await api.bookmarks.update(bookmark.id, { is_favorite: newFav });
      toast({
        title: newFav ? 'Added to Favorites' : 'Removed from Favorites',
        variant: 'default',
        duration: 2000
      });
    } catch {
      setCategoryBookmarks((prev) =>
        prev.map((b) => (b.id === bookmark.id ? { ...b, is_favorite: !newFav } : b))
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background transition-colors">
      {/* Categories Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl px-4 py-3 border-b border-border flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (selectedCategory) {
                setSelectedCategory(null);
              } else {
                onBackToHome();
              }
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground tracking-tight leading-none">
                {selectedCategory || 'Categories'}
              </h1>
              <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                {selectedCategory ? categoryBookmarks.length : categories.length}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-normal">
              {selectedCategory ? 'Category collection' : 'Explore by topics'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mt-3 flex-grow">
        {selectedCategory ? (
          <div>
            {loadingCategoryBookmarks ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                <span className="text-xs font-mono">Loading bookmarks...</span>
              </div>
            ) : categoryBookmarks.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-sm font-medium text-foreground">No bookmarks in {selectedCategory}</p>
                <p className="text-xs text-muted-foreground mt-1">Saved items in this category will appear here</p>
              </div>
            ) : (
              <MasonryFeed
                bookmarks={categoryBookmarks}
                onSelectBookmark={onSelectBookmark}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3.5 px-3.5 sm:px-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-38 rounded-2xl bg-muted/40 animate-pulse border border-border/60"
                  />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20 px-4">
                <p className="text-sm font-medium text-foreground">No categories yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved bookmarks are automatically organized by AI
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 px-3.5 sm:px-4">
                {categories.map((item) => {
                  const theme = getCategoryTheme(item.category);
                  const Icon = theme.icon;

                  return (
                    <div
                      key={item.category}
                      onClick={() => handleSelectCategory(item.category)}
                      className="group relative h-40 rounded-2xl overflow-hidden border border-border/80 bg-card active:scale-[0.98] transition-transform cursor-pointer flex flex-col justify-between p-3.5 select-none shadow-xs"
                    >
                      {/* Colorful Background Gradient & Cover Image Preview */}
                      {item.previewImageUrl ? (
                        <>
                          <img
                            src={item.previewImageUrl}
                            alt={item.category}
                            loading="lazy"
                            decoding="async"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                          />
                          <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient}`} />
                        </>
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
                      )}

                      {/* Top: Colorful Icon Badge */}
                      <div className="relative z-10 self-start">
                        <div className={`p-2.5 rounded-xl shadow-md ${theme.badgeBg}`}>
                          <Icon className="w-4 h-4 stroke-[2]" />
                        </div>
                      </div>

                      {/* Bottom: Title & Count */}
                      <div className="relative z-10 flex flex-col">
                        <span className="text-[14.5px] font-bold text-white tracking-tight leading-snug line-clamp-1 drop-shadow-xs">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-mono mt-0.5 text-white/85 drop-shadow-2xs">
                          {item.count} {item.count === 1 ? 'bookmark' : 'bookmarks'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

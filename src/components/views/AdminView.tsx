import React from 'react';
import { useApp } from '../../context/AppContext';
import { Movie } from '../../types';
import { addMovieToFirestore, updateMovieInFirestore, deleteMovieFromFirestore } from '../../lib/firebase';
import { AdminDashboard } from '../AdminDashboard';

interface AdminViewProps {
  movies?: Movie[];
  onUpdateMovies?: (movies: Movie[]) => void;
}

export const AdminView: React.FC<AdminViewProps> = () => {
  const { movies, addMedia, updateMedia, deleteMedia } = useApp();

  // The dashboard's built-in lock screen IS the single login gate:
  // only the Master Admin password unlocks it, and it works from any
  // browser/device. No other account can ever be granted admin access.
  const handleAddMovie = async (newMovieData: Movie) => {
    await addMovieToFirestore(newMovieData);
    await addMedia(newMovieData);
  };

  const handleUpdateMovie = async (id: string, updates: Partial<Movie>) => {
    await updateMovieInFirestore(id, updates);
    const existing = movies.find((m) => m.id === id);
    if (existing) {
      await updateMedia({ ...existing, ...updates });
    }
  };

  const handleDeleteMovie = async (id: string) => {
    await deleteMovieFromFirestore(id);
    await deleteMedia(id);
  };

  return <AdminDashboard />;
};

export default AdminView;

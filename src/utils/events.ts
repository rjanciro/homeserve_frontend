// Simple event system for profile updates
export const profileEvents = {
  // Dispatch an event when profile is updated
  emitProfileUpdate: () => {
    const event = new CustomEvent('profile-updated');
    window.dispatchEvent(event);
  },
  
  // Add a listener for profile updates
  onProfileUpdate: (callback: () => void) => {
    window.addEventListener('profile-updated', callback);
    return () => window.removeEventListener('profile-updated', callback);
  }
}; 
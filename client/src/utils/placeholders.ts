// Placeholder image as inline SVG data URI
export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

// Helper function to handle image errors
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, placeholder: string = PLACEHOLDER_IMAGE) => {
  const target = e.currentTarget;
  if (target.src !== placeholder) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Image failed to load:", target.src);
    }
    target.src = placeholder;
    target.onerror = null; // Prevent infinite loop
  }
};


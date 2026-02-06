/**
 * Component styling helpers for generating reusable button, card, and input classes
 */

export const getButtonClasses = (contrastMode, textSizeClasses, variant = 'primary') => {
  const baseClasses = `font-bold ${textSizeClasses.button} transition-all duration-200 border-2`;
  
  if (variant === 'primary') {
    if (contrastMode === 'high') {
      return `${baseClasses} bg-black text-yellow-400 border-black hover:bg-gray-900`;
    } else if (contrastMode === 'dark') {
      return `${baseClasses} bg-slate-700 text-blue-400 border-slate-400 hover:bg-slate-600`;
    }
    return `${baseClasses} bg-blue-600 text-white border-blue-600 hover:bg-blue-700`;
  }
  
  if (variant === 'secondary') {
    if (contrastMode === 'high') {
      return `${baseClasses} bg-white text-black border-black hover:bg-gray-100`;
    } else if (contrastMode === 'dark') {
      return `${baseClasses} bg-slate-800 text-blue-400 border-slate-400 hover:bg-slate-700`;
    }
    return `${baseClasses} bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200`;
  }
  
  return baseClasses;
};

export const getCardClasses = (contrastMode) => {
  const baseClasses = 'p-6 rounded-2xl border-4 shadow-lg';
  
  if (contrastMode === 'high') {
    return `${baseClasses} bg-yellow-50 border-black text-black`;
  } else if (contrastMode === 'dark') {
    return `${baseClasses} bg-slate-800 border-slate-400 text-slate-100`;
  }
  return `${baseClasses} bg-blue-50 border-blue-200 text-gray-900`;
};

export const getSettingsPanelClasses = (contrastMode) => {
  const baseClasses = 'rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border-4 transform transition-all duration-300 ease-out';
  
  if (contrastMode === 'high') {
    return `${baseClasses} bg-gray-100 text-black border-black`;
  } else if (contrastMode === 'dark') {
    return `${baseClasses} bg-slate-900 text-slate-100 border-slate-400`;
  }
  return `${baseClasses} bg-white text-gray-900 border-gray-200`;
};

export const getInputClasses = (contrastMode, textSizeClasses, hasSearched) => {
  const baseClasses = `flex gap-3 items-center rounded-full border-2 transition-all duration-300 shadow-lg`;
  
  let modeClasses = '';
  if (contrastMode === 'high') {
    modeClasses = hasSearched ? 'bg-transparent border-transparent' : 'bg-white border-black';
  } else if (contrastMode === 'dark') {
    modeClasses = hasSearched ? 'bg-transparent border-transparent' : 'bg-slate-900 border-slate-400';
  } else {
    modeClasses = hasSearched ? 'bg-transparent border-transparent' : 'bg-white border-gray-300';
  }
  
  const flexClasses = hasSearched ? 'bg-transparent px-3 py-2 border-transparent flex-1' : 'px-6 py-4';
  
  return `${baseClasses} ${flexClasses} ${modeClasses}`;
};

export const getBackdropClasses = (contrastMode, isOpen) => {
  let bgColor = 'rgba(0,0,0,0.3)';
  if (contrastMode === 'high') {
    bgColor = 'rgba(0,0,0,0.5)';
  } else if (contrastMode === 'dark') {
    bgColor = 'rgba(0,0,0,0.7)';
  }
  
  return {
    backgroundColor: bgColor,
    pointerEvents: isOpen ? 'auto' : 'none',
    opacity: isOpen ? 1 : 0,
  };
};

/**
 * Parse news summary into individual cards with better headline/content association
 */
export const parseNewsSummary = (summaryText) => {
  const cards = [];
  
  // Split by numbered sections: "1. ", "2. ", etc. or markdown headers
  const sections = summaryText
    .split(/(?=\d+\.\s+|#{1,3}\s+|^---$)/m)
    .filter(s => s.trim());
  
  sections.forEach((section, index) => {
    const trimmedSection = section.trim();
    if (!trimmedSection) return;
    
    // Clean up and separate headline from content
    let headline = '';
    let content = '';
    
    // Extract numbered prefix if exists
    const numberedMatch = trimmedSection.match(/^(\d+\.\s+)?(.+?)(?:\n|$)/);
    const firstLine = numberedMatch ? numberedMatch[2] : trimmedSection.split('\n')[0];
    
    // Clean markdown formatting from headline
      headline = firstLine
        .replace(/^#+\s*/, '') // Remove markdown headers
        .replace(/\*\*/g, '') // Remove bold formatting
        .replace(/^["'`]+|["'`]+$/g, '') // Remove quotes
        .trim()
        .replace(/^[\-–—]\s*/, ''); // Remove leading bullet/dash markers from headline
    
    // Get content (everything after the first line)
    const lines = trimmedSection.split('\n');
    if (lines.length > 1) {
        content = lines
          .slice(1)
          .join('\n')
          .replace(/\*+/g, '') // Remove extra asterisks
          .trim()
          .replace(/(^|\n)\s*[\-–—]\s+/g, '$1') // Remove leading dash/bullet markers at the start of lines
          .replace(/^[\-–—]\s*/, '').trim(); // Remove leading dash/bullet markers from content
    }
    
    // If no content found, use the cleaned headline repeated or part of it
    if (!content && headline) {
      content = headline;
    }
    
    // Only create card if we have at least a headline
    if (headline) {
      cards.push({
        id: `${Date.now()}-${index}`,
        headline: headline.substring(0, 80), // Limit headline length
        content: content.substring(0, 300), // Limit content preview
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Fallback if parsing resulted in no cards
  if (cards.length === 0) {
    return [{
      id: `${Date.now()}-0`,
      headline: 'News Summary',
      content: summaryText.substring(0, 300),
      timestamp: new Date().toISOString()
    }];
  }
  
  return cards;
};

/**
 * Style helper functions for generating contrast and text size classes
 */

export const getContrastStyles = (contrastMode) => {
  if (contrastMode === "high") {
    return {
      bgClass: "bg-black",
      textClass: "text-white",
      borderClass: "border-white",
      accentClass: "bg-yellow-300 text-black",
    };
  } else if (contrastMode === "dark") {
    return {
      bgClass: "bg-slate-950",
      textClass: "text-slate-100",
      borderClass: "border-slate-300",
      accentClass: "bg-blue-600",
    };
  }
  return {
    bgClass: "bg-zinc-900",
    textClass: "text-white",
    borderClass: "border-zinc-700",
    accentClass: "bg-emerald-500 hover:bg-emerald-400",
  };
};

export const getTextSizeClasses = (textSize) => {
  if (textSize === "large") {
    return {
      logo: "text-7xl md:text-8xl",
      subtitle: "text-3xl md:text-4xl",
      heading: "text-4xl md:text-5xl",
      heading2: "text-3xl",
      label: "text-2xl",
      body: "text-2xl",
      bodyLarge: "text-3xl",
      bodyMedium: "text-2xl",
      bodySmall: "text-xl",
      button: "text-2xl",
      hint: "text-lg",
      footer: "text-lg",
    };
  } else if (textSize === "small") {
    return {
      logo: "text-4xl md:text-5xl",
      subtitle: "text-base md:text-lg",
      heading: "text-2xl md:text-3xl",
      heading2: "text-xl",
      label: "text-base",
      body: "text-base",
      bodyLarge: "text-lg",
      bodyMedium: "text-base",
      bodySmall: "text-sm",
      button: "text-base",
      hint: "text-xs",
      footer: "text-xs",
    };
  }
  // normal
  return {
    logo: "text-6xl md:text-7xl",
    subtitle: "text-2xl md:text-3xl",
    heading: "text-3xl md:text-4xl",
    heading2: "text-2xl",
    label: "text-xl",
    body: "text-lg",
    bodyLarge: "text-2xl",
    bodyMedium: "text-lg",
    bodySmall: "text-base",
    button: "text-lg",
    hint: "text-sm",
    footer: "text-sm",
  };
};

export const getBgStyles = (contrastMode) => {
  if (contrastMode === "high") {
    return {
      bg: "bg-white",
      text: "text-black",
      accent: "text-yellow-500",
      secondaryBg: "bg-gray-100",
      card: "bg-white border-black",
      input: "bg-white text-black border-black focus:ring-yellow-400",
    };
  } else if (contrastMode === "dark") {
    return {
      bg: "bg-slate-950",
      text: "text-slate-100",
      accent: "text-blue-400",
      secondaryBg: "bg-slate-900",
      card: "bg-slate-900 border-slate-400",
      input: "bg-slate-900 text-slate-100 border-slate-400 focus:ring-blue-400",
    };
  }
  return {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
    text: "text-gray-900",
    accent: "text-blue-600",
    secondaryBg: "bg-white",
    card: "bg-white border-gray-200 shadow-sm hover:shadow-md",
    input: "bg-white text-gray-900 border-gray-300 focus:ring-blue-500",
  };
};

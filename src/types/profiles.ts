export interface UIProfile {
  id: string;
  name: string;
  description: string;
  styles: {
    // Layout
    layout: 'classic' | 'modern' | 'minimal' | 'traditional';
    
    // Container styles
    containerPadding: string;
    containerMaxWidth: string;
    
    // Header styles
    headerLayout: 'horizontal' | 'vertical' | 'compact';
    logoSize: string;
    titleSize: string;
    
    // Time & Calendar styles
    timeCardLayout: 'side-by-side' | 'stacked' | 'centered';
    timeSize: string;
    
    // Prayer times grid
    prayerGridCols: string;
    prayerCardPadding: string;
    prayerCardSize: string;
    
    // Colors & Effects
    accentColor: string;
    glassOpacity: string;
    textShadow: string;
    borderRadius: string;
    
    // Spacing
    sectionGap: string;
    cardGap: string;
  };
}

export const UI_PROFILES: UIProfile[] = [
  {
    id: 'modern',
    name: 'Modern & Clean',
    description: 'Large text, spacious layout, minimal design',
    styles: {
      layout: 'modern',
      containerPadding: 'px-4 md:px-8 lg:px-12 py-8 md:py-12',
      containerMaxWidth: 'max-w-[1920px]',
      headerLayout: 'horizontal',
      logoSize: 'w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32',
      titleSize: 'text-3xl md:text-4xl lg:text-5xl',
      timeCardLayout: 'side-by-side',
      timeSize: 'text-5xl md:text-6xl lg:text-7xl',
      prayerGridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
      prayerCardPadding: 'p-4 md:p-6',
      prayerCardSize: 'text-2xl md:text-3xl lg:text-4xl',
      accentColor: 'emerald',
      glassOpacity: 'bg-black/20',
      textShadow: 'drop-shadow-lg',
      borderRadius: 'rounded-lg',
      sectionGap: 'gap-6 mb-8 md:mb-12',
      cardGap: 'gap-3 md:gap-4 lg:gap-6',
    },
  },
  {
    id: 'classic',
    name: 'Classic Display',
    description: 'Traditional mosque display with balanced layout',
    styles: {
      layout: 'classic',
      containerPadding: 'px-6 md:px-10 lg:px-16 py-10',
      containerMaxWidth: 'max-w-[1600px]',
      headerLayout: 'horizontal',
      logoSize: 'w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36',
      titleSize: 'text-4xl md:text-5xl lg:text-6xl',
      timeCardLayout: 'stacked',
      timeSize: 'text-6xl md:text-7xl lg:text-8xl',
      prayerGridCols: 'grid-cols-3 lg:grid-cols-6',
      prayerCardPadding: 'p-5 md:p-7',
      prayerCardSize: 'text-3xl md:text-4xl lg:text-5xl',
      accentColor: 'blue',
      glassOpacity: 'bg-black/30',
      textShadow: 'drop-shadow-2xl',
      borderRadius: 'rounded-xl',
      sectionGap: 'gap-8 mb-10 md:mb-14',
      cardGap: 'gap-4 md:gap-5 lg:gap-7',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Focus',
    description: 'Clean, distraction-free with emphasis on prayer times',
    styles: {
      layout: 'minimal',
      containerPadding: 'px-4 md:px-6 py-6 md:py-8',
      containerMaxWidth: 'max-w-[1400px]',
      headerLayout: 'compact',
      logoSize: 'w-16 h-16 md:w-20 md:h-20',
      titleSize: 'text-2xl md:text-3xl lg:text-4xl',
      timeCardLayout: 'centered',
      timeSize: 'text-4xl md:text-5xl lg:text-6xl',
      prayerGridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
      prayerCardPadding: 'p-3 md:p-4',
      prayerCardSize: 'text-xl md:text-2xl lg:text-3xl',
      accentColor: 'teal',
      glassOpacity: 'bg-black/15',
      textShadow: 'drop-shadow-md',
      borderRadius: 'rounded-md',
      sectionGap: 'gap-4 mb-6 md:mb-8',
      cardGap: 'gap-2 md:gap-3 lg:gap-4',
    },
  },
  {
    id: 'traditional',
    name: 'Traditional Islamic',
    description: 'Rich colors, elegant typography, ornate styling',
    styles: {
      layout: 'traditional',
      containerPadding: 'px-8 md:px-12 lg:px-20 py-12 md:py-16',
      containerMaxWidth: 'max-w-[1800px]',
      headerLayout: 'vertical',
      logoSize: 'w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48',
      titleSize: 'text-4xl md:text-5xl lg:text-7xl',
      timeCardLayout: 'stacked',
      timeSize: 'text-6xl md:text-7xl lg:text-9xl',
      prayerGridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      prayerCardPadding: 'p-6 md:p-8',
      prayerCardSize: 'text-3xl md:text-4xl lg:text-5xl',
      accentColor: 'amber',
      glassOpacity: 'bg-black/40',
      textShadow: 'drop-shadow-2xl',
      borderRadius: 'rounded-2xl',
      sectionGap: 'gap-10 mb-12 md:mb-16',
      cardGap: 'gap-5 md:gap-6 lg:gap-8',
    },
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Maximum information density, ideal for smaller displays',
    styles: {
      layout: 'minimal',
      containerPadding: 'px-3 md:px-5 py-4 md:py-6',
      containerMaxWidth: 'max-w-full',
      headerLayout: 'compact',
      logoSize: 'w-14 h-14 md:w-16 md:h-16',
      titleSize: 'text-xl md:text-2xl lg:text-3xl',
      timeCardLayout: 'centered',
      timeSize: 'text-3xl md:text-4xl lg:text-5xl',
      prayerGridCols: 'grid-cols-3 lg:grid-cols-6',
      prayerCardPadding: 'p-2 md:p-3',
      prayerCardSize: 'text-lg md:text-xl lg:text-2xl',
      accentColor: 'cyan',
      glassOpacity: 'bg-black/25',
      textShadow: 'drop-shadow',
      borderRadius: 'rounded',
      sectionGap: 'gap-3 mb-4 md:mb-6',
      cardGap: 'gap-2 md:gap-2 lg:gap-3',
    },
  },
];

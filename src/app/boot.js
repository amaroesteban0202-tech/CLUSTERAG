(() => {
    const version = '2026-07-performance-focus';
    const versionKey = 'cluster_theme_default_version';
    const themeKey = 'cluster_theme';
    const paletteKey = 'cluster_palette';
    if (!localStorage.getItem(themeKey)) {
        localStorage.setItem(themeKey, 'dark');
    }
    localStorage.setItem(versionKey, version);
    const storedPalette = localStorage.getItem(paletteKey);
    const palette = storedPalette === 'clay' ? 'cobalt' : storedPalette || 'botanical';
    localStorage.setItem(paletteKey, palette);
    document.documentElement.dataset.palette = palette;
    document.documentElement.classList.toggle(
        'dark',
        localStorage.getItem(themeKey) !== 'light'
    );
})();

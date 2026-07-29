const dynamicColors = [
    'slate',
    'gray',
    'zinc',
    'neutral',
    'stone',
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'rose'
];

const neutral = {
    50: '#f8faf6',
    100: '#f0f3ed',
    200: '#e0e5dd',
    300: '#c8d0c8',
    400: '#929d94',
    500: '#68746b',
    600: '#4f5b52',
    700: '#39433b',
    800: '#252d27',
    900: '#171d19',
    950: '#0d110e'
};

const accent = {
    50: '#f7faea',
    100: '#eff5d2',
    200: '#dfeaa7',
    300: '#c9db72',
    400: '#adc743',
    500: '#8fa82b',
    600: '#70851e',
    700: '#586918',
    800: '#46541a',
    900: '#39451a',
    950: '#1c2409'
};

const info = {
    50: '#f0f7f8',
    100: '#dcecef',
    200: '#b9d9df',
    300: '#88bdc8',
    400: '#5a9ca9',
    500: '#407f8d',
    600: '#356875',
    700: '#305661',
    800: '#2b4851',
    900: '#283d44',
    950: '#132328'
};

const success = {
    50: '#f0f7f1',
    100: '#dcecdf',
    200: '#bbd9c1',
    300: '#8fbd99',
    400: '#64a176',
    500: '#48855f',
    600: '#386c4c',
    700: '#31563f',
    800: '#2a4636',
    900: '#253a30',
    950: '#122119'
};

const warning = {
    50: '#fbf7ed',
    100: '#f5ecd2',
    200: '#ebd69f',
    300: '#dbb96a',
    400: '#c99a3f',
    500: '#b17e25',
    600: '#93631b',
    700: '#744a19',
    800: '#603d1b',
    900: '#50331b',
    950: '#2d1a0b'
};

const danger = {
    50: '#fbf2f0',
    100: '#f7e2de',
    200: '#efc8c1',
    300: '#e5a59a',
    400: '#d87d70',
    500: '#c75e52',
    600: '#ad473e',
    700: '#8f3934',
    800: '#77322f',
    900: '#642e2c',
    950: '#351514'
};

const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const alphaSuffixes = ['/5', '/10', '/20', '/30', '/40', '/50', '/60'];
const variants = ['dark', 'hover', 'focus', 'focus-visible', 'disabled'];

const colorUtilities = dynamicColors.flatMap((color) => {
    const solidUtilities = shades.flatMap((shade) => [
        `bg-${color}-${shade}`,
        `text-${color}-${shade}`,
        `border-${color}-${shade}`,
        `ring-${color}-${shade}`,
        `shadow-${color}-${shade}`,
        `from-${color}-${shade}`,
        `via-${color}-${shade}`,
        `to-${color}-${shade}`
    ]);

    const alphaUtilities = alphaSuffixes.flatMap((suffix) => [
        `bg-${color}-500${suffix}`,
        `border-${color}-500${suffix}`,
        `ring-${color}-500${suffix}`,
        `shadow-${color}-500${suffix}`,
        `ring-${color}-400${suffix}`
    ]);

    return [...solidUtilities, ...alphaUtilities];
});

const variantUtilities = variants.flatMap((variant) => colorUtilities.map((utility) => `${variant}:${utility}`));

module.exports = {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,jsx,html}'
    ],
    safelist: [
        ...colorUtilities,
        ...variantUtilities,
        'bg-white',
        'text-white',
        'border-white',
        'bg-black',
        'text-black',
        'border-black',
        'bg-transparent',
        'text-transparent',
        'border-transparent'
    ],
    theme: {
        colors: {
            inherit: 'inherit',
            current: 'currentColor',
            transparent: 'transparent',
            black: '#0d110e',
            white: '#fcfdf9',
            slate: neutral,
            gray: neutral,
            zinc: neutral,
            neutral,
            stone: neutral,
            lime: accent,
            indigo: accent,
            violet: accent,
            purple: accent,
            fuchsia: accent,
            blue: info,
            sky: info,
            cyan: info,
            emerald: success,
            green: success,
            teal: success,
            amber: warning,
            yellow: warning,
            orange: warning,
            red: danger,
            rose: danger,
            pink: danger
        },
        extend: {}
    }
};

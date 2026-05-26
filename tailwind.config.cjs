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
        extend: {}
    }
};

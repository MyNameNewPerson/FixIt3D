import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_TOKEN = process.env.THINGIVERSE_TOKEN || "53dba3cff3fbbf0506e34d7fa855f40e";
const THINGIVERSE_API = 'https://api.thingiverse.com';

const JOKE_KEYWORDS = [
    "joke", "meme", "funny", "gag", "prank", "fake", "parody", "satire", "ironic", "not real", "fake part",
    "keychain", "logo", "decoration", "figurine", "statue", "ornament", "fan art", "toy", "miniature", "sign",
    "display", "stand", "desktop", "accessory", "charm", "pendant", "wall art", "poster", "non-functional"
];

const FUNCTIONAL_KEYWORDS = [
    "gear", "knob", "handle", "bracket", "clip", "button", "lever", "mount", "adapter", "joint", "wheel",
    "shaft", "seal", "gasket", "spring", "latch", "hinge", "cap", "plug", "cover", "base", "housing", "shell",
    "replacement", "repair", "fix", "part", "impeller", "pulley", "bushing", "nozzle"
];

const SPARE_PARTS_QUERIES = {
    'Bosch': ['Bosch+spare+part', 'Bosch+repair'],
    'Dyson': ['Dyson+spare+part', 'Dyson+repair'],
    'Ikea': ['Ikea+spare+part', 'Ikea+repair'],
    'Samsung': ['Samsung+spare+part', 'Samsung+repair'],
    'LG': ['LG+spare+part', 'LG+repair'],
    'Whirlpool': ['Whirlpool+spare+part', 'Whirlpool+repair'],
    'Philips': ['Philips+spare+part', 'Philips+repair'],
    'Braun': ['Braun+spare+part', 'Braun+repair'],
    'Miele': ['Miele+spare+part', 'Miele+repair'],
    'Xiaomi': ['Xiaomi+spare+part', 'Xiaomi+repair'],
    'Electrolux': ['Electrolux+spare+part', 'Electrolux+repair'],
    'Kenwood': ['Kenwood+spare+part', 'Kenwood+repair'],
    'KitchenAid': ['KitchenAid+spare+part', 'KitchenAid+repair'],
    'DeLonghi': ['DeLonghi+spare+part', 'DeLonghi+repair'],
    'Tefal': ['Tefal+spare+part', 'Tefal+repair'],
    'Beko': ['Beko+spare+part', 'Beko+repair'],
    'General Parts': ['spare+part', 'repair', 'replacement+part', 'fix']
};

const HOBBY_QUERIES = {
    'Tabletop': ['dnd', 'warhammer', 'miniature', 'terrain'],
    'Games': ['minecraft', 'pokemon', 'zelda', 'star+wars'],
    'Toys': ['toy', 'puzzle', 'lego'],
    'Decor': ['decoration', 'vase', 'art']
};

const AUTO_QUERIES = {
    'Toyota': ['Toyota+part', 'Toyota+accessory'],
    'BMW': ['BMW+part', 'BMW+accessory'],
    'Mercedes': ['Mercedes+part', 'Mercedes+repair'],
    'Audi': ['Audi+part', 'Audi+repair'],
    'Volkswagen': ['VW+part', 'VW+repair'],
    'Tesla': ['Tesla+part', 'Tesla+accessory'],
    'Accessories': ['car+holder', 'cupholder', 'key+fob']
};

const HOME_QUERIES = {
    'Makita': ['Makita+spare+part', 'Makita+repair'],
    'Karcher': ['Karcher+spare+part', 'Karcher+repair'],
    'DeWalt': ['DeWalt+part', 'DeWalt+adapter'],
    'Garden': ['garden+tool', 'hose+connector'],
    'Kitchen': ['organizer', 'hook', 'shelf']
};

function isJoke(name, description, mode) {
    const text = (name + " " + (description || "")).toLowerCase();
    if (JOKE_KEYWORDS.some(word => text.includes(word))) return true;

    if (mode === 'spare-parts') {
        const brands = ['bosch', 'dyson', 'samsung', 'lg', 'whirlpool', 'miele', 'ikea', 'kitchenaid'];
        if (brands.some(b => text.includes(b.toLowerCase()))) {
            if (!FUNCTIONAL_KEYWORDS.some(fk => text.includes(fk.toLowerCase()))) {
                return true;
            }
        }
    }
    return false;
}

function estimateVolume(name) {
    const nameL = name.toLowerCase();
    if (['small', 'tiny', 'knob', 'button', 'clip', 'gear'].some(x => nameL.includes(x))) {
        return Math.round((Math.random() * 8 + 2) * 100) / 100;
    }
    if (['large', 'big', 'housing', 'case', 'box', 'mount'].some(x => nameL.includes(x))) {
        return Math.round((Math.random() * 170 + 80) * 100) / 100;
    }
    return Math.round((Math.random() * 45 + 15) * 100) / 100;
}

async function fetchResults(queries, mode, headers, existingIds, maxPages = 1, sort = 'relevant') {
    const models = {};
    for (const [category, terms] of Object.entries(queries)) {
        for (const term of terms) {
            console.log(`[${mode}] Searching '${category}' for: '${term}' (sort=${sort})...`);
            for (let page = 1; page <= maxPages; page++) {
                const url = `${THINGIVERSE_API}/search/${term}?sort=${sort}&per_page=40&page=${page}`;
                try {
                    const response = await fetch(url, { headers, timeout: 10000 });
                    if (!response.ok) break;
                    const data = await response.json();

                    const hits = data.hits || [];
                    if (hits.length === 0) break;

                    let foundNewOnPage = false;
                    let hitExisting = false;

                    for (const item of hits) {
                        const modelId = `thingiverse_${item.id}`;

                        if (existingIds.has(modelId)) {
                            if (sort === 'newest') hitExisting = true;
                            continue;
                        }

                        if (!item.preview_image) continue;
                        if (isJoke(item.name, item.description, mode)) continue;

                        let brand = null;
                        if (mode === 'spare-parts' && category !== 'General Parts') {
                            for (const b of Object.keys(SPARE_PARTS_QUERIES)) {
                                if (b !== 'General Parts' && item.name.toLowerCase().includes(b.toLowerCase())) {
                                    brand = b;
                                    break;
                                }
                            }
                            if (!brand) brand = category;
                        }

                        foundNewOnPage = true;
                        models[modelId] = {
                            objectID: modelId,
                            name: item.name,
                            description: item.description || '',
                            brand: brand,
                            category: category,
                            mode: mode,
                            source: 'thingiverse',
                            source_url: item.public_url,
                            license: item.license,
                            author: item.creator ? item.creator.name : 'Unknown',
                            image: item.preview_image,
                            popularity: item.likes_count || 0,
                            downloads: item.download_count || 0,
                            stl_url: null,
                            volume_cm3: estimateVolume(item.name),
                            indexed_at: new Date().toISOString()
                        };
                    }

                    if (hitExisting && sort === 'newest') {
                        console.log(`  - Hit existing model, stopping search for '${term}'`);
                        break;
                    }

                    if (!foundNewOnPage && maxPages === 1) break;
                } catch (e) {
                    console.error(`  - Error: ${e.message}`);
                    break;
                }
                // Small delay to be nice to API
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
    return models;
}

async function parseThingiverse() {
    const isFull = process.argv.includes('--full');
    const isInitial = process.argv.includes('--initial');

    const sort = (isInitial || isFull) ? 'relevant' : 'newest';
    const maxPages = (isInitial || isFull) ? 5 : 1;

    const headers = { 'Authorization': `Bearer ${APP_TOKEN}` };
    const outputPath = path.resolve(__dirname, '../data/models-index.json');

    let existingModels = {};
    if (fs.existsSync(outputPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            data.forEach(m => existingModels[m.objectID] = m);
            console.log(`Loaded ${Object.keys(existingModels).length} existing models.`);
        } catch (e) {
            console.error(`Error loading existing models: ${e.message}`);
        }
    }

    const existingIds = new Set(Object.keys(existingModels));
    const queryGroups = [
        [SPARE_PARTS_QUERIES, 'spare-parts'],
        [HOBBY_QUERIES, 'hobby'],
        [AUTO_QUERIES, 'auto'],
        [HOME_QUERIES, 'home']
    ];

    let newCount = 0;
    for (const [queries, mode] of queryGroups) {
        const newItems = await fetchResults(queries, mode, headers, existingIds, maxPages, sort);
        for (const [id, data] of Object.entries(newItems)) {
            if (!existingModels[id]) {
                existingModels[id] = data;
                newCount++;
            }
        }
    }

    const modelsList = Object.values(existingModels);
    modelsList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    fs.writeFileSync(outputPath, JSON.stringify(modelsList, null, 2));
    console.log(`Update complete. Added ${newCount} new models. Total: ${modelsList.length}`);
}

parseThingiverse();

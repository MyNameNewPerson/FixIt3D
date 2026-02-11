// public/scripts/i18n.js

const translations = {
    ru: {
        "nav-catalog": "Каталог",
        "nav-map": "Карта мастеров",
        "nav-add": "Добавить модель",
        "hero-title": "Найдите деталь, которую <span class=\"text-gradient\">нельзя купить</span>",
        "hero-subtitle": "Крупнейшая база 3D-моделей для ремонта бытовой техники. Скачайте файл и распечатайте деталь за копейки.",
        "hero-search-placeholder": "Например: шестерня для Bosch Maxx 7",
        "hero-search-btn": "Найти модель",
        'hero-find-master': 'Найти мастера',
        "hero-popular": "Популярно:",
        "hero-stats": "{count} модель доступна сегодня",
        "meta-title": "FixIt3D | База 3D-моделей для ремонта и хобби",
        "meta-description": "Найдите 3D-модели редких запчастей для Bosch, Dyson, Samsung и других брендов. Огромный каталог STL файлов для печати и хобби.",
        "hero-card-repair-title": "Ремонт Bosch",
        "hero-card-repair-sub": "Скидка 80% от цены новой детали",
        "hero-card-hobby-title": "Хобби и Игры",
        "hero-card-hobby-sub": "Уникальные миниатюры",
        "catalog-title-spare": "Каталог запчастей",
        "catalog-title-hobby": "Каталог хобби-моделей",
        "results-count": "{count} моделей",
        "all-brands": "Все бренды",
        "tag-gear": "Шестерня",
        "footer-about": "Мы строим будущее без свалок. Продлеваем жизнь вещам через доступность технологий 3D-печати.",
        "footer-cat-title": "Категории",
        "footer-about-title": "О проекте",
        "footer-help-title": "Помощь",
        "footer-copy": "© 2024 FixIt3D Project. Создано для устойчивого будущего.",

        // Modal
        "modal-author": "Автор",
        "tab-print": "Печать",
        "tab-buy": "Купить готовую",
        "tab-calc": "Расчет",
        "download-stl": "Скачать STL файл",
        "download-sub": "Для самостоятельной печати",
        "download-btn": "Скачать",
        "order-master": "Заказать у мастера",
        "order-sub": "Найдено {count} мастера рядом",
        "order-btn": "Найти",
        "buy-hint": "Если печать невозможна, поищите оригинал или аналог:",
        "calc-plastic": "Пластик:",
        "calc-pla": "PLA (Декор)",
        "calc-petg": "PETG (Прочный)",
        "calc-abs": "ABS (Термостойкий)",
        "calc-infill": "Заполнение:",
        "calc-estimate": "Ориентировочная цена:",
        "calc-currency": "₽",
        "source-link": "Посмотреть на оригинале ↗",
        "buy-original": "Купить оригинал",
        "check-price": "Узнать цену",
        "view-details": "Посмотреть →",

        // Search Results
        "no-results": "Ничего не найдено",
        "no-results-sub": "Попробуйте другой запрос или измените фильтры.",
        "reset-filters": "Сбросить всё",

        // Modes
        "mode-spare": "Запчасти",
        "mode-hobby": "Хобби",

        // Hobby Mode Hero
        "hobby-hero-title": "Создавайте <span class=\"text-gradient\">шедевры</span> сами",
        "hobby-hero-subtitle": "Тысячи моделей для хобби, игр и декора. От настольных миниатюр до интерьерных решений.",

        // Map
        "map-title": "Карта мастеров 3D-печати",
        "map-subtitle": "Найдите ближайшего специалиста, если у вас нет своего принтера",
        "map-join": "Стать мастером",
        "map-city-placeholder": "Ваш город...",

        // Footer Cats
        "footer-cat-appliances": "Бытовая техника",
        "footer-cat-electronics": "Электроника",
        "footer-cat-auto": "Автотовары",
        "footer-cat-home": "Дом и Сад",
        "footer-how": "Как это работает",
        "footer-for-masters": "Для мастеров",
        "footer-dmca": "DMCA",
        "footer-privacy": "Конфиденциальность",
        "footer-faq": "FAQ",
        "footer-feedback": "Обратная связь",
        "footer-donations": "Донаты"
    },
    en: {
        "nav-catalog": "Catalog",
        "nav-map": "Master Map",
        "nav-add": "Add Model",
        "hero-title": "Find the part you <span class=\"text-gradient\">can't buy</span>",
        "hero-subtitle": "Largest database of 3D models for appliance repair. Download and print parts for pennies.",
        "hero-search-placeholder": "Example: Bosch Maxx 7 gear",
        "hero-search-btn": "Find Model",
        "hero-find-master": "Find Master",
        "hero-popular": "Popular:",
        "hero-stats": "{count} models available today",
        "meta-title": "FixIt3D | 3D Models for Repair & Hobby",
        "meta-description": "Find 3D models of rare spare parts for Bosch, Dyson, Samsung and other brands. Huge catalog of STL files for printing and hobby.",
        "hero-card-repair-title": "Bosch Repair",
        "hero-card-repair-sub": "80% cheaper than a new part",
        "hero-card-hobby-title": "Hobby & Games",
        "hero-card-hobby-sub": "Unique miniatures",
        "catalog-title-spare": "Spare Parts Catalog",
        "catalog-title-hobby": "Hobby Model Catalog",
        "results-count": "{count} models",
        "all-brands": "All Brands",
        "tag-gear": "Gear",
        "footer-about": "We build a future without landfills. Extending the life of things through accessible 3D printing.",
        "footer-cat-title": "Categories",
        "footer-about-title": "About Project",
        "footer-help-title": "Help",
        "footer-copy": "© 2024 FixIt3D Project. Built for a sustainable future.",

        // Modal
        "modal-author": "Author",
        "tab-print": "Print",
        "tab-buy": "Buy Ready",
        "tab-calc": "Calculate",
        "download-stl": "Download STL file",
        "download-sub": "For self-printing",
        "download-btn": "Download",
        "order-master": "Order from Master",
        "order-sub": "Found {count} masters nearby",
        "order-btn": "Find",
        "buy-hint": "If printing is not possible, look for the original or analog:",
        "calc-plastic": "Plastic:",
        "calc-pla": "PLA (Decor)",
        "calc-petg": "PETG (Durable)",
        "calc-abs": "ABS (Heat-resistant)",
        "calc-infill": "Infill:",
        "calc-estimate": "Estimated price:",
        "calc-currency": "$",
        "source-link": "View on original ↗",
        "buy-original": "Buy Original",
        "check-price": "Check Price",
        "view-details": "View Details →",

        // Search Results
        "no-results": "Nothing found",
        "no-results-sub": "Try another query or change filters.",
        "reset-filters": "Reset all",

        // Modes
        "mode-spare": "Parts",
        "mode-hobby": "Hobby",

        // Hobby Mode Hero
        "hobby-hero-title": "Create <span class=\"text-gradient\">masterpieces</span> yourself",
        "hobby-hero-subtitle": "Thousands of models for hobbies, games, and decor. From tabletop miniatures to interior solutions.",

        // Map
        "map-title": "3D Printing Masters Map",
        "map-subtitle": "Find a local specialist if you don't have your own printer",
        "map-join": "Join as Master",
        "map-city-placeholder": "Your city...",

        // Footer Cats
        "footer-cat-appliances": "Appliances",
        "footer-cat-electronics": "Electronics",
        "footer-cat-auto": "Auto Parts",
        "footer-cat-home": "Home & Garden",
        "footer-how": "How it works",
        "footer-for-masters": "For Masters",
        "footer-dmca": "DMCA",
        "footer-privacy": "Privacy Policy",
        "footer-faq": "FAQ",
        "footer-feedback": "Feedback",
        "footer-donations": "Donations"
    }
};

let currentLang = localStorage.getItem('lang') || 'ru';

export function getTranslation(key, params = {}) {
    let text = translations[currentLang][key] || key;
    for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(`{${pKey}}`, pVal);
    }
    return text;
}

export function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyTranslations();
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

export function getCurrentLanguage() {
    return currentLang;
}

export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = getTranslation(key);

        if (el.tagName === 'INPUT' && el.type === 'text') {
            el.placeholder = translation;
        } else if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = translation;
        } else {
            el.innerHTML = translation;
        }
    });

    // SEO
    document.title = getTranslation('meta-title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', getTranslation('meta-description'));

    // Update lang attribute
    document.documentElement.lang = currentLang;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});

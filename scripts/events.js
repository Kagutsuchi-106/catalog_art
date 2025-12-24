// Функции для работы с настройками фильтров в localStorage
function saveFilterSettings(filters) {
    try {
        localStorage.setItem('eventFilters', JSON.stringify(filters));
    } catch (e) {
        console.warn('Не удалось сохранить настройки фильтров:', e);
    }
}

function loadFilterSettings() {
    try {
        const saved = localStorage.getItem('eventFilters');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Не удалось загрузить настройки фильтров:', e);
    }
    return null;
}

// Состояние фильтров
let activeFilters = loadFilterSettings() || {
    type: 'all',
    genre: 'all',
    date: 'all',
    dateFrom: '',
    dateTo: '',
    price: 'all',
    district: 'all',
    artist: 'all',
    venue: 'all',
    searchQuery: '',
    sortBy: 'date'
};

// Функция для извлечения числового значения цены
function getPriceValue(priceString) {
    const match = priceString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Функция для парсинга даты из строки
function parseEventDate(dateString) {
    // Пытаемся найти дату в формате "15 марта" или "15 марта — 30 апреля"
    const months = {
        'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
        'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };
    
    // Если есть dateStart, используем его
    return null;
}

// Функция для проверки, попадает ли дата в диапазон
function isDateInRange(event, dateFilter) {
    if (dateFilter === 'all') return true;
    if (!event.dateStart) return true; // Если нет даты, пропускаем
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(event.dateStart);
    eventDate.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
        return eventDate.getTime() === today.getTime();
    }
    
    if (dateFilter === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return eventDate >= today && eventDate <= weekFromNow;
    }
    
    if (dateFilter === 'month') {
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);
        return eventDate >= today && eventDate <= monthFromNow;
    }
    
    return true;
}

// Функция для проверки диапазона дат
function isDateInCustomRange(event, dateFrom, dateTo) {
    if (!dateFrom && !dateTo) return true;
    if (!event.dateStart) return true;
    
    const eventDate = new Date(event.dateStart);
    eventDate.setHours(0, 0, 0, 0);
    
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (eventDate < fromDate) return false;
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(0, 0, 0, 0);
        if (eventDate > toDate) return false;
    }
    
    return true;
}

// Функция поиска по событиям
function searchEvents(events, query) {
    if (!query || query.trim() === '') return events;
    
    const searchTerm = query.toLowerCase().trim();
    
    return events.filter(event => {
        // Поиск по названию
        if (event.title.toLowerCase().includes(searchTerm)) return true;
        
        // Поиск по ключевым словам
        if (event.keywords && event.keywords.toLowerCase().includes(searchTerm)) return true;
        
        // Поиск по описанию
        if (event.description && event.description.toLowerCase().includes(searchTerm)) return true;
        
        // Поиск по имени художника
        if (event.artistIds) {
            const artists = event.artistIds.map(id => getArtistById(id)).filter(Boolean);
            const artistNames = artists.map(a => a.name.toLowerCase()).join(' ');
            if (artistNames.includes(searchTerm)) return true;
        }
        
        return false;
    });
}

// Функция сортировки событий
function sortEvents(events, sortBy) {
    const sorted = [...events];
    
    switch(sortBy) {
        case 'date':
            return sorted.sort((a, b) => {
                if (!a.dateStart || !b.dateStart) return 0;
                return new Date(a.dateStart) - new Date(b.dateStart);
            });
        
        case 'price-asc':
            return sorted.sort((a, b) => {
                const priceA = getPriceValue(a.price);
                const priceB = getPriceValue(b.price);
                return priceA - priceB;
            });
        
        case 'price-desc':
            return sorted.sort((a, b) => {
                const priceA = getPriceValue(a.price);
                const priceB = getPriceValue(b.price);
                return priceB - priceA;
            });
        
        case 'alphabet':
            return sorted.sort((a, b) => {
                return a.title.localeCompare(b.title, 'ru');
            });
        
        case 'popularity':
            return sorted.sort((a, b) => {
                const popA = a.popularity || 0;
                const popB = b.popularity || 0;
                return popB - popA;
            });
        
        default:
            return sorted;
    }
}

// Функция фильтрации событий
function filterEvents(events) {
    let filtered = [...events];
    
    // Поиск
    if (activeFilters.searchQuery) {
        filtered = searchEvents(filtered, activeFilters.searchQuery);
    }
    
    // Фильтр по типу
    if (activeFilters.type !== 'all') {
        filtered = filtered.filter(event => event.type === activeFilters.type);
    }
    
    // Фильтр по жанру
    if (activeFilters.genre !== 'all') {
        filtered = filtered.filter(event => event.genre === activeFilters.genre);
    }
    
    // Фильтр по дате
    if (activeFilters.date !== 'all') {
        filtered = filtered.filter(event => isDateInRange(event, activeFilters.date));
    }
    
    // Фильтр по диапазону дат
    if (activeFilters.dateFrom || activeFilters.dateTo) {
        filtered = filtered.filter(event => isDateInCustomRange(event, activeFilters.dateFrom, activeFilters.dateTo));
    }
    
    // Фильтр по цене
    if (activeFilters.price !== 'all') {
        filtered = filtered.filter(event => {
            const price = getPriceValue(event.price);
            switch(activeFilters.price) {
                case 'free':
                    return price === 0;
                case 'low':
                    return price > 0 && price <= 300;
                case 'medium':
                    return price > 300 && price <= 700;
                case 'high':
                    return price > 700;
                default:
                    return true;
            }
        });
    }
    
    // Фильтр по району
    if (activeFilters.district !== 'all') {
        filtered = filtered.filter(event => {
            const venue = getVenueById(event.venueId);
            return venue && venue.district === activeFilters.district;
        });
    }
    
    // Фильтр по художнику
    if (activeFilters.artist !== 'all') {
        const artistId = parseInt(activeFilters.artist);
        filtered = filtered.filter(event => 
            event.artistIds && event.artistIds.includes(artistId)
        );
    }
    
    // Фильтр по месту
    if (activeFilters.venue !== 'all') {
        const venueId = parseInt(activeFilters.venue);
        filtered = filtered.filter(event => event.venueId === venueId);
    }
    
    // Сортировка
    filtered = sortEvents(filtered, activeFilters.sortBy);
    
    return filtered;
}

// Функция для создания карточки события
function createEventCard(event) {
    const venue = getVenueById(event.venueId);
    const artists = event.artistIds.map(id => getArtistById(id)).filter(Boolean);
    const artistNames = artists.map(a => a.name).join(', ');
    const isFav = isFavorite(event.id);
    const priceValue = getPriceValue(event.price);
    
    // Генерируем WebP версию URL (если поддерживается)
    const imageWebP = event.image.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    
    return `
        <article class="event-card-wrapper" 
                 data-event-id="${event.id}"
                 itemscope 
                 itemtype="https://schema.org/Event"
                 role="listitem"
                 aria-label="${event.title}">
            <a href="event.html?id=${event.id}" class="event-card" itemprop="url" aria-label="Подробнее о событии ${event.title}">
                <picture>
                    <source srcset="${imageWebP}" type="image/webp">
                    <img src="${event.image}" 
                         alt="${event.alt}" 
                         class="event-card__image"
                         itemprop="image"
                         loading="lazy"
                         decoding="async"
                         width="300"
                         height="200">
                </picture>
                <div class="event-card__content">
                    <span class="event-card__type" itemprop="eventAttendanceMode">${event.type}</span>
                    ${event.genre ? `<span class="event-card__genre">${event.genre}</span>` : ''}
                    <h3 class="event-card__title" itemprop="name">${event.title}</h3>
                    <time class="event-card__date" datetime="${event.date}" itemprop="startDate">${event.date}</time>
                    ${artistNames ? `<p class="event-card__artist" itemprop="performer" itemscope itemtype="https://schema.org/Person">
                        <span itemprop="name">${artistNames}</span>
                    </p>` : ''}
                    ${venue ? `<p class="event-card__venue" itemprop="location" itemscope itemtype="https://schema.org/Place">
                        <span itemprop="name">${venue.name}</span>
                    </p>` : ''}
                    <p class="event-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                        <span itemprop="price">${priceValue === 0 ? 'Бесплатно' : priceValue}</span>
                        ${priceValue > 0 ? '<span itemprop="priceCurrency" content="RUB">₽</span>' : ''}
                    </p>
                </div>
            </a>
            <button class="favorite-btn ${isFav ? 'favorite-btn--active' : ''}" 
                    data-event-id="${event.id}" 
                    aria-label="${isFav ? 'Удалить из избранного' : 'Добавить в избранное'}">
                ${isFav ? '★ В избранном' : '☆ В избранное'}
            </button>
        </article>
    `;
}

// Функция рендеринга событий
function renderEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    const eventsEmpty = document.getElementById('eventsEmpty');
    const eventsCount = document.getElementById('eventsCount');
    
    if (!eventsGrid) return;
    
    const filtered = filterEvents(events);
    
    // Сохраняем настройки фильтров (кроме поискового запроса)
    const filtersToSave = { ...activeFilters };
    delete filtersToSave.searchQuery; // Не сохраняем поисковый запрос
    saveFilterSettings(filtersToSave);
    
    // Обновляем счетчик
    if (eventsCount) {
        eventsCount.textContent = filtered.length;
    }
    
    // Показываем/скрываем сообщение о пустом результате
    if (eventsEmpty) {
        if (filtered.length === 0) {
            eventsEmpty.style.display = 'block';
            eventsGrid.style.display = 'none';
        } else {
            eventsEmpty.style.display = 'none';
            eventsGrid.style.display = 'grid';
        }
    }
    
    // Добавляем класс для анимации исчезновения
    eventsGrid.classList.add('events-grid--fade-out');
    
    setTimeout(() => {
        const cardsHTML = filtered.map(createEventCard).join('');
        eventsGrid.innerHTML = cardsHTML;
        
        // Добавляем класс для анимации появления
        eventsGrid.classList.remove('events-grid--fade-out');
        eventsGrid.classList.add('events-grid--fade-in');
        
        // Убираем класс анимации после завершения
        setTimeout(() => {
            eventsGrid.classList.remove('events-grid--fade-in');
        }, 300);
        
        // Добавляем обработчики для кнопок избранного
        attachFavoriteHandlers();
    }, 150);
}

// Функция для добавления обработчиков кнопок избранного
function attachFavoriteHandlers() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const eventId = parseInt(btn.dataset.eventId);
            toggleFavorite(eventId);
            
            // Обновляем состояние кнопки
            const isFav = isFavorite(eventId);
            if (isFav) {
                btn.classList.add('favorite-btn--active');
                btn.textContent = '★ В избранном';
                btn.setAttribute('aria-label', 'Удалить из избранного');
            } else {
                btn.classList.remove('favorite-btn--active');
                btn.textContent = '☆ В избранное';
                btn.setAttribute('aria-label', 'Добавить в избранное');
            }
            
            // Добавляем анимацию
            btn.classList.add('favorite-btn--animate');
            setTimeout(() => {
                btn.classList.remove('favorite-btn--animate');
            }, 300);
        });
    });
}

// Функция для заполнения селектов фильтров
function populateFilterSelects() {
    const artistSelect = document.getElementById('artistFilter');
    const venueSelect = document.getElementById('venueFilter');
    
    if (artistSelect) {
        artists.forEach(artist => {
            const option = document.createElement('option');
            option.value = artist.id;
            option.textContent = artist.name;
            artistSelect.appendChild(option);
        });
    }
    
    if (venueSelect) {
        venues.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue.id;
            option.textContent = venue.name;
            venueSelect.appendChild(option);
        });
    }
}

// Функция для обновления активных кнопок фильтров
function updateActiveFilterButtons() {
    // Обновляем все группы фильтров
    ['type', 'genre', 'date', 'price', 'district'].forEach(filterType => {
        document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(btn => {
            const isActive = btn.dataset.value === activeFilters[filterType];
            if (isActive) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    });
    
    // Обновляем селекты
    const artistSelect = document.getElementById('artistFilter');
    const venueSelect = document.getElementById('venueFilter');
    const sortSelect = document.getElementById('sortSelect');
    
    if (artistSelect) artistSelect.value = activeFilters.artist;
    if (venueSelect) venueSelect.value = activeFilters.venue;
    if (sortSelect) sortSelect.value = activeFilters.sortBy;
}

// Функция для сброса фильтров
function resetFilters() {
    activeFilters = {
        type: 'all',
        genre: 'all',
        date: 'all',
        dateFrom: '',
        dateTo: '',
        price: 'all',
        district: 'all',
        artist: 'all',
        venue: 'all',
        searchQuery: '',
        sortBy: 'date'
    };
    
    const searchInput = document.getElementById('searchInput');
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    
    if (searchInput) searchInput.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    const searchClear = document.getElementById('searchClear');
    if (searchClear) searchClear.style.display = 'none';
    
    updateActiveFilterButtons();
    renderEvents();
}

// Инициализация
function initEvents() {
    // Заполняем селекты
    populateFilterSelects();
    
    // Восстанавливаем сохраненные настройки фильтров
    const savedFilters = loadFilterSettings();
    if (savedFilters) {
        activeFilters = { ...activeFilters, ...savedFilters };
        updateActiveFilterButtons();
        
        // Восстанавливаем значения полей
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        if (dateFrom && savedFilters.dateFrom) dateFrom.value = savedFilters.dateFrom;
        if (dateTo && savedFilters.dateTo) dateTo.value = savedFilters.dateTo;
    }
    
    // Обработчик поиска
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                activeFilters.searchQuery = e.target.value;
                if (searchClear) {
                    searchClear.style.display = e.target.value ? 'block' : 'none';
                }
                renderEvents();
            }, 300);
        });
    }
    
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            activeFilters.searchQuery = '';
            if (searchInput) searchInput.value = '';
            searchClear.style.display = 'none';
            renderEvents();
        });
    }
    
    // Обработчики для кнопок фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.filter;
            const filterValue = btn.dataset.value;
            
            activeFilters[filterType] = filterValue;
            
            // Обновляем активные кнопки
            document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            
            // Применяем фильтры
            renderEvents();
        });
    });
    
    // Обработчик диапазона дат
    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');
    const applyDateRange = document.getElementById('applyDateRange');
    
    if (applyDateRange) {
        applyDateRange.addEventListener('click', () => {
            activeFilters.dateFrom = dateFrom ? dateFrom.value : '';
            activeFilters.dateTo = dateTo ? dateTo.value : '';
            activeFilters.date = 'all'; // Сбрасываем фильтр по дате
            document.querySelectorAll('[data-filter="date"]').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.value === 'all') btn.classList.add('active');
            });
            renderEvents();
        });
    }
    
    // Обработчики для селектов
    const artistSelect = document.getElementById('artistFilter');
    const venueSelect = document.getElementById('venueFilter');
    const sortSelect = document.getElementById('sortSelect');
    
    if (artistSelect) {
        artistSelect.addEventListener('change', (e) => {
            activeFilters.artist = e.target.value;
            renderEvents();
        });
    }
    
    if (venueSelect) {
        venueSelect.addEventListener('change', (e) => {
            activeFilters.venue = e.target.value;
            renderEvents();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeFilters.sortBy = e.target.value;
            renderEvents();
        });
    }
    
    // Обработчик для кнопки сброса
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    // Первоначальный рендеринг
    renderEvents();
}

// Запускаем инициализацию при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
} else {
    initEvents();
}


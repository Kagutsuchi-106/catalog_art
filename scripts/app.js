// Состояние фильтров для главной страницы
let homeFilters = {
    type: 'all',
    date: 'all'
};

// Функция для создания карточки события
function createEventCard(event) {
    const venue = getVenueById(event.venueId);
    const artists = (event.artistIds || []).map(id => getArtistById(id)).filter(Boolean);
    const artistNames = artists.map(a => a.name).join(', ');
    const isFav = isFavorite(event.id);
    const priceValue = getPriceValue(event.price);
    
    return `
        <article class="event-card-wrapper" 
                 data-event-id="${event.id}"
                 itemscope 
                 itemtype="https://schema.org/Event"
                 role="listitem">
            <a href="event.html?id=${event.id}" class="event-card" itemprop="url" aria-label="Подробнее о событии ${event.title}">
                <picture>
                    <source srcset="${event.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
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
                    <h3 class="event-card__title" itemprop="name">${event.title}</h3>
                    <time class="event-card__date" datetime="${event.date}" itemprop="startDate">${event.date}</time>
                    ${artistNames ? `<p class="event-card__artist" itemprop="performer" itemscope itemtype="https://schema.org/Person">
                        <span itemprop="name">${artistNames}</span>
                    </p>` : ''}
                    ${venue ? `<p class="event-card__venue" itemprop="location" itemscope itemtype="https://schema.org/Place">
                        <span itemprop="name">${venue.name}</span>
                    </p>` : ''}
                    <p class="event-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                        <span itemprop="price">${priceValue}</span>
                        <span itemprop="priceCurrency" content="RUB">₽</span>
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

// Функция для извлечения числового значения цены
function getPriceValue(priceString) {
    const match = priceString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Функция для проверки даты события
function checkDateFilter(event, filterValue) {
    if (filterValue === 'all') return true;
    if (!event.dateStart) return true; // Если нет даты, пропускаем
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(event.dateStart);
    eventDate.setHours(0, 0, 0, 0);
    
    // Проверяем, что событие в будущем или сегодня
    if (eventDate < today) return false;
    
    if (filterValue === 'week') {
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return eventDate >= today && eventDate <= weekFromNow;
    }
    
    if (filterValue === 'month') {
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(today.getMonth() + 1);
        return eventDate >= today && eventDate <= monthFromNow;
    }
    
    if (filterValue === 'halfyear') {
        const halfYearFromNow = new Date(today);
        halfYearFromNow.setMonth(today.getMonth() + 6);
        return eventDate >= today && eventDate <= halfYearFromNow;
    }
    
    return true;
}

// Функция фильтрации событий
function filterHomeEvents(events) {
    return events.filter(event => {
        // Фильтр по типу
        if (homeFilters.type !== 'all' && event.type !== homeFilters.type) {
            return false;
        }
        
        // Фильтр по дате
        if (homeFilters.date !== 'all' && !checkDateFilter(event, homeFilters.date)) {
            return false;
        }
        
        return true;
    });
}

// Функция рендеринга событий
function renderEvents(filteredEvents = null) {
    const catalogGrid = document.getElementById('catalogGrid') || document.querySelector('.catalog-grid');
    const eventsEmpty = document.getElementById('eventsEmpty');
    const eventsCount = document.getElementById('eventsCount');
    
    if (!catalogGrid) {
        return;
    }
    
    const filtered = filteredEvents !== null ? filteredEvents : filterHomeEvents(events);
    
    // Обновляем счетчик
    if (eventsCount) {
        eventsCount.textContent = filtered.length;
    }
    
    // Показываем/скрываем сообщение о пустом результате
    if (eventsEmpty) {
        if (filtered.length === 0) {
            eventsEmpty.style.display = 'block';
            catalogGrid.style.display = 'none';
        } else {
            eventsEmpty.style.display = 'none';
            catalogGrid.style.display = 'grid';
        }
    }
    
    // Добавляем класс для анимации исчезновения
    catalogGrid.classList.add('events-grid--fade-out');
    
    setTimeout(() => {
        const cardsHTML = filtered.map(createEventCard).join('');
        catalogGrid.innerHTML = cardsHTML;
        
        // Добавляем класс для анимации появления
        catalogGrid.classList.remove('events-grid--fade-out');
        catalogGrid.classList.add('events-grid--fade-in');
        
        // Убираем класс анимации после завершения
        setTimeout(() => {
            catalogGrid.classList.remove('events-grid--fade-in');
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

// Функция для обновления активных кнопок фильтров
function updateActiveFilterButtons() {
    // Обновляем кнопки типа
    document.querySelectorAll('[data-filter="type"]').forEach(btn => {
        if (btn.dataset.value === homeFilters.type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Обновляем кнопки даты
    document.querySelectorAll('[data-filter="date"]').forEach(btn => {
        if (btn.dataset.value === homeFilters.date) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Функция для сброса фильтров
function resetFilters() {
    homeFilters = {
        type: 'all',
        date: 'all'
    };
    updateActiveFilterButtons();
    renderEvents();
}

// Инициализация
function initHomePage() {
    // Обработчики для кнопок фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.filter;
            const filterValue = btn.dataset.value;
            
            homeFilters[filterType] = filterValue;
            
            // Обновляем активные кнопки
            document.querySelectorAll(`[data-filter="${filterType}"]`).forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            // Применяем фильтры
            const filtered = filterHomeEvents(events);
            renderEvents(filtered);
        });
    });
    
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
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}



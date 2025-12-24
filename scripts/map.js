// Цветовое кодирование по типам мест
const venueColors = {
    museum: '#E63946',      // Красный для музеев
    gallery: '#457B9D',      // Синий для галерей
    'art-center': '#2A9D8F', // Зеленый для арт-центров
    cluster: '#F77F00'       // Желтый/оранжевый для кластеров
};

// Текущий активный фильтр
let activeTypeFilter = 'all';

// Функция для получения событий места
function getVenueEvents(venueId) {
    return events.filter(event => event.venueId === venueId);
}

// Функция для создания SVG маркера
function createVenueMarker(venue) {
    const color = venueColors[venue.typeCategory] || '#666';
    const venueEvents = getVenueEvents(venue.id);
    const eventsCount = venueEvents.length;
    
    // Внешняя группа для позиционирования (translate)
    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markerGroup.classList.add('venue-marker-group');
    markerGroup.setAttribute('data-venue-id', venue.id);
    markerGroup.setAttribute('data-type', venue.typeCategory);
    markerGroup.setAttribute('transform', `translate(${venue.svgX}, ${venue.svgY})`);
    markerGroup.setAttribute('role', 'button');
    markerGroup.setAttribute('tabindex', '0');
    markerGroup.setAttribute('aria-label', `${venue.name}. ${eventsCount} событий`);
    
    // Внутренняя группа для масштабирования (scale)
    const scaleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    scaleGroup.classList.add('marker-scale-group');
    
    // Внешний круг (тень)
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    shadow.setAttribute('cx', '0');
    shadow.setAttribute('cy', '0');
    shadow.setAttribute('r', '18');
    shadow.setAttribute('fill', 'rgba(0, 0, 0, 0.2)');
    shadow.setAttribute('opacity', '0.3');
    
    // Основной круг маркера
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '15');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '3');
    circle.classList.add('marker-circle');
    
    // Иконка типа (первая буква)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-family', 'var(--font-heading)');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', 'bold');
    text.textContent = venue.type.charAt(0);
    
    // Индикатор количества событий
    if (eventsCount > 0) {
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        badge.setAttribute('cx', '12');
        badge.setAttribute('cy', '-12');
        badge.setAttribute('r', '8');
        badge.setAttribute('fill', '#fff');
        badge.setAttribute('stroke', color);
        badge.setAttribute('stroke-width', '2');
        
        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeText.setAttribute('x', '12');
        badgeText.setAttribute('y', '-12');
        badgeText.setAttribute('text-anchor', 'middle');
        badgeText.setAttribute('dominant-baseline', 'central');
        badgeText.setAttribute('fill', color);
        badgeText.setAttribute('font-family', 'var(--font-body)');
        badgeText.setAttribute('font-size', '10');
        badgeText.setAttribute('font-weight', 'bold');
        badgeText.textContent = eventsCount;
        
        scaleGroup.appendChild(badge);
        scaleGroup.appendChild(badgeText);
    }
    
    scaleGroup.appendChild(shadow);
    scaleGroup.appendChild(circle);
    scaleGroup.appendChild(text);
    markerGroup.appendChild(scaleGroup);
    
    // Обработчики событий
    markerGroup.addEventListener('mouseenter', () => {
        markerGroup.classList.add('marker-hover');
    });
    
    markerGroup.addEventListener('mouseleave', () => {
        markerGroup.classList.remove('marker-hover');
    });
    
    markerGroup.addEventListener('click', () => {
        openVenueModal(venue);
    });
    
    markerGroup.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openVenueModal(venue);
        }
    });
    
    return markerGroup;
}

// Функция для отображения всех маркеров
function renderMarkers(filterType = 'all') {
    const markersContainer = document.getElementById('venue-markers');
    if (!markersContainer) return;
    
    // Очищаем контейнер
    markersContainer.innerHTML = '';
    
    // Фильтруем места
    const filteredVenues = filterType === 'all' 
        ? venues 
        : venues.filter(v => v.typeCategory === filterType);
    
    // Создаем маркеры
    filteredVenues.forEach(venue => {
        const marker = createVenueMarker(venue);
        markersContainer.appendChild(marker);
    });
}

// Функция для открытия модального окна с информацией о месте
function openVenueModal(venue) {
    const modal = document.getElementById('venueModal');
    const modalBody = document.getElementById('venueModalBody');
    
    if (!modal || !modalBody) return;
    
    const venueEvents = getVenueEvents(venue.id);
    const color = venueColors[venue.typeCategory] || '#666';
    
    // Формируем список событий
    const eventsHTML = venueEvents.length > 0
        ? venueEvents.map(event => `
            <li class="venue-events__item">
                <a href="event.html?id=${event.id}" class="venue-events__link">
                    <span class="venue-events__title">${event.title}</span>
                    <span class="venue-events__date">${event.date}</span>
                </a>
            </li>
        `).join('')
        : '<li class="venue-events__item venue-events__item--empty">На этой площадке пока нет запланированных мероприятий</li>';
    
    modalBody.innerHTML = `
        <div class="venue-modal__header" style="border-left: 4px solid ${color};">
            <h2 id="venueModalTitle" class="venue-modal__title">${venue.name}</h2>
            <span class="venue-modal__type" style="color: ${color};">${venue.type}</span>
        </div>
        
        ${venue.image ? `
            <div class="venue-modal__image">
                <picture>
                    <source srcset="${venue.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                    <img src="${venue.image}" 
                         alt="${venue.name}" 
                         class="venue-modal__img"
                         loading="lazy"
                         decoding="async"
                         width="600"
                         height="300">
                </picture>
            </div>
        ` : ''}
        
        <div class="venue-modal__info">
            <div class="venue-info__section">
                <h3 class="venue-info__heading">Адрес</h3>
                <p class="venue-info__text">${venue.address}</p>
                ${venue.howToGet ? `<p class="venue-info__text venue-info__text--how-to-get">
                    <strong>Как добраться:</strong> ${venue.howToGet}
                </p>` : ''}
            </div>
            
            <div class="venue-info__section">
                <h3 class="venue-info__heading">Режим работы</h3>
                <pre class="venue-info__schedule">${venue.workingHours}</pre>
            </div>
            
            <div class="venue-info__section">
                <h3 class="venue-info__heading">Контакты</h3>
                ${venue.phone ? `<p class="venue-info__text">
                    <strong>Телефон:</strong> 
                    <a href="tel:${venue.phone.replace(/\s/g, '')}" class="venue-info__link">${venue.phone}</a>
                </p>` : ''}
                ${venue.website ? `<p class="venue-info__text">
                    <strong>Сайт:</strong> 
                    <a href="${venue.website}" target="_blank" rel="noopener noreferrer" class="venue-info__link">${venue.website}</a>
                </p>` : ''}
            </div>
            
            <div class="venue-info__section">
                <h3 class="venue-info__heading">Средняя стоимость входа</h3>
                <p class="venue-info__price">${venue.averagePrice}</p>
            </div>
            
            <div class="venue-info__section">
                <h3 class="venue-info__heading">О пространстве</h3>
                <p class="venue-info__description">${venue.description}</p>
            </div>
            
            <div class="venue-info__section">
                <h3 class="venue-info__heading">Текущие и предстоящие мероприятия (${venueEvents.length})</h3>
                <ul class="venue-events__list">
                    ${eventsHTML}
                </ul>
            </div>
        </div>
    `;
    
    // Показываем модальное окно
    modal.classList.add('venue-modal--active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Фокус на модальном окне для доступности
    const closeBtn = modal.querySelector('.venue-modal__close');
    if (closeBtn) {
        closeBtn.focus();
    }
}

// Функция для закрытия модального окна
function closeVenueModal() {
    const modal = document.getElementById('venueModal');
    if (!modal) return;
    
    modal.classList.remove('venue-modal--active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// Инициализация карты
function initMap() {
    // Рендерим все маркеры
    renderMarkers(activeTypeFilter);
    
    // Обработчики фильтров
    const filterButtons = document.querySelectorAll('.map-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.filter;
            activeTypeFilter = filterType;
            
            // Обновляем активные кнопки
            filterButtons.forEach(b => {
                const isActive = b.dataset.filter === filterType;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            
            // Обновляем маркеры
            renderMarkers(filterType);
        });
    });
    
    // Обработчик закрытия модального окна
    const modal = document.getElementById('venueModal');
    const closeBtn = modal?.querySelector('.venue-modal__close');
    const overlay = modal?.querySelector('.venue-modal__overlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVenueModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeVenueModal);
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVenueModal();
        }
    });
}

// Запускаем инициализацию при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}

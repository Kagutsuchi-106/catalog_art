function getArtistIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}


function getEventsByArtistId(artistId) {
    return events.filter(event => event.artistIds && event.artistIds.includes(artistId));
}

function renderArtist() {
    const artistContent = document.getElementById('artist-content');
    if (!artistContent) {
        return;
    }

    const artistId = getArtistIdFromURL();
    if (!artistId) {
        artistContent.innerHTML = '<p>Художник не найден.</p>';
        return;
    }

    const artist = getArtistById(artistId);
    if (!artist) {
        artistContent.innerHTML = '<p>Художник не найден.</p>';
        return;
    }

    const artistEvents = getEventsByArtistId(artistId);
    
    const portfolioHTML = artist.portfolio && artist.portfolio.length > 0
        ? `
            <section class="artist-portfolio">
                <h2 class="section__title">Портфолио</h2>
                <div class="portfolio-masonry">
                    ${artist.portfolio.map((work, index) => {
                        const workData = JSON.stringify(work).replace(/'/g, "&#39;").replace(/"/g, '&quot;');
                        return `
                        <article class="portfolio-item" 
                                 itemscope 
                                 itemtype="https://schema.org/CreativeWork"
                                 data-work-index="${index}">
                            <button class="portfolio-item__button" 
                                    type="button"
                                    aria-label="Открыть подробную информацию о работе ${work.title}"
                                    data-work-data='${workData}'>
                                <picture>
                                    <source srcset="${work.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                                    <img src="${work.image}" 
                                         alt="${work.title}" 
                                         class="portfolio-item__image"
                                         itemprop="image"
                                         loading="lazy"
                                         decoding="async"
                                         width="400"
                                         height="300">
                                </picture>
                                <div class="portfolio-item__content">
                                    <h3 class="portfolio-item__title" itemprop="name">${work.title}</h3>
                                    <time class="portfolio-item__year" datetime="${work.year}" itemprop="dateCreated">${work.year}</time>
                                </div>
                            </button>
                        </article>
                    `;
                    }).join('')}
                </div>
            </section>
        `
        : '';

    const eventsHTML = artistEvents.length > 0
        ? `
            <section class="artist-events">
                <h2 class="section__title">Мероприятия</h2>
                <div class="events-list">
                    ${artistEvents.map(event => `
                        <article class="event-item" 
                                 itemscope 
                                 itemtype="https://schema.org/Event">
                            <h3 class="event-item__title">
                                <a href="${getPagePath('event.html')}?id=${event.id}" 
                                   class="event-item__link"
                                   itemprop="url">
                                    <span itemprop="name">${event.title}</span>
                                </a>
                            </h3>
                            <p class="event-item__type" itemprop="eventAttendanceMode">${event.type}</p>
                            <time class="event-item__date" datetime="${event.date}" itemprop="startDate">${event.date}</time>
                        </article>
                    `).join('')}
                </div>
            </section>
        `
        : '<p>У художника пока нет запланированных мероприятий.</p>';

    artistContent.innerHTML = `
        <article class="artist-profile" 
                 itemscope 
                 itemtype="https://schema.org/Person">
            <header class="artist-profile__header">
                <picture>
                    <source srcset="${artist.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                    <img src="${artist.image}" 
                         alt="${artist.name}" 
                         class="artist-profile__image"
                         itemprop="image"
                         loading="eager"
                         decoding="async"
                         width="300"
                         height="300">
                </picture>
                <div class="artist-profile__info">
                    <h1 class="artist-profile__name" itemprop="name">${artist.name}</h1>
                    <p class="artist-profile__direction" itemprop="jobTitle">${artist.direction}</p>
                </div>
            </header>
            <section class="artist-profile__bio">
                <h2 class="section__title">Биография</h2>
                <p class="artist-profile__text" itemprop="description">${artist.bio}</p>
            </section>
            <section class="artist-profile__concept">
                <h2 class="section__title">Концепция</h2>
                <p class="artist-profile__text">${artist.concept}</p>
            </section>
            ${portfolioHTML}
            ${eventsHTML}
        </article>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "${artist.name}",
            "jobTitle": "${artist.direction}",
            "description": "${artist.bio}",
            "image": "${artist.image}"
        }
        </script>
    `;
}

// Добавляем обработчики кликов на портфолио после рендеринга
function attachPortfolioHandlers() {
    const portfolioButtons = document.querySelectorAll('.portfolio-item__button');
    portfolioButtons.forEach(button => {
        button.addEventListener('click', function() {
            const workDataStr = this.getAttribute('data-work-data');
            if (workDataStr && window.openPortfolioModal) {
                try {
                    const workData = JSON.parse(workDataStr.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
                    window.openPortfolioModal(workData);
                } catch (e) {
                    console.error('Ошибка при парсинге данных работы:', e);
                }
            }
        });
    });
}

function renderArtist() {
    const artistContent = document.getElementById('artist-content');
    if (!artistContent) {
        return;
    }

    const artistId = getArtistIdFromURL();
    if (!artistId) {
        artistContent.innerHTML = '<p>Художник не найден.</p>';
        return;
    }

    const artist = getArtistById(artistId);
    if (!artist) {
        artistContent.innerHTML = '<p>Художник не найден.</p>';
        return;
    }

    const artistEvents = getEventsByArtistId(artistId);
    
    const portfolioHTML = artist.portfolio && artist.portfolio.length > 0
        ? `
            <section class="artist-portfolio">
                <h2 class="section__title">Портфолио</h2>
                <div class="portfolio-masonry">
                    ${artist.portfolio.map((work, index) => {
                        const workData = JSON.stringify(work).replace(/'/g, "&#39;").replace(/"/g, '&quot;');
                        return `
                        <article class="portfolio-item" 
                                 itemscope 
                                 itemtype="https://schema.org/CreativeWork"
                                 data-work-index="${index}">
                            <button class="portfolio-item__button" 
                                    type="button"
                                    aria-label="Открыть подробную информацию о работе ${work.title}"
                                    data-work-data='${workData}'>
                                <picture>
                                    <source srcset="${work.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                                    <img src="${work.image}" 
                                         alt="${work.title}" 
                                         class="portfolio-item__image"
                                         itemprop="image"
                                         loading="lazy"
                                         decoding="async"
                                         width="400"
                                         height="300">
                                </picture>
                                <div class="portfolio-item__content">
                                    <h3 class="portfolio-item__title" itemprop="name">${work.title}</h3>
                                    <time class="portfolio-item__year" datetime="${work.year}" itemprop="dateCreated">${work.year}</time>
                                </div>
                            </button>
                        </article>
                    `;
                    }).join('')}
                </div>
            </section>
        `
        : '';

    const eventsHTML = artistEvents.length > 0
        ? `
            <section class="artist-events">
                <h2 class="section__title">Мероприятия</h2>
                <div class="events-list">
                    ${artistEvents.map(event => `
                        <article class="event-item" 
                                 itemscope 
                                 itemtype="https://schema.org/Event">
                            <h3 class="event-item__title">
                                <a href="${getPagePath('event.html')}?id=${event.id}" 
                                   class="event-item__link"
                                   itemprop="url">
                                    <span itemprop="name">${event.title}</span>
                                </a>
                            </h3>
                            <p class="event-item__type" itemprop="eventAttendanceMode">${event.type}</p>
                            <time class="event-item__date" datetime="${event.date}" itemprop="startDate">${event.date}</time>
                        </article>
                    `).join('')}
                </div>
            </section>
        `
        : '<p>У художника пока нет запланированных мероприятий.</p>';

    artistContent.innerHTML = `
        <article class="artist-profile" 
                 itemscope 
                 itemtype="https://schema.org/Person">
            <header class="artist-profile__header">
                <picture>
                    <source srcset="${artist.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                    <img src="${artist.image}" 
                         alt="${artist.name}" 
                         class="artist-profile__image"
                         itemprop="image"
                         loading="eager"
                         decoding="async"
                         width="300"
                         height="300">
                </picture>
                <div class="artist-profile__info">
                    <h1 class="artist-profile__name" itemprop="name">${artist.name}</h1>
                    <p class="artist-profile__direction" itemprop="jobTitle">${artist.direction}</p>
                </div>
            </header>
            <section class="artist-profile__bio">
                <h2 class="section__title">Биография</h2>
                <p class="artist-profile__text" itemprop="description">${artist.bio}</p>
            </section>
            <section class="artist-profile__concept">
                <h2 class="section__title">Концепция</h2>
                <p class="artist-profile__text">${artist.concept}</p>
            </section>
            ${portfolioHTML}
            ${eventsHTML}
        </article>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "${artist.name}",
            "jobTitle": "${artist.direction}",
            "description": "${artist.bio}",
            "image": "${artist.image}"
        }
        </script>
    `;
    
    // Добавляем обработчики после рендеринга
    setTimeout(attachPortfolioHandlers, 100);
}

renderArtist();

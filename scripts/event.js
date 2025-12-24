function getEventIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id'));
}


function renderEvent() {
    const eventContent = document.getElementById('event-content');
    if (!eventContent) {
        return;
    }

    const eventId = getEventIdFromURL();
    if (!eventId) {
        eventContent.innerHTML = '<p>Событие не найдено.</p>';
        return;
    }

    const event = getEventById(eventId);
    if (!event) {
        eventContent.innerHTML = '<p>Событие не найдено.</p>';
        return;
    }

    const eventArtists = event.artistIds 
        ? event.artistIds.map(id => getArtistById(id)).filter(Boolean)
        : [];
    
    const artistsLinks = eventArtists.length > 0
        ? eventArtists.map(artist => 
            `<a href="artist.html?id=${artist.id}" class="event-content__link">${artist.name}</a>`
          ).join(', ')
        : 'Не указаны';
    
    const venue = getVenueById(event.venueId);
    const venueLink = venue 
        ? `<a href="map.html#venue-${venue.id}" class="event-content__link">${venue.name}</a>`
        : 'Не указана';

    const priceValue = event.price.match(/(\d+)/) ? parseInt(event.price.match(/(\d+)/)[1]) : 0;
    const curatorInfo = event.curator ? `<p><strong>Куратор:</strong> <span itemprop="organizer" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${event.curator}</span></span></p>` : '';
    const conceptInfo = event.concept ? `
        <section class="event-detail__section">
            <h3 class="event-detail__heading">Концепция</h3>
            <p class="event-detail__text" itemprop="description">${event.concept}</p>
        </section>
    ` : '';
    const scheduleInfo = event.schedule ? `
        <section class="event-detail__section">
            <h3 class="event-detail__heading">График работы</h3>
            <pre class="event-detail__schedule">${event.schedule}</pre>
        </section>
    ` : '';
    
    const artistsSchema = eventArtists.length > 0 
        ? JSON.stringify(eventArtists.map(artist => ({
            "@type": "Person",
            "name": artist.name
        })))
        : '[]';

    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": event.title,
        "description": event.description,
        "image": event.image,
        "startDate": event.date,
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        "location": {
            "@type": "Place",
            "name": venue ? venue.name : "Не указана"
        },
        "offers": {
            "@type": "Offer",
            "price": priceValue.toString(),
            "priceCurrency": "RUB"
        },
        "performer": eventArtists.map(artist => ({
            "@type": "Person",
            "name": artist.name
        }))
    };

    eventContent.innerHTML = `
        <article class="event-detail" 
                 itemscope 
                 itemtype="https://schema.org/Event">
            <h1 class="section__title" itemprop="name">${event.title}</h1>
            <picture>
                <source srcset="${event.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                <img src="${event.image}" 
                     alt="${event.alt}" 
                     class="event-detail__image"
                     itemprop="image"
                     loading="eager"
                     decoding="async"
                     width="800"
                     height="600">
            </picture>
            
            <div class="event-detail__meta">
                <span class="event-card__type" itemprop="eventAttendanceMode">${event.type}</span>
            </div>
            
            <div class="event-detail__info">
                <div class="event-detail__row">
                    <p class="event-detail__row-text"><strong>Дата:</strong> <time datetime="${event.date}" itemprop="startDate">${event.date}</time></p>
                    <p class="event-detail__row-text"><strong>Цена:</strong> <span itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                        <span itemprop="price">${priceValue}</span>
                        <span itemprop="priceCurrency" content="RUB">₽</span>
                    </span></p>
                </div>
                <div class="event-detail__row">
                    <p class="event-detail__row-text"><strong>Художник${eventArtists.length > 1 ? 'и' : ''}:</strong> 
                        ${eventArtists.map(artist => 
                            `<a href="artist.html?id=${artist.id}" class="event-content__link" itemprop="performer" itemscope itemtype="https://schema.org/Person">
                                <span itemprop="name">${artist.name}</span>
                            </a>`
                        ).join(', ')}
                    </p>
                    <p class="event-detail__row-text"><strong>Площадка:</strong> 
                        ${venue ? `<a href="map.html#venue-${venue.id}" class="event-content__link" itemprop="location" itemscope itemtype="https://schema.org/Place">
                            <span itemprop="name">${venue.name}</span>
                        </a>` : 'Не указана'}
                    </p>
                </div>
                ${curatorInfo ? `<div class="event-detail__row">${curatorInfo}</div>` : ''}
            </div>
            
            <section class="event-detail__section">
                <h2 class="event-detail__heading">Описание</h2>
                <p class="event-detail__text" itemprop="description">${event.description}</p>
            </section>
            
            ${conceptInfo}
            ${scheduleInfo}
        </article>
        <script type="application/ld+json">
        ${JSON.stringify(eventSchema)}
        </script>
    `;
}

renderEvent();



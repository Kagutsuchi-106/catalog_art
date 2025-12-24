function createArtistCard(artist) {
    return `
        <article id="artist-${artist.id}" 
                 class="artist-card"
                 itemscope 
                 itemtype="https://schema.org/Person"
                 role="listitem">
            <a href="artist.html?id=${artist.id}" class="artist-card__link" itemprop="url" aria-label="Подробнее о художнике ${artist.name}">
                <picture>
                    <source srcset="${artist.image.replace(/\.(jpg|jpeg|png)$/i, '.webp')}" type="image/webp">
                    <img src="${artist.image}" 
                         alt="${artist.name}" 
                         class="artist-card__image"
                         itemprop="image"
                         loading="lazy"
                         decoding="async"
                         width="300"
                         height="300">
                </picture>
                <div class="artist-card__content">
                    <h3 class="artist-card__name" itemprop="name">${artist.name}</h3>
                    <span class="artist-card__direction" itemprop="jobTitle">${artist.direction}</span>
                </div>
            </a>
        </article>
    `;
}

function renderArtists() {
    const artistsGrid = document.querySelector('.artists-grid');
    if (!artistsGrid) {
        return;
    }
    
    const cardsHTML = artists.map(createArtistCard).join('');
    artistsGrid.innerHTML = cardsHTML;
}

renderArtists();

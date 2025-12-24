function getFavorites() {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(eventId) {
    const favorites = getFavorites();
    return favorites.includes(eventId);
}

function addToFavorites(eventId) {
    const favorites = getFavorites();
    if (!favorites.includes(eventId)) {
        favorites.push(eventId);
        saveFavorites(favorites);
    }
}

function removeFromFavorites(eventId) {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(id => id !== eventId);
    saveFavorites(updatedFavorites);
}

function toggleFavorite(eventId) {
    if (isFavorite(eventId)) {
        removeFromFavorites(eventId);
    } else {
        addToFavorites(eventId);
    }
}

function getFavoriteEvents() {
    const favorites = getFavorites();
    return events.filter(event => favorites.includes(event.id));
}

function getTicketCategory() {
    const category = localStorage.getItem('ticketCategory');
    return category || '';
}

function saveTicketCategory(category) {
    localStorage.setItem('ticketCategory', category);
}

function getEventById(eventId) {
    return events.find(event => event.id === eventId);
}

function getArtistById(artistId) {
    return artists.find(artist => artist.id === artistId);
}

function getVenueById(venueId) {
    return venues.find(venue => venue.id === venueId);
}




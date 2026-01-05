function renderCalendar() {
    const calendarList = document.getElementById('calendar-list');
    if (!calendarList) {
        return;
    }

    const favoriteEvents = getFavoriteEvents();

    if (favoriteEvents.length === 0) {
        calendarList.innerHTML = '<p class="calendar-list__empty">У вас пока нет избранных мероприятий.</p>';
        return;
    }

    const listHTML = favoriteEvents.map(event => `
        <article class="calendar-item">
            <span class="calendar-item__date">${event.date}</span>
            <h3 class="calendar-item__title"><a href="event.html?id=${event.id}" class="calendar-item__link">${event.title}</a></h3>
        </article>
    `).join('');

    calendarList.innerHTML = listHTML;
}

renderCalendar();



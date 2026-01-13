// Коэффициенты для категорий билетов
const TICKET_COEFFICIENTS = {
    'full': 1.0,
    'student': 0.7,
    'discount': 0.5
};

// Переменные для хранения данных
let plannedBudget = 0;
let budgetChart = null;

// Инициализация
function initBudget() {
    loadBudgetSettings();
    initBudgetInput();
    initTicketCategorySelector();
    renderBudget();
}

// Загрузка настроек из localStorage
function loadBudgetSettings() {
    const savedBudget = localStorage.getItem('plannedBudget');
    if (savedBudget) {
        plannedBudget = parseInt(savedBudget) || 0;
        const budgetInput = document.getElementById('planned-budget');
        if (budgetInput) {
            budgetInput.value = plannedBudget;
        }
    }
    
    const savedCategory = getTicketCategory();
    if (savedCategory) {
        const selector = document.getElementById('ticket-category-selector');
        if (selector) {
            selector.value = savedCategory;
        }
    }
}

// Сохранение настроек в localStorage
function saveBudgetSettings() {
    localStorage.setItem('plannedBudget', plannedBudget.toString());
    saveTicketCategory(getTicketCategory());
    
    // Сохранение истории расчетов
    const calculation = {
        date: new Date().toISOString(),
        plannedBudget: plannedBudget,
        ticketCategory: getTicketCategory(),
        events: getFavoriteEvents().map(e => e.id),
        total: calculateBudget().total
    };
    
    const history = JSON.parse(localStorage.getItem('budgetHistory') || '[]');
    history.push(calculation);
    if (history.length > 10) {
        history.shift(); // Оставляем только последние 10 расчетов
    }
    localStorage.setItem('budgetHistory', JSON.stringify(history));
}

// Инициализация поля ввода бюджета
function initBudgetInput() {
    const budgetInput = document.getElementById('planned-budget');
    if (!budgetInput) return;
    
    budgetInput.addEventListener('input', function() {
        plannedBudget = parseInt(this.value) || 0;
        saveBudgetSettings();
        renderBudget();
    });
    
    budgetInput.addEventListener('blur', function() {
        if (plannedBudget < 0) {
            plannedBudget = 0;
            this.value = 0;
        }
        saveBudgetSettings();
    });
}

// Инициализация селектора категории билета
function initTicketCategorySelector() {
    const selector = document.getElementById('ticket-category-selector');
    if (!selector) return;
    
    const savedCategory = getTicketCategory();
    if (savedCategory) {
        selector.value = savedCategory;
    } else {
        selector.value = 'full';
        saveTicketCategory('full');
    }
    
    selector.addEventListener('change', function() {
        saveTicketCategory(this.value);
        saveBudgetSettings();
        renderBudget();
    });
}

// Парсинг цены из строки
function parsePrice(priceString) {
    if (!priceString || priceString === '0 ₽' || priceString === 'Бесплатно') {
        return 0;
    }
    const price = priceString.replace(/\s/g, '').replace('₽', '').replace('₽', '');
    return parseInt(price) || 0;
}

// Получение коэффициента билета
function getTicketCoefficient() {
    const category = getTicketCategory();
    return TICKET_COEFFICIENTS[category] || TICKET_COEFFICIENTS['full'];
}

// Расчет бюджета
function calculateBudget() {
    const favoriteEvents = getFavoriteEvents();
    const coefficient = getTicketCoefficient();
    
    if (favoriteEvents.length === 0) {
        return {
            events: [],
            total: 0,
            coefficient: coefficient,
            byType: {}
        };
    }
    
    const eventsWithPrices = favoriteEvents.map(event => {
        const basePrice = parsePrice(event.price);
        const finalPrice = Math.round(basePrice * coefficient);
        
        return {
            ...event,
            priceValue: basePrice,
            finalPrice: finalPrice
        };
    });
    
    const total = eventsWithPrices.reduce((sum, event) => sum + event.finalPrice, 0);
    
    // Группировка по типам мероприятий
    const byType = {};
    eventsWithPrices.forEach(event => {
        const type = event.type || 'Другое';
        if (!byType[type]) {
            byType[type] = { count: 0, total: 0 };
        }
        byType[type].count++;
        byType[type].total += event.finalPrice;
    });
    
    return {
        events: eventsWithPrices,
        total: total,
        coefficient: coefficient,
        byType: byType
    };
}

// Получение метки категории
function getCategoryLabel(category) {
    const labels = {
        'full': 'Полный билет',
        'student': 'Студенческий',
        'discount': 'Льготный'
    };
    return labels[category] || 'Полный билет';
}

// Расчет аналитики
function calculateAnalytics() {
    const budget = calculateBudget();
    const events = budget.events;
    
    const paidEvents = events.filter(e => e.finalPrice > 0);
    const freeEvents = events.filter(e => e.finalPrice === 0);
    
    const averagePrice = paidEvents.length > 0
        ? Math.round(paidEvents.reduce((sum, e) => sum + e.finalPrice, 0) / paidEvents.length)
        : 0;
    
    // Расчет экономии со студенческим билетом
    const fullPriceTotal = events.reduce((sum, e) => sum + e.priceValue, 0);
    const savings = fullPriceTotal - budget.total;
    
    // Доступные бесплатные мероприятия
    const allFreeEvents = events.filter(e => parsePrice(e.price) === 0);
    const availableFreeEvents = allFreeEvents.length;
    
    return {
        paidCount: paidEvents.length,
        freeCount: freeEvents.length,
        averagePrice: averagePrice,
        savings: savings,
        availableFreeEvents: availableFreeEvents,
        fullPriceTotal: fullPriceTotal
    };
}

// Генерация рекомендаций
function generateRecommendations() {
    const budget = calculateBudget();
    const analytics = calculateAnalytics();
    const recommendations = [];
    
    if (plannedBudget > 0) {
        const remaining = plannedBudget - budget.total;
        const percentage = (budget.total / plannedBudget) * 100;
        
        if (remaining < 0) {
            // Превышение бюджета
            const overBudget = Math.abs(remaining);
            const paidEvents = budget.events.filter(e => e.finalPrice > 0);
            if (paidEvents.length > 0) {
                recommendations.push({
                    type: 'warning',
                    text: `Превышение бюджета на ${overBudget} ₽. Замените ${Math.ceil(overBudget / analytics.averagePrice)} платное мероприятие на бесплатное.`
                });
            }
        } else if (percentage > 100) {
            recommendations.push({
                type: 'error',
                text: `Превышение бюджета на ${Math.abs(remaining)} ₽`
            });
        } else if (percentage >= 70 && percentage <= 100) {
            recommendations.push({
                type: 'warning',
                text: `Использовано ${Math.round(percentage)}% бюджета. Осталось ${remaining} ₽.`
            });
        } else {
            recommendations.push({
                type: 'success',
                text: `Остаток бюджета: ${remaining} ₽ (${Math.round(100 - percentage)}%)`
            });
        }
    }
    
    // Общие рекомендации
    if (analytics.paidCount > 0 && analytics.freeCount > 0) {
        recommendations.push({
            type: 'info',
            text: `У вас ${analytics.paidCount} платных и ${analytics.freeCount} бесплатных мероприятий`
        });
    }
    
    if (analytics.averagePrice > 0) {
        recommendations.push({
            type: 'info',
            text: `Средняя стоимость билета: ${analytics.averagePrice} ₽`
        });
    }
    
    if (analytics.savings > 0) {
        recommendations.push({
            type: 'success',
            text: `Со ${getCategoryLabel(getTicketCategory()).toLowerCase()} билетом вы экономите ${analytics.savings} ₽`
        });
    }
    
    if (analytics.availableFreeEvents > 0) {
        recommendations.push({
            type: 'info',
            text: `Доступно ${analytics.availableFreeEvents} бесплатных мероприятий в этом месяце`
        });
    }
    
    return recommendations;
}

// Генерация советов по льготам
function generateDiscountTips() {
    const tips = [];
    const category = getTicketCategory();
    
    if (category !== 'student') {
        tips.push({
            type: 'tip',
            text: 'Используйте студенческий билет для скидки 30%'
        });
    }
    
    tips.push({
        type: 'tip',
        text: 'Первое воскресенье месяца - бесплатный вход в Музей современного искусства'
    });
    
    tips.push({
        type: 'tip',
        text: 'Льготный билет предоставляет скидку 50% для пенсионеров и инвалидов'
    });
    
    return tips;
}

// Отрисовка прогресс-бара
function renderProgressBar() {
    const progressContainer = document.getElementById('budget-progress');
    if (!progressContainer) return;
    
    if (plannedBudget === 0) {
        progressContainer.innerHTML = '<p class="budget-progress__empty">Установите плановый бюджет для отслеживания расходов</p>';
        return;
    }
    
    const budget = calculateBudget();
    const percentage = Math.min((budget.total / plannedBudget) * 100, 100);
    const remaining = Math.max(plannedBudget - budget.total, 0);
    
    let colorClass = 'budget-progress__bar--green';
    if (percentage >= 100) {
        colorClass = 'budget-progress__bar--red';
    } else if (percentage >= 70) {
        colorClass = 'budget-progress__bar--yellow';
    }
    
    progressContainer.innerHTML = `
        <div class="budget-progress__info">
            <div class="budget-progress__stat">
                <span class="budget-progress__label">Использовано:</span>
                <span class="budget-progress__value">${budget.total} ₽</span>
            </div>
            <div class="budget-progress__stat">
                <span class="budget-progress__label">Остаток:</span>
                <span class="budget-progress__value">${remaining} ₽</span>
            </div>
            <div class="budget-progress__stat">
                <span class="budget-progress__label">Процент:</span>
                <span class="budget-progress__value">${Math.round(percentage)}%</span>
            </div>
        </div>
        <div class="budget-progress__bar-container">
            <div class="budget-progress__bar ${colorClass}" style="width: ${percentage}%"></div>
        </div>
    `;
}

// Отрисовка круговой диаграммы
function renderChart() {
    const visualizationContainer = document.getElementById('budget-visualization');
    if (!visualizationContainer) return;
    
    const budget = calculateBudget();
    
    if (budget.events.length === 0) {
        visualizationContainer.innerHTML = '<p class="budget-visualization__empty">Добавьте мероприятия в календарь для визуализации</p>';
        if (budgetChart) {
            budgetChart.destroy();
            budgetChart = null;
        }
        return;
    }
    
    // Проверяем, доступен ли Chart.js
    if (typeof Chart === 'undefined') {
        // Если Chart.js не загружен, показываем текстовую статистику
        const typeData = Object.entries(budget.byType);
        if (typeData.length === 0) {
            visualizationContainer.innerHTML = '<p class="budget-visualization__empty">Нет данных для отображения</p>';
            return;
        }
        
        const statsHTML = typeData.map(([type, data]) => {
            const percentage = ((data.total / budget.total) * 100).toFixed(1);
            return `
                <div class="budget-stats-item">
                    <span class="budget-stats-item__type">${type}:</span>
                    <span class="budget-stats-item__value">${data.total} ₽ (${percentage}%)</span>
                </div>
            `;
        }).join('');
        
        visualizationContainer.innerHTML = `
            <div class="budget-stats">
                <h3 class="budget-stats__title">Распределение бюджета по типам</h3>
                ${statsHTML}
            </div>
        `;
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.id = 'budget-chart';
    visualizationContainer.innerHTML = '';
    visualizationContainer.appendChild(canvas);
    
    const typeData = Object.entries(budget.byType).map(([type, data]) => ({
        label: type,
        value: data.total
    }));
    
    if (typeData.length === 0) {
        visualizationContainer.innerHTML = '<p class="budget-visualization__empty">Нет данных для отображения</p>';
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (budgetChart) {
        budgetChart.destroy();
    }
    
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: typeData.map(d => d.label),
            datasets: [{
                data: typeData.map(d => d.value),
                backgroundColor: [
                    '#E63946',
                    '#457B9D',
                    '#2A9D8F',
                    '#F77F00',
                    '#E9C46A',
                    '#A8DADC',
                    '#1D3557'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const percentage = ((value / budget.total) * 100).toFixed(1);
                            return `${label}: ${value} ₽ (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Отрисовка аналитики
function renderAnalytics() {
    const analyticsContainer = document.getElementById('budget-analytics');
    if (!analyticsContainer) return;
    
    const recommendations = generateRecommendations();
    const tips = generateDiscountTips();
    
    if (recommendations.length === 0 && tips.length === 0) {
        analyticsContainer.innerHTML = '';
        return;
    }
    
    const recommendationsHTML = recommendations.map(rec => `
        <div class="budget-recommendation budget-recommendation--${rec.type}">
            <span class="budget-recommendation__icon">${rec.type === 'success' ? '✓' : rec.type === 'warning' ? '⚠' : rec.type === 'error' ? '✗' : 'ℹ'}</span>
            <span class="budget-recommendation__text">${rec.text}</span>
        </div>
    `).join('');
    
    const tipsHTML = tips.map(tip => `
        <div class="budget-tip">
            <span class="budget-tip__icon">💡</span>
            <span class="budget-tip__text">${tip.text}</span>
        </div>
    `).join('');
    
    analyticsContainer.innerHTML = `
        <div class="budget-analytics__section">
            <h3 class="budget-analytics__title">Рекомендации</h3>
            <div class="budget-recommendations">
                ${recommendationsHTML}
            </div>
        </div>
        <div class="budget-analytics__section">
            <h3 class="budget-analytics__title">Советы по льготам</h3>
            <div class="budget-tips">
                ${tipsHTML}
            </div>
        </div>
    `;
}

// Отрисовка списка мероприятий
function renderBudgetList() {
    const budgetContent = document.getElementById('budget-content');
    if (!budgetContent) return;
    
    const budget = calculateBudget();
    const category = getTicketCategory() || 'full';
    
    if (budget.events.length === 0) {
        budgetContent.innerHTML = '<p class="budget-empty">У вас нет избранных мероприятий для расчета бюджета. Добавьте мероприятия в календарь.</p>';
        return;
    }
    
    const eventsList = budget.events.map(event => {
        const originalPrice = event.price;
        const finalPrice = event.finalPrice;
        const priceDisplay = finalPrice !== event.priceValue 
            ? `<span style="text-decoration: line-through; opacity: 0.6;">${originalPrice}</span> <strong>${finalPrice} ₽</strong>`
            : `<strong>${finalPrice} ₽</strong>`;
        
        return `
            <article class="budget-item" data-event-id="${event.id}">
                <div class="budget-item__content">
                    <h3 class="budget-item__title"><a href="${getPagePath('event.html')}?id=${event.id}" class="budget-item__link">${event.title}</a></h3>
                    <p class="budget-item__text"><strong>Дата:</strong> ${event.date}</p>
                    <p class="budget-item__text"><strong>Тип:</strong> ${event.type || 'Не указан'}</p>
                    <p class="budget-item__text"><strong>Стоимость:</strong> ${priceDisplay}</p>
                </div>
                <button class="budget-item__remove" 
                        onclick="removeEventFromBudget(${event.id})" 
                        aria-label="Удалить из избранного"
                        title="Удалить из избранного">
                    ×
                </button>
            </article>
        `;
    }).join('');
    
    const categoryLabel = getCategoryLabel(category);
    const coefficientPercent = Math.round(budget.coefficient * 100);
    
    budgetContent.innerHTML = `
        <div class="budget-list">
            ${eventsList}
        </div>
        <div class="budget-total">
            <p class="budget-category-info">Категория: ${categoryLabel} (коэффициент ${budget.coefficient})</p>
            <h3 class="budget-total__title">Общая стоимость: ${budget.total} ₽</h3>
        </div>
    `;
}

// Экспорт данных
function renderExport() {
    const exportContainer = document.getElementById('budget-export');
    if (!exportContainer) return;
    
    const budget = calculateBudget();
    
    if (budget.events.length === 0) {
        exportContainer.innerHTML = '';
        return;
    }
    
    exportContainer.innerHTML = `
        <div class="budget-export__buttons">
            <button id="export-print" class="budget-export__btn">Печатная версия</button>
            <button id="export-text" class="budget-export__btn">Текстовый список</button>
        </div>
    `;
    
    const printBtn = document.getElementById('export-print');
    const textBtn = document.getElementById('export-text');
    
    if (printBtn) {
        printBtn.addEventListener('click', exportToPrint);
    }
    
    if (textBtn) {
        textBtn.addEventListener('click', exportToText);
    }
}

// Экспорт для печати
function exportToPrint() {
    const budget = calculateBudget();
    const category = getTicketCategory();
    const categoryLabel = getCategoryLabel(category);
    
    const printWindow = window.open('', '_blank');
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Календарь культурных мероприятий</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>Календарь культурных мероприятий</h1>
            <p><strong>Категория билета:</strong> ${categoryLabel}</p>
            <p><strong>Плановый бюджет:</strong> ${plannedBudget} ₽</p>
            <p><strong>Дата создания:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
            <table>
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Название</th>
                        <th>Тип</th>
                        <th>Стоимость</th>
                    </tr>
                </thead>
                <tbody>
                    ${budget.events.map(event => `
                        <tr>
                            <td>${event.date}</td>
                            <td>${event.title}</td>
                            <td>${event.type || 'Не указан'}</td>
                            <td>${event.finalPrice} ₽</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total">Общая стоимость: ${budget.total} ₽</div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Экспорт в текстовый формат
function exportToText() {
    const budget = calculateBudget();
    const category = getTicketCategory();
    const categoryLabel = getCategoryLabel(category);
    
    let text = `КАЛЕНДАРЬ КУЛЬТУРНЫХ МЕРОПРИЯТИЙ\n`;
    text += `Дата создания: ${new Date().toLocaleDateString('ru-RU')}\n`;
    text += `Категория билета: ${categoryLabel}\n`;
    text += `Плановый бюджет: ${plannedBudget} ₽\n\n`;
    text += `МЕРОПРИЯТИЯ:\n`;
    text += `================\n\n`;
    
    budget.events.forEach((event, index) => {
        text += `${index + 1}. ${event.title}\n`;
        text += `   Дата: ${event.date}\n`;
        text += `   Тип: ${event.type || 'Не указан'}\n`;
        text += `   Стоимость: ${event.finalPrice} ₽\n\n`;
    });
    
    text += `================\n`;
    text += `Общая стоимость: ${budget.total} ₽\n`;
    
    // Создаем временный textarea для копирования
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Показываем уведомление
    alert('Текстовый список скопирован в буфер обмена!');
}

// Удаление мероприятия из избранного (глобальная функция для использования в onclick)
window.removeEventFromBudget = function(eventId) {
    if (confirm('Удалить это мероприятие из избранного?')) {
        removeFromFavorites(eventId);
        renderBudget();
        
        // Обновляем календарь, если он открыт
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }
    }
};

// Основная функция отрисовки
function renderBudget() {
    renderProgressBar();
    renderChart();
    renderAnalytics();
    renderBudgetList();
    renderExport();
    saveBudgetSettings();
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBudget);
} else {
    initBudget();
}

// Обновление при изменении избранного
window.addEventListener('storage', function(e) {
    if (e.key === 'favorites') {
        renderBudget();
    }
});

// Периодическое обновление (на случай изменений в других вкладках)
setInterval(function() {
    renderBudget();
}, 2000);

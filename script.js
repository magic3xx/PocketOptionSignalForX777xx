document.addEventListener('DOMContentLoaded', function () {
    const originalSignalCardHTML = document.querySelector('.signal-card').innerHTML;
    let signalTrend = 0;
    const realLength = 75;
    const paddingRight = 20;
    let lastPulseTime = 0;
    let chart;
    
    // Обновление времени
    function updateTime() {
        const now = new Date();
        document.getElementById('current-time').textContent = now.toLocaleTimeString('ru-RU', { hour12: false });
    }
    
    // Инициализация графика
    function initResponsiveChart() {
        const ctx = document.getElementById('price-chart').getContext('2d');
        let lastValue = 50 + Math.random() * 10;
        
        const labels = Array.from({ length: realLength + paddingRight }, () => '');
        const data = labels.map((_, i) => {
            if (i < realLength) {
                lastValue += Math.random() * 2 - 1;
                return lastValue;
            }
            return null;
        });
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    borderColor: '#1c87c2',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: {
                        target: 'origin',
                        above: 'rgba(68, 108, 148, 0.1)',
                        below: 'rgba(68, 108, 148, 0.1)'
                    },
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    customVerticalGrid: { // Активируем наш плагин
                        color: 'rgba(200, 200, 200, 0.1)',
                        step: 20, // Еще более редкие линии (каждые 20 единиц)
                        offset: 15 // Большее смещение
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false // Отключаем стандартную сетку
                        },
                        ticks: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            display: true,
                            color: 'rgba(200, 200, 200, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Плагин для пульсации
    Chart.register({
        id: 'uniformVerticalGrid',
        beforeDraw(chart) {
            // Код для вертикальной сетки (как было)
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const chartArea = chart.chartArea;
            
            const gridOptions = {
                color: 'rgba(200, 200, 200, 0.05)',
                lineWidth: 1,
                step: 3,
                offset: 0
            };
            
            ctx.save();
            ctx.strokeStyle = gridOptions.color;
            ctx.lineWidth = gridOptions.lineWidth;
            
            const firstTick = Math.ceil(xAxis.min / gridOptions.step) * gridOptions.step;
            const lastTick = Math.floor(xAxis.max / gridOptions.step) * gridOptions.step;
            
            for (let value = firstTick; value <= lastTick; value += gridOptions.step) {
                const x = xAxis.getPixelForValue(value) + gridOptions.offset;
                
                if (x >= chartArea.left && x <= chartArea.right) {
                    ctx.beginPath();
                    ctx.moveTo(x, chartArea.top);
                    ctx.lineTo(x, chartArea.bottom);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
    });
    Chart.register({
        id: 'customDotAndLine',
        afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            const meta = chart.getDatasetMeta(0);
            const realLength = 75;
            
            if (!meta.data || meta.data.length < realLength) return;
            
            const point = meta.data[realLength - 1];
            if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return;
            
            // Горизонтальная линия (оставляем как было)
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(chart.chartArea.left, point.y);
            ctx.lineTo(chart.chartArea.right, point.y);
            ctx.strokeStyle = '#1c87c2';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
            
            // Статичный шарик (оставляем как было)
            ctx.save();
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#1c87c2';
            ctx.fill();
            ctx.restore();
            
            // Улучшенная пульсация с градиентом
            const now = Date.now();
            if (now - lastPulseTime < 1000) {
                const progress = (now - lastPulseTime) / 1000;
                const outerRadius = 15 + progress * 50; // Больший радиус
                const innerRadius = 10 + progress * 30; // Внутренний радиус
                
                // Создаем градиент с прозрачной серединой
                const gradient = ctx.createRadialGradient(
                    point.x, point.y, innerRadius,
                    point.x, point.y, outerRadius
                );
                
                // Голубые края с прозрачностью
                gradient.addColorStop(0, 'rgba(100, 149, 237, 0)');       // Прозрачный центр
                gradient.addColorStop(0.3, 'rgba(100, 149, 237, 0.3)');   // Начало цвета
                gradient.addColorStop(0.7, 'rgba(100, 149, 237, 0.3)');   // Пик цвета
                gradient.addColorStop(1, 'rgba(100, 149, 237, 0)');       // Прозрачный край
            }
        }
    });
    
    
    
    // Инициализация
    chart = initResponsiveChart();
    setInterval(updateTime, 1000);
    updateTime();
    
    // Кнопки экспирации
    const expiryButtons = document.querySelectorAll('.expiry-btn');
    expiryButtons.forEach(button => {
        button.addEventListener('click', function () {
            expiryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Обработчик кнопки сигнала
    const getSignalBtn = document.getElementById('get-signal-btn');
    const analyzingContainer = document.getElementById('analyzing-container');
    const signalResult = document.getElementById('signal-result');
    // Получаем элемент с инструкциями
    const instrElement = document.getElementById('instr');
    // Сохраняем оригинальный HTML
    const originalHtml = instrElement.innerHTML;
    
    getSignalBtn.addEventListener('click', function () {
        this.classList.add('hidden');
        analyzingContainer.classList.remove('hidden');
        signalResult.classList.add('hidden');
        instrElement.style.display = 'none';
        
        setTimeout(() => {
            analyzingContainer.classList.add('hidden');
            generateSignal();
            startExpiryCountdown();
        }, 3000);
    });
    
    let isFirstExpiryCompleted = false;

// Глобальные переменные

let isInTrade = false;

function generateSignal() {
    const activeExpiryBtn = document.querySelector('.expiry-btn.active');
    const expiryTime = parseInt(activeExpiryBtn.dataset.time);
    const isUp = Math.random() > 0.5;
    const percent = Math.floor(Math.random() * 20) + 73;

    // Рассчитываем время окончания экспирации
    const now = new Date();
    now.setSeconds(now.getSeconds() + expiryTime);
    const expiryTimeString = now.toLocaleTimeString('ru-RU', { hour12: false });

    // Формируем направление
    const direction = isUp ? 'повышение' : 'понижение';
    const directionText = isUp ? 'ПОВЫШЕНИЕ' : 'ПОНИЖЕНИЕ';

    // Создаем HTML для сигнала
    const signalHTML = `
        <div class="signal-message">
            <p><span class="text-bold">${percent}</span>% лучших трейдеров сделали ставку на </span><span class="text-bold">${direction}</span><span class="text-light">.</span></p>
            <p><span class="text-light">Ровно в </span><span class="text-bold">${expiryTimeString}</span><span class="text-light"> ставим </span><span class="text-bold">${direction}</span><span class="text-light">!</span></p>
        </div>
    `;

    // Вставляем сформированный HTML
    document.querySelector('.signal-card').innerHTML = signalHTML;

    // Настройка блока направления
    const directionBlock = document.getElementById('final-direction');
    directionBlock.className = `final-direction ${isUp ? 'up' : 'down'}`;
    document.getElementById('direction-text').textContent = directionText;
    directionBlock.querySelector('i').className = isUp ? 'fas fa-arrow-up' : 'fas fa-arrow-down';

    // Запоминаем направление, но пока не применяем
    signalTrend = isUp ? 1 : -1;
    isInTrade = false;
    signalResult.classList.remove('hidden');
}

    function startExpiryCountdown() {
    const activeExpiryBtn = document.querySelector('.expiry-btn.active');
    const expiryTime = parseInt(activeExpiryBtn.dataset.time);
    const timeLeftElement = document.getElementById('time-left');
    let remaining = expiryTime;

    // Первый этап - ожидание входа в сделку
    document.getElementById('expiry-time').textContent = `До входа в сделку:`;
    updateTimeDisplay();

    const countdown = setInterval(() => {
        remaining--;
        updateTimeDisplay();
        
        if (remaining <= 0) {
            clearInterval(countdown);
            isInTrade = true; // Теперь можно применять направление графика
            
            // Второй этап - время самой сделки
            let dealRemaining = expiryTime;
            document.getElementById('expiry-time').textContent = `До окончания сделки:`;
            
            const dealCountdown = setInterval(() => {
                dealRemaining--;
                
                document.getElementById('expiry-time').textContent = `До окончания сделки:`;
                updateDealTimeDisplay(dealRemaining);
                
                if (dealRemaining <= 0) {
                    clearInterval(dealCountdown);
                    signalTrend = 0; // Возвращаем нейтральное направление
                    isInTrade = false;
                    setTimeout(() => {
                        signalResult.classList.add('hidden');
                        getSignalBtn.classList.remove('hidden');
                        instrElement.innerHTML = originalHtml;
                        instrElement.style.display = 'block';
                        document.getElementById('expiry-time').textContent = `через ${expiryTime} сек`;
                    }, 500);
                }
            }, 1000);
        }
    }, 1000);

    function updateTimeDisplay() {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timeLeftElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function updateDealTimeDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timeLeftElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
    // Обновление графика
    setInterval(() => {
    if (!chart) return;

    const dataset = chart.data.datasets[0];
    const data = dataset.data;
    
    let lastRealValue = 50;
    for (let i = realLength - 1; i >= 0; i--) {
        if (data[i] !== null) {
            lastRealValue = data[i];
            break;
        }
    }

    // Генерируем новое значение с учетом направления
    let trendMultiplier = isInTrade ? signalTrend : 0;
    
    const newValue = lastRealValue + 
        (trendMultiplier * (Math.random() * 0.2)) + 
        ((Math.random() - 0.5) * 0.1); // Уменьшил случайные колебания

    // Обновляем данные
    data.shift();
    data.splice(realLength - 1, 0, newValue);
    data.length = realLength + paddingRight;

    // Обновляем цвет линии
    dataset.borderColor = 
        trendMultiplier === 1 ? '#00b894' :
        trendMultiplier === -1 ? '#d63031' :
        '#1c87c2';

    chart.data.labels.shift();
    chart.data.labels.push('');
    lastPulseTime = Date.now();
    chart.update();
}, 2000);
});

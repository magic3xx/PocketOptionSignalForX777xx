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

    // ======================================================================
    // ===== THE UPDATED FUNCTION IS HERE =====
    // ======================================================================
    function generateSignal() {
        // --- START OF IMPROVEMENT ---

        // 1. Get the chart data to analyze the trend
        const data = chart.data.datasets[0].data;
        const lastPoint = data[realLength - 1];
        // Look at a point 15 steps ago to determine the trend
        const pastPoint = data[realLength - 1 - 15]; 

        // 2. Determine the trend direction and set probability
        const trend = lastPoint - pastPoint;
        const trendFollowingProbability = 0.80; // 80% chance to follow the trend
        let isUp;

        if (trend > 0) {
            // Trend is UP, so we're more likely to generate a BUY signal
            isUp = Math.random() < trendFollowingProbability; // e.g., 80% chance to be true
        } else if (trend < 0) {
            // Trend is DOWN, so we're more likely to generate a SELL signal
            isUp = Math.random() > trendFollowingProbability; // e.g., 20% chance to be true (isUp)
        } else {
            // No clear trend, fall back to 50/50
            isUp = Math.random() > 0.5;
        }

        // --- END OF IMPROVEMENT ---

        // The rest of your function remains the same
        const activeExpiryBtn = document.querySelector('.expiry-btn.active');
        const expiryTime = parseInt(activeExpiryBtn.dataset.time);
        const percent = Math.floor(Math.random() * 20) + 73;

        // Рассчитываем время окончания экспирации
        const now = new Date();
        now.setSeconds(now.getSeconds() + expiryTime);
        const expiryTimeString = now.toLocaleTimeString('ru-RU', { hour12: false });

        // Формируем направление
        const direction = isUp ? 'buy' : 'sell';
        const directionText = isUp ? 'BUY' : 'SELL';

        // Создаем HTML для сигнала
        const signalHTML = `
            <div class="signal-message">
                <p><span class="text-bold">${percent}</span>% of the best traders bet on </span><span class="text-bold">${direction}</span><span class="text-light">.</span></p>
                <p><span class="text-light">Exactly at </span><span class="text-bold">${expiryTimeString}</span><span class="text-light"> we bet </span><span class="text-bold">${direction}</span><span class="text-light">!</span></p>
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

        // Calculate the number of seconds remaining until the next full minute.
        const now = new Date();
        const seconds = now.getSeconds();
        let remaining = 60 - seconds;

        // This handles the edge case where the button is clicked at exactly :00 seconds.
        if (remaining === 60) {
            remaining = 0;
        }

        document.getElementById('expiry-time').textContent = `Before entering a trade:`;
        updateTimeDisplay();

        const countdown = setInterval(() => {
            remaining--;
            updateTimeDisplay();
            
            if (remaining <= 0) {
                clearInterval(countdown);
                isInTrade = true;
                
                let dealRemaining = expiryTime; 
                document.getElementById('expiry-time').textContent = `Before the end of the transaction:`;
                
                const dealCountdown = setInterval(() => {
                    dealRemaining--;
                    
                    document.getElementById('expiry-time').textContent = `Before the end of the transaction:`;
                    updateDealTimeDisplay(dealRemaining);
                    
                    if (dealRemaining <= 0) {
                        clearInterval(dealCountdown);
                        signalTrend = 0;
                        isInTrade = false;
                        setTimeout(() => {
                            signalResult.classList.add('hidden');
                            getSignalBtn.classList.remove('hidden');
                            instrElement.innerHTML = originalHtml;
                            instrElement.style.display = 'block';
                            document.querySelector('.signal-card').innerHTML = originalSignalCardHTML;
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

document.addEventListener('DOMContentLoaded', function() {
    const categorySelect = document.getElementById('category-select');
    const assetSelect = document.getElementById('asset-select');
    const getSignalBtn = document.getElementById('get-signal-btn');
    
    // Данные для выпадающих списков
    const assets = {
        currencies: [
            {value: "AUD/CAD OTC", text: "AUD/CAD OTC"},
            {value: "AUD/NZD OTC", text: "AUD/NZD OTC"},
            {value: "BHD/CNY OTC", text: "BHD/CNY OTC"},
            {value: "CAD/CHF OTC", text: "CAD/CHF OTC"},
            {value: "CAD/JPY OTC", text: "CAD/JPY OTC"},
            {value: "CHF/JPY OTC", text: "CHF/JPY OTC"},
            {value: "EUR/JPY OTC", text: "EUR/JPY OTC"},
            {value: "EUR/RUB OTC", text: "EUR/RUB OTC"},
            {value: "GBP/USD OTC", text: "GBP/USD OTC"},
            {value: "KES/USD OTC", text: "KES/USD OTC"},
            {value: "LBP/USD OTC", text: "LBP/USD OTC"},
            {value: "NZD/JPY OTC", text: "NZD/JPY OTC"},
            {value: "USD/IDR OTC", text: "USD/IDR OTC"},
            {value: "USD/EGP OTC", text: "USD/EGP OTC"},
            {value: "USD/COP OTC", text: "USD/COP OTC"},
            {value: "USD/CLP OTC", text: "USD/CLP OTC"},
            {value: "USD/BDT OTC", text: "USD/BDT OTC"},
            {value: "USD/ARS OTC", text: "USD/ARS OTC"},
            {value: "QAR/CNY OTC", text: "QAR/CNY OTC"},
            {value: "OMR/CNY OTC", text: "OMR/CNY OTC"},
            {value: "USD/MXN OTC", text: "USD/MXN OTC"},
            {value: "USD/MYR OTC", text: "USD/MYR OTC"},
            {value: "USD/PHP OTC", text: "USD/PHP OTC"},
            {value: "USD/RUB OTC", text: "USD/RUB OTC"},
            {value: "CAD/CHF OTC", text: "CAD/CHF OTC"},
            {value: "CHF/NOK OTC", text: "CHF/NOK OTC"},
            {value: "EUR/USD OTC", text: "EUR/USD OTC"},
            {value: "AED/CNY OTC", text: "AED/CNY OTC"},
            {value: "GBP/AUD OTC", text: "GBP/AUD OTC"},
            {value: "USD/ARS OTC", text: "USD/ARS OTC"},
            {value: "JOD/CNY OTC", text: "JOD/CNY OTC"},
            {value: "YER/USD OTC", text: "YER/USD OTC"}
        ],
        crypto: [
            {value: "Cardano OTC", text: "Cardano OTC"},
            {value: "BNB OTC", text: "BNB OTC"},
            {value: "Bitcoin OTC", text: "Bitcoin OTC"},
            {value: "Dogecoin OTC", text: "Dogecoin OTC"},
            {value: "Polkadot OTC", text: "Polkadot OTC"},
            {value: "Ethereum OTC", text: "Ethereum OTC"},
            {value: "Solana OTC", text: "Solana OTC"}
        ],
        commodities: [
            {value: "Brent Oil OTC", text: "Brent Oil OTC"},
            {value: "WTI Crude Oil OTC", text: "WTI Crude Oil OTC"},
            {value: "Silver OTC", text: "Silver OTC"},
            {value: "Gold OTC", text: "Gold OTC"},
            {value: "Natural Gas OTC", text: "Natural Gas OTC"},
            {value: "Palladium spot OTC", text: "Palladium spot OTC"},
            {value: "Platinum spot OTC", text: "Platinum spot OTC"}
        ],
        stocks: [
            {value: "McDonald's OTC", text: "McDonald's OTC"},
            {value: "Tesla OTC", text: "Tesla OTC"},
            {value: "Amazon OTC", text: "Amazon OTC"},
            {value: "Coinbase Global OTC", text: "Coinbase Global OTC"},
            {value: "VISA OTC", text: "VISA OTC"},
            {value: "Alibaba OTC", text: "Alibaba OTC"},
            {value: "Netflix OTC", text: "Netflix OTC"}
        ]
    };

    getSignalBtn.disabled = true;

    assetSelect.addEventListener('change', function() {
        getSignalBtn.disabled = this.value === '';
        // Note: The logic for showing/hiding buttons is already handled elsewhere,
        // so we just focus on enabling/disabling here.
    });
            
    // Обработчик изменения категории
    categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        
        // Очищаем список активов
        assetSelect.innerHTML = '<option value="">Select asset</option>';
        getSignalBtn.disabled = true; // Disable button when category changes
        
        if (selectedCategory) {
            // Активируем выбор актива
            assetSelect.disabled = false;
            
            // Заполняем список активов в зависимости от выбранной категории
            assets[selectedCategory].forEach(asset => {
                const option = document.createElement('option');
                option.value = asset.value;
                option.textContent = asset.text;
                assetSelect.appendChild(option);
            });
        } else {
            // Деактивируем выбор актива, если категория не выбрана
            assetSelect.disabled = true;
        }
    });
            
    // Обновление времени (This function is duplicated, but keeping for structural integrity of your code)
    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString(); // Uses local default format
        // This might conflict with the other updateTime, ensure IDs are correct if you merge
        // document.getElementById('current-time').textContent = timeStr;
    }
            
    setInterval(updateTime, 1000);
    updateTime();
});

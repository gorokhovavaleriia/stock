const express = require('express');
const axios = require('axios');
const dayjs = require('dayjs');
const path = require('path');

const app = express();
app.use(express.json());

const MS_TOKEN = process.env.MS_TOKEN; 
const LOGIN = 'admin';       // Логин для входа на ваш сайт
const PASSWORD = 'password123'; // Пароль для входа на ваш сайт

// 1. Роут для проверки логина и пароля
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === LOGIN && password === PASSWORD) {
        return res.json({ success: true });
    }
    res.status(401).json({ error: 'Неверный логин или пароль' });
});

// НАЧАЛО ЗАМЕНЫ: Найдите роут /api/stock-history и замените его до конца файла

    app.get('/api/stock-history', async (req, res) => {
    const productId = req.query.productId;
    if (!productId) return res.status(400).json({ error: 'Не указан productId' });

    const history = [];
    const daysToFetch = 30;

    try {
        const requests = [];
        for (let i = daysToFetch - 1; i >= 0; i--) {
            const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD 23:59:59');
            const url = `https://moysklad.ru`;
            const config = {
                headers: { 'Authorization': `Bearer ${MS_TOKEN}` },
                params: {
                    filter: `product=https://moysklad.ru{productId}`,
                    moment: dateStr
                }
            };
            // Добавляем задержку в 50мс между запросами, чтобы МойСклад нас не блокировал
            await new Promise(resolve => setTimeout(resolve, 50));
            requests.push({ date: dayjs().subtract(i, 'day').format('DD.MM'), req: axios.get(url, config) });
        }

        const responses = await Promise.all(requests.map(item => item.req.catch(e => e)));

        responses.forEach((response, index) => {
            let stock = 0;
            if (response && response.status === 200 && response.data?.rows?.length > 0) {
                stock = response.data.rows[0].stock || 0; // Исправлено получение остатка из массива rows
            }
            history.push({ date: requests[index].date, stock: stock });
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отдаем фронтенд файлы
app.use(express.static(path.join(__dirname, 'public')));

// ВАЖНО: Render требует порт 10000 по умолчанию
const PORT = process.env.PORT || 10000; 
app.listen(PORT, '0.0.0.0', () => console.log(`Сервер успешно запущен на порту ${PORT}`));

FROM node:22.11.0-alpine

WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо решту файлів проекту
COPY . .

# Експозуємо порт
EXPOSE 3000

# Запускаємо застосунок
CMD ["npm", "start"]
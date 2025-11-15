### Docker
docker-compose down -v?
Удалятся volumes (флаг -v) → все данные БД исчезнут!
Правильно:
docker-compose down — только контейнеры (данные остаются)
docker-compose stop — остановить без удаления

### Create migration
Путь Б: Правильные миграции с нуля
npm run migration:run
# 1. Очистить БДdocker-compose exec postgres psql -U postgres -d nestjs_realworld -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"# 2. Сгенерировать миграциюnpm run migration:generate# 3. Применитьnpm run migration:run# 4. Запустить приложениеnpm run start:watch
Путь В: Принять текущее состояние
# 1. Создать пустую миграцию
npm run typeorm -- migration:create ./src/migrations/InitialSchema

# 2. "Применить" её (пометить как выполненную)
npm run migration:run

# 3. Запустить приложение
npm run start:watch
# 1. Создать пустую миграциюnpm run typeorm -- migration:create ./src/migrations/InitialSchema# 2. "Применить" её (пометить как выполненную)npm run migration:run# 3. Запустить приложениеnpm run start:watch

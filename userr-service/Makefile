start_db:
	docker compose up -d

stop_db: 
	docker compose down

migrate:
	db-migrate up

migrate-down: 
	db-migrate down

create_migration:
	db-migrate create update_users_table --sql-file

server: 
	npm run dev

.PHONEY: start_db stop_db server migrate migrate-down create_migration


# db-migrate create user-address --sql-file
# db-migrate create add_payment-method_table --sql-file
 
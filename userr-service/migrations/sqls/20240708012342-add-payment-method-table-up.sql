CREATE TABLE "payments_methods" (
    "id" bigserial PRIMARY KEY,
    "user_id" bigint NOT NULL,
    "bank_account" bigint,
    "swift_code" varchar,
    "payment_type" varchar,
    "verified" boolean NOT NULL DEFAULT FALSE,
    "created_at" timestamptz NOT NULL DEFAULT (now()),
    "updated_at" timestamptz NOT NULL DEFAULT (now())    
);

CREATE INDEX ON "payments_methods" ("bank_account");
CREATE INDEX ON "payments_methods" ("user_id");
CREATE INDEX ON "payments_methods" ("payment_type");


-- Add relation
ALTER TABLE "payment_methods" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

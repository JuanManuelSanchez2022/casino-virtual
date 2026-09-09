-- Insertar juego Dados
INSERT INTO "Game" ("id", "slug", "name", "description", "type", "isActive", "config", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'dice',
  'Dados',
  'Tira dos dados y apostá por Alto, Bajo o Siete.',
  'dice',
  true,
  '{"sides": 6, "dice": 2, "paytableVersion": "1.0.0", "minBet": 1, "maxBet": 100000}',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;
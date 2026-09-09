-- Insertar juego Ruleta
INSERT INTO "Game" ("id", "slug", "name", "description", "type", "isActive", "config", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'roulette',
  'Ruleta',
  'Ruleta europea clásica. Apostá al número, color o diferentes combinaciones.',
  'roulette',
  true,
  '{"numbers": 37, "paytableVersion": "1.0.0", "minBet": 1, "maxBet": 100000}',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO profiles (name, title, bio)
VALUES ('Example Person', 'Developer', 'Example profile for local development.');

INSERT INTO skills (name, display_order)
VALUES ('TypeScript', 1);

INSERT INTO favourites (name, description, link, display_order)
VALUES ('Example hobby', 'Example favourite.', 'https://example.com/favourite', 1);

INSERT INTO portfolios (section, name, summary, technologies, display_order)
VALUES
  ('engineering', 'Example engineering project', 'Example engineering work.', ARRAY['TypeScript'], 1),
  ('hobby', 'Example hobby project', 'Example hobby work.', ARRAY['Bun'], 1);

INSERT INTO social_links (section, kind, url, display_order)
VALUES
  ('engineering', 'website', 'https://example.com/engineering', 1),
  ('hobby', 'website', 'https://example.com/hobby', 1);

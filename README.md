## SolveLicita Frontend

Aplicação Next.js do SolveLicita.

### Runtime

Depende de:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- tabela Supabase `public.municipios`
- arquivos GeoJSON em `public/*_geo.geojson`
- `lib/brazilMapData.js`

### Desenvolvimento

```bash
npm install
npm run dev

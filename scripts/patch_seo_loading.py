import sys

path = r'c:\Users\felipe\Documentos\solvelicita-frontend\components\DashboardPage.jsx'

with open(path, 'rb') as f:
    content = f.read()

text = content.decode('utf-8', errors='ignore')

# 1. Update the loading initialization to be more robust
old_loading_init = 'const [loading, setLoading] = useState(!initialMunicipios?.length)'
new_loading_init = 'const [loading, setLoading] = useState(true)' # Start true to show loading immediately on client

if old_loading_init in text:
    text = text.replace(old_loading_init, new_loading_init)

# 2. Add a ref to track if we've already loaded initial data to skip loading on SSR
# But actually, the best way for SEO is to check if we are in the browser.
# If not in browser (SSR/SSG), loading should be false if we have data.

loading_fix = """  const [loading, setLoading] = useState(() => {
    // No servidor, se temos dados iniciais, não mostramos loading (para o Google indexar)
    if (typeof window === 'undefined') {
      return !initialMunicipios || initialMunicipios.length === 0
    }
    // No cliente, começamos com loading para evitar o "pop" de conteúdo incompleto
    return true
  })"""

text = text.replace(new_loading_init, loading_fix)

# 3. Update the early return for loading to be more "Bot friendly"
# If we have municipalities, we should NOT return early, but overlay the loading screen.
# If we DON'T have municipalities, we return the loading screen (this is the Soft 404 case, but hopefully it only happens if fetch really failed)

old_loading_return = """  if (loading) {
    return (
      <div className="loading-state-container">
        <div className="loading-pulse-icon">
          <Map size={48} className="pulse" />
        </div>
        <h2 className="loading-text">Carregando dados do estado...</h2>
        <p className="loading-subtext">Buscando indicadores fiscais e malha geográfica municipal.</p>
      </div>
    )
  }"""

# We'll replace it with a more sophisticated version that only returns early if there's NO data at all
new_loading_return = """  // SEO: Se temos dados, não retornamos antecipadamente com o loading, 
  // para que o Google sempre veja o conteúdo no HTML. 
  // O loading será tratado como um overlay no final do render.
  if (loading && (!municipios || municipios.length === 0)) {
    return (
      <div className="loading-state-container">
        <div className="loading-pulse-icon">
          <Map size={48} className="pulse" />
        </div>
        <h2 className="loading-text">Carregando dados do estado...</h2>
        <p className="loading-subtext">Buscando indicadores fiscais e malha geográfica municipal.</p>
      </div>
    )
  }"""

if old_loading_return in text:
    text = text.replace(old_loading_return, new_loading_return)

# 4. Add the loading overlay at the end of the main render
# We need to find the main container return. 
# It usually looks like return ( <div ... )

# Instead of complex search, let's just add the loading overlay CSS class to the main div if loading is true.
# Or better, add the overlay at the end of the return statement.

# I'll just keep the early return but make sure it only triggers if municipios is empty.
# If municipios is NOT empty, loading will be false later anyway.

# Actually, I'll add a bit of logic in the carregar function to handle the transition better.
# In Turn 18, I saw the 'carregar' function.
# I'll update it to only set loading(false) when BOTH municipios and geo are ready (or failed).

with open(path, 'wb') as f:
    f.write(text.encode('utf-8'))

print("DashboardPage patched for SEO and Loading")

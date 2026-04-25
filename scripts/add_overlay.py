import sys

path = r'c:\Users\felipe\Documentos\solvelicita-frontend\components\DashboardPage.jsx'

with open(path, 'rb') as f:
    content = f.read()

text = content.decode('utf-8', errors='ignore')

# We'll add the overlay before the final closing fragments
overlay_code = """      {loading && municipios.length > 0 && (
        <div className="loading-state-overlay">
          <div className="loading-pulse-icon">
            <Map size={48} className="pulse" />
          </div>
          <h2 className="loading-text">Carregando mapa...</h2>
          <p className="loading-subtext">Processando malha geográfica municipal.</p>
        </div>
      )}
    </>"""

if '    </>' in text:
    text = text.replace('    </>', overlay_code)

with open(path, 'wb') as f:
    f.write(text.encode('utf-8'))

print("DashboardPage overlay added")

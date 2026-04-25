import sys

path = r'c:\Users\felipe\Documentos\solvelicita-frontend\components\DashboardPage.jsx'

with open(path, 'rb') as f:
    content = f.read()

text = content.decode('utf-8', errors='ignore')

# 1. Torna o erro resiliente: Se tivermos dados das cidades, mostramos o dashboard mesmo se o mapa falhar.
old_error_check = "if (erro) {"
new_error_check = "if (erro && (!municipios || municipios.length === 0)) {"

if old_error_check in text:
    text = text.replace(old_error_check, new_error_check)

with open(path, 'wb') as f:
    f.write(text.encode('utf-8'))

print("Resiliência de erro aplicada ao DashboardPage")

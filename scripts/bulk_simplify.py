import os
import json
import geopandas as gpd
from pathlib import Path

# Configurações
PUBLIC_DIR = Path(r'c:\Users\felipe\Documentos\solvelicita-frontend\public')
TOLERANCE = 0.001  # Aprox. 110 metros, ideal para mapas web
MIN_SIZE_MB = 5.0  # Simplificar apenas arquivos maiores que 5MB

print(f"Iniciando simplificação em massa em {PUBLIC_DIR}")

files_to_process = []
for file in PUBLIC_DIR.glob('*.geojson'):
    size_mb = file.stat().st_size / (1024 * 1024)
    if size_mb > MIN_SIZE_MB:
        files_to_process.append((file, size_mb))

print(f"Encontrados {len(files_to_process)} arquivos para processar.")

for file, size_mb in files_to_process:
    try:
        print(f"Processando {file.name} ({size_mb:.2f} MB)...")
        # Lendo com geopandas
        gdf = gpd.read_file(file)
        
        # Simplificando
        gdf.geometry = gdf.geometry.simplify(TOLERANCE, preserve_topology=True)
        
        # Salvando de volta (GeoJSON padrão)
        # Forçamos o CRS para 4326 (WGS84) se necessário
        if gdf.crs and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(epsg=4326)
            
        gdf.to_file(file, driver='GeoJSON')
        
        new_size_mb = file.stat().st_size / (1024 * 1024)
        print(f"Sucesso: {file.name} agora tem {new_size_mb:.2f} MB")
    except Exception as e:
        print(f"Erro ao processar {file.name}: {e}")

print("Simplificação concluída.")

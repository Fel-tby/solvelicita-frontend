#!/usr/bin/env python3
"""
dirtree.py — Gera estrutura de diretório com metadados detalhados.
Uso: python dirtree.py [caminho] [opções]
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path


def get_file_type(path: Path) -> str:
    if path.is_dir():
        return "Pasta de arquivos"

    name = path.name.lower()
    ext = path.suffix.lower()

    special = {
        ".gitignore": "Arquivo Fonte Git",
        ".gitkeep":   "Arquivo GITKEEP",
        ".env":       "Arquivo ENV",
        ".treewriterignore": "Configuração Treewriter"
    }
    if name in special:
        return special[name]

    ext_map = {
        ".py":      "Arquivo Fonte Python",
        ".md":      "Arquivo Fonte Markdown",
        ".txt":     "Documento de Texto",
        ".csv":     "Arquivo Fonte CSV",
        ".json":    "Arquivo JSON",
        ".jsonl":   "Arquivo JSONL",
        ".geojson": "Arquivo GEOJSON",
        ".ipynb":   "Jupyter Notebook",
        ".html":    "Arquivo HTML",
        ".css":     "Arquivo CSS",
        ".js":      "Arquivo JavaScript",
        ".jsx":     "Arquivo React JSX",
        ".tsx":     "Arquivo React TSX",
        ".ts":      "Arquivo TypeScript",
        ".yaml":    "Arquivo YAML",
        ".yml":     "Arquivo YAML",
        ".toml":    "Arquivo TOML",
        ".cfg":     "Arquivo de Configuração",
        ".ini":     "Arquivo INI",
        ".sh":      "Script Shell",
        ".bat":     "Script Batch",
        ".sql":     "Arquivo SQL",
        ".xml":     "Arquivo XML",
        ".zip":     "Arquivo Compactado",
        ".tar":     "Arquivo Compactado",
        ".gz":      "Arquivo Compactado",
        ".png":     "Imagem PNG",
        ".jpg":     "Imagem JPEG",
        ".jpeg":    "Imagem JPEG",
        ".svg":     "Imagem SVG",
        ".pdf":     "Arquivo PDF",
        ".xlsx":    "Planilha Excel",
        ".xls":     "Planilha Excel",
        ".docx":    "Documento Word",
        ".example": "Arquivo EXAMPLE",
    }

    if ext in ext_map:
        return ext_map[ext]
    return f"Arquivo {ext[1:].upper()}" if ext else "Arquivo"


def format_size(size_bytes: int) -> str:
    """
    Formata o tamanho do arquivo escalando dinamicamente
    para B, KB, MB, GB, etc., usando o padrão brasileiro (vírgula).
    """
    if size_bytes == 0:
        return "0 B"
        
    unidades = ["B", "KB", "MB", "GB", "TB"]
    tamanho = float(size_bytes)
    indice_unidade = 0
    
    while tamanho >= 1024 and indice_unidade < len(unidades) - 1:
        tamanho /= 1024
        indice_unidade += 1
        
    if indice_unidade == 0:
        return f"{int(tamanho)} B"
        
    tamanho_formatado = f"{tamanho:.2f}".replace(".", ",")
    return f"{tamanho_formatado} {unidades[indice_unidade]}"


def get_info(path: Path) -> str:
    stat = path.stat()
    date = datetime.fromtimestamp(stat.st_mtime).strftime("%d/%m/%Y %H:%M")
    ftype = get_file_type(path)
    if path.is_dir():
        return f"# {date}, {ftype}"
    return f"# {date}, {ftype}, {format_size(stat.st_size)}"


def load_ignore_file(root_path: Path) -> set:
    """
    Lê o arquivo .treewriterignore na raiz do projeto, se existir.
    Ignora linhas vazias e comentários (iniciados com #).
    """
    ignore_file = root_path / ".treewriterignore"
    ignore_set = set()
    
    if ignore_file.exists():
        try:
            with open(ignore_file, "r", encoding="utf-8") as f:
                for line in f:
                    limpa = line.strip()
                    if limpa and not limpa.startswith("#"):
                        ignore_set.add(limpa)
        except Exception as e:
            print(f"[AVISO] Não foi possível ler .treewriterignore: {e}", file=sys.stderr)
            
    return ignore_set


def build_tree(
    root: Path,
    stats: dict,
    prefix: str = "",
    ignore: set = None,
    max_depth: int = None,
    depth: int = 0,
) -> list[str]:
    if max_depth is not None and depth >= max_depth:
        return []

    try:
        # Pastas (0) vêm primeiro, depois arquivos (1), organizados alfabeticamente
        entries = sorted(root.iterdir(), key=lambda p: (p.is_file(), p.name.lower()))
    except PermissionError:
        return [f"{prefix}    [sem permissão]"]

    # Filtro Absoluto: Exclui completamente da árvore
    if ignore:
        entries = [e for e in entries if e.name not in ignore]

    # Pastas onde o conteúdo interno será omitido (bloqueio de recursão)
    omit_contents = ["venv", "node_modules", ".next", "pytest"]

    lines = []
    for i, entry in enumerate(entries):
        is_last = (i == len(entries) - 1)
        connector = "└── " if is_last else "├── "
        
        is_omitted_dir = entry.is_dir() and any(k in entry.name.lower() for k in omit_contents)

        # Atualizando o dicionário de estatísticas globalmente
        if entry.is_dir():
            stats["dirs"] += 1
            if is_omitted_dir:
                lines.append(f"{prefix}{connector}{entry.name} {get_info(entry)} [CONTEÚDO OMITIDO]")
            else:
                lines.append(f"{prefix}{connector}{entry.name} {get_info(entry)}")
                
                # Desce na árvore se a pasta NÃO for omitida
                extension = "    " if is_last else "│   "
                lines.extend(build_tree(entry, stats, prefix + extension, ignore, max_depth, depth + 1))
        else:
            stats["files"] += 1
            stats["size"] += entry.stat().st_size
            lines.append(f"{prefix}{connector}{entry.name} {get_info(entry)}")

    return lines


def main():
    parser = argparse.ArgumentParser(description="Gera árvore de diretório com metadados")
    parser.add_argument("path", nargs="?", default=".", help="Pasta raiz (padrão: atual)")
    parser.add_argument("-d", "--depth", type=int, default=None, help="Profundidade máxima")
    
    # Defaults do terminal
    parser.add_argument(
        "-i", "--ignore", nargs="+",
        default=["__pycache__", ".git", ".mypy_cache", "target", "dbt_packages"],
        help="Nomes a ignorar completamente (oculta a pasta e o conteúdo)",
    )
    parser.add_argument("-o", "--output", type=str, default=None, help="Salvar em arquivo")
    args = parser.parse_args()

    root = Path(args.path).resolve()
    print(f"[DEBUG] Lendo: {root}", file=sys.stderr)
    if not root.exists():
        print(f"Erro: '{args.path}' não existe.", file=sys.stderr)
        sys.exit(1)

    # Combina argumentos do terminal com o arquivo .treewriterignore
    ignore_set = set(args.ignore)
    ignore_set.update(load_ignore_file(root))

    # Dicionário passado por referência para acumular as estatísticas durante a recursão
    stats = {"dirs": 0, "files": 0, "size": 0}

    # Gera a árvore
    lines = [f"{root.name}/"] + build_tree(root, stats, ignore=ignore_set, max_depth=args.depth)
    
    # Gera o sumário estatístico
    separador = "─" * 50
    linha_vazia = ""
    resumo_titulo = "📊 SUMÁRIO DO PROJETO (Visível)"
    resumo_pastas = f"Pastas processadas  : {stats['dirs']}"
    resumo_arquivos = f"Arquivos rastreados : {stats['files']}"
    resumo_tamanho = f"Tamanho total lido  : {format_size(stats['size'])}"
    
    lines.extend([
        linha_vazia, 
        separador, 
        resumo_titulo, 
        resumo_pastas, 
        resumo_arquivos, 
        resumo_tamanho, 
        separador
    ])
    
    result = "\n".join(lines)

    if args.output:
        Path(args.output).write_text(result, encoding="utf-8")
        print(f"[INFO] Árvore salva com sucesso em '{args.output}'")
    else:
        print(result)


if __name__ == "__main__":
    main()
# Implementacao - Todo

## 1) Setup do projeto
- [x] Inicializar Vite (vanilla JS, ESM)
- [x] Configurar Tailwind CSS
- [x] Configurar Vitest
- [x] Definir estrutura de pastas em src/
- [x] Adicionar scripts de build, test e lint (se aplicavel)

## 2) Arquitetura base
- [x] Definir modelo JSON de documento (schema versionado)
- [x] Definir modelo de bloco (id, type, content, position, size, metadata)
- [x] Criar servicos base (storage, translation, export)
- [x] Criar utilitarios de grid e snap

## 3) Editor de texto e blocos
- [x] Integrar ProseMirror ou Tiptap core em modo vanilla
- [x] Implementar schema inicial (texto, imagem, grafico)
- [x] Implementar toolbar (negrito, italico, listas)
- [x] Renderizacao de blocos no canvas/layout
- [x] Suporte a formato da pagina (A4, Letter, etc)
- [x] Suporte a layout da pagina (retrato/paisagem)
- [x] Suporte a multiplas paginas por documento
- [x] Suporte a abas de idiomas por documento

## 4) Drag e resize
- [x] Integrar Interact.js (ou equivalente)
- [x] Implementar drag e resize por bloco
- [x] Adicionar snap-to-grid configuravel
- [x] Toggle de snap por documento (UI)

## 5) Persistencia local
- [x] Salvar documento em JSON no filesystem via Tauri
- [x] Abrir documento salvo
- [ ] (Opcional) Cache via IndexedDB

## 6) Exportacao PDF
- [x] Renderizar HTML paginado
- [x] Aplicar estilos de print
- [x] Gerar PDF com output deterministico
- [x] Garantir embed de imagens e fontes

## 7) Integracao com API de traducao
- [x] Implementar cliente em src/services/translation.js (endpoint + chave + payload)
- [x] Suporte a PT (padrao), EN e ES
- [ ] Traduzir selecao
- [ ] Traduzir bloco
- [x] Traduzir documento
- [x] UI de loading e erro
- [x] Botao "Atualizar" nas abas EN/ES para resetar traducao
- [x] Atualizar clona PT, traduz e restaura conteudo/posicao/tamanho dos blocos

## 8) Testes
- [ ] Testar serializacao do schema
- [ ] Testar comandos de blocos
- [ ] Testar matematica de snap-to-grid
- [ ] Testar servico de traducao (mock)

## 9) Empacotamento
- [ ] Configurar build do Tauri
- [ ] Testar instalacao Windows
- [ ] (Opcional) Auto-update

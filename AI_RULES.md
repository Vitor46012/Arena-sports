# AI_RULES.md — Sports Review (Arena Sports)

> Regras para qualquer IA (AI Studio, Gemini, Claude Code) que editar este repositório.
> Este arquivo reflete o estado REAL verificado do projeto, não um resumo otimista.
> Antes de qualquer refatoração, releia as seções "FASE ATUAL" e "NÃO IMPLEMENTAR AINDA".

---

## 0. COMO ESTE ARQUIVO FOI VALIDADO
Cada item abaixo está marcado como:
- ✅ **CONFIRMADO** — verificado no schema.prisma ou confirmado pelo dono do projeto
- ⚠️ **PARCIAL** — a estrutura de dados existe, mas a lógica funcional não foi confirmada
- ❌ **NÃO IMPLEMENTADO** — não crie código assumindo que isso já existe

Se você (IA) não tem certeza se algo existe, PARE e peça para o usuário colar o arquivo relevante. Nunca assuma funcionalidade com base em nomes de campos ou comentários no código.

---

## 1. STACK REAL (✅ confirmado)
- Next.js + Prisma + PostgreSQL
- Storage de vídeo: **Cloudflare R2** (confirmado em uso hoje)
  - ⚠️ O schema ainda tem campos legados `driveFileId` (Google Drive) e `s3Key`/`s3Url` comentados como "legado". Provavelmente é código morto. **Não delete sem perguntar**, mas não construa novas features em cima desses campos — use apenas o padrão R2.
- Hardware: Arduino + shield Ethernet (botoeira física) e Mini PC com OBS Studio + Node-RED instalados. Isso é físico e real, não hipotético.
- Comunicação com o hardware (✅ confirmado, arquitetura assimétrica — não confundir os dois sentidos):
  - **Web → Quadra:** `POST /api/trigger-record` conecta no broker MQTT, publica uma única mensagem no tópico `arena/web/botoeira/{courtId}` e desconecta imediatamente. **Não existe** listener/subscriber MQTT rodando em background no servidor — o backend é publisher sob demanda, nunca um serviço MQTT persistente.
  - **Quadra → Web:** o Edge (Node-RED) reporta o vídeo gravado via HTTP normal, `POST /api/webhooks/video` (`app/api/webhooks/video/route.ts`). Essa rota é o único canal de retorno da quadra para a nuvem.
  - Ao pensar em "live automática" (Fase 4), lembre-se que hoje não há canal persistente de status da quadra (sem heartbeat/listener) — qualquer feature de monitoramento em tempo real precisa ser desenhada do zero, não "ligada" em algo que já existe.

## 2. MODELO DE DADOS (✅ confirmado via schema.prisma)
- Duas roles de USUÁRIO apenas: `ADMIN` e `TENANT`. Mas existe uma camada extra de permissão por FEATURE FLAG (não é role, é granular por Arena) via campo `features Json?` — isso é ✅ **CONFIRMADO** e ativamente usado em:
  - `components/layout/SideNavBar.tsx` — oculta/exibe abas de navegação lendo chaves como `features['branding.access']`, `features['cameras.access']`, `features['transmission.access']`
  - `components/auth/PermissionGuard.tsx` e `app/page.tsx` — bloqueiam acesso a telas se a flag estiver `false`
  - `components/admin/PermissionsManagerView.tsx` — admin liga/desliga flags via `PATCH /api/arenas/[id]/permissions`
  - `components/admin/ArenaModal.tsx` — aba "features" com checkboxes ao criar/editar arena
  - `app/api/provision/route.ts` — inicializa o JSON `features` com o padrão do plano contratado
  - **Regra para a IA:** ao adicionar qualquer módulo novo visível para o Tenant (ex: nova aba, novo painel), verifique se ele precisa de uma nova chave em `features` e proteja com `<PermissionGuard>` — não deixe uma tela nova acessível sem checar a flag, ou um Tenant sem aquele plano vai enxergar algo que não devia.
- `Arena` → `Court` (1:N) → `VideoClip`/`Match`. O modelo de múltiplas quadras por arena está corretamente implementado e é compatível com o cenário de 3 quadras de beach tennis.
- `Invoice` e `Plan` existem como tabelas, mas o fluxo de cobrança é **manual**: o dono confirma pagamento clicando um botão. Não existe integração automática de gateway/PIX confirmando pagamento sozinho.

## 3. FASE ATUAL (o que construir/mexer agora)
- Cadastro e gestão das 3 quadras de beach tennis (modelo `Court` já suporta isso)
- Reservas/horários por quadra
- Fluxo de pagamento manual (manter como está — não tente "automatizar" a confirmação de PIX sem pedido explícito, pois isso muda todo o fluxo de conciliação financeira)

## 4. FASE FUTURA — NÃO IMPLEMENTAR SEM PEDIDO EXPLÍCITO
Estas features têm alguma estrutura de dados no schema, mas NÃO estão prontas. Não "complete" nada disso por conta própria, mesmo que pareça faltar pouco:
- Live automática para YouTube via botão físico → RTMP/SRT (arquitetura ainda a definir: MQTT do Arduino → Node-RED → OBS → YouTube)
- Firmware do Arduino (debounce, reconexão)
- Auto-boot do Mini PC / retry offline / limpeza de disco via PowerShell
- Overlay de patrocinadores no OBS
- QR Code por quadra
- RBAC granular / feature flags reais
- Cobrança automática de faturas

## 5. SEGURANÇA E HIGIENE DE DADOS
- **Nunca** sugira remover, sobrescrever ou "limpar" o `.env` ou `.env.example` de produção.
- Um usuário `TENANT` nunca deve ver dados de outra `Arena`. Ao construir telas do Tenant, não crie seletor de "trocar de arena" — o vínculo vem da sessão (`user.arenaId`).
- Use os métodos do Prisma ORM; nunca `queryRawUnsafe` ou concatenação de strings em queries.
- Nunca exiba stack trace de erro na interface do usuário final.
- Nunca exponha `MQTT_BROKER_URL`, tokens (`mqttToken`), credenciais R2 ou chaves PIX em texto visível na UI — nem em placeholders de exemplo.

## 6. UX WRITING — TRADUÇÃO DE JARGÃO
Ao escrever textos visíveis para o dono da arena ou atleta, traduza:
- "Edge Node" → "Computador da Quadra"
- "MQTT/SRT/RTMP" → "Sinal de Câmera" / "Transmissão"
- "R2/Bucket" → "Armazenamento em Nuvem"
- Oculte UUID/CUID, tamanho de arquivo em MB, timestamps Unix crus, `nodeId`/`macAddress`.

## 7. UI
- Ícones exclusivamente de `lucide-react`. Não usar Material Symbols ou emoji nativo.
- Botões destrutivos (excluir) só em telas de configuração/administração — nunca em cards de visualização ou impressão.
- Fallback visual sólido para imagem/thumbnail que falhar ao carregar (nunca tela preta/quebrada).
- Toda URL de mídia externa (R2) precisa estar em `images.remotePatterns` no `next.config`.

## 8. LIMITAÇÕES DO AGENTE
- A IA não tem acesso a localhost, portas locais ou hardware físico do usuário. Se precisar inspecionar algo local, peça para o usuário colar o conteúdo.
- Antes de dizer que uma feature "está implementada", a IA deve citar o arquivo/linha específico como evidência — nunca describer funcionalidade com base em suposição sobre o que "deveria" existir.

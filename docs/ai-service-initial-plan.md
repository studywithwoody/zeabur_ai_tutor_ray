# AI Service 初步改善計畫（LangChain / LangGraph）

## 0. 背景與目標

根據 `summay.md` 與目前 `packages/ai-service` 實作，現況是：
- FastAPI 已提供 `/chat/stream` SSE 與 `/chat` 相容端點。
- 已使用 `langgraph.prebuilt.create_react_agent` + MCP tools。
- Nuxt 端會把歷史訊息帶入，並在完成後寫回 DB。

本文件目標是：
1. 讓 `packages/ai-service` 進化成可維運、可觀測、可擴展的「教學代理服務」。
2. 保持與現有 Nuxt + MCP 架構相容，不做高風險大改。
3. 依 LangChain/LangGraph 建議路線（`create_agent/create_react_agent`、middleware、checkpointer、typed tool schema、streaming）逐步強化。

---

## 1. 現況診斷（重點）

### 1.1 可用基礎
- ✅ 已有流式回應架構（SSE token/tool event）。
- ✅ 已有 MCPManager singleton 與 tool preload。
- ✅ 已有 system prompt 注入 user/classroom 上下文。

### 1.2 主要風險
- ⚠️ **沒有 checkpointer/thread_id 記憶策略**：目前每次請求都重建 agent，狀態由 Nuxt 傳歷史訊息維持；LangGraph 層無耐久 state。
- ⚠️ **模型與行為硬編碼**：`gpt-4o`, `temperature=0.3`、MCP URL 都直接寫死。
- ⚠️ **tool contract 可觀測性不足**：tool 失敗/超時時只有一般例外，缺乏標準化錯誤訊號。
- ⚠️ **舊 graph 檔案與現行路徑混雜**：`src/graph/nodes.py`, `state.py` 仍為 mock/legacy 風格，易誤導。
- ⚠️ **Python cache 檔案進 repo**：`__pycache__` 已被追蹤，污染版本歷史。

---

## 2. 目標架構（Phase-based，不一次重寫）

### Phase 1（穩定化，低風險）
1. **Config 外部化**
   - 將 model、temperature、MCP URL、timeout、max steps 移至 env/config module。
2. **標準化錯誤處理**
   - 對 tool start/end/error 統一事件格式（SSE type：`tool_error`、`agent_error`）。
3. **清理 legacy 與 repo hygiene**
   - 明確標示 `nodes.py/state.py` 是否停用；必要時移到 `legacy/`。
   - 補 `.gitignore` 並清理 `__pycache__`。

### Phase 2（LangGraph 能力提升）
1. **導入 checkpointer（先 memory, 後 postgres）**
   - 請求帶入 `thread_id`（可用 `chat_history.id` 或 `user_id:classroom_id`）。
2. **加入 middleware hooks**
   - logging / safety guard / tool fallback（遵循 LangChain middleware 模式）。
3. **限制 agent recursion/step**
   - 避免無限工具循環，設置明確上限。

### Phase 3（教學品質與可觀測）
1. **response schema 化（至少內部）**
   - 定義 tutor response 結構：`answer`, `hints`, `recommendedProblems`, `recommendedMaterials`。
2. **追蹤與指標**
   - 加入 request_id、latency、tool success rate、token usage（可對接 LangSmith）。
3. **測試基線**
   - chat stream contract test、tool failure test、memory persistence test。

---

## 3. 套件結構建議（packages/ai-service）

建議逐步收斂成：

```text
src/
  main.py
  config.py                 # env parsing + defaults
  api/
    schemas.py              # ChatRequest/Response models
    stream.py               # SSE event builder
  graph/
    agent.py                # create_react_agent factory
    prompt.py               # system prompt builder
    runtime.py              # invoke/astream wrapper + config
  tools/
    mcp_manager.py
    adapters.py             # tool invocation wrappers + error mapping
  observability/
    logging.py
    metrics.py
```

重點：保留既有路徑與行為，先「切分責任」再談功能增強。

---

## 4. 建議優先待辦（可直接拆 Issue）

### P0（本週）
- [ ] 建立 `src/config.py`，抽離硬編碼設定。
- [ ] 為 stream event 加入 `error` 類型與 request_id。
- [ ] 補 Python `.gitignore` 並移除追蹤中的 `__pycache__`。
- [ ] 文件化目前 production path（`workflow.py` 為主）。

### P1（下週）
- [ ] 增加 checkpointer（先 `MemorySaver` 驗證行為）。
- [ ] 請求攜帶 thread_id，統一 session key strategy。
- [ ] 針對 MCP tool 增加 timeout/retry/backoff 策略。

### P2（接續）
- [ ] 導入 LangSmith/自建 tracing。
- [ ] 增加最小測試集（3~5 個高價值案例）。
- [ ] 設計 tutor response schema，讓前端可做結構化 UI。

---

## 5. 驗收標準（初版）

- 可靠性：tool 失敗不會中斷整段 SSE；最終會回傳可讀 fallback。
- 可維運：模型、endpoint、timeout 可透過 env 調整，不需改碼。
- 可觀測：每個請求都能追到 request_id 與 tool 成功/失敗事件。
- 可演進：agent 建立流程與 API/stream 邏輯分離，後續可插入 middleware/checkpointer。

---

## 6. 備註（與 LangChain skill 對齊）

本計畫已對齊專案 LangChain skill 的核心建議：
- 使用 `create_react_agent` / `create_agent` 作為主路徑。
- 導入 middleware 與 checkpointer，避免單純 stateless loop。
- 加入 recursion/step 控制與標準化 tool schema/錯誤處理。
- 逐步補齊 observability 與 integration tests，走向 production-ready。

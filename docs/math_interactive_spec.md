# 數學視覺化互動遊戲 App 規格書 (math_interactive_spec.md)

## 1. 核心數學概念模型 (Mathematical Model)

### 1.1 年齡不變量模型 (Age Difference Invariant)
- **概念識別碼 (concept_id)**: `invariant_age_diff`
- **數學定義與核心邏輯**:
  設兩人之年齡分別為 $A_t$ 與 $B_t$（$t$ 為時間年份）。在任何時間點 $t$，各自年齡變化量滿足 $\Delta A = \Delta B = \Delta t$。因此，兩人之年齡差 $\Delta t_{\text{diff}} = A_t - B_t = (A_0 + t) - (B_0 + t) = A_0 - B_0$ 恆為常數（Invariant）。當倍數關係隨時間改變時，年齡差即為模型中固定不變之基本單位量（Unit Delta）。
- **視覺化心智模型 (Mental Model)**:
  雙軌平行滑塊模型（Parallel Dual-Track Slider）。畫面上設置上、下兩條平行數線，分別代表兩人年齡。玩家拖曳時間軸滑桿 $t$ 時，兩條數線上的指示點同步向右等速平移，兩點之間的實體連結線段長度保持固定不變，直觀呈現「年齡隨時間同增，但差距空間恆定」的幾何特徵。
- **直覺陷阱 (Common Fallacy)**:
  學生常誤以為年齡倍數關係不變（例如以為「今年媽媽年齡是我的 3 倍，5 年後媽媽傳統上依然是我的 3 倍」），忽視了倍數會隨著基數增大而漸進趨近於 1 的特性。

### 1.2 流水相對運動與相消原理 (Relative Motion in Fluid)
- **概念識別碼 (concept_id)**: `relative_motion_river`
- **數學定義與核心邏輯**:
  設水流速度為 $V_r$，船隻靜水速度分別為 $V_1, V_2$。
  - 順流速度 $V_{\text{down}} = V_{\text{ship}} + V_r$
  - 逆流速度 $V_{\text{up}} = V_{\text{ship}} - V_r$
  在同水域相對運動中（如相遇、追及或拋物相遇），相對速度 $V_{\text{rel}} = (V_1 + V_r) + (V_2 - V_r) = V_1 + V_2$（相遇）或 $(V_1 + V_r) - (V_2 + V_r) = V_1 - V_2$（追及）。水流向量 $V_r$ 在相對算式中相互抵消，相遇時間與距離僅取決於靜水速度與初始相對距離。
- **視覺化心智模型 (Mental Model)**:
  帶有背景傳送帶（Conveyor Belt Grid）的雙體質點幾何圖形。背景底板以向量 $V_r$ 穩定向右滾動，兩船質點在底板上相向移動。系統提供「觀察者座標系切換」按鈕：切換至「流體參考座標系」時，背景停止滾動，直接展示兩船以純靜水速度相向靠攏的對稱幾何軌跡。
- **直覺陷阱 (Common Fallacy)**:
  直覺認為水流會對掉落浮木的返回相遇時間造成延遲，忽略了掉落物與返回船隻受到相同水速漂移向量的疊加，導致相對相遇時間依然等於「發現前流逝的時間」。

### 1.3 逆向操作與操作可逆性 (Working Backward & Invertible Operations)
- **概念識別碼 (concept_id)**: `working_backward_invert`
- **數學定義與核心邏輯**:
  設初始狀態為 $S_0$，經過一系列單射變換函數序列 $f_1, f_2, \dots, f_n$ 達到終態 $S_n = f_n(f_{n-1}(\dots f_1(S_0)\dots))$。若所有變換 $f_i$ 均存在逆函數 $f_i^{-1}$，則初始狀態可藉由終態與逆函數序列完全還原：$S_0 = f_1^{-1}(f_2^{-1}(\dots f_n^{-1}(S_n)\dots))$。
  具體對應規則：
  - 取走一半並多拿 $k$ 個：正向 $f(x) = \frac{x}{2} - k$，逆向 $f^{-1}(y) = (y + k) \times 2$
  - 放回 $m$ 個：正向 $g(x) = x + m$，逆向 $g^{-1}(y) = y - m$
- **視覺化心智模型 (Mental Model)**:
  有向狀態樹與流向倒放節點圖（Reversible Flow Network）。每個運算節點包含雙向箭頭。正向播放時，物件數量隨節點縮減；當啟用「逆向倒帶」模式時，所有流向管道轉向，運算子自動轉化為逆運算（加變減、乘變除），數值從最終剩餘量沿反向路線逆推回初值。
- **直覺陷阱 (Common Fallacy)**:
  在處理「取走一半多 3 個」時，學生常先乘以 2 再減 3，混淆了逆運算的嚴格順序（正確應為先補回 3 個，再乘以 2）。

### 1.4 餘數週期與同餘類 (Remainder Cycle & Modular Arithmetic)
- **概念識別碼 (concept_id)**: `remainder_cycle_modulo`
- **數學定義與核心邏輯**:
  設一長度為 $T$ 的重複序列 $P = [p_0, p_1, \dots, p_{T-1}]$。對於任意正整數序號 $N$（1-indexed），其對應的元素為 $P[(N - 1) \bmod T]$。在 $N$ 項累積和運算中，若一個週期內特定元素出現頻率為 $c$，則前 $N$ 項中該元素的總出現次數為：
  $$\text{Count}(N) = \lfloor \frac{N}{T} \rfloor \times c + \text{Count}_{\text{prefix}}((N \bmod T))$$
- **視覺化心智模型 (Mental Model)**:
  環形齒輪盤模型（Circular Modulo Wheel）。將週期長度 $T$ 的 Pattern 繪製於一個有 $T$ 個齒的圓盤上。指針隨著序號 $N$ 的增加繞圓盤順時針旋轉。當 $N$ 增長時，圓盤完成 $\lfloor N/T \rfloor$ 圈旋轉，最終停留在偏轉角為 $(N - 1) \bmod T$ 的扇區。
- **直覺陷阱 (Common Fallacy)**:
  計算餘數時直接以 $N \bmod T$ 作為索引，忽視了 1-based 索引下餘數為 0 實則對應週期最後一項（第 $T$ 項）而非第 0 項。

### 1.5 極值原理與邊界代換 (Extremal Principle & Resource Exchange)
- **概念識別碼 (concept_id)**: `extremal_wrapper_exchange`
- **數學定義與核心邏輯**:
  設初始資源（資金或物品）可換取基本單位數量為 $A_0$。若每 $k$ 個空殼/資源可兌換 1 個新單位（內含 1 個新資源與 1 個空殼），則淨兌換成本為 $(k - 1)$ 個空殼。總獲取最大值 $A_{\text{max}}$ 滿足：
  $$A_{\text{max}} = A_0 + \lfloor \frac{A_0 - 1}{k - 1} \rfloor$$
  極值條件受限於資源不可預支原則（無借貸狀態下，每次兌換必須即時累積滿 $k$ 個空殼）。
- **視覺化心智模型 (Mental Model)**:
  堆疊天平與資源迴路槽（Resource Recital Loop）。左側為「糖果庫存」，右側為「空糖紙回收槽」。當玩家將糖果移至「食用區」時，糖果轉化為點數並產出 1 張糖紙落入回收槽；回收槽累積滿 $k$ 張時，自動觸發高亮合成動畫，產生 1 個新糖果，循環往復直達無法湊滿 $k$ 張的邊界。
- **直覺陷阱 (Common Fallacy)**:
  直接套用無條件公式 $A_0 / (k-1)$，忽略了現實中若剩餘空殼數不足 $k$ 且無法借用時，無法觸發最後一次兌換。

### 1.6 格點幾何與正方形旋轉對稱 (Grid Geometry & Rotational Symmetry)
- **概念識別碼 (concept_id)**: `spatial_symmetry_grid`
- **數學定義與核心邏輯**:
  在正方形點陣 $\mathbb{Z}^2$ 上，以四個格點為頂點構成的正方形，其邊長可由格點向量 $(a, b)$ 決定。正方形面積為 $S = a^2 + b^2$。當 $a, b \in \mathbb{Z}^0$ 時，頂點座標經旋轉矩陣 $R_{90^\circ} = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$ 作用後仍落在格點上，形成傾斜正方形（Tilted Square）。
- **視覺化心智模型 (Mental Model)**:
  動態格點外接矩形包絡框（Bounding Box Frame）。在 $N \times N$ 點陣上，當玩家拖曳四個頂點時，系統自動繪製該傾斜正方形的水平-垂直外接正方形，並顯示四角四個全等直角三角形（邊長 $a, b$，斜邊 $c$），直觀展示 $S = (a+b)^2 - 4 \times (\frac{1}{2}ab) = a^2 + b^2$。
- **直覺陷阱 (Common Fallacy)**:
  誤以為點陣上只能構建邊平行於座標軸的正方形（正置正方形），忽視了利用勾股數組合構成的傾斜正方形。

---

## 2. 狀態機與資料結構定義 (TypeScript Data Schema)

```typescript
// 1. 基本幾何與向量定義
export interface Vector2D {
  x: number;
  y: number;
}

// 2. 節點與盤面狀態介面
export interface BoardNode {
  id: string;
  position: Vector2D;
  value: number;
  type: 'SOURCE' | 'TRANSFORM' | 'SINK' | 'OBSTACLE';
  state: {
    isSelected: boolean;
    isHighlighted: boolean;
    isInvalid: boolean;
    label?: string;
  };
}

export interface ConveyorEntity {
  id: string;
  currentSegmentIndex: number;
  progressOnSegment: number; // 0.0 到 1.0
  speed: number;
  direction: 1 | -1;
}

export interface GameBoardState {
  levelId: string;
  gridSize: { cols: number; rows: number };
  nodes: Map<string, BoardNode>;
  entities: ConveyorEntity[];
  stepCount: number;
  maxSteps: number;
  timeElapsed: number;
  globalVariables: Record<string, number>; // 例如：{ riverSpeed: 2, ageDiff: 12 }
  status: 'INIT' | 'PLAYING' | 'STALEMATE' | 'VICTORY' | 'FAILED';
}

// 3. 玩家操作動作型別定義
export type PlayerAction =
  | { type: 'SELECT_NODE'; payload: { nodeId: string } }
  | { type: 'MOVE_SLIDER'; payload: { variableName: string; value: number } }
  | { type: 'EXECUTE_STEP'; payload: { transformType: 'INVERT' | 'EXCHANGE' | 'STEP_FORWARD' } }
  | { type: 'CONNECT_NODES'; payload: { sourceId: string; targetId: string } }
  | { type: 'ROTATE_ELEMENT'; payload: { nodeId: string; angleDegrees: number } }
  | { type: 'UNDO' }
  | { type: 'RESET' };

// 4. 驗證與狀態判斷函式簽名
export type WinConditionChecker = (
  state: GameBoardState
) => {
  isWin: boolean;
  score: number;
  reason?: string;
};

export type StalemateDetector = (
  state: GameBoardState
) => {
  isStalemate: boolean;
  suggestUndo: boolean;
  reason?: string;
};

export type ActionValidator = (
  state: GameBoardState,
  action: PlayerAction
) => {
  isValid: boolean;
  errorMessage?: string;
};
```

---

## 3. 視覺化畫布與座標系規格 (SVG / Canvas Visualization Spec)

### 3.1 座標空間定義
- **標準 viewBox**: `0 0 800 600`（寬 800px，高 600px，長寬比 4:3）。
- **原點位置**: 左上角為 `(0, 0)`，X 軸正向朝右，Y 軸正向朝下。
- **世界座標至畫布座標對映**:
  - 主遊戲視窗區域：`x: 50` 至 `750`，`y: 50` 至 `500`。
  - 控制面板與提示區域：`x: 0` 至 `800`，`y: 500` 至 `600`。

### 3.2 幾何元素渲染規則

| 物件類別 | 幾何形狀 / SVG 標籤 | 基礎尺寸 & 間距 | 狀態樣式與視覺回饋 (CSS/SVG Attributes) |
| :--- | :--- | :--- | :--- |
| **網格點 (Grid Dot)** | `<circle>` | 半徑 $r = 4\text{px}$，網格間距 $dx = dy = 50\text{px}$ | 正常：`fill="#E0E0E0"`<br>懸停：`fill="#4A90E2", r=6px`<br>有效連線目標：`fill="#7ED321"` |
| **操作卡牌/節點** | `<rect>`（圓角） | 寬 $80\text{px}$，高 $60\text{px}$，圓角 $rx = 8\text{px}$ | 正常：`fill="#FFFFFF", stroke="#D0D0D0", stroke-width=2`<br>選取：`stroke="#4A90E2", stroke-width=4`<br>不合法：`stroke="#D0021B"`, 附加 CSS Keyframe 左右震動動畫 (Shaking Effect, $\pm 5\text{px}$) |
| **向量/箭頭管道** | `<path>` 與 `<marker>` | 線寬 $4\text{px}$，箭頭尺寸 $8\times 8\text{px}$ | 靜止：`stroke="#9B9B9B"`<br>流動中：`stroke="#4A90E2", stroke-dasharray="6 4"` + 虛線偏移動畫<br>逆向還原模式：`stroke="#F5A623"` |
| **高亮破局元件** | `<polygon>` / `<circle>` | 依幾何邊界延伸，擴展 $6\text{px}$ | 滿足定理：`stroke="#7ED321", fill="rgba(126, 211, 33, 0.2)"`, 呼吸燈動畫 (Pulse Effect) |

### 3.3 互動觸發區域 (Hitbox) 規格
- **點擊 (Click/Tap) Hitbox**: 以元件中心為基準，最小有效點擊區域擴展至 $44 \times 44\text{px}$（滿足移動端觸控標準）。
- **拖曳 (Drag & Drop) 磁吸範圍**: 當物件被拖曳至目標節點中心距離 $< 25\text{px}$ 時，觸發自動磁吸（Snap-to-Grid），並播放回饋音效與邊框高亮。
- **連線 (Connection Line) Hitbox**: 繞路徑曲線外側擴展 $12\text{px}$ 的透明觸發帶（`stroke="transparent", stroke-width=24`），方便玩家點擊選取或剪斷連線。

---

## 4. 遊戲關卡機制 (Gameplay Mechanics & Levels)

### 關卡 1：香蕉籃逆向還原 (Level 1: Reversing the Fruit Basket)
- **概念對應**: `working_backward_invert`
- **關卡目標**: 輸入初始香蕉總數，使經過三階段分發後，最終剩餘數量精確等於 15。
- **初始狀態 (Initial State)**:
  - 終態記錄：`remaining = 15`
  - 操作歷史節點（順向）：
    1. 拿走一半多 5 個（`op1: x -> x/2 - 5`）
    2. 放回 6 個（`op2: x -> x + 6`）
    3. 拿走一半少 3 個（`op3: x -> x/2 + 3`）
  - 盤面初值未知：`initial_x = ?`
- **限制條件**: 步數上限 6 步；必須按逆向時間軸順序解鎖運算節點。
- **三階段引導提示 (Progressive Hints)**:
  - **Level 1 提示 (觀察引導)**: 請關注最後一步「拿走一半少 3 個」完成後，籃子裡剩下的 15 根香蕉。如果把最後放回籃子的 3 根拿走，數量會變成多少？
  - **Level 2 提示 (規律聚焦)**: 逆向操作時，每一個步驟的運算都要變成「相反動作」：加法變減法，除以 2 變成乘以 2。注意步驟順序必須從最後一步倒著算回去！
  - **Level 3 提示 (核心破局)**: 倒推算式流程：
    $$\text{Stage 3}: 15 - 3 = 12 \xrightarrow{\times 2} 24$$
    $$\text{Stage 2}: 24 - 6 = 18$$
    $$\text{Stage 1}: 18 + 5 = 23 \xrightarrow{\times 2} 46$$
    初始香蕉總數為 46 根。

### 關卡 2：河流中物品拋落相遇 (Level 2: River Floating Relic)
- **概念對應**: `relative_motion_river`
- **關卡目標**: 控制快船掉頭時機，使快船在最少時間內追回掉落水中的漂流箱（Relic）。
- **初始狀態 (Initial State)**:
  - 兩碼頭距離：$15\text{ km}$，水流速度 $V_r = 3\text{ km/h}$（初始隱藏）
  - 快船靜水速度 $V_1 = 18\text{ km/h}$，慢船靜水速度 $V_2 = 12\text{ km/h}$
  - 快船追上慢船後繼續行駛 10 分鐘時，物品掉入水中。
- **限制條件**: 只能控制快船「掉頭時機」；不能直接更改船隻靜水速度。
- **三階段引導提示 (Progressive Hints)**:
  - **Level 1 提示 (觀察引導)**: 觀察快船與漂流箱在水流中的相對運動。水速對快船遠離漂流箱與駛回漂流箱的影響是否相同？
  - **Level 2 提示 (規律聚焦)**: 嘗試切換視角至「水流參考座標系」（漂浮在水上的視角）。在水流視角中，水速被完全抵消，漂流箱是靜止的！
  - **Level 3 提示 (核心破局)**: 揭示相對運動定理：快船遠離漂流箱開了 10 分鐘，掉頭返回追回漂流箱所需時間必然也精確等於 10 分鐘，與水流速度大小完全無關。

### 關卡 3：星星燈串顏色預測 (Level 3: Star Light Cycle)
- **概念對應**: `remainder_cycle_modulo`
- **關卡目標**: 點擊正確顏色按鈕，設定第 32 盞與第 100 盞星星燈的顏色，並計算前 32 盞燈中藍燈的總數。
- **初始狀態 (Initial State)**:
  - 燈串顏色規律序列：`[紅, 紅, 黃, 藍, 藍]`，週期 $T = 5$
  - 燈串展示區域：顯示前 12 盞燈，後續燈泡以問號表示。
- **限制條件**: 禁止逐一手動點亮超過 15 盞燈，必須透過設定週期公式提交答案。
- **三階段引導提示 (Progressive Hints)**:
  - **Level 1 提示 (觀察引導)**: 仔細觀察前 10 盞燈，找出幾盞燈之後顏色開始完全重複？
  - **Level 2 提示 (規律聚焦)**: 週期長度為 5。計算 $32 \div 5$ 的商數與餘數。商數代表完整重複了多少組？餘數代表落在新一組的第幾盞燈？
  - **Level 3 提示 (核心破局)**: 
    $$32 = 5 \times 6 + 2$$
    餘數為 2，故第 32 盞燈顏色與第 2 盞燈相同，為「紅色」。前 32 盞燈包含 6 個完整週期（每組 2 藍）加上餘數 2 盞（無藍），藍燈總數 $= 6 \times 2 + 0 = 12$ 盞。

### 關卡 4：糖紙換糖極值挑戰 (Level 4: Sweet Wrapper Exchange Limit)
- **概念對應**: `extremal_wrapper_exchange`
- **關卡目標**: 操作初始資金購買糖果並進行空糖紙兌換，達到該資金下可獲得的糖果數量最大值。
- **初始狀態 (Initial State)**:
  - 初始資金：可購買 $A_0 = 11$ 顆糖果
  - 兌換規則：每 $k = 3$ 張空糖紙可免費兌換 1 顆新糖果
  - 盤面介面：顯示「購買區」、「食用區」、「糖紙回收區」
- **限制條件**: 無借貸功能（不得預支糖紙）；步數不限但需達到數學理論極限。
- **三階段引導提示 (Progressive Hints)**:
  - **Level 1 提示 (觀察引導)**: 每次吃完糖果後，把糖紙放入回收區，滿 3 張就立刻兌換新糖果。兌換來的新糖果吃完後又會產生什麼？
  - **Level 2 提示 (規律聚焦)**: 注意兌換到的新糖果吃掉後也會產生 1 張新糖紙！將「兌換」與「再食用」連貫計算。
  - **Level 3 提示 (核心破局)**: 
    - 初始 11 糖 $\rightarrow$ 11 糖紙 $\rightarrow$ 換 3 糖（餘 2 糖紙）
    - 吃 3 糖產生 3 糖紙，加上餘 2 糖紙，共 5 糖紙 $\rightarrow$ 換 1 糖（餘 2 糖紙）
    - 吃 1 糖產生 1 糖紙，加上餘 2 糖紙，共 3 糖紙 $\rightarrow$ 換 1 糖（餘 0 糖紙）
    - 總獲取最大數量 $= 11 + 3 + 1 + 1 = 16$ 顆。

### 關卡 5：點陣傾斜正方形構建 (Level 5: Tilted Grid Square Construction)
- **概念對應**: `spatial_symmetry_grid`
- **關卡目標**: 在 $6 \times 6$ 的點陣圖上，利用 4 個點連接構成一個面積精確等於 $5\text{ 平方單位}$ 的正方形。
- **初始狀態 (Initial State)**:
  - 點陣空間：$0 \le x, y \le 5$ 的整數格點
  - 玩家工具：點擊格點繪製多邊形邊框
- **限制條件**: 正方形頂點必須精確落在格點上；邊長不能與座標軸平行（禁止正置正方形）。
- **三階段引導提示 (Progressive Hints)**:
  - **Level 1 提示 (觀察引導)**: 試著畫一個正置正方形，其面積只能是 $1, 4, 9, 16 \dots$ 無法達到 5。線段能否傾斜連接？
  - **Level 2 提示 (規律聚焦)**: 利用勾股定理（直角三角形斜邊）：尋找兩個整數 $a, b$，使得斜邊平方 $a^2 + b^2 = 5$。
  - **Level 3 提示 (核心破局)**: 取 $a = 1, b = 2$，因為 $1^2 + 2^2 = 5$。從點 $(0, 1)$ 出發，依序連接 $(2, 0) \rightarrow (3, 2) \rightarrow (1, 3) \rightarrow (0, 1)$，即可構成面積為 5 的傾斜正方形。

---

## 5. 解法驗證與核心演算法 (Validation Logic)

### 5.1 勝負驗證虛擬碼 (Pseudocode)

```typescript
/**
 * 核心勝負條件驗證演算法
 * @param state 當前遊戲盤面狀態
 * @returns 驗證結果與分數
 */
export function checkWinCondition(state: GameBoardState): { isWin: boolean; score: number; reason?: string } {
  // 1. 檢查遊戲基礎狀態
  if (state.status === 'FAILED' || state.status === 'STALEMATE') {
    return { isWin: false, score: 0, reason: '盤面已處於失敗或死局狀態。' };
  }

  // 2. 根據不同關卡類型進行精確數學驗證
  switch (state.levelId) {
    case 'LEVEL_1_WORKING_BACKWARD': {
      const initialValue = state.globalVariables['calculatedInitialValue'];
      const targetValue = 46; // 理論精確值
      if (initialValue === targetValue && state.nodes.get('node_final')?.state.value === 15) {
        const score = Math.max(100 - (state.stepCount - 5) * 10, 60);
        return { isWin: true, score, reason: '成功逆向還原初始香蕉總數！' };
      }
      break;
    }

    case 'LEVEL_2_RIVER_RELATIVE_MOTION': {
      const turnBackTime = state.globalVariables['turnBackTime'];
      const targetTime = 10; // 相對運動下，返回時間等於開出時間 10 分鐘
      if (Math.abs(turnBackTime - targetTime) < 1e-3) {
        return { isWin: true, score: 100, reason: '成功運用相對運動不變量，以最佳時機追回漂流箱！' };
      }
      break;
    }

    case 'LEVEL_3_REMAINDER_CYCLE': {
      const p32Color = state.globalVariables['p32_color_answer']; // 應為 RED (1)
      const blueCount = state.globalVariables['blue_count_answer']; // 應為 12
      if (p32Color === 1 && blueCount === 12) {
        return { isWin: true, score: 100, reason: '同餘週期與累積數量計算完全正確！' };
      }
      break;
    }

    case 'LEVEL_4_EXTREMAL_EXCHANGE': {
      const consumedSweets = state.globalVariables['consumedSweets'];
      const maxTheoretical = 16;
      if (consumedSweets === maxTheoretical) {
        return { isWin: true, score: 100, reason: '已達成極值資源兌換最大化！' };
      }
      break;
    }

    case 'LEVEL_5_GRID_TILTED_SQUARE': {
      const polygonNodes = Array.from(state.nodes.values()).filter(n => n.state.isSelected);
      if (polygonNodes.length === 4) {
        const [p1, p2, p3, p4] = polygonNodes.map(n => n.position);
        // 計算四邊向量與斜率，驗證是否為邊長 sqrt(5) 之正方形
        const d12_sq = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        const d23_sq = Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2);
        const d34_sq = Math.pow(p3.x - p4.x, 2) + Math.pow(p3.y - p4.y, 2);
        const d41_sq = Math.pow(p4.x - p1.x, 2) + Math.pow(p4.y - p1.y, 2);
        
        // 向量內積驗證垂直
        const dotProduct = (p2.x - p1.x) * (p3.x - p2.x) + (p2.y - p1.y) * (p3.y - p2.y);

        if (d12_sq === 5 && d23_sq === 5 && d34_sq === 5 && d41_sq === 5 && dotProduct === 0) {
          return { isWin: true, score: 100, reason: '成功構建面積為 5 的傾斜格點正方形！' };
        }
      }
      break;
    }

    default:
      break;
  }

  return { isWin: false, score: 0 };
}
```

### 5.2 死局偵測 (Stalemate Detection) 演算法

```typescript
/**
 * 即時死局偵測演算法
 * @param state 當前遊戲狀態
 * @returns 是否死局與復原建議
 */
export function detectStalemate(state: GameBoardState): { isStalemate: boolean; suggestUndo: boolean; reason?: string } {
  // 死局條件 1：超過限制步數且未達成勝負條件
  if (state.stepCount >= state.maxSteps && !checkWinCondition(state).isWin) {
    return {
      isStalemate: true,
      suggestUndo: true,
      reason: `操作步數已達上限 (${state.maxSteps} 步)，無法繼續達成目標。`
    };
  }

  // 死局條件 2：極值換糖關卡中，糖紙數不足以兌換且剩餘資金為 0，且總糖果數未達標
  if (state.levelId === 'LEVEL_4_EXTREMAL_EXCHANGE') {
    const currentWrappers = state.globalVariables['currentWrappers'] || 0;
    const currentMoney = state.globalVariables['currentMoney'] || 0;
    const consumedSweets = state.globalVariables['consumedSweets'] || 0;

    if (currentMoney === 0 && currentWrappers < 3 && consumedSweets < 16) {
      return {
        isStalemate: true,
        suggestUndo: true,
        reason: '資源已耗盡且空糖紙不足 3 張，無法繼續進行兌換。請點擊「復原 (Undo)」返回前一步。'
      };
    }
  }

  // 死局條件 3：逆向還原關卡中，出現非整數或負數無效狀態
  if (state.levelId === 'LEVEL_1_WORKING_BACKWARD') {
    const currentValue = state.globalVariables['currentWorkingValue'];
    if (currentValue !== undefined && (currentValue < 0 || !Number.isInteger(currentValue))) {
      return {
        isStalemate: true,
        suggestUndo: true,
        reason: '當前還原數值出現非整數或負數，不符合實體物品物理約束。'
      };
    }
  }

  return { isStalemate: false, suggestUndo: false };
}
```

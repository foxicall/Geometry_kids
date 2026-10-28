import type { GameBoard, GameLevel, GameValidation, IMOConcept } from '../types/game';
import {
  arithmetic,
  bestPlaceNumber,
  boundaryEdges,
  castleCells,
  displayNumber,
  gcd,
  isSymmetry,
  lcm,
  metricPresets,
  parseRoman,
  ports,
  reverseSteps,
  roundTo,
  wrap,
} from './math';

const result = (
  solved: boolean,
  message: string,
  facts: string[],
  valid = true,
): GameValidation => ({ solved, valid, message, facts });
export function matrixValue(
  board: Extract<GameBoard, { kind: 'matrix' }>,
  a: number,
  b: number,
  c: number,
): number | null {
  if (!board.first || !board.second) return null;
  const first = arithmetic(b, board.first, c);
  return first === null ? null : arithmetic(first, board.second, a);
}
/** 所有判定使用目前盤面；不依畫面動畫、提示或儲存資料推測通關。 */
export function validateBoard(b: GameBoard): GameValidation {
  switch (b.kind) {
    case 'place': {
      const complete = b.slots.every((n) => n !== null),
        n = Number(b.slots.map((n) => n ?? 0).join(''));
      const cards = [...b.slots].sort().join(',') === '0,2,4,7,9';
      return result(
        complete && cards && n === bestPlaceNumber(),
        !complete
          ? '先把五個舞台排好。'
          : b.slots[0] === 0
            ? '五位數的萬位不能是 0，試試復原。'
            : !cards
              ? '挑戰要把 2、4、0、7、9 各用一次。'
              : n === bestPlaceNumber()
                ? '找到了！先讓高位盡量大，再保留奇數個位。'
                : '還能更大嗎？記得小於 50000，而且個位要是奇數。',
        ['面值就是數字本身；位值＝數字 × 所在位置的單位。', '0 放在哪一位，面值和位值都是 0。'],
      );
    }
    case 'roman': {
      const n = parseRoman(b.text);
      return result(
        n === 465,
        !b.text
          ? '點符號排成密碼。'
          : n === null
            ? '這個排列不符合標準寫法。可左減的組合只有 IV、IX、XL、XC、CD、CM。試試復原。'
            : n === 465
              ? '密碼門打開了！CD + LX + V = 400 + 60 + 5。'
              : `目前的標準羅馬數字代表 ${n}。`,
        ['I、X、C、M 最多連續三次；V、L、D 不重複。', '使用 1–3999 的標準羅馬數字；沒有 0。'],
        !b.text || n !== null,
      );
    }
    case 'rounding': {
      const answer = roundTo(b.number, b.precision),
        low = Math.floor(b.number / b.precision) * b.precision;
      return result(
        b.choice === answer,
        b.choice === null
          ? '觀察小車是否到達中點，再選月台。'
          : b.choice === answer
            ? '到站！中點和中點右邊的數都往上進位。'
            : '再看看中點的位置，可以復原重選。',
        [
          `兩個月台是 ${low} 與 ${low + b.precision}；中點是 ${low + b.precision / 2}。`,
          `估算到 ${b.precision} 位階時，看它右邊的第一位。`,
        ],
      );
    }
    case 'reverse': {
      const prefix = b.operations.every((op, i) => op === reverseSteps[i]);
      return result(
        prefix && b.operations.length === 4 && b.current === 20,
        prefix
          ? b.operations.length === 4
            ? '找到原數 20！代回正向流程，也會得到 348。'
            : '這一步倒帶正確，接著還原前一個動作。'
          : '目前沒有依反向順序還原，使用復原再試。',
        [`目前數值：${displayNumber(b.current)}。`, '先倒轉順序，再換成逆運算。乘除的數不能是 0。'],
      );
    }
    case 'unitary':
      return result(
        b.unit === b.total / b.count && b.quantity === b.wanted,
        b.unit === null
          ? '先算出一瓶的量，再調整瓶數。'
          : b.unit !== b.total / b.count
            ? '用總量除以瓶數，檢查一瓶的量。'
            : b.quantity !== b.wanted
              ? '單瓶容量正確！再調整到客人需要的瓶數。'
              : '調配完成！先求一份，再求好多份。',
        [
          `${b.count} 瓶共 ${b.total} 毫升。`,
          b.unit === null
            ? '單瓶容量尚未設定。'
            : `目前調配：${b.unit} × ${b.quantity} = ${b.unit * b.quantity} 毫升。`,
        ],
      );
    case 'fraction': {
      const n = b.slices.filter(Boolean).length,
        d = b.slices.length,
        equivalent = n * 32 === d * 12;
      return result(
        equivalent && gcd(n, d) === 1,
        !equivalent
          ? '塗色的份量改變了；挑戰要保留原來的 12/32，可復原。'
          : gcd(n, d) === 1
            ? '份量沒變，已經不能再約分了！'
            : '試試把分子、分母同除以一個公因數。',
        [
          `目前選取 ${n}/${d}；最大公因數是 ${gcd(n, d)}。`,
          '同除以任何大於 1 的公因數都合法，不一定要一次完成。',
        ],
      );
    }
    case 'compare': {
      const left = b.a * b.d,
        right = b.c * b.b,
        answer = left > right ? 'left' : left < right ? 'right' : 'equal';
      const common = lcm(b.b, b.d);
      return result(
        b.normalized && b.choice === answer,
        !b.normalized
          ? '先按通分，讓同樣長的跑道使用相同刻度。'
          : b.choice === null
            ? '現在每一小格一樣大了，哪邊的分量多？'
            : b.choice === answer
              ? '判斷正確！比較的是同一整體的分量。'
              : '看看車子的位置，復原再比較一次。',
        [
          `兩條跑道的全長相同。${b.a}/${b.b} 和 ${b.c}/${b.d}。`,
          b.normalized
            ? `通分：${(b.a * common) / b.b}/${common} 和 ${(b.c * common) / b.d}/${common}。`
            : '通分只改變刻度，不改變車子代表的分量。',
        ],
      );
    }
    case 'metric': {
      const p = metricPresets[b.preset],
        total = p.major * p.ratio;
      return result(
        b.converted === total && b.portion === total / p.people,
        b.converted !== total
          ? `先把 ${p.major} ${p.unit}換成${p.small}。`
          : b.portion !== total / p.people
            ? `換算正確！再平均分給 ${p.people} 人。`
            : `分配完成，每人 ${total / p.people} ${p.small}。`,
        [
          `1 ${p.unit} = ${p.ratio} ${p.small}。`,
          '小數也能表示正確的量；例如 0.4 公尺就是 40 公分。',
        ],
      );
    }
    case 'perimeter': {
      const boundary = boundaryEdges(b.cells),
        correct = b.fences.filter((e) => boundary.includes(e)).length,
        wrong = b.fences.length - correct;
      return result(
        boundary.length > 0 && correct === boundary.length && wrong === 0,
        wrong
          ? '有圍欄放在兩塊積木之間，使用復原移除。'
          : correct === boundary.length && boundary.length > 0
            ? '外露邊全部圍好了，凹進去的邊也有算到！'
            : '點外露的邊架圍欄；積木中間的線不用圍。',
        [
          `已圍對 ${correct} 段；內部誤放 ${wrong} 段。`,
          `周長＝外露邊段數 × ${b.side} 公分。空洞的邊界也算在內。`,
        ],
      );
    }
    case 'symmetry': {
      const good = b.tried.filter((a) => isSymmetry(b.shape, a));
      return result(
        b.shape === 'square' && [0, 45, 90, 135].every((a) => good.includes(a)),
        b.lastAxis === null
          ? '選一條摺線，看看鏡像能否完全重合。'
          : isSymmetry(b.shape, b.lastAxis)
            ? '完全重合！這是一條對稱軸。'
            : '有角落伸出來，這條線不是對稱軸。可復原後再試。',
        [
          b.shape === 'circle'
            ? '圓的每一條直徑都是對稱軸，有無限多條；按鈕只是部分例子。'
            : `已找到 ${good.length} 條不同的對稱軸。`,
          '把每個角映到摺線另一邊，整個輪廓都吻合才算。',
        ],
      );
    }
    case 'pictograph':
      return result(
        b.icons === 5 && b.shareN === 1 && b.shareD === 4,
        b.icons !== 5
          ? '補上小雪缺少的圖案，讓全班合計等於總量。'
          : b.shareN !== 1 || b.shareD !== 4
            ? '圖案數正確！再把小安占總量的分數約到最簡。'
            : '天平平衡了！小雪 5 個圖案，小安占全班的 1/4。',
        [
          `1 圖案＝${b.scale} 枝；全班共有 ${28 * b.scale} 枝。`,
          `目前圖上合計 ${(23 + b.icons) * b.scale} 枝，小雪 ${b.icons * b.scale} 枝。`,
        ],
      );
    case 'matrix': {
      const one = matrixValue(b, 8, 3, 4),
        two = matrixValue(b, 9, 5, 5),
        pattern = one === 20 && two === 34;
      return result(
        pattern && b.unknown === 3,
        !b.first || !b.second
          ? '先把兩個運算位置填上。括號內先算。'
          : !pattern
            ? '這組運算還不能同時通過兩個範例。'
            : b.unknown !== 3
              ? '兩個範例都通過了！再解第三組的問號。'
              : '成功！同一規則能通過所有組別：3 × 7 + 14 = 35。',
        [
          `規則固定為 (B 運算 C) 運算 A，不可交換節點。`,
          `第一組：${one ?? '尚未完成'} / 目標 20；第二組：${two ?? '尚未完成'} / 目標 34。`,
        ],
      );
    }
    case 'compass': {
      const heading = wrap(b.start + b.turns.reduce((a, c) => a + c, 0), 8),
        prefix = b.turns.every((t, i) => t === [-1, 2][i]);
      return result(
        b.start === 0 && prefix && b.turns.length === 2,
        prefix
          ? b.turns.length === 2
            ? '到市場了！先到郵局，再經過圖書館到市場。'
            : '順序正確，繼續看下一個轉向指令。'
          : '到達相同港口不代表路線相同；使用復原依指令轉向。',
        [
          `船頭面向${ports[heading]}；一格是 45°。`,
          `順時針格數相加，逆時針格數相減，再繞回八方位。`,
        ],
      );
    }
  }
}

type Definition = [IMOConcept, string, string, string, string, GameBoard, number, string[]];
const definitions: Definition[] = [
  [
    'place',
    '位值舞台劇',
    '數字站的位置，讓大小不一樣',
    '把 2、4、0、7、9 各用一次，排出小於 50000 的最大五位奇數。',
    '從最高位開始選，並替個位保留奇數。',
    { kind: 'place', slots: [null, null, null, null, null] },
    8,
    [
      '奇數的個位必須是奇數；這裡只有 7 和 9。',
      '萬位選 4，千位盡量大可放 9；把 7 留給個位。',
      '依序放 4、9、2、0、7，得到 49207。',
    ],
  ],
  [
    'roman',
    '羅馬密碼門',
    '用符號排出一個數',
    '用標準羅馬數字組出 465。',
    '左減只允許六種組合，不能隨意把小符號放前面。',
    { kind: 'roman', text: '' },
    8,
    [
      '465 可以拆成 400 + 60 + 5。',
      'CD 是 500 減 100；LX 是 50 加 10。',
      '依序排 C、D、L、X、V：CDLXV = 465。',
    ],
  ],
  [
    'rounding',
    '過山車估算站',
    '離哪一個整千比較近？',
    '把 37589 四捨五入到千位，選一個月台。',
    '到達中點就往上進位；還沒到中點就往下。',
    { kind: 'rounding', number: 37589, precision: 1000, choice: null },
    3,
    [
      '千位右邊是百位，這裡是 5。',
      '37000 與 38000 的中點是 37500，小車已超過它。',
      '選 38000；千位進 1，百、十、個位變成 0。',
    ],
  ],
  [
    'reverse',
    '時空倒帶機',
    '從結果找回起點',
    '原數先 ×10、+12、×4、−500，得到 348。依反向順序找回原數。',
    '逆運算先處理最後一步，加減互換、乘除互換。',
    { kind: 'reverse', current: 348, operations: [] },
    6,
    [
      '最後是減 500，所以先加回 500。',
      '接著除以 4，再減去 12，最後除以 10。',
      '348 → 848 → 212 → 200 → 20。原數是 20。',
    ],
  ],
  [
    'unitary',
    '魔法藥水廠',
    '先找到一瓶，再配好多瓶',
    '7 瓶共 420 毫升。設定一瓶的量，再配出 12 瓶。',
    '總量 ÷ 份數＝一份的量；一份的量 × 新份數＝新總量。',
    { kind: 'unitary', count: 7, total: 420, wanted: 12, unit: null, quantity: 1 },
    5,
    [
      '一瓶是多少？把 420 平分成 7 份。',
      '420 ÷ 7 = 60，所以一瓶 60 毫升。',
      '設定 60，再把瓶數調到 12，得到 720 毫升。',
    ],
  ],
  [
    'fraction',
    '披薩約分工廠',
    '切片變大，份量不變',
    '保留 12/32 的份量，把分數約到最簡。',
    '分子和分母同除以公因數，份量才不會改變。',
    { kind: 'fraction', slices: Array.from({ length: 32 }, (_, i) => i < 12) },
    4,
    [
      '12 和 32 都能被哪些數整除？',
      '最大公因數是 4；分兩次除以 2 也可以。',
      '12 ÷ 4 = 3，32 ÷ 4 = 8，所以是 3/8。',
    ],
  ],
  [
    'compare',
    '分數賽車場',
    '刻度不同，也能公平比較',
    '先通分，再比較 5/8 與 3/7 哪個分量大。',
    '整體要同樣大；通分後每一小格也同樣大。',
    { kind: 'compare', a: 5, b: 8, c: 3, d: 7, normalized: false, choice: null },
    4,
    [
      '兩條跑道一樣長，試試把刻度都改成 56 格。',
      '5/8 = 35/56；3/7 = 24/56。',
      '35 格比 24 格多，選左邊 5/8。',
    ],
  ],
  [
    'metric',
    '單位轉換工廠',
    '大單位換成小單位',
    '50 公尺絲帶平均分給 125 人：先換成公分，再算每人多少公分。',
    '數字和單位要一起看；換單位不會改變實際的量。',
    { kind: 'metric', preset: 0, converted: null, portion: null },
    4,
    ['1 公尺等於 100 公分。', '50 × 100 = 5000 公分。', '5000 ÷ 125 = 40，每人 40 公分。'],
  ],
  [
    'perimeter',
    '城堡圍欄師',
    '只圍外露的邊',
    '替城堡所有外露邊架上圍欄，每段長 3 公分。不要圍內部接縫。',
    '周長數的是邊，不是方格面積；凹入的邊也要計算。',
    { kind: 'perimeter', cells: castleCells, fences: [], side: 3 },
    22,
    [
      '一段一段沿著邊走，凹進去的地方也不要漏掉。',
      '共有 20 段外露邊，現在以金色提示。',
      '20 段 × 3 公分 = 60 公分。把金色邊全部圍好。',
    ],
  ],
  [
    'symmetry',
    '圖形對稱鏡',
    '翻到另一邊，能不能貼合？',
    '選摺線並對折，找出正方形的全部 4 條對稱軸。',
    '每個點的鏡像都吻合原圖，才是對稱軸。',
    { kind: 'symmetry', shape: 'square', tried: [], lastAxis: null },
    6,
    [
      '先試水平和垂直的摺線。',
      '再試兩條對角線，觀察角落是否吻合。',
      '正方形的對稱軸角度為 0°、45°、90°、135°。',
    ],
  ],
  [
    'pictograph',
    '節慶蠟燭天平',
    '一個圖案不只代表一枝',
    '全班 196 枝蠟燭，每圖案代表 7 枝。補齊小雪的圖案，再填小安占總量的最簡分數。',
    '先統一成圖案數或實際枝數，再計算剩餘的量。',
    { kind: 'pictograph', scale: 7, icons: 0, shareN: null, shareD: null },
    8,
    [
      '196 ÷ 7 = 28 個圖案；已知四人合計 23 個。',
      '小雪需要 28 − 23 = 5 個圖案，也就是 35 枝。',
      '小安有 49 枝，49/196 約分後是 1/4。',
    ],
  ],
  [
    'matrix',
    '神殿規律鎖',
    '同一個規則，要通過所有範例',
    '在 (B □ C) □ A 填運算，使前兩組成立，再求第三組的 x。',
    '一個例子成立還不夠，必須用相同位置與順序檢查每一組。',
    { kind: 'matrix', first: null, second: null, unknown: null, probe: [8, 3, 4] },
    5,
    [
      '試試先讓 B 和 C 相乘，再和 A 組合。',
      '3 × 4 + 8 = 20；5 × 5 + 9 = 34。',
      '第三組是 x × 7 + 14 = 35，所以 x = (35 − 14) ÷ 7 = 3。',
    ],
  ],
  [
    'compass',
    '航海羅盤迷宮',
    '一步一步轉向目的地',
    '從圖書館開始：先逆時針 1/8 圈，再順時針 1/4 圈。',
    '八方位每格 45°。轉向的方向、大小與順序都要看清楚。',
    { kind: 'compass', start: 0, turns: [] },
    4,
    [
      '1/8 圈是 1 格，1/4 圈是 2 格。',
      '先逆轉 1 格到郵局，再順轉 2 格。',
      '圖書館 → 郵局 → 市場；合計 −45° + 90° = 45°。',
    ],
  ],
];
export const levels: GameLevel[] = definitions.map(
  ([concept, title, subtitle, goal, principle, initialBoard, stepLimit, hints]) => ({
    id: `imo-${concept}`,
    concept,
    title,
    subtitle,
    goal,
    principle,
    initialBoard,
    stepLimit,
    hints,
    validate: (board) =>
      board.kind === concept
        ? validateBoard(board)
        : result(false, '盤面與關卡不符，請重新開始。', [], false),
  }),
);
export const getLevel = (id: string): GameLevel =>
  levels.find((level) => level.id === id) ?? levels[0];

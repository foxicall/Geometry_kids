import type { ReasoningLevel, ReasoningQuestion, ReasoningStep, ReasoningTopic } from '../types/reasoning';

export const REASONING_TOPICS: ReasoningTopic[] = ['angles', 'height', 'cut', 'similar', 'squares', 'path'];
export const TOPIC_NAMES: Record<ReasoningTopic, string> = { angles: '追角小偵探', height: '同高的祕密', cut: '切一切、補一補', similar: '圖形放大鏡', squares: '正方形拼圖', path: '最短路線' };
export const LEVELS: { id: ReasoningLevel; name: string; description: string; prerequisite: string }[] = [
  { id: 'warmup', name: '圖解暖身', description: '看圖數一數，用加減乘除找線索。', prerequisite: '先會：加減乘除、長方形面積。' },
  { id: 'bridge', name: '搭橋練習', description: '從同高、等腰與放大，連起兩個線索。', prerequisite: '先會：三角形面積、幾倍的意思。' },
  { id: 'challenge', name: '國中挑戰', description: '試試角平分線、相似與勾股的推理。', prerequisite: '先會：前兩級觀念；新的名詞會邊玩邊解釋。' },
];
const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17]] as const;
const step = (title: string, text: string, calculation: string): ReasoningStep => ({ title, text, calculation });

/** 所有數值由原創參數推導；解答、文字與圖形共用同一組已知條件。 */
export function makeReasoningQuestion(topic: ReasoningTopic, level: ReasoningLevel, variant: number): ReasoningQuestion {
  if (!REASONING_TOPICS.includes(topic) || !LEVELS.some((item) => item.id === level) || !Number.isInteger(variant) || variant < 0 || variant > 3) throw new Error('不支援的推理題參數');
  const v = variant, stage = LEVELS.findIndex((item) => item.id === level);
  let content: Omit<ReasoningQuestion, 'id' | 'topic' | 'level' | 'options'>;
  if (topic === 'angles') {
    const left = stage === 1 ? 50 + 5 * v : 35 + 5 * v;
    const right = stage === 0 ? 65 + 5 * v : stage === 1 ? left : 180 - left - (45 + 5 * v);
    const top = 180 - left - right, exterior = 180 - right;
    const answer = stage === 0 ? top : stage === 1 ? left : exterior / 2;
    content = {
      title: stage === 0 ? '三個角，拼成一直線' : stage === 1 ? '一樣長的邊，有什麼線索？' : '轉個彎，再平分這個角',
      prompt: stage === 0 ? '三角形中，頂端的橘色角是幾度？' : stage === 1 ? '兩條斜邊一樣長。左下方的橘色角是幾度？' : '把底邊從 B 向右延長成 BD。橘色線把 ∠CBD 平分成兩份，靠近 BD 的橘色角是幾度？',
      given: stage === 0 ? [`左下角 ${left} 度`, `右下角 ${right} 度`] : stage === 1 ? [`兩條斜邊相等（同樣的刻痕）`, `頂角 ${top} 度`] : [`∠A＝${left} 度`, `∠C＝${top} 度`, '橘色線是外角 ∠CBD 的角平分線'],
      prerequisite: '一個平角就是把手臂張成一直線，大小是 180 度。',
      concept: stage === 2 ? '角平分線把一個角分成一樣大的兩個角。外角可先由一直線的 180 度求出。' : stage === 1 ? '等腰三角形有兩條一樣長的邊；它們對面的兩個底角也一樣大。' : '任意三角形的三個內角合起來都是 180 度。',
      unit: '度', answer, diagram: { kind: 'angles', mode: stage === 0 ? 'sum' : stage === 1 ? 'isosceles' : 'bisector', left, right, top },
      hints: stage === 0 ? ['把三個角想成拼在一起的一條直線。', '先把兩個已知角加起來。', `用 180 減掉 ${left} 與 ${right}，剩下的就是橘色角。`] : stage === 1 ? ['找找兩條有相同刻痕的邊。', '拿掉頂角後，剩下的角度要分給兩個一樣大的底角。', `先算 180 − ${top}，再除以 2。`] : ['先找到 B 點的三角形內角。', '內角加上右邊的外角是一條直線，共 180 度。', '求出整個外角後，因為橘色線平分它，再除以 2。'],
      steps: stage === 0 ? [step('湊成一直線', '三個內角加起來是 180 度。', '三角形內角和＝180°'), step('合併已知的兩個角', '先把已經知道的部分合起來。', `${left}＋${right}＝${left + right}°`), step('找出剩下的角', '從全部扣掉已知的部分。', `180−${left + right}＝${answer}°`)] : stage === 1 ? [step('認出一樣大的角', '相等的斜邊，對著兩個相等的底角。', '左底角＝右底角'), step('先留出兩個底角', '把頂角從 180 度扣掉。', `180−${top}＝${180 - top}°`), step('平均分成兩份', '剩下的角度由兩個底角平分。', `${180 - top}÷2＝${answer}°`)] : [step('先找內角', '三角形的三個角合起來是 180 度。', `∠B＝180−${left}−${top}＝${right}°`), step('走到外面的角', '底邊是一直線，所以內角和外角加起來是 180 度。', `外角＝180−${right}＝${exterior}°`), step('把外角分一半', '角平分線的兩邊一樣大。', `${exterior}÷2＝${answer}°`)],
    };
  } else if (topic === 'height') {
    const left = 4 + v, right = (2 + v) * left, height = 4 + 2 * v;
    const leftArea = left * height / 2, rightArea = right * height / 2;
    const answer = stage === 0 ? leftArea : stage === 1 ? rightArea : right;
    content = {
      title: stage === 0 ? '三角形是一半' : stage === 1 ? '一樣高，底有幾倍？' : '用面積找回藏起來的底',
      prompt: stage === 0 ? '左邊綠色三角形的面積是多少平方公分？' : stage === 1 ? '兩個三角形共用同一個頂點，底在同一直線上。右邊橘色三角形的面積是多少平方公分？' : '兩個三角形一樣高。已知兩邊的面積，右邊的底 DB 長幾公分？',
      given: stage === 0 ? [`左邊的底 AD＝${left} 公分`, `垂直的高＝${height} 公分`] : stage === 1 ? [`左底 AD＝${left} 公分，右底 DB＝${right} 公分`, `左邊面積＝${leftArea} 平方公分`] : [`左底 AD＝${left} 公分`, `左面積＝${leftArea}，右面積＝${rightArea}（平方公分）`],
      prerequisite: '三角形面積＝底 × 垂直的高 ÷ 2。高要和底成直角，不是斜邊。',
      concept: '同高的三角形，底是幾倍，面積就是幾倍。左右移動頂點，只要高度不變，兩邊的面積都不會改變。',
      unit: stage === 2 ? '公分' : '平方公分', answer, diagram: { kind: 'height', mode: stage === 0 ? 'area' : stage === 1 ? 'ratio' : 'inverse', left, right, height },
      hints: stage === 0 ? ['綠色三角形的底是 AD，不是整條 AB。', '找與底垂直的虛線，它才是高。', `先算 ${left}×${height}，再除以 2。`] : stage === 1 ? ['兩塊三角形的高相同，底都在 AB 上。', '先比較右邊的底是左邊的幾倍。', `用 ${right}÷${left} 找倍數，再乘左邊面積。`] : ['高一樣，可以比較兩邊面積的倍數。', '面積放大幾倍，底就放大相同倍數。', `先算 ${rightArea}÷${leftArea}，再乘 ${left}。`],
      steps: stage === 0 ? [step('只看綠色的底', '三角形用的是它自己的底 AD。', `底＝${left} 公分`), step('底乘垂直的高', '先想像補成同底同高的平行四邊形。', `${left}×${height}＝${left * height}`), step('三角形拿一半', '它是那個平行四邊形的一半。', `${left * height}÷2＝${answer} 平方公分`)] : stage === 1 ? [step('確認高相同', '共同頂點到同一條底線的距離一樣。', '左高＝右高'), step('比較底的倍數', '把右底分成和左底一樣長的小段。', `${right}÷${left}＝${right / left} 倍`), step('面積也乘相同倍數', '同高時，只增加底，就按相同倍數增加面積。', `${leftArea}×${right / left}＝${answer} 平方公分`)] : [step('先比較兩塊面積', '右邊可以裝下幾份左邊的面積？', `${rightArea}÷${leftArea}＝${right / left} 倍`), step('換成底的倍數', '因為高相同，右邊的底也是相同倍數。', `右底＝左底的 ${right / left} 倍`), step('找回右邊的底', '把左底按倍數加長。', `${left}×${right / left}＝${answer} 公分`)],
    };
  } else if (topic === 'cut') {
    const width = 12 + 4 * v, height = 8 + 2 * v, cutWidth = 4 + 2 * v, cutHeight = height / 2;
    const trapezoidTop = width - cutWidth, triangleArea = cutWidth * height / 2;
    const answer = stage === 0 ? width * height - cutWidth * cutHeight / 2 : stage === 1 ? width * height - cutWidth * cutHeight : (trapezoidTop + width) * height / 2;
    content = {
      title: stage === 0 ? '剪掉一個角，還剩多少？' : stage === 1 ? '把缺角補回去' : '從小三角形找出梯形的高',
      prompt: stage === 0 ? '從長方形剪掉右上角的白色三角形，剩下綠色部分的面積是多少？' : stage === 1 ? '長方形的右上角缺了一塊小長方形，綠色 L 形的面積是多少？' : '梯形的上下底平行，左邊垂直於底。右邊橘色三角形面積已知，整個梯形的面積是多少？',
      given: stage === 2 ? [`上底＝${trapezoidTop}，下底＝${width}（公分）`, `橘色三角形面積＝${triangleArea} 平方公分`] : [`完整長方形：寬 ${width}、高 ${height} 公分`, `剪掉部分：橫向 ${cutWidth}、垂直 ${cutHeight} 公分`],
      prerequisite: '長方形面積＝長 × 寬；三角形面積＝底 × 高 ÷ 2。',
      concept: stage === 2 ? '梯形可切成長方形和三角形。先由三角形面積倒推共同的高，再把兩塊面積加起來。' : '複雜圖形可以先補成完整長方形，再減去沒有的那一塊。',
      unit: '平方公分', answer, diagram: { kind: 'cut', mode: stage === 0 ? 'corner' : stage === 1 ? 'notch' : 'trapezoid', width, height, cutWidth, cutHeight },
      hints: stage === 2 ? ['畫出虛線，把梯形切成左長方形和右三角形。', `右三角形的底是 ${width}−${trapezoidTop}，和整個梯形同高。`, '三角形面積先乘 2，再除以它的底，就得到高。'] : ['先把白色缺口想像補回去。', stage === 0 ? '缺掉的是三角形，面積要記得除以 2。' : '缺掉的是小長方形，可以直接長乘寬。', '完整的面積減掉缺口面積，就是綠色部分。'],
      steps: stage === 2 ? [step('找到右三角形的底', '下底比上底多的長度，剛好是右三角形的底。', `${width}−${trapezoidTop}＝${cutWidth} 公分`), step('把高找回來', '面積乘 2 會變成底乘高，再除以底。', `${triangleArea}×2÷${cutWidth}＝${height} 公分`), step('把兩塊加起來', '左長方形加上右三角形，就是整個梯形。', `${trapezoidTop}×${height}＋${triangleArea}＝${answer} 平方公分`)] : [step('先算完整的', '把缺角補回長方形。', `${width}×${height}＝${width * height} 平方公分`), step('算出白色缺口', stage === 0 ? '三角形是同底同高長方形的一半。' : '小缺口也是長方形。', stage === 0 ? `${cutWidth}×${cutHeight}÷2＝${cutWidth * cutHeight / 2}` : `${cutWidth}×${cutHeight}＝${cutWidth * cutHeight}`), step('扣掉缺口', '綠色才是題目問的部分。', `${width * height}−${width * height - answer}＝${answer} 平方公分`)],
    };
  } else if (topic === 'similar') {
    const side = 3 + v, area = side * (4 + 2 * v) / 2, scale = v % 2 + 2, largeArea = area * scale * scale;
    const answer = stage === 1 ? largeArea : side * scale;
    content = {
      title: stage === 0 ? '同一張圖，放大了' : stage === 1 ? '邊放大，面積怎麼變？' : '從面積猜放大幾倍',
      prompt: stage === 1 ? '兩個三角形形狀相同，每條邊都按同一倍數放大。大三角形的面積是多少？' : stage === 2 ? '兩個三角形相似，也就是形狀相同、大小不同。由面積的變化，找出大三角形底邊長幾公分。' : '把小三角形的每條邊都放大相同倍數。大三角形的底邊長幾公分？',
      given: stage === 0 ? [`小三角形底邊＝${side} 公分`, `每條邊放大 ${scale} 倍`] : stage === 1 ? [`小三角形面積＝${area} 平方公分`, `每條邊放大 ${scale} 倍`] : [`小三角形底邊＝${side} 公分`, `小面積＝${area}，大面積＝${largeArea}（平方公分）`],
      prerequisite: '「相似」就是形狀相同：所有對應的邊都按同一倍數放大，角度不變。',
      concept: '邊放大 k 倍時，底和高都放大 k 倍，所以面積會變成 k × k 倍。不能只把面積乘 k。',
      unit: stage === 1 ? '平方公分' : '公分', answer, diagram: { kind: 'similar', mode: stage === 0 ? 'length' : stage === 1 ? 'area' : 'inverse', side, area, scale },
      hints: stage === 0 ? ['底邊也要和其他邊一起放大。', '放大幾倍，就準備幾份一樣長的底邊。', `把 ${side} 乘以 ${scale}。`] : stage === 1 ? ['底和高都變長了，不只有底變長。', `底乘 ${scale}，高也乘 ${scale}。`, `面積要乘 ${scale}×${scale}。`] : ['先求大面積是小面積的幾倍。', '想想哪個整數乘自己，會等於這個面積倍數。', '找到邊長倍數後，再乘小三角形的底。'],
      steps: stage === 0 ? [step('找對應的邊', '兩個三角形的底邊互相對應。', `小底＝${side} 公分`), step('數一數幾份', '放大幾倍，就有幾份原本的長度。', `放大 ${scale} 倍`), step('算出新長度', '底邊和其他邊用相同倍數。', `${side}×${scale}＝${answer} 公分`)] : stage === 1 ? [step('底和高一起變長', '形狀不變時，兩個方向都跟著放大。', `底 ×${scale}，高 ×${scale}`), step('合併兩個方向的變化', '底乘高，所以兩個倍數也要相乘。', `${scale}×${scale}＝${scale * scale} 倍`), step('把面積放大', '三角形面積公式裡的除以 2 不變。', `${area}×${scale * scale}＝${answer} 平方公分`)] : [step('先看面積的倍數', '用大面積除以小面積。', `${largeArea}÷${area}＝${scale * scale}`), step('找相同的兩個乘數', '底和高放大相同倍數，試試 2×2、3×3。', `${scale}×${scale}＝${scale * scale}，所以邊長放大 ${scale} 倍`), step('算大三角形的底', '現在才用邊長倍數。', `${side}×${scale}＝${answer} 公分`)],
    };
  } else if (topic === 'squares') {
    const [a, b, c] = triples[v], answer = stage === 0 ? c * c : stage === 1 ? c : b;
    content = {
      title: stage === 0 ? '兩個小正方形，合成大面積' : stage === 1 ? '用正方形找斜邊' : '少了一條邊，也能找回來',
      prompt: stage === 0 ? '直角三角形的三條邊外面，各畫一個正方形。橘色大正方形的面積是多少？' : stage === 1 ? '這是有一個直角的三角形。對著直角的最長邊，叫作斜邊，它長幾公分？' : '直角三角形的斜邊與一條直角邊已知。另一條直角邊長幾公分？',
      given: stage === 0 ? [`兩個小正方形面積：${a * a} 與 ${b * b} 平方公分`, '小方框標示的是直角（90 度）'] : stage === 1 ? [`兩條直角邊長 ${a} 與 ${b} 公分`, '小方框標示的是直角'] : [`斜邊 ${c} 公分`, `一條直角邊 ${a} 公分`],
      prerequisite: '正方形面積＝邊長 × 邊長。3×3 就是 9；「平方」是把同一個數乘自己。',
      concept: '勾股定理只適用於直角三角形：兩條直角邊上的正方形面積，加起來等於斜邊上的正方形面積。',
      unit: stage === 0 ? '平方公分' : '公分', answer, diagram: { kind: 'squares', mode: stage === 0 ? 'area' : stage === 1 ? 'hypotenuse' : 'leg', a, b, c },
      hints: stage === 0 ? ['先找到直角旁的兩個小正方形。', '大正方形面積，是兩個小正方形面積的總和。', `把 ${a * a} 和 ${b * b} 加起來。`] : stage === 1 ? ['把兩條短邊各自乘自己，先變成面積。', '兩個小正方形面積相加，是斜邊正方形的面積。', '想想哪個整數乘自己，會得到這個面積；不用直接把兩條邊相加。'] : ['先把斜邊長乘自己，得到大正方形面積。', '大面積減去已知的小面積，就得到另一個小正方形。', '找一個整數，乘自己後會得到剩下的面積。'],
      steps: stage === 0 ? [step('先確認有直角', '小方框代表兩條邊像牆角一樣垂直。', '這是直角三角形'), step('面積可以相加', '斜邊上的正方形，面積等於另外兩個的總和。', `${a * a}＋${b * b}`), step('求出大面積', '這裡問的是面積，不是邊長。', `${a * a}＋${b * b}＝${answer} 平方公分`)] : stage === 1 ? [step('把邊長變成面積', '各自乘自己，不是乘 2。', `${a}×${a}＝${a * a}；${b}×${b}＝${b * b}`), step('合成大正方形面積', '只有直角三角形可以用這個關係。', `${a * a}＋${b * b}＝${c * c}`), step('從面積找回邊長', '找一個整數乘自己，剛好得到這個面積。', `${c}×${c}＝${c * c}，所以斜邊是 ${answer} 公分`)] : [step('把已知邊長變成面積', '斜邊對應的正方形最大。', `${c}×${c}＝${c * c}；${a}×${a}＝${a * a}`), step('大面積減去小面積', '剩下的就是未知邊上的正方形面積。', `${c * c}−${a * a}＝${b * b}`), step('從面積找回邊長', '試試哪個數乘自己會得到這個面積。', `${b}×${b}＝${b * b}，所以未知邊是 ${answer} 公分`)],
    };
  } else {
    const [width, height, diagonal] = triples[v], split = Math.floor(height / 2), answer = stage === 0 ? width + height : diagonal;
    content = {
      title: stage === 0 ? '沿著轉彎的小路走' : stage === 1 ? '草地上，哪條路最短？' : '把地面和牆面攤平',
      prompt: stage === 0 ? '從 A 出發，沿著橘色路線先向右、再向上到 B，一共走幾公分？' : stage === 1 ? '長方形草地沒有障礙，可以走任何路線。從 A 到對角 B，最短距離是幾公分？' : '小蟲從地面 A 爬到牆上 B，只能沿圖中的地面和這一面牆爬，不能離開表面。把兩個面沿接縫攤平後，最短路程是幾公分？',
      given: stage === 2 ? [`兩個面共同的寬＝${width} 公分`, `地面深 ${split} 公分，牆面高 ${height - split} 公分`, '圖是這兩個相鄰長方形面的展開圖'] : [`長方形寬 ${width}、高 ${height} 公分`, stage === 0 ? '只能沿橘色 L 形道路走' : '可以沿直線走，不必繞邊'],
      prerequisite: stage === 0 ? '分段的路線，把每一段長度加起來。' : '先試過「正方形拼圖」：直角邊的平方相加，等於斜邊的平方。',
      concept: stage === 2 ? '攤平相鄰的面不會拉長或縮短表面上的路線。攤平後，兩點之間的直線最短。' : stage === 1 ? '同一個平面上，兩點之間的直線最短；長方形的對角線可用勾股關係求出。' : '沿道路走和可以穿過草地走，是不同的條件；先讀清楚限制。',
      unit: '公分', answer, diagram: { kind: 'path', mode: stage === 0 ? 'road' : stage === 1 ? 'diagonal' : 'unfold', width, height, split, diagonal },
      hints: stage === 0 ? ['橘色路線有一段橫向和一段縱向。', '沿邊的路線要把兩段都算進去。', `把 ${width} 和 ${height} 加起來。`] : stage === 1 ? ['畫出 A 到 B 的直線。', '對角線和兩條邊，組成直角三角形。', '把寬和高各自乘自己，再相加，最後找出對應的邊長。'] : ['兩個面已沿虛線展開，接縫不是障礙。', `展開圖的總高是 ${split}＋${height - split}。`, '畫 A 到 B 的直線，再用寬和總高的平方求這條斜邊。'],
      steps: stage === 0 ? [step('找出第一段', '從 A 向右走完整個寬。', `${width} 公分`), step('再走第二段', '從右下角向上到 B。', `${height} 公分`), step('把兩段相加', '題目限制沿橘色路線走。', `${width}＋${height}＝${answer} 公分`)] : [step(stage === 2 ? '先合併兩個面的高度' : '畫出最短的直線', stage === 2 ? '攤平後，地面深度加牆面高度形成長方形的總高。' : 'A 到 B 的直線，就是長方形的對角線。', stage === 2 ? `${split}＋${height - split}＝${height} 公分` : `兩條直角邊：${width}、${height}`), step('先求斜邊正方形的面積', '寬和高互相垂直，所以可用勾股關係。', `${width}×${width}＋${height}×${height}＝${diagonal * diagonal}`), step('找回路程的長度', '找哪個整數乘自己，會得到剛才的面積。', `${diagonal}×${diagonal}＝${diagonal * diagonal}，最短路程 ${answer} 公分`)],
    };
  }
  // 選項為正整數且互不重複；位置輪替，不固定把正解放在第一格。
  const values = new Set<number>([content.answer]);
  for (const candidate of [content.answer + 2 + v, Math.max(1, content.answer - 3 - v), content.answer * 2, content.answer + 1, content.answer + 7]) { if (values.size === 4) break; values.add(candidate); }
  const options = [...values], offset = (REASONING_TOPICS.indexOf(topic) + stage + v) % 4;
  return { ...content, id: `${topic}-${level}-${v}`, topic, level, options: [...options.slice(offset), ...options.slice(0, offset)] };
}

export const reasoningBank = LEVELS.flatMap(({ id }) => REASONING_TOPICS.flatMap((topic) => Array.from({ length: 4 }, (_, v) => makeReasoningQuestion(topic, id, v))));
export function makeReasoningRound(level: ReasoningLevel, random = Math.random): ReasoningQuestion[] {
  // 保留概念順序，先做正方形面積，再應用到最短路線；每次換一組參數。
  return REASONING_TOPICS.map((topic) => makeReasoningQuestion(topic, level, Math.min(3, Math.max(0, Math.floor(random() * 4)))));
}

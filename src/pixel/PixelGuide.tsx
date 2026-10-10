import type { ReactNode } from 'react';
import { Avatar } from '../components/Avatar';
import { PixelNomad } from '../components/PixelNomad';
import { CLOTH, HAIR_COLOURS, PRESETS, SIZE, SKIN_TONES, compose, runs, type Avatar as AvatarData, type Pixels } from '../lib/avatar';
import { SCENES, SCENE_H, SCENE_W } from './scenes';
import './PixelGuide.css';

// The pixel style guide (dev only, /pixel/): the rules behind the avatar and the header mascot, with every picture
// drawn by the real avatar code, plus the city scenes that extend the style. Chinese only, like the design page.

const preset = (id: string): AvatarData => PRESETS.find((p) => p.id === id)!.avatar;
const shade = (hex: string, by = 0.18) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * (1 - by)).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

const NAV = [
  ['concept', '概念'], ['principles', '七條原則'], ['grid', '網格與比例'], ['palette', '調色盤'], ['figure', '人物構造'],
  ['crop', '裁切'], ['motion', '動態'], ['scale', '縮放與輸出'], ['scenes', '城市場景'], ['brand', '品牌與行銷'],
  ['dodont', '該做與不該做'], ['make', '製作流程'],
] as const;

// Any pixel grid as crisp SVG rects.
function Px({ pixels, className, viewBox }: { pixels: Pixels; className?: string; viewBox?: string }) {
  const w = pixels[0].length;
  return (
    <svg className={className} viewBox={viewBox ?? `0 0 ${w} ${pixels.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {runs(pixels).map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}

// Two frames swapped with a hard cut on the given beat.
function TwoFrame({ a, b, beat, className }: { a: Pixels; b: Pixels; beat: 'bob' | 'pet' | 'blink' | 'scene'; className?: string }) {
  return (
    <div className={`pg-anim pg-beat-${beat}${className ? ` ${className}` : ''}`}>
      <div className="pg-f1"><Px pixels={a} /></div>
      <div className="pg-f2"><Px pixels={b} /></div>
    </div>
  );
}

function Scene({ id, name, draw }: { id: string; name: string; draw: (low: boolean) => Pixels }) {
  return (
    <figure className="pg-scene" id={`scene-${id}`}>
      <TwoFrame a={draw(false)} b={draw(true)} beat="scene" />
      <figcaption>
        <b>{name}</b>
        <span>{SCENE_W}×{SCENE_H} · 21:9 · 角色 1:1</span>
      </figcaption>
    </figure>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="pg-section">
      <div className="pg-eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="pg-tile">
      {children}
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function Swatch({ colour, label, pair, tag }: { colour: string; label: string; pair?: string; tag?: string }) {
  return (
    <div className="pg-sw">
      <span style={{ background: colour }} />
      {pair && <span className="pair" style={{ background: pair }} />}
      <code>{label}</code>
      {tag && <em>{tag}</em>}
    </div>
  );
}

export function PixelGuide() {
  const plain: AvatarData = { ...preset('cafe'), neck: 'none', handL: 'none', handR: 'none' };
  const dressed: AvatarData = { ...plain, head: 'bucket', headColour: 4, eyes: 'sunglasses', neck: 'scarf', neckColour: 0 };
  const carrying: AvatarData = { ...dressed, back: 'backpack', backColour: 7, handR: 'bubbletea' };
  const beside: AvatarData = { ...carrying, sideL: 'cat', sideR: 'suitcase', sideRColour: 0 };
  const clothNames = ['red', 'yellow', 'teal', 'forest', 'olive', 'sky', 'denim', 'navy', 'lavender', 'plum', 'khaki', 'sand', 'cream', 'grey', 'charcoal', 'black'];
  const gridLines = Array.from({ length: SIZE + 1 }, (_, i) => i);

  return (
    <div className="pg">
      <nav className="pg-toc" aria-label="目錄">
        <span className="pg-toc-label">Pixel Guide</span>
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`}>{label}</a>
        ))}
        <a className="pg-toc-other" href="../design/">設計系統 →</a>
      </nav>

      <main>
        <header className="pg-hero">
          <div>
            <div className="pg-eyebrow">今天不在家工作 · Not WFH</div>
            <h1>Nomad Pixel<br />像素風格指南</h1>
            <p className="pg-lede">正面、平塗、整數倍放大、兩格動畫。這套規則從紙娃娃角色長出來，但適用於任何像素圖：場景、圖示、行銷素材。所有圖都由 <code>lib/avatar.ts</code> 即時畫出。</p>
          </div>
          <div className="pg-hero-art">
            <Avatar avatar={preset('gapyear')} animate className="pg-hero-fig" />
            <PixelNomad />
          </div>
        </header>
        <div className="pg-facts">
          <div><b>32×32</b><span>角色畫布</span></div>
          <div><b>16×24</b><span>人物本體</span></div>
          <div><b>2 格</b><span>每段動畫的格數</span></div>
          <div><b>整數倍</b><span>唯一允許的放大方式</span></div>
        </div>

        <Section id="concept" eyebrow="Concept" title="概念">
          <p>Nomad Pixel 是一套「看起來像早期掌機遊戲，但用在生活工具上」的像素語言。它要讓人覺得輕鬆、友善、有旅行感，不是懷舊或復古炫技。</p>
          <p>畫面上的每個角色都正面看著你，站在同一條地面上，身上帶著自己的東西：咖啡、背包、衝浪板、一隻貓。像素少，所以每一格都要有理由。</p>
          <h3>個性關鍵字</h3>
          <p><b>溫暖</b>：暖色皮膚、沙地、太陽黃。<b>直接</b>：正面、對稱、不做透視。<b>輕盈</b>：沒有描邊、沒有漸層。<b>有點好笑</b>：允許綠色皮膚、兔耳、天使翅膀，但不惡搞。</p>
          <h3>兩個角色層級</h3>
          <p>頁首的棕櫚樹小人（16×15，含場景）是<b>品牌標誌</b>，固定不變。紙娃娃（32×32）是<b>使用者的分身</b>，自由組合。兩者共用這份規則，但不互相取代。</p>
        </Section>

        <Section id="principles" eyebrow="Principles" title="七條原則">
          <div className="pg-principles">
            {[
              ['一個字元就是一格像素', '圖是用一排排字元寫成的資料，不是 SVG 路徑或點陣檔。改圖就是改字元，形狀和顏色分開存。'],
              ['只用整數倍放大', '1、2、3、4、5、6 倍。2.5 倍、自動縮放、瀏覽器平滑都不行，邊緣會糊。'],
              ['平塗加一階陰影', '每個顏色最多搭一個暗 18% 的陰影色。沒有漸層、沒有抗鋸齒、沒有描邊。'],
              ['剪影優先', '小尺寸下只看得出輪廓和色塊。先確認剪影認得出來（帽子、背包、尾巴），再加細節。'],
              ['正面、對稱，畫一半', '人物和多數物件左右對稱，只畫左半邊，程式鏡像。不對稱的東西（吉他、馬尾）才畫完整一排。'],
              ['大家站在同一條地面', '角色、寵物、行李箱、建築都對齊同一條地面線。物件之間的大小比例保持真實。'],
              ['動得少，動得像遊戲', '兩格硬切換，不做補間。每個東西有自己的節奏，彼此錯開。減少動態時停在第一格。'],
            ].map(([h, p]) => (
              <div key={h}>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="grid" eyebrow="Grid" title="網格與比例">
          <div className="pg-grid-demo">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} shapeRendering="crispEdges" aria-hidden="true">
              {runs(compose(preset('surfer'))).map((r) => (
                <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
              ))}
              <g className="pg-gridlines">
                {gridLines.map((i) => (
                  <g key={i}>
                    <line x1={i} y1={0} x2={i} y2={SIZE} />
                    <line x1={0} y1={i} x2={SIZE} y2={i} />
                  </g>
                ))}
              </g>
              <rect className="pg-figbox" x={8} y={4} width={16} height={24} />
              <line className="pg-floor" x1={0} y1={28} x2={SIZE} y2={28} />
            </svg>
            <div>
              <p>角色畫布 32×32。人物本體 16×24 放正中間：左右各留 8 格給身旁物件，上下各 4 格給帽子、兔耳和地面。</p>
              <div className="pg-legend">
                <span><i />人物本體 16×24（畫布第 8–23 欄、第 4–27 列）</span>
                <span><i className="f" />地面線：鞋底與身旁物件都站在這條線上</span>
              </div>
              <table>
                <tbody>
                  <tr><th>部位</th><th>位置（人物座標）</th></tr>
                  <tr><td>頭</td><td>第 3–9 列，寬 8 格；眼睛在第 6 列</td></tr>
                  <tr><td>嘴</td><td>第 8 列，2 格寬</td></tr>
                  <tr><td>肩膀</td><td>第 11 列</td></tr>
                  <tr><td>手與腰</td><td>第 17 列，手在第 2–3 欄（鏡像到 12–13）</td></tr>
                  <tr><td>腳踝</td><td>第 22 列，以下是鞋子</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <h3>比例：約三頭身</h3>
          <p>頭佔身高三分之一左右，眼睛只有 1 格。這個比例讓臉在 32px 頭像裡還認得出來，也讓衣服和道具有空間。物件跟人的比例以「看得懂」為準：行李箱到腰、衝浪板比人高、貓狗到膝蓋。</p>
          <h3>其他用途的畫布</h3>
          <table>
            <tbody>
              <tr><th>用途</th><th>畫布</th><th>說明</th></tr>
              <tr><td>小圖示</td><td className="num">12 或 16</td><td>只畫一個物件或臉部特寫</td></tr>
              <tr><td>品牌標誌</td><td className="num">16×15</td><td>棕櫚樹下的小人，含場景</td></tr>
              <tr><td>角色</td><td className="num">32×32</td><td>人物 16×24 置中</td></tr>
              <tr><td>城市場景</td><td className="num">224×96</td><td>21:9；角色以 1:1 站進去</td></tr>
              <tr><td>社群直式</td><td className="num">90×160</td><td>9:16，放大 6 倍得到 540×960</td></tr>
              <tr><td>連結預覽</td><td className="num">200×105</td><td>放大 6 倍得到 1200×630</td></tr>
            </tbody>
          </table>
        </Section>

        <Section id="palette" eyebrow="Palette" title="調色盤">
          <p>每個顏色都有一個陰影色，等於原色亮度降 18%。畫的時候只寫代號，組合時才換成顏色，所以同一個形狀可以換任何色。</p>
          <h3>膚色（{SKIN_TONES.length}）</h3>
          <p className="pg-muted">前六種是真實膚色，隨機產生時只用這六種；後四種是要自己選的趣味色。</p>
          <div className="pg-swatches">{SKIN_TONES.map((c, i) => <Swatch key={c[0]} colour={c[0]} pair={c[1]} label={c[0]} tag={i >= 6 ? '趣味' : undefined} />)}</div>
          <h3>髮色（{HAIR_COLOURS.length}）</h3>
          <div className="pg-swatches">{HAIR_COLOURS.map((c) => <Swatch key={c[0]} colour={c[0]} pair={c[1]} label={c[0]} />)}</div>
          <h3>布料色（{CLOTH.length}）</h3>
          <p className="pg-muted">衣服、帽子、背包、鞋子、行李箱共用這一組。右邊的窄條是陰影色。</p>
          <div className="pg-swatches">{CLOTH.map((c, i) => <Swatch key={c} colour={c} pair={shade(c)} label={clothNames[i]} />)}</div>
          <h3>世界色</h3>
          <p className="pg-muted">固定用途的顏色。場景延伸時優先從這裡和布料色挑，不另外發明相近的色。</p>
          <div className="pg-swatches">
            {[['#222222', '眼睛、細線'], ['#b5524a', '嘴巴'], ['#ffffff', '白'], ['#333333', '器材、背帶'], ['#3f9b62', '葉子'], ['#8a5a3a', '樹幹'], ['#f5b83d', '太陽'], ['#ead9b0', '沙地'], ['#7fc4e8', '螢幕、天空'], ['#ff5a5f', '品牌紅']].map(([c, l]) => (
              <Swatch key={c} colour={c} label={l} />
            ))}
          </div>
          <h3>用色規則</h3>
          <ul>
            <li>一個物件最多 3–4 個顏色（含陰影）。</li>
            <li>最深的顏色是 <code>#222222</code>，只給眼睛和細線，不用純黑。</li>
            <li>陰影放在物件的外側邊緣或下緣，光固定從上方來。</li>
            <li>相鄰物件不要用同一個顏色，會糊成一塊（例如紅帽配紅背包）。</li>
          </ul>
        </Section>

        <Section id="figure" eyebrow="Figure" title="人物構造">
          <p>角色由圖層疊起來，上面的蓋住下面的。每一格配件位置互相獨立，可以同時放。</p>
          <div className="pg-tiles">
            {[['人物本體', plain], ['＋配件', dressed], ['＋隨身物', carrying], ['＋身旁', beside]].map(([l, a]) => (
              <Tile key={l as string} label={l as string}><Avatar avatar={a as AvatarData} /></Tile>
            ))}
          </div>
          <h3>圖層順序（由下往上）</h3>
          <ol className="pg-layers">
            {['背上的東西（包身、吉他、披風）', '後髮（長髮、馬尾）', '身體與臉', '下身、鞋子', '上衣', '背帶與綁帶', '前髮（戴帽時藏起頭頂）', '臉下半（鬍子、口罩）', '頭上（帽子、髮箍）', '眼部（眼鏡、眼罩）', '頸部（耳機畫在帽子上面）', '手上的東西', '身旁物件（左右各一）'].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h3>寫法</h3>
          <p>每排字元的長度決定怎麼放：8 個字元是人物左半邊（鏡像），16 個是整個人物寬，32 個是整張畫布。<code>.</code> 是透明，大寫字母是顏色、小寫是它的陰影，<code>X</code>／<code>x</code> 是「這個配件自己的顏色」。</p>
          <pre className="pg-rows">{`bunny: at(-3, [
  '....XX..',   ← 耳朵外圈（配件色）
  '....iX..',   ← i：粉紅內耳
  '....iX..',
  '....iX..',
  '....XX..',
  '...XXXXX',   ← 髮箍
])`}</pre>
          <h3>背面</h3>
          <p className="pg-muted">同一個角色轉過去：同樣的輪廓，沒有臉；頭髮蓋住後腦勺，背包、吉他、披風換到身體前面，左右身旁物件互換。眼鏡、鬍子、手上的東西從背面看不到。</p>
          <div className="pg-tiles small">
            {['engineer', 'backpacker', 'gapyear', 'creator', 'designer'].map((id) => (
              <Tile key={id} label={`${id} · back`}><Avatar avatar={preset(id)} view="back" /></Tile>
            ))}
          </div>
          <h3>預設角色</h3>
          <p className="pg-muted">十種數位遊牧類型，用來示範各種組合，也是行銷素材的固定班底。</p>
          <div className="pg-tiles small">
            {PRESETS.map((p) => (
              <Tile key={p.id} label={p.id}><Avatar avatar={p.avatar} /></Tile>
            ))}
          </div>
        </Section>

        <Section id="crop" eyebrow="Crop" title="裁切">
          <p>不重畫小圖，而是從 32×32 裁一塊正方形出來，再整數倍放大。裁切範圍固定幾種，不同地方的同一個角色才會一致。</p>
          <div className="pg-tiles">
            {([['全身 32', [0, 0, 32]], ['頭部 16', [8, 2, 16]], ['半身像 16（工具列）', [8, 4, 16]], ['臉 12', [10, 4, 12]]] as const).map(([l, c]) => (
              <Tile key={l} label={l}><Avatar avatar={preset('cafe')} crop={c} /></Tile>
            ))}
          </div>
          <p className="pg-muted">半身像（頭頂到胸口）用在圓形頭像，圓的下緣切掉肩膀，頭大約佔圓的一半。</p>
        </Section>

        <Section id="motion" eyebrow="Motion" title="動態">
          <p>動畫一律兩格輪流、硬切換（CSS <code>steps(1)</code>），像遊戲 sprite，不做平滑補間。每個東西各有節奏，彼此錯開，畫面才不會整齊地一起抖。</p>
          <div className="pg-motion">
            <figure>
              <TwoFrame a={compose(preset('backpacker'), { only: 'figure' })} b={compose(preset('backpacker'), { only: 'figure', dip: true })} beat="bob" />
              <figcaption><b>待機呼吸 · 0.9 秒</b>身體下沉 1 格再回來，腳和身旁物件不動。</figcaption>
            </figure>
            <figure>
              <TwoFrame a={compose(preset('silver'))} b={compose(preset('silver'), { blink: true })} beat="blink" />
              <figcaption><b>眨眼 · 4.2 秒</b>閉眼只佔最後 5%，平常幾乎看不到。</figcaption>
            </figure>
            <figure>
              <TwoFrame a={compose(preset('gapyear'), { only: 'beside' })} b={compose(preset('gapyear'), { only: 'beside', wag: true })} beat="pet" />
              <figcaption><b>寵物 · 0.6 秒</b>貓甩尾、狗豎耳吐舌、兔子抖耳朵。</figcaption>
            </figure>
          </div>
          <h3>新動畫的規則</h3>
          <ul>
            <li>每次只動最少的像素：1 格位移、2–4 格形狀變化。</li>
            <li>節奏從 0.6、0.9、1.2 秒裡挑，同一畫面不要兩個東西同節奏。</li>
            <li>站在地上的東西不離地；要跳就整個物件一起移，影子不畫。</li>
            <li>只有主角級的大圖會動；縮圖、頭像、清單裡的小圖保持靜止。</li>
            <li>減少動態設定開啟時，全部停在第一格。</li>
          </ul>
        </Section>

        <Section id="scale" eyebrow="Scale" title="縮放與輸出">
          <div className="pg-scales">
            {[1, 2, 3, 4].map((k) => (
              <figure key={k} className="pg-scale">
                <div className="pg-sbox"><Avatar avatar={preset('designer')} className="fixed" /><style>{`.pg-scale:nth-child(${k}) .avatar.fixed{width:${32 * k}px;height:${32 * k}px}`}</style></div>
                <figcaption>{k}× · {32 * k}px</figcaption>
              </figure>
            ))}
            <figure className="pg-scale bad">
              <div className="pg-sbox"><Avatar avatar={preset('designer')} className="smooth" /></div>
              <figcaption>2.5× · 邊緣糊掉</figcaption>
            </figure>
          </div>
          <p>放大倍數必須是整數，每格像素才一樣大、邊緣銳利。外框尺寸不剛好時，用內距補齊，不要硬拉。例如設定頁大圖外框 192px，加 16px 內距後裡面是 160px，剛好 5 倍。</p>
          <h3>輸出規則</h3>
          <ul>
            <li>網頁：SVG，每排同色像素合成一個 <code>rect</code>，加 <code>shape-rendering="crispEdges"</code>。</li>
            <li>圖片：canvas 逐格 <code>fillRect</code>，再乘上整數倍；不要縮放已經畫好的圖。</li>
            <li>交給設計工具或印刷：匯出 1 倍原圖加最終尺寸的整數倍版本，關閉所有平滑與重新取樣。</li>
            <li>背景用平塗色（產品裡是 <code>#f7f7f7</code> 或白），不放照片或漸層在像素圖後面。</li>
          </ul>
        </Section>

        <Section id="scenes" eyebrow="Scenes" title="城市場景">
          <p>場景跟角色用<b>同一個像素大小</b>：角色以 1:1 站進場景，不是放大貼上去。畫布 224×96（21:9），放大 4 倍是 896×384。場景也走兩格動畫：海浪、渡輪、霓虹、花瓣跟人物同拍。</p>
          {SCENES.map((s) => (
            <Scene key={s.id} {...s} />
          ))}
          <h3>場景分層</h3>
          <table>
            <tbody>
              <tr><th>層</th><th>做法</th></tr>
              <tr><td>天空</td><td>5–6 條平塗色帶，越接近地平線越淺（黃昏則越暖）；不用漸層</td></tr>
              <tr><td>遠景</td><td>天際線一個顏色加右側陰影，窗戶只有一格淡點或沒有</td></tr>
              <tr><td>地標</td><td>只畫最好認的剪影，最多 3–4 個顏色；放在三分線上</td></tr>
              <tr><td>中景</td><td>建築用布料色或世界色，右側兩格陰影，窗戶 2×1、間距固定</td></tr>
              <tr><td>地面</td><td>人行道加一條地面線，所有人物和物件站在線上</td></tr>
              <tr><td>角色與物件</td><td>照角色規則，不縮放；每個場景 2–3 個人</td></tr>
              <tr><td>點綴</td><td>每個城市 2–3 樣在地的小東西：雪梨的朱鷺和渡輪、東京的販賣機和櫻花</td></tr>
            </tbody>
          </table>
          <h3>場景動態</h3>
          <ul>
            <li>跟人物同一個 0.9 秒節拍：第二格裡海浪位移、渡輪前進 1 格、鳥翅膀上下、花瓣下落 1–2 格、霓虹輪流亮。</li>
            <li>一個場景最多 4–5 個會動的東西，其餘靜止。</li>
            <li>夜景：天空換成 navy、plum 色帶，窗戶亮 <code>#ffd98a</code>，少數窗戶在兩格間閃爍。</li>
          </ul>
        </Section>

        <Section id="brand" eyebrow="Brand" title="品牌與行銷">
          <p>像素圖負責「人」和「地方」，文字負責資訊。兩者並排時，像素圖保持整數倍，文字照品牌字體走。</p>
          <h3>字體搭配</h3>
          <ul>
            <li>中文介面字是 975HazyGo，只用 400 與 600 兩種字重。</li>
            <li>Pixelify Sans 只用在英文副標或海報大標，不用在內文、按鈕或中文。</li>
            <li>不要把字畫成像素字塞進插圖；需要文字就用真的字體疊上去。</li>
          </ul>
          <h3>適合的素材</h3>
          <table>
            <tbody>
              <tr><th>素材</th><th>建議</th></tr>
              <tr><td>社群貼文</td><td>一個預設角色加城市場景，放大 4–6 倍，下方留文字區</td></tr>
              <tr><td>貼圖、表情</td><td>單一角色或配件，32×32，透明背景，放大 8 倍</td></tr>
              <tr><td>連結預覽圖</td><td>品牌標誌或場景裁切，1200×630</td></tr>
              <tr><td>周邊印刷</td><td>每格像素印出來至少 1mm，交付 1 倍原圖加印刷尺寸</td></tr>
              <tr><td>介紹頁插圖</td><td>十個預設角色排成一排站在地面線上，或一張城市場景</td></tr>
            </tbody>
          </table>
          <h3>留白</h3>
          <p>像素圖四周至少留「放大後的 2 格」空白。像素圖不加圓角卡片、陰影或描邊外框；需要底就用平塗色塊。</p>
        </Section>

        <Section id="dodont" eyebrow="Do & Don't" title="該做與不該做">
          <div className="pg-dodont">
            <div>
              <h3>該做</h3>
              <ul>
                <li>整數倍放大，外框不夠就加內距</li>
                <li>每個顏色只配一個陰影色</li>
                <li>先畫剪影，認得出來再加細節</li>
                <li>對稱的東西只畫一半</li>
                <li>所有東西站在同一條地面</li>
                <li>動畫兩格、硬切換、節奏錯開</li>
                <li>從現有調色盤挑色</li>
              </ul>
            </div>
            <div className="dont">
              <h3>不該做</h3>
              <ul>
                <li>非整數縮放、瀏覽器平滑、模糊</li>
                <li>漸層、半透明、抗鋸齒邊緣</li>
                <li>黑色描邊外框</li>
                <li>側面、四分之三角度、透視</li>
                <li>不同像素大小的圖放在同一畫面</li>
                <li>平滑補間動畫、彈跳緩動</li>
                <li>把品牌標誌換成使用者的角色</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section id="make" eyebrow="Process" title="製作流程">
          <ol>
            <li>決定畫布：照上面的表挑尺寸，人物以外的東西也對齊同一個像素大小。</li>
            <li>寫剪影：先用一個顏色把形狀寫成字元，放大 4 倍檢查認不認得出來。</li>
            <li>上色：從調色盤挑主色，加一階陰影；要換色的部分用 <code>X</code>／<code>x</code>。</li>
            <li>放進情境：跟角色、地面線一起看比例，跟相鄰物件比顏色。</li>
            <li>動畫（選用）：只畫第二格的差異，挑一個沒人用的節奏。</li>
            <li>輸出：整數倍，關閉平滑。</li>
          </ol>
          <h3>交付前檢查</h3>
          <ul className="pg-check">
            {['所有放大倍數都是整數，邊緣沒有糊掉', '沒有漸層、半透明、描邊', '每個顏色都在調色盤裡，陰影都是同一套算法', '物件站在地面線上，比例看得懂', '相鄰物件沒有撞色', '動畫兩格、硬切換、跟其他東西節奏不同', '減少動態時停在第一格'].map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="pg-muted">程式：<code>src/lib/avatar.ts</code>（圖層與調色盤）、<code>src/components/Avatar.tsx</code>（SVG 與動畫）、<code>src/components/PixelNomad.tsx</code>（品牌標誌）、<code>src/pixel/scenes.ts</code>（城市場景）。</p>
        </Section>
      </main>
    </div>
  );
}

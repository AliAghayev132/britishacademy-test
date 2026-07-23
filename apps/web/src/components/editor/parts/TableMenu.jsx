'use client';

/* =====================================================================
 *  TableMenu — Tiptap editor üçün geniş cədvəl idarəetmə paneli.
 *
 *  Davranış:
 *    - Cədvəl XARİCİNDƏ: 10×10 grid + başlıq seçimi.
 *    - Cədvəl İÇİNDƏ: 4 tab — Quruluş / Rənglər / Sərhəd / Düzləndirmə.
 *
 *  Hər rəng panelində həm hazır palitra, həm də CUSTOM hex / native
 *  color picker var — istifadəçi istənilən rəngi seçə bilər.
 *
 *  Reaktivlik: editor-un `selectionUpdate` və `transaction` event-lərinə
 *  abunə oluruq və daxili `tick` state-i artırırıq.
 *
 *  Help: Hər tab-ın altında mavi rəngli "Necə istifadə edilir?"
 *  açılır-bağlanır izah bloku var.
 * ===================================================================== */

import { useEffect, useRef, useState } from 'react';
import {
  Table as TableIcon, Trash2, X,
  AlignLeft, AlignCenter, AlignRight,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Merge, Split,
  Plus, Minus, Rows, Columns,
  Paintbrush, Type as TypeIcon, Square,
  Layers, Settings, Palette,
  HelpCircle, ChevronDown,
  Maximize2, Move,
} from 'lucide-react';
import { ToolbarButton } from './Primitives';
import {
  TABLE_CELL_BG_COLORS,
  TABLE_CELL_TEXT_COLORS,
  TABLE_BORDER_COLORS,
  TABLE_BORDER_WIDTHS,
  TABLE_BORDER_STYLES,
} from './constants';

const INSERT_GRID = 10;

export default function TableMenu({ editor }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('struct');
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const [withHeader, setWithHeader] = useState(true);
  const popRef = useRef(null);

  /* Editor seçimi dəyişdikdə re-render */
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const tick = () => force((n) => n + 1);
    editor.on('selectionUpdate', tick);
    editor.on('transaction', tick);
    return () => {
      editor.off('selectionUpdate', tick);
      editor.off('transaction', tick);
    };
  }, [editor]);

  /* Click outside */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!editor) return null;
  const inTable = editor.isActive('table');

  const run = (chainFn) => () => chainFn(editor.chain().focus()).run();

  const insertTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: withHeader }).run();
    setOpen(false);
    setTab('struct');
  };

  const setCellAttr = (key, value) =>
    editor.chain().focus().setCellAttribute(key, value).run();

  const setAlign = (a) => editor.chain().focus().setTextAlign(a).run();

  return (
    <div className="relative" ref={popRef}>
      <ToolbarButton
        onClick={() => setOpen((p) => !p)}
        isActive={open || inTable}
        title="Cədvəl"
      >
        <TableIcon size={16} />
      </ToolbarButton>

      {open && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 mt-1 z-50 w-[380px] bg-white border
                     border-gray-200 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Başlıq */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <TableIcon size={14} className="text-secondary" />
              {inTable ? 'Cədvəl redaktoru' : 'Yeni cədvəl yarat'}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          {/* Cədvəl xaricində */}
          {!inTable && (
            <InsertPanel
              hover={hover}
              setHover={setHover}
              withHeader={withHeader}
              setWithHeader={setWithHeader}
              onPick={insertTable}
            />
          )}

          {/* Cədvəl içində */}
          {inTable && (
            <>
              <div className="flex bg-gray-50 border-b border-gray-100 text-xs">
                <TabBtn active={tab === 'struct'}  onClick={() => setTab('struct')}  icon={Layers}>Quruluş</TabBtn>
                <TabBtn active={tab === 'style'}   onClick={() => setTab('style')}   icon={Palette}>Rənglər</TabBtn>
                <TabBtn active={tab === 'border'}  onClick={() => setTab('border')}  icon={Square}>Sərhəd</TabBtn>
                <TabBtn active={tab === 'align'}   onClick={() => setTab('align')}   icon={Settings}>Düzləndirmə</TabBtn>
              </div>

              <div className="p-3 max-h-[420px] overflow-y-auto">
                {tab === 'struct' && (
                  <StructPanel
                    run={run}
                    editor={editor}
                    setCellAttr={setCellAttr}
                  />
                )}
                {tab === 'style' && (
                  <StylePanel
                    onCellBg={(c) => setCellAttr('backgroundColor', c || null)}
                    onCellFg={(c) => setCellAttr('color', c || null)}
                  />
                )}
                {tab === 'border' && (
                  <BorderPanel
                    onColor={(c) => setCellAttr('borderColor', c || null)}
                    onWidth={(w) => setCellAttr('borderWidth', w || null)}
                    onStyle={(s) => setCellAttr('borderStyle', s || null)}
                  />
                )}
                {tab === 'align' && (
                  <AlignPanel setAlign={setAlign} editor={editor} setCellAttr={setCellAttr} />
                )}
              </div>

              <div className="border-t border-gray-100 p-2 bg-gray-50/50">
                <button
                  type="button"
                  onClick={run((c) => c.deleteTable())}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5
                             text-xs text-red-600 border border-red-200 rounded
                             hover:bg-red-50 transition"
                >
                  <Trash2 size={12} />
                  Cədvəli sil
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* =================================================================== */
/*  Tab düyməsi                                                         */
/* =================================================================== */
function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-2 transition border-b-2 ${
        active
          ? 'border-secondary text-secondary bg-white font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
      }`}
    >
      <Icon size={12} />
      {children}
    </button>
  );
}

/* =================================================================== */
/*  Yeni cədvəl yaratma paneli                                          */
/* =================================================================== */
function InsertPanel({ hover, setHover, withHeader, setWithHeader, onPick }) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Ölçü seç</span>
        <span className="font-medium text-gray-700">
          {hover.r > 0 ? `${hover.r} sətir × ${hover.c} sütun` : '— × —'}
        </span>
      </div>

      <div
        className="grid gap-0.5 mb-3"
        style={{ gridTemplateColumns: `repeat(${INSERT_GRID}, 1fr)` }}
        onMouseLeave={() => setHover({ r: 0, c: 0 })}
      >
        {Array.from({ length: INSERT_GRID * INSERT_GRID }, (_, i) => {
          const r = Math.floor(i / INSERT_GRID) + 1;
          const c = (i % INSERT_GRID) + 1;
          const active = r <= hover.r && c <= hover.c;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover({ r, c })}
              onClick={() => onPick(r, c)}
              className={`w-7 h-7 border rounded-sm transition ${
                active
                  ? 'bg-secondary border-secondary'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-400'
              }`}
            />
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none mb-2">
        <input
          type="checkbox"
          checked={withHeader}
          onChange={(e) => setWithHeader(e.target.checked)}
          className="accent-secondary"
        />
        Başlıq sətri ilə yarat
      </label>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li>Yuxarıdakı şəbəkədə üzərinə gəlib istədiyiniz <b>sətir × sütun</b> sayını seçin.</li>
          <li>Klikləyəndə cədvəl daxil edilir. Cədvələ klikləyəndə bu menyu redaktə rejiminə keçəcək.</li>
          <li>Sütunun ölçüsünü dəyişmək üçün xananın <b>sağ kənarına</b> mausu yaxınlaşdırın — mavi zolaq görünəcək, onu sürükləyin.</li>
          <li>Konkret en/hündürlük üçün <b>Quruluş</b> tabındakı <b>W / H</b> sahələrindən istifadə edin.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Quruluş paneli                                                      */
/* =================================================================== */
function StructPanel({ run, editor, setCellAttr }) {
  const cellAttrs = {
    ...editor.getAttributes('tableCell'),
    ...editor.getAttributes('tableHeader'),
  };
  const currentPadding = cellAttrs.cellPadding || null;
  return (
    <div className="space-y-3">
      <Section title="Sətir">
        <Btn icon={Plus} onClick={run((c) => c.addRowBefore())}>Yuxarı əlavə</Btn>
        <Btn icon={Plus} onClick={run((c) => c.addRowAfter())}>Aşağı əlavə</Btn>
        <Btn icon={Minus} danger onClick={run((c) => c.deleteRow())}>Sətri sil</Btn>
      </Section>

      <Section title="Sütun">
        <Btn icon={Plus} onClick={run((c) => c.addColumnBefore())}>Sol əlavə</Btn>
        <Btn icon={Plus} onClick={run((c) => c.addColumnAfter())}>Sağ əlavə</Btn>
        <Btn icon={Minus} danger onClick={run((c) => c.deleteColumn())}>Sütunu sil</Btn>
      </Section>

      <Section title="Xanalar">
        <Btn icon={Merge} onClick={run((c) => c.mergeCells())}>Birləşdir</Btn>
        <Btn icon={Split} onClick={run((c) => c.splitCell())}>Böl</Btn>
        <Btn icon={Merge} onClick={run((c) => c.mergeOrSplit())}>Auto</Btn>
      </Section>

      <Section title="Başlıq">
        <Btn icon={Rows}     onClick={run((c) => c.toggleHeaderRow())}>Sətir</Btn>
        <Btn icon={Columns}  onClick={run((c) => c.toggleHeaderColumn())}>Sütun</Btn>
        <Btn icon={TableIcon} onClick={run((c) => c.toggleHeaderCell())}>Xana</Btn>
      </Section>

      {/* Xana ölçüsü (cari xana üçün) */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
          <Maximize2 size={10} /> Xana ölçüsü
        </div>
        <div className="flex items-center gap-2">
          <SizeInput
            label="W"
            currentAttr={editor.getAttributes('tableCell').cellWidth || editor.getAttributes('tableHeader').cellWidth}
            onCommit={(v) => setCellAttr('cellWidth', v)}
          />
          <SizeInput
            label="H"
            currentAttr={editor.getAttributes('tableCell').cellHeight || editor.getAttributes('tableHeader').cellHeight}
            onCommit={(v) => setCellAttr('cellHeight', v)}
          />
          <button
            type="button"
            onClick={() => {
              setCellAttr('cellWidth', null);
              setCellAttr('cellHeight', null);
            }}
            className="px-2 py-1 text-[10px] text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
            title="Xana ölçüsünü sıfırla"
          >
            Sıfırla
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          Boş = avtomatik. Vahid yazılmasa <code>px</code> götürülür (məs: <code>120</code>, <code>50%</code>).
        </p>
      </div>

      {/* Xana daxili padding */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5 flex items-center gap-1">
          <Move size={10} /> Daxili boşluq (padding)
        </div>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {['0', '2px', '4px', '8px', '12px', '16px', '20px'].map((p) => {
            const active = currentPadding === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCellAttr('cellPadding', p)}
                className={`px-2.5 py-1 text-xs border rounded transition ${
                  active
                    ? 'bg-secondary text-white border-secondary'
                    : 'border-gray-200 hover:bg-secondary/10 hover:border-secondary'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCellAttr('cellPadding', null)}
            className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
            title="Default-a qaytar (4px)"
          >
            Default
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mb-1">
          Default 4px-dir. <b>0</b> seçərək tamamilə sıfırlamaq olar.
        </p>
        <SizeInput
          label="Özün"
          currentAttr={currentPadding}
          onCommit={(v) => setCellAttr('cellPadding', v)}
        />
      </div>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li><b>Sətir/Sütun</b> bölmələri ilə cari xananın yanına/sonuna sıra əlavə edin və ya silin.</li>
          <li><b>Birləşdir</b> seçilmiş bir neçə xananı tək xanaya çevirir; <b>Böl</b> birləşmiş xananı geri ayırır.</li>
          <li><b>Başlıq</b> bölməsində aktiv olan sətir/sütun/xananı `&lt;th&gt;` (başlıq) və ya `&lt;td&gt;` (adi) etmək olar.</li>
          <li>Xana ölçüsünü dəqiq vermək üçün <b>W</b> (en) və <b>H</b> (hündürlük) sahələrini doldurun.</li>
          <li>Çoxlu xana seçmək üçün xana üzərinə klikləyib mausu sürükləyin.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Stil paneli — fon və mətn rəngi                                     */
/* =================================================================== */
function StylePanel({ onCellBg, onCellFg }) {
  return (
    <div className="space-y-4">
      <ColorBlock
        title="Xana fon rəngi"
        icon={Paintbrush}
        colors={TABLE_CELL_BG_COLORS}
        onPick={onCellBg}
        defaultHex="#FEF3C7"
        showTransparentLabel
      />
      <ColorBlock
        title="Mətn rəngi"
        icon={TypeIcon}
        colors={TABLE_CELL_TEXT_COLORS}
        onPick={onCellFg}
        defaultHex="#2C4B62"
      />

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li>Əvvəlcə cədvəldə bir və ya bir neçə xananı seçin.</li>
          <li>Hazır palitradan bir rəngə klikləyin və ya <b>Custom rəng</b> sahəsində istənilən rəngi seçin (color picker / hex kod).</li>
          <li>Şəffaf rəng seçimi (qırmızı xətli kvadrat) tətbiq olunmuş rəngi silir.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Sərhəd paneli                                                       */
/* =================================================================== */
function BorderPanel({ onColor, onWidth, onStyle }) {
  return (
    <div className="space-y-4">
      <ColorBlock
        title="Sərhəd rəngi"
        icon={Square}
        colors={TABLE_BORDER_COLORS}
        onPick={onColor}
        defaultHex="#2C4B62"
      />

      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
          Qalınlıq
        </div>
        <div className="flex flex-wrap gap-1">
          {TABLE_BORDER_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onWidth(w)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded
                         hover:bg-secondary/10 hover:border-secondary transition"
            >
              {w}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onWidth(null)}
            className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
          >
            Sıfırla
          </button>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
          Stil
        </div>
        <div className="flex flex-wrap gap-1">
          {TABLE_BORDER_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStyle(s.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded
                         hover:bg-secondary/10 hover:border-secondary transition"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onStyle(null)}
            className="px-2.5 py-1 text-xs text-gray-500 border border-dashed border-gray-300
                       rounded hover:bg-gray-50"
          >
            Sıfırla
          </button>
        </div>
      </div>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li>Sərhəd ayrıca xana üçün tətbiq olunur. Bütün cədvələ vermək üçün <b>Ctrl + A</b> ilə xanaları seçin.</li>
          <li>Əvvəl <b>rəngi</b>, sonra <b>qalınlığı</b> və <b>stili</b> seçin.</li>
          <li><b>Sıfırla</b> default sərhəddi (1px solid #d1d5db) qaytarır.</li>
        </ul>
      </Help>
    </div>
  );
}

/* =================================================================== */
/*  Düzləndirmə paneli                                                  */
/* =================================================================== */
function AlignPanel({ setAlign, editor, setCellAttr }) {
  const isAlign = (a) => editor.isActive({ textAlign: a });
  const cellAttrs = {
    ...editor.getAttributes('tableCell'),
    ...editor.getAttributes('tableHeader'),
  };
  const isVAlign = (v) => cellAttrs.verticalAlign === v;
  return (
    <div className="space-y-3">
      <Section title="Üfüqi">
        <Btn icon={AlignLeft}   active={isAlign('left')}   onClick={() => setAlign('left')}>Sol</Btn>
        <Btn icon={AlignCenter} active={isAlign('center')} onClick={() => setAlign('center')}>Mərkəz</Btn>
        <Btn icon={AlignRight}  active={isAlign('right')}  onClick={() => setAlign('right')}>Sağ</Btn>
      </Section>

      <Section title="Şaquli (yuxarı-aşağı)">
        <Btn icon={AlignVerticalJustifyStart}  active={isVAlign('top')}    onClick={() => setCellAttr('verticalAlign', 'top')}>Yuxarı</Btn>
        <Btn icon={AlignVerticalJustifyCenter} active={isVAlign('middle')} onClick={() => setCellAttr('verticalAlign', 'middle')}>Orta</Btn>
        <Btn icon={AlignVerticalJustifyEnd}    active={isVAlign('bottom')} onClick={() => setCellAttr('verticalAlign', 'bottom')}>Aşağı</Btn>
      </Section>

      <button
        type="button"
        onClick={() => setCellAttr('verticalAlign', null)}
        className="w-full px-2 py-1.5 text-[11px] text-gray-500 border border-dashed border-gray-300
                   rounded hover:bg-gray-50"
      >
        Şaquli düzləndirməni sıfırla
      </button>

      <Help title="Necə istifadə edilir?">
        <ul className="space-y-1 list-disc pl-4">
          <li><b>Üfüqi</b> — xanadakı mətni sola, mərkəzə və ya sağa düzləndirir.</li>
          <li><b>Şaquli</b> — xananın yüksəkliyi böyükdürsə, mətnin xana daxilində yuxarı, ortada və ya aşağıda yerləşməsini təyin edir.</li>
          <li>Bir neçə xananı birdən formatlamaq üçün xanaları sürükləyərək seçin.</li>
        </ul>
      </Help>
    </div>
  );
}

/* ===================================================================
 *  UI primitiv-ləri (yalnız bu fayl daxilində)
 * =================================================================== */

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
        {title}
      </div>
      <div className="grid grid-cols-3 gap-1">{children}</div>
    </div>
  );
}

function Btn({ icon: Icon, children, onClick, danger = false, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded transition truncate
        ${active
          ? 'bg-secondary text-white border-secondary'
          : danger
            ? 'text-red-600 border-red-200 hover:bg-red-50'
            : 'text-gray-700 border-gray-200 hover:bg-gray-50'}`}
    >
      <Icon size={12} className="shrink-0" />
      <span className="truncate">{children}</span>
    </button>
  );
}

/**
 * Rəng paneli: hazır palitra + custom hex / native picker.
 * `defaultHex` color input-un başlanğıc dəyəridir.
 */
function ColorBlock({
  title,
  icon: Icon,
  colors,
  onPick,
  defaultHex = '#000000',
  showTransparentLabel = false,
}) {
  const [hex, setHex] = useState(defaultHex);
  const valid = /^#[0-9a-f]{6}$/i.test(hex);

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
        <Icon size={10} />
        {title}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {colors.map((c, i) => {
          const isClear = !c;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(c)}
              title={c || (showTransparentLabel ? 'Şəffaf' : 'Default')}
              className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition relative"
              style={{
                background: isClear
                  ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 8px 8px'
                  : c,
              }}
            >
              {isClear && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-5 h-px bg-red-500 rotate-45" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom rəng */}
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={valid ? hex : defaultHex}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setHex(v);
            // Native color picker dəyişdiyi an dərhal tətbiq et — Word-vari təcrübə
            onPick(v);
          }}
          className="w-9 h-8 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
          title="Color picker"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' && valid) onPick(hex);
          }}
          placeholder="#RRGGBB"
          maxLength={7}
          className="flex-1 px-2 py-1 text-xs font-mono border border-gray-200 rounded
                     focus:outline-none focus:border-secondary"
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => onPick(hex)}
          className="px-2 py-1 text-xs bg-secondary text-white rounded
                     hover:bg-secondary/90 disabled:opacity-40"
        >
          Tətbiq
        </button>
      </div>
    </div>
  );
}

/** Xana W / H input-u — boş = avtomatik */
function SizeInput({ label, currentAttr, onCommit }) {
  const [v, setV] = useState(currentAttr || '');
  useEffect(() => {
    setV(currentAttr || '');
  }, [currentAttr]);

  const commit = () => {
    const t = (v || '').trim();
    if (!t) {
      onCommit(null);
      return;
    }
    // əgər sırf rəqəmdirsə — px əlavə et
    onCommit(/^[0-9]+$/.test(t) ? `${t}px` : t);
  };

  return (
    <label className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 border border-gray-200 rounded text-xs flex-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
      <input
        type="text"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            e.currentTarget.blur();
          }
        }}
        placeholder="auto"
        className="w-full bg-transparent outline-none font-medium"
      />
    </label>
  );
}

/* Açılır-bağlanır izah bloku */
function Help({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-md overflow-hidden mt-2">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px]
                   font-medium text-blue-700 hover:bg-blue-50"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={12} />
          {title}
        </span>
        <ChevronDown
          size={12}
          className={`transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-3 py-2 text-[11px] text-blue-900/80 leading-relaxed border-t border-blue-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

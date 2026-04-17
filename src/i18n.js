// ===== i18n =====
export let currentLang = localStorage.getItem('jiro_lang') || 'ja';

const i18n = {
  ja: {
    joinQueue: '行列に並ぶ',
    ranking: 'ランキング',
    goHome: '帰宅する',
    leaveMsgs: ["…やっぱり並ぼう", "JIROに背を向けられる人間はいない", "あなたはもうJIROの虜です", "ロットを乱す気ですか？", "逃げられない。さあ、並ぼう。"],
    world: '世界', myself: '自分', loading: '読み込み中...', noRecords: 'まだ記録がありません', backToTitle: 'タイトルへ戻る',
    queueText: (n) => `前に${n}人並んでいます`, joinBtn: '並ぶ',
    chooseTicket: '食券を選んでください', smallRamen: '小ラーメン', largeRamen: '大ラーメン', doublePork: '大ぶたダブルラーメン',
    waitMsgs: ["ソワソワ…", "お腹が減った…", "いい匂いがする…", "前の人が食券を握りしめている…", "店員の掛け声が聞こえる…"],
    showTicket: '食券見せてください', tooSlow: 'お客さん、困りますよ', pleaseWait: 'もう少しお待ちください…',
    sitMsgs: ["隣の人がすごい勢いで食べている…","ニンニクの匂いが充満している…","水を飲んで待つ…","早く食べたい…","店員が麺を茹でている…"],
    finallySat: 'ようやく座れた…',
    garlicQ: 'ニンニク入れますか？', callBtn: 'コールする！',
    garlic: 'ニンニク', veggie: 'ヤサイ', fat: 'アブラ', salty: 'カラメ',
    none: 'なし', slight: '少し', more: 'マシ', extraMore: 'マシマシ',
    asIs: 'そのまま', gotIt: 'あいよ！！', theTimeHasCome: 'ついにこの時が来た！',
    howToPlay: '遊び方', tapToStart: 'タップして開始', tapEmoji: '→ タップ！', skipSkull: '→ スルー！（タップしない）',
    comboUp: 'コンボでスコアアップ！', tapOnBar: '黄色いバーに重なったらタップ',
    noodle: '麺', pork: 'ブタ', choke: 'むせ',
    perfectHit: 'ズルズルッ！！', goodHit: 'ズッ！', okHit: 'ゴクリ', miss: 'ハフハフ…',
    stomachLimit: '胃が限界を迎えた…', scoreLabel: 'スコア', finished: '完 食 ！！',
    maxCombo: '最大コンボ', leaveStore: '退店する', confirmLeave: '本当に退店しますか？', yes: 'はい', no: 'いいえ',
    banned: 'お客さん、出禁だから', wipePlease: 'カウンターをクロスで拭いてから退店してください', oneMore: 'もう一杯', shareX: 'Xでシェア',
    perfectMove: '完璧なJIROムーブ。', seeYa: 'またな',
    worstDesc: 'あなたは神聖なるJIROの掟に背き、<br>店主に出禁を言い渡され、<br>SNSで晒されてしまった。',
    crimeTicket: '罪状：食券提示の遅延行為', crimeLeftover: '罪状：残し',
    rankBeginner: 'JIROにわか', rankMaster: 'JIROマスター', rankLian: 'JIROリアン', rankIntermediate: 'JIRO中級者', rankBanned: '出禁寸前',
    sharePts: '点', shareCall: 'コール', shareNone: 'なし',
    sharePerfect: '✅ 完璧なJIROムーブ達成', shareBanned: '🚫 出禁になりました', shareForgot: '❌ クロスで拭き忘れた…',
    langLabel: 'EN',
  },
  en: {
    joinQueue: 'Join the Line', ranking: 'Ranking', goHome: 'Go Home',
    leaveMsgs: ["...Let's line up after all", "No one can turn their back on JIRO", "You're already hooked on JIRO", "Are you going to break the lot order?", "You can't escape. Let's line up."],
    world: 'World', myself: 'Local', loading: 'Loading...', noRecords: 'No records yet', backToTitle: 'Back to Title',
    queueText: (n) => `${n} people ahead of you`, joinBtn: 'Join',
    chooseTicket: 'Choose your ticket', smallRamen: 'Small Ramen', largeRamen: 'Large Ramen', doublePork: 'Large Double Pork',
    waitMsgs: ["Fidgeting...", "So hungry...", "Smells amazing...", "The person ahead is gripping their ticket...", "You can hear the staff shouting..."],
    showTicket: 'Show me your ticket!', tooSlow: "Hey, you're holding up the line!", pleaseWait: 'Please wait a moment...',
    sitMsgs: ["The person next to you is eating incredibly fast...","The garlic smell fills the air...","Drinking water while waiting...","Can't wait to eat...","The cook is boiling noodles..."],
    finallySat: 'Finally got a seat...',
    garlicQ: 'Garlic?', callBtn: 'Call it!',
    garlic: 'Garlic', veggie: 'Veggie', fat: 'Fat', salty: 'Salty',
    none: 'None', slight: 'Little', more: 'Extra', extraMore: 'Max',
    asIs: 'As is', gotIt: 'You got it!!', theTimeHasCome: 'The moment has come!',
    howToPlay: 'How to Play', tapToStart: 'Tap to Start', tapEmoji: '→ Tap!', skipSkull: "→ Don't tap!",
    comboUp: 'Build combos for more points!', tapOnBar: 'Tap when it hits the yellow bar',
    noodle: 'Noodle', pork: 'Pork', choke: 'Choke',
    perfectHit: 'SLURP!!', goodHit: 'SLRP!', okHit: 'Gulp', miss: 'Whiff...',
    stomachLimit: 'Your stomach gave out...', scoreLabel: 'Score', finished: 'DONE!!',
    maxCombo: 'Max Combo', leaveStore: 'Leave', confirmLeave: 'Really leave?', yes: 'Yes', no: 'No',
    banned: "You're banned, buddy", wipePlease: 'Please wipe the counter before leaving', oneMore: 'One More', shareX: 'Share on X',
    perfectMove: 'Perfect JIRO Move.', seeYa: 'See ya',
    worstDesc: "You defied the sacred laws of JIRO,<br>got banned by the owner,<br>and got exposed on social media.",
    crimeTicket: 'Crime: Delayed ticket presentation', crimeLeftover: 'Crime: Leaving food behind',
    rankBeginner: 'JIRO Beginner', rankMaster: 'JIRO Master', rankLian: 'JIROlian', rankIntermediate: 'JIRO Regular', rankBanned: 'Almost Banned',
    rankAllMax: 'Max Topping Champion',
    sharePts: 'pts', shareCall: 'Call', shareNone: 'None',
    sharePerfect: '✅ Perfect JIRO Move achieved', shareBanned: '🚫 Got banned from JIRO', shareForgot: '❌ Forgot to wipe the counter...',
    langLabel: 'JP',
  }
};

export function t(key) {
  return i18n[currentLang][key] || i18n['ja'][key] || key;
}

export function toggleLang() {
  currentLang = currentLang === 'ja' ? 'en' : 'ja';
  localStorage.setItem('jiro_lang', currentLang);
  // Dispatch event so scenes can re-render
  window.dispatchEvent(new CustomEvent('jiro:lang-changed'));
}

export function createLangToggle() {
  const btn = document.createElement('div');
  btn.className = 'lang-toggle';
  btn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg><span>${t('langLabel')}</span>`;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLang();
  });
  return btn;
}

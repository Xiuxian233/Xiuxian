import './styles.css';

const STORAGE_KEY = 'xiuxian-ai-world-v1';
const todayKey = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

const eventSeeds = [
  {
    title: '雾起青岚山',
    scene: '晨钟未响，洞府外忽有三声鹤唳。薄雾从青岚山脚升起，雾中隐约浮现一枚残破玉简，似在呼唤你的道号。',
    choices: [
      ['入雾寻简', '冒险'],
      ['焚香占问', '谨慎'],
      ['传讯同门', '结缘'],
    ],
  },
  {
    title: '月下灵泉',
    scene: '子时将近，城外灵泉映出一轮赤月。你曾经留下的因果在水面荡开，似乎有人借泉水窥探你的修行。',
    choices: [
      ['以心魔相问', '道心'],
      ['封住泉眼', '果断'],
      ['留下护泉符', '慈悲'],
    ],
  },
  {
    title: '旧友飞剑传书',
    scene: '一柄覆着霜纹的飞剑落在窗前，剑穗上刻着你过往抉择的痕迹。信中只写：若仍念旧缘，今夜来城南古槐。',
    choices: [
      ['赴约古槐', '重情'],
      ['回信试探', '谋定'],
      ['闭门不见', '清修'],
    ],
  },
];

const rarity = [
  ['legendary', 0.03, '传说'],
  ['epic', 0.12, '玄品'],
  ['rare', 0.28, '珍品'],
  ['common', 0.55, '凡品'],
];

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    user: null,
    profile: null,
    events: [],
    collectibles: [],
    posts: seedPosts(),
    tab: 'today',
  };
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedPosts() {
  return [
    {
      id: uid('post'),
      city: '杭州',
      author: '玄鹤散人',
      content: '今日在西湖雾心见一页无字天书，待我凝神时，纸上竟浮现自己的名字。',
      likeCount: 18,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: uid('post'),
      city: '上海',
      author: '听潮子',
      content: '黄浦江夜潮有灵，我以一盏茶换来半句剑诀，醒来袖中多了一片青鳞。',
      likeCount: 11,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

function createProfile(formData) {
  const daoName = formData.get('daoName')?.trim() || '无名小修';
  const city = formData.get('city')?.trim() || '杭州';
  state.user = {
    id: uid('user'),
    nickname: daoName,
    daoName,
    city,
    realm: '炼气一层',
    createdAt: new Date().toISOString(),
  };
  state.profile = {
    personalitySummary: '初入仙途，道心未定，仍在观察天地与人情。',
    cultivationPath: '尚未定下道途。',
    currentRealm: '炼气一层',
    majorEventsSummary: '刚刚踏入修行世界，因果尚浅。',
    relationshipSummary: '在本城分舵暂无深交。',
    artifactSummary: '尚无可载入传记的灵物。',
    worldStateSummary: `${city}附近灵气渐浓，似有旧日仙缘复苏。`,
  };
  saveState();
  render();
}

function currentEvent() {
  return state.events.find((event) => event.date === todayKey());
}

function generateDailyEvent() {
  if (currentEvent()) return;
  const historyWeight = state.events.length + state.collectibles.length;
  const seed = eventSeeds[historyWeight % eventSeeds.length];
  const memory = state.profile.majorEventsSummary;
  const artifactHint = state.collectibles[0] ? `你袖中${state.collectibles[0].name}微微发烫，似与此事相应。` : '你忽然想起自己初入仙途时许下的愿。';
  state.events.unshift({
    id: uid('event'),
    userId: state.user.id,
    date: todayKey(),
    title: seed.title,
    content: `${seed.scene}\n\n过往因果：${memory}\n\n${artifactHint}`,
    choices: seed.choices.map(([text, tendency]) => ({ id: uid('choice'), text, tendency })),
    createdAt: new Date().toISOString(),
  });
  saveState();
}

function completeEvent(eventId, choiceId) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event || event.selectedChoiceId) return;
  const choice = event.choices.find((item) => item.id === choiceId);
  event.selectedChoiceId = choice.id;
  event.result = `你选择「${choice.text}」，此举令你的${choice.tendency}之念更坚定。${state.user.city}分舵的玉册上，悄然添下一笔属于你的因果。`;
  event.completedAt = new Date().toISOString();
  state.profile.personalitySummary = `近来更显${choice.tendency}，行事不再只是随波逐流。`;
  state.profile.majorEventsSummary = `曾在「${event.title}」中选择「${choice.text}」，由此留下新的因果。`;
  state.profile.worldStateSummary = `${state.user.city}附近的灵气因「${event.title}」出现细微变化，后续事件会继续受此影响。`;
  maybeDropCollectible(event, choice);
  saveState();
  render();
}

function maybeDropCollectible(event, choice) {
  const roll = Math.random();
  const picked = rarity.find(([, chance]) => roll < chance);
  if (!picked) return;
  const [key, , label] = picked;
  const collectible = {
    id: uid('artifact'),
    ownerUserId: state.user.id,
    sourceEventId: event.id,
    name: `${choice.tendency}·${event.title.replace(/\s/g, '')}灵印`,
    description: `因你在「${event.title}」中的选择凝成，印中仍留有一缕${choice.tendency}气机。`,
    rarity: key,
    rarityLabel: label,
    imagePrompt: `oriental xianxia artifact, ink wash, jade and gold, ${choice.tendency}, ${event.title}`,
    lore: `此物只属于${state.user.daoName}，源自${event.date}的一段独特修仙经历。`,
    uniqueHash: btoa(`${state.user.id}:${event.id}:${choice.id}:${Date.now()}`).replace(/=/g, '').slice(0, 16),
    createdAt: new Date().toISOString(),
  };
  state.collectibles.unshift(collectible);
  event.collectibleId = collectible.id;
  state.profile.artifactSummary = `拥有${collectible.name}，此物见证了${event.title}的因果。`;
}

function shareLatestEvent() {
  const latest = state.events.find((event) => event.completedAt);
  if (!latest) return;
  state.posts.unshift({
    id: uid('post'),
    city: state.user.city,
    author: state.user.daoName,
    content: `${latest.title}：${latest.result}`,
    likeCount: 0,
    createdAt: new Date().toISOString(),
  });
  saveState();
  render();
}

function setTab(tab) {
  state.tab = tab;
  saveState();
  render();
}

function App() {
  if (!state.user) return Onboarding();
  generateDailyEvent();
  return `
    <section class="phone-shell">
      <header class="hero">
        <p class="eyebrow">青云纪 · AI 修仙世界</p>
        <h1>${state.user.daoName}</h1>
        <div class="chips"><span>${state.user.city}分舵</span><span>${state.profile.currentRealm}</span></div>
      </header>
      ${state.tab === 'today' ? TodayView() : ''}
      ${state.tab === 'profile' ? ProfileView() : ''}
      ${state.tab === 'artifacts' ? ArtifactView() : ''}
      ${state.tab === 'sect' ? SectView() : ''}
      <nav class="tabbar">
        ${TabButton('today', '今日')}
        ${TabButton('profile', '档案')}
        ${TabButton('artifacts', '藏品')}
        ${TabButton('sect', '分舵')}
      </nav>
    </section>`;
}

function Onboarding() {
  return `
    <section class="onboarding">
      <div class="moon"></div>
      <p class="eyebrow">一个会记住你的 AI 修仙世界</p>
      <h1>今日入道，明日因果自来。</h1>
      <form id="profile-form" class="card form-card">
        <label>道号<input name="daoName" placeholder="如：云栖子" maxlength="12" /></label>
        <label>所在城市<input name="city" placeholder="如：杭州" maxlength="12" /></label>
        <button type="submit">踏入仙途</button>
      </form>
    </section>`;
}

function TodayView() {
  const event = currentEvent();
  const collectible = state.collectibles.find((item) => item.id === event.collectibleId);
  return `
    <article class="card scroll-card">
      <p class="date">${event.date}</p>
      <h2>${event.title}</h2>
      <p>${event.content.replace(/\n/g, '<br />')}</p>
      <div class="choices">
        ${event.selectedChoiceId ? `<div class="result">${event.result}</div>` : event.choices.map((choice) => `<button data-choice="${choice.id}" data-event="${event.id}">${choice.text}<small>${choice.tendency}</small></button>`).join('')}
      </div>
      ${collectible ? `<div class="artifact-drop">获得藏品：<strong>${collectible.name}</strong><br /><span>唯一印记 ${collectible.uniqueHash}</span></div>` : ''}
    </article>`;
}

function ProfileView() {
  return `<section class="card"><h2>修仙档案</h2>${Object.entries(state.profile).map(([key, value]) => `<div class="memory"><b>${labelFor(key)}</b><p>${value}</p></div>`).join('')}</section>`;
}

function ArtifactView() {
  return `<section class="grid-list"><h2>藏品阁</h2>${state.collectibles.length ? state.collectibles.map((item) => `<article class="card artifact"><span>${item.rarityLabel}</span><h3>${item.name}</h3><p>${item.description}</p><small>印记 ${item.uniqueHash}</small></article>`).join('') : '<p class="empty">尚无藏品。完成每日事件，或许会有灵物择主。</p>'}</section>`;
}

function SectView() {
  const posts = state.posts.filter((post) => post.city === state.user.city);
  return `<section class="grid-list"><h2>${state.user.city}宗门分舵</h2><button class="share" id="share-latest">分享最近经历</button>${posts.map((post) => `<article class="card post"><b>${post.author}</b><p>${post.content}</p><small>灵赞 ${post.likeCount}</small></article>`).join('')}</section>`;
}

function TabButton(tab, label) {
  return `<button class="${state.tab === tab ? 'active' : ''}" data-tab="${tab}">${label}</button>`;
}

function labelFor(key) {
  return {
    personalitySummary: '道心性情',
    cultivationPath: '修行路线',
    currentRealm: '当前境界',
    majorEventsSummary: '重要经历',
    relationshipSummary: '人情因果',
    artifactSummary: '灵物记忆',
    worldStateSummary: '世界状态',
  }[key] || key;
}

function render() {
  document.querySelector('#app').innerHTML = App();
}

document.addEventListener('submit', (event) => {
  if (event.target.id === 'profile-form') {
    event.preventDefault();
    createProfile(new FormData(event.target));
  }
});

document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]')?.dataset.tab;
  if (tab) setTab(tab);
  const choice = event.target.closest('[data-choice]');
  if (choice) completeEvent(choice.dataset.event, choice.dataset.choice);
  if (event.target.id === 'share-latest') shareLatestEvent();
});

render();

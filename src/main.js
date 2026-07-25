const STORAGE_KEY = 'xiuxian-ai-world-v2';
const todayKey = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) => `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;

const eventSeeds = [
  { title: '雾起青岚山', scene: '晨钟未响，洞府外忽有三声鹤唳。薄雾从青岚山脚升起，雾中隐约浮现一枚残破玉简，似在呼唤你的道号。', choices: [['入雾寻简', '冒险'], ['焚香占问', '谨慎'], ['传讯同门', '结缘']] },
  { title: '月下灵泉', scene: '子时将近，城外灵泉映出一轮赤月。你曾经留下的因果在水面荡开，似乎有人借泉水窥探你的修行。', choices: [['以心魔相问', '道心'], ['封住泉眼', '果断'], ['留下护泉符', '慈悲']] },
  { title: '旧友飞剑传书', scene: '一柄覆着霜纹的飞剑落在窗前，剑穗上刻着你过往抉择的痕迹。信中只写：若仍念旧缘，今夜来城南古槐。', choices: [['赴约古槐', '重情'], ['回信试探', '谋定'], ['闭门不见', '清修']] },
  { title: '坊市残卷', scene: '宗门坊市今日忽然多出一卷无主残经。摊主说它不收灵石，只认有缘人过往的一个决定。', choices: [['以经历换取', '执着'], ['让与后来者', '豁达'], ['请分舵共鉴', '协作']] },
];

const rarityTable = [
  { key: 'legendary', chance: 0.03, label: '传说', tone: 'legendary' },
  { key: 'epic', chance: 0.12, label: '玄品', tone: 'epic' },
  { key: 'rare', chance: 0.28, label: '珍品', tone: 'rare' },
  { key: 'common', chance: 0.55, label: '凡品', tone: 'common' },
];

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('xiuxian-ai-world-v1');
  const parsed = saved ? JSON.parse(saved) : {};
  return {
    user: parsed.user || null,
    profile: parsed.profile || null,
    events: parsed.events || [],
    collectibles: parsed.collectibles || [],
    posts: parsed.posts || seedPosts(),
    tab: parsed.tab || 'today',
    artifactFilter: parsed.artifactFilter || 'all',
    selectedArtifactId: parsed.selectedArtifactId || null,
    likedPostIds: parsed.likedPostIds || [],
  };
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedPosts() {
  return [
    { id: uid('post'), city: '杭州', author: '玄鹤散人', content: '今日在西湖雾心见一页无字天书，待我凝神时，纸上竟浮现自己的名字。', likeCount: 18, createdAt: new Date(Date.now() - 86400000).toISOString(), featuredArtifactName: '无字天书影' },
    { id: uid('post'), city: '上海', author: '听潮子', content: '黄浦江夜潮有灵，我以一盏茶换来半句剑诀，醒来袖中多了一片青鳞。', likeCount: 11, createdAt: new Date(Date.now() - 172800000).toISOString(), featuredArtifactName: '青鳞潮符' },
    { id: uid('post'), city: '杭州', author: '南屏客', content: '分舵香火忽明忽暗，似有人在梦里替我续上一段断掉的仙缘。', likeCount: 7, createdAt: new Date(Date.now() - 3600000).toISOString(), featuredArtifactName: '' },
  ];
}

function createProfile(formData) {
  const daoName = formData.get('daoName')?.trim() || '无名小修';
  const city = formData.get('city')?.trim() || '杭州';
  state.user = { id: uid('user'), nickname: daoName, daoName, city, realm: '炼气一层', createdAt: new Date().toISOString() };
  state.profile = { personalitySummary: '初入仙途，道心未定，仍在观察天地与人情。', cultivationPath: '尚未定下道途。', currentRealm: '炼气一层', majorEventsSummary: '刚刚踏入修行世界，因果尚浅。', relationshipSummary: '在本城分舵暂无深交。', artifactSummary: '尚无可载入传记的灵物。', worldStateSummary: `${city}附近灵气渐浓，似有旧日仙缘复苏。` };
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
  state.events.unshift({ id: uid('event'), userId: state.user.id, date: todayKey(), title: seed.title, content: `${seed.scene}\n\n过往因果：${memory}\n\n${artifactHint}`, choices: seed.choices.map(([text, tendency]) => ({ id: uid('choice'), text, tendency })), createdAt: new Date().toISOString() });
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
  const picked = rarityTable.find((rarity) => roll < rarity.chance);
  if (!picked) return;
  const serial = state.collectibles.length + 1;
  const uniqueHash = btoa(`${state.user.id}:${event.id}:${choice.id}:${Date.now()}:${serial}`).replace(/=/g, '').slice(0, 20);
  const collectible = {
    id: uid('artifact'), ownerUserId: state.user.id, sourceEventId: event.id,
    name: `${choice.tendency}·${event.title.replace(/\s/g, '')}灵印`, rarity: picked.key, rarityLabel: picked.label, tone: picked.tone,
    description: `因你在「${event.title}」中的选择凝成，印中仍留有一缕${choice.tendency}气机。`,
    lore: `此物只属于${state.user.daoName}，源自${event.date}的一段独特修仙经历。`,
    imagePrompt: `oriental xianxia artifact, ink wash, jade and gold, ${choice.tendency}, ${event.title}`,
    uniqueHash, serial: String(serial).padStart(4, '0'), createdAt: new Date().toISOString(), favorite: false,
  };
  state.collectibles.unshift(collectible);
  state.selectedArtifactId = collectible.id;
  event.collectibleId = collectible.id;
  state.profile.artifactSummary = `拥有${collectible.name}，此物见证了${event.title}的因果。`;
}

function toggleFavoriteArtifact(artifactId) {
  const item = state.collectibles.find((artifact) => artifact.id === artifactId);
  if (!item) return;
  item.favorite = !item.favorite;
  saveState();
  render();
}

function setArtifactFilter(filter) {
  state.artifactFilter = filter;
  state.selectedArtifactId = null;
  saveState();
  render();
}

function selectArtifact(artifactId) {
  state.selectedArtifactId = artifactId;
  saveState();
  render();
}

function shareLatestEvent() {
  const latest = state.events.find((event) => event.completedAt);
  if (!latest) return;
  createSectPost(`${latest.title}：${latest.result}`, latest.collectibleId);
}

function createSectPost(content, artifactId = '') {
  const text = content.trim();
  if (!text) return;
  const artifact = state.collectibles.find((item) => item.id === artifactId);
  state.posts.unshift({ id: uid('post'), city: state.user.city, author: state.user.daoName, content: text.slice(0, 180), likeCount: 0, createdAt: new Date().toISOString(), featuredArtifactName: artifact?.name || '', featuredArtifactId: artifact?.id || '' });
  state.profile.relationshipSummary = `已在${state.user.city}分舵留下公开修仙经历，与同城道友因果渐深。`;
  saveState();
  render();
}

function likeSectPost(postId) {
  if (state.likedPostIds.includes(postId)) return;
  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;
  post.likeCount += 1;
  state.likedPostIds.push(postId);
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
  return `<section class="phone-shell"><header class="hero"><p class="eyebrow">青云纪 · AI 修仙世界</p><h1>${escapeHTML(state.user.daoName)}</h1><div class="chips"><span>${escapeHTML(state.user.city)}分舵</span><span>${escapeHTML(state.profile.currentRealm)}</span><span>${state.collectibles.length} 件藏品</span></div></header>${state.tab === 'today' ? TodayView() : ''}${state.tab === 'profile' ? ProfileView() : ''}${state.tab === 'artifacts' ? ArtifactView() : ''}${state.tab === 'sect' ? SectView() : ''}<nav class="tabbar">${TabButton('today', '今日')}${TabButton('profile', '档案')}${TabButton('artifacts', '藏品')}${TabButton('sect', '分舵')}</nav></section>`;
}

function Onboarding() {
  return `<section class="onboarding"><div class="moon"></div><p class="eyebrow">一个会记住你的 AI 修仙世界</p><h1>今日入道，明日因果自来。</h1><form id="profile-form" class="card form-card"><label>道号<input name="daoName" placeholder="如：云栖子" maxlength="12" /></label><label>所在城市<input name="city" placeholder="如：杭州" maxlength="12" /></label><button type="submit">踏入仙途</button></form></section>`;
}

function TodayView() {
  const event = currentEvent();
  const collectible = state.collectibles.find((item) => item.id === event.collectibleId);
  return `<article class="card scroll-card"><p class="date">${event.date}</p><h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(event.content).replace(/\n/g, '<br />')}</p><div class="choices">${event.selectedChoiceId ? `<div class="result">${escapeHTML(event.result)}</div>` : event.choices.map((choice) => `<button data-choice="${choice.id}" data-event="${event.id}">${escapeHTML(choice.text)}<small>${escapeHTML(choice.tendency)}</small></button>`).join('')}</div>${collectible ? ArtifactDrop(collectible) : ''}</article>`;
}

function ArtifactDrop(collectible) {
  return `<div class="artifact-drop"><div>获得藏品：<strong>${escapeHTML(collectible.name)}</strong></div><span>唯一印记 ${escapeHTML(collectible.uniqueHash)}</span><button data-tab="artifacts">入藏品阁查看</button></div>`;
}

function ProfileView() {
  return `<section class="card"><h2>修仙档案</h2>${Object.entries(state.profile).map(([key, value]) => `<div class="memory"><b>${labelFor(key)}</b><p>${escapeHTML(value)}</p></div>`).join('')}</section>`;
}

function ArtifactView() {
  const counts = rarityTable.reduce((memo, rarity) => ({ ...memo, [rarity.key]: state.collectibles.filter((item) => item.rarity === rarity.key).length }), {});
  const filtered = state.collectibles.filter((item) => state.artifactFilter === 'all' || item.rarity === state.artifactFilter);
  const selected = state.collectibles.find((item) => item.id === state.selectedArtifactId) || filtered[0];
  return `<section class="grid-list"><div class="section-head"><div><p class="eyebrow">唯一藏品 · ${state.collectibles.length} 件</p><h2>藏品阁</h2></div></div><div class="filter-row">${FilterButton('all', `全部 ${state.collectibles.length}`)}${rarityTable.map((rarity) => FilterButton(rarity.key, `${rarity.label} ${counts[rarity.key]}`)).join('')}</div>${selected ? ArtifactDetail(selected) : '<p class="empty">尚无藏品。完成每日事件，或许会有灵物择主。</p>'}<div class="artifact-list">${filtered.map(ArtifactCard).join('')}</div></section>`;
}

function FilterButton(filter, label) {
  return `<button class="filter ${state.artifactFilter === filter ? 'active' : ''}" data-artifact-filter="${filter}">${escapeHTML(label)}</button>`;
}

function ArtifactCard(item) {
  return `<article class="card artifact mini ${state.selectedArtifactId === item.id ? 'selected' : ''}" data-artifact="${item.id}"><div class="artifact-orb ${item.tone}"></div><span>${escapeHTML(item.rarityLabel)}</span><h3>${escapeHTML(item.name)}</h3><small>#${escapeHTML(item.serial)} · ${escapeHTML(item.uniqueHash.slice(0, 10))}</small></article>`;
}

function ArtifactDetail(item) {
  const sourceEvent = state.events.find((event) => event.id === item.sourceEventId);
  return `<article class="card artifact-detail"><div class="artifact-visual"><div class="artifact-orb large ${item.tone}"></div><div><span>${escapeHTML(item.rarityLabel)}</span><h3>${escapeHTML(item.name)}</h3><small>藏品编号 #${escapeHTML(item.serial)}</small></div></div><p>${escapeHTML(item.description)}</p><div class="seal-grid"><div><b>唯一印记</b><code>${escapeHTML(item.uniqueHash)}</code></div><div><b>来源事件</b><span>${escapeHTML(sourceEvent?.title || '未知因果')}</span></div><div><b>获得日期</b><span>${escapeHTML(item.createdAt.slice(0, 10))}</span></div></div><p class="lore">${escapeHTML(item.lore)}</p><details><summary>AI 图像 Prompt</summary><p>${escapeHTML(item.imagePrompt)}</p></details><button data-favorite-artifact="${item.id}">${item.favorite ? '取消供奉' : '设为供奉'}</button></article>`;
}

function SectView() {
  const posts = state.posts.filter((post) => post.city === state.user.city);
  return `<section class="grid-list"><div class="section-head"><div><p class="eyebrow">${escapeHTML(state.user.city)} · ${posts.length} 条因果</p><h2>${escapeHTML(state.user.city)}宗门分舵</h2></div></div><form id="sect-form" class="card sect-form"><label>分享修仙经历<textarea name="content" maxlength="180" placeholder="写下今日所见、所得或想对同城道友说的话……"></textarea></label><label>附带藏品<select name="artifactId"><option value="">不附带</option>${state.collectibles.map((item) => `<option value="${item.id}">${escapeHTML(item.name)}</option>`).join('')}</select></label><button type="submit">发布到分舵</button><button type="button" class="secondary" id="share-latest">一键分享最近事件</button></form>${posts.map(SectPost).join('')}</section>`;
}

function SectPost(post) {
  const liked = state.likedPostIds.includes(post.id);
  return `<article class="card post"><div class="post-head"><b>${escapeHTML(post.author)}</b><small>${new Date(post.createdAt).toLocaleDateString('zh-CN')}</small></div><p>${escapeHTML(post.content)}</p>${post.featuredArtifactName ? `<div class="post-artifact">携带藏品：${escapeHTML(post.featuredArtifactName)}</div>` : ''}<button class="like ${liked ? 'liked' : ''}" data-like-post="${post.id}" ${liked ? 'disabled' : ''}>${liked ? '已结缘' : '灵赞'} ${post.likeCount}</button></article>`;
}

function TabButton(tab, label) {
  return `<button class="${state.tab === tab ? 'active' : ''}" data-tab="${tab}">${label}</button>`;
}

function labelFor(key) {
  return { personalitySummary: '道心性情', cultivationPath: '修行路线', currentRealm: '当前境界', majorEventsSummary: '重要经历', relationshipSummary: '人情因果', artifactSummary: '灵物记忆', worldStateSummary: '世界状态' }[key] || key;
}

function render() {
  document.querySelector('#app').innerHTML = App();
}

document.addEventListener('submit', (event) => {
  if (event.target.id === 'profile-form') { event.preventDefault(); createProfile(new FormData(event.target)); }
  if (event.target.id === 'sect-form') { event.preventDefault(); const formData = new FormData(event.target); createSectPost(formData.get('content') || '', formData.get('artifactId') || ''); }
});

document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]')?.dataset.tab;
  if (tab) setTab(tab);
  const choice = event.target.closest('[data-choice]');
  if (choice) completeEvent(choice.dataset.event, choice.dataset.choice);
  const artifact = event.target.closest('[data-artifact]');
  if (artifact) selectArtifact(artifact.dataset.artifact);
  const filter = event.target.closest('[data-artifact-filter]');
  if (filter) setArtifactFilter(filter.dataset.artifactFilter);
  const favorite = event.target.closest('[data-favorite-artifact]');
  if (favorite) toggleFavoriteArtifact(favorite.dataset.favoriteArtifact);
  const like = event.target.closest('[data-like-post]');
  if (like) likeSectPost(like.dataset.likePost);
  if (event.target.id === 'share-latest') shareLatestEvent();
});

render();

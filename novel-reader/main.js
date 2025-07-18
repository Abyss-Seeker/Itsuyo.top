// 变量定义
let chapters = [];
let currentChapter = 0;
let splitPattern = /\n\n/;
let bookmarksMap = {}; // 新增：以文件名为key的书签映射
let currentFileName = '';
let settings = {
    splitPattern: '\n\n',
    fontSize: 1.1,
    darkMode: false
};
let originalText = '';

// DOM 元素
const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');
const loadingDiv = document.getElementById('loading');
const chapterMenu = document.getElementById('chapter-menu');
const chapterTitle = document.getElementById('chapter-title');
const chapterContent = document.getElementById('chapter-content');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const bookmarkBtn = document.getElementById('bookmark-btn');
const colorToggle = document.getElementById('color-toggle');
const fontSizeDec = document.getElementById('font-size-dec');
const fontSizeInc = document.getElementById('font-size-inc');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const splitPatternInput = document.getElementById('split-pattern');
const saveSettingsBtn = document.getElementById('save-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const titlePatternInput = document.getElementById('title-pattern');
const titleRegexInput = document.getElementById('title-regex');
const splitRegexInput = document.getElementById('split-regex');
const showMenuBtn = document.getElementById('show-menu-btn');
const menuMask = document.getElementById('menu-mask');

// 事件绑定
importBtn.onclick = () => fileInput.click();
fileInput.onchange = handleFileImport;
settingsBtn.onclick = () => { settingsModal.style.display = 'block'; };
closeSettingsBtn.onclick = () => { settingsModal.style.display = 'none'; };
saveSettingsBtn.onclick = saveSettings;
prevBtn.onclick = () => jumpToChapter(currentChapter - 1);
nextBtn.onclick = () => jumpToChapter(currentChapter + 1);
function updateColorToggleText() {
    colorToggle.textContent = document.body.classList.contains('dark-mode') ? '亮灯' : '关灯';
}
colorToggle.onclick = function() {
    toggleDarkMode();
    updateColorToggleText();
};
fontSizeDec.onclick = () => changeFontSize(-0.1);
fontSizeInc.onclick = () => changeFontSize(0.1);
bookmarkBtn.onclick = toggleBookmark;

// 预留：加载缓存、初始化设置
window.onload = function() {
    loadCache();
    applySettings();
    // 设置弹窗初始值
    splitPatternInput.value = settings.splitPattern || '\n\n';
    splitRegexInput.checked = !!settings.splitRegex;
    titlePatternInput.value = settings.titlePattern || '^.*$';
    titleRegexInput.checked = !!settings.titleRegex;
    updateColorToggleText();
};

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    loadingDiv.style.display = 'block';
    currentFileName = file.name; // 记录当前文件名
    localStorage.setItem('novel_reader_last_file', currentFileName); // 记住上次打开的文件名
    localStorage.removeItem('novel_reader_cache');
    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        originalText = text; // 保存原始全文
        splitChapters(text);
        loadingDiv.style.display = 'none';
        renderChapterMenu();
        jumpToChapter(0);
        saveCache();
    };
    reader.readAsText(file, 'utf-8');
}

function splitChapters(text) {
    let pattern = settings.splitPattern || '\n\n';
    let useRegex = settings.splitRegex;
    try {
        if (useRegex) {
            splitPattern = new RegExp(pattern, 'g');
        } else {
            splitPattern = pattern.replace(/\\n/g, '\n');
        }
    } catch {
        splitPattern = /\n\n/g;
    }
    if (useRegex) {
        chapters = text.split(splitPattern).map(s => s.trim()).filter(Boolean);
    } else {
        chapters = text.split(splitPattern).map(s => s.trim()).filter(Boolean);
    }
}

function renderChapterMenu() {
    chapterMenu.innerHTML = '';
    // 获取当前文件的书签
    let bookmarks = bookmarksMap[currentFileName] || [];
    chapters.forEach((chapter, idx) => {
        // 章节名提取
        let title = '';
        if (settings.titleRegex) {
            try {
                const match = chapter.match(new RegExp(settings.titlePattern || '^.*$', 'm'));
                title = match ? match[0] : `第${idx+1}章`;
            } catch {
                title = chapter.split('\n')[0] || `第${idx+1}章`;
            }
        } else {
            // 普通模式：取第一行
            title = chapter.split(settings.titlePattern || '\n')[0] || `第${idx+1}章`;
        }
        const btn = document.createElement('button');
        btn.textContent = title;
        btn.onclick = () => jumpToChapter(idx);
        if (idx === currentChapter) btn.classList.add('active');
        if (bookmarks.includes(idx)) btn.classList.add('bookmarked');
        if (title.length <= 6) btn.setAttribute('data-len', 'short');
        else if (title.length <= 10) btn.setAttribute('data-len', 'medium');
        else if (title.length <= 16) btn.setAttribute('data-len', 'long');
        else btn.setAttribute('data-len', 'xlong');
        chapterMenu.appendChild(btn);
    });
}

// 拖拽分栏功能
const dragbar = document.getElementById('dragbar');
let isDragging = false;
dragbar.addEventListener('mousedown', function(e) {
    isDragging = true;
    document.body.style.cursor = 'ew-resize';
});
document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const container = document.getElementById('container');
    const menu = document.getElementById('chapter-menu');
    let newWidth = e.clientX - container.getBoundingClientRect().left;
    newWidth = Math.max(120, Math.min(newWidth, window.innerWidth * 0.5));
    menu.style.width = newWidth + 'px';
    menu.style.flex = 'none';
});
document.addEventListener('mouseup', function(e) {
    if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
    }
});

// 目录弹出/隐藏逻辑
function openMenu() {
    document.body.classList.add('mobile-menu-active');
    menuMask.style.display = 'block';
    document.body.style.overflow = 'hidden';
}
function closeMenu() {
    document.body.classList.remove('mobile-menu-active');
    menuMask.style.display = 'none';
    document.body.style.overflow = '';
}
showMenuBtn.onclick = openMenu;
// 覆盖menuMask点击逻辑，仅移动端下点击遮罩收回目录
menuMask.onclick = function(e) {
    if (window.innerWidth <= 600 || window.innerHeight > window.innerWidth) {
        closeMenu();
    }
};
// 目录栏内点击目录后自动关闭（移动端）
chapterMenu.addEventListener('click', function(e) {
    if (window.innerWidth <= 900 || window.innerWidth > window.innerWidth) {
        closeMenu();
    }
});
// 屏幕变化时自动隐藏目录栏
window.addEventListener('resize', function() {
    if (window.innerWidth > 900 && window.innerWidth > window.innerHeight) {
        closeMenu();
    }
});

function jumpToChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;
    currentChapter = idx;
    const btns = document.querySelectorAll('#chapter-menu button');
    // 获取当前文件的书签
    let bookmarks = bookmarksMap[currentFileName] || [];
    btns.forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
        btn.classList.toggle('bookmarked', bookmarks.includes(i));
    });
    const chapter = chapters[idx] || '';
    const lines = chapter.split('\n');
    chapterTitle.textContent = lines[0] || `第${idx+1}章`;
    chapterContent.innerHTML = lines.slice(1).map(p => `<p>${p.replace(/\s/g, '&nbsp;')}</p>`).join('');
    bookmarkBtn.classList.toggle('active', bookmarks.includes(currentChapter));
    chapterContent.scrollTop = 0;
    // 自动将当前目录按钮滚动到中间
    if (btns[idx]) {
        const menu = chapterMenu;
        const btn = btns[idx];
        const menuRect = menu.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        menu.scrollTop = btn.offsetTop - menu.offsetHeight / 2 + btn.offsetHeight / 2;
    }
    saveCache();
}

function toggleBookmark() {
    if (!currentFileName) return;
    let bookmarks = bookmarksMap[currentFileName] || [];
    if (!bookmarks.includes(currentChapter)) {
        bookmarks.push(currentChapter);
    } else {
        bookmarks = bookmarks.filter(b => b !== currentChapter);
    }
    bookmarksMap[currentFileName] = bookmarks;
    renderChapterMenu(); // 立即刷新目录高亮
    saveCache();
}

function toggleDarkMode() {
    settings.darkMode = !settings.darkMode;
    applySettings();
    saveCache();
}

function changeFontSize(delta) {
    settings.fontSize = Math.max(0.8, Math.min(2.5, (settings.fontSize || 1.1) + delta));
    applySettings();
    saveCache();
}

function applySettings() {
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        chapterContent.style.background = '#23272e';
        chapterContent.style.color = '#e0e0e0';
        document.getElementById('reader-section').style.background = '#23272e';
    } else {
        document.body.classList.remove('dark-mode');
        chapterContent.style.background = '';
        chapterContent.style.color = '';
        document.getElementById('reader-section').style.background = '';
    }
    chapterContent.style.fontSize = settings.fontSize + 'rem';
    updateColorToggleText();
}

function saveSettings() {
    settings.splitPattern = splitPatternInput.value || '\n\n';
    settings.splitRegex = splitRegexInput.checked;
    settings.titlePattern = titlePatternInput.value || '^.*$';
    settings.titleRegex = titleRegexInput.checked;
    settingsModal.style.display = 'none';
    // 重新分割章节并刷新目录，基于原始全文
    if (originalText) {
        splitChapters(originalText);
        renderChapterMenu();
        jumpToChapter(0);
    }
    saveCache();
}

function saveCache() {
    // 保存所有文件的书签
    localStorage.setItem('novel_reader_cache', JSON.stringify({
        currentChapter,
        bookmarksMap,
        settings,
        currentFileName
    }));
}

function loadCache() {
    const cache = localStorage.getItem('novel_reader_cache');
    if (!cache) return;
    try {
        const data = JSON.parse(cache);
        currentChapter = data.currentChapter || 0;
        bookmarksMap = data.bookmarksMap || {};
        settings = Object.assign(settings, data.settings || {});
        currentFileName = data.currentFileName || '';
        splitPatternInput.value = settings.splitPattern || '\n\n';
    } catch {}
} 
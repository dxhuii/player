let player = null;
let currentIndex = 0;
let playlist = [];
let isWebFullscreen = false;
let isFullscreen = false;
let wasFullscreen = false;
let wasWebFullscreen = false;

// 主题切换
window.toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
};

// 更新主题图标
function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (theme === 'dark') {
    icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"></path>';
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  }
}

// 初始化主题
function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      updateThemeIcon(newTheme);
    }
  });
}

initTheme();

// 从URL获取视频链接
function getVideoLink() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('link');
}

// 初始化页面
function initPage() {
  const link = getVideoLink();
  if (link) {
    playlist = [link];
    currentIndex = 0;
    initPlayer(link);
  }
}

initPage();

function full() {
  wasFullscreen = player.fullscreen;
  wasWebFullscreen = player.fullscreenWeb;
}

async function initPlayer(url) {
  if (player) {
    full()
    player.destroy();
  }
  const isM3u8 = url.includes('.m3u8') && !url.includes('@@noad');
  let playUrl = url.includes('@@') ? url.split('@@')[1] : url;

  player = new Artplayer({
    container: '#playerCnt',
    poster: 'https://unmc.bj.bcebos.com/1709555341156_728368261.jpg',
    url: playUrl,
    theme: '#b98de4',
    muted: false,
    autoPlayback: true,
    autoplay: true,
    flip: true,
    pip: true,
    autoSize: false,
    autoMini: true,
    setting: true,
    loop: false,
    lock: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    hotkey: true,
    backdrop: true,
    fastForward: true,
    playsInline: true,
    autoOrientation: true,
    type: isM3u8 || url.includes('@@noad') ? 'm3u8' : 'mp4',
    contextmenu: [
      {
        html: 'cms',
        click: function () {
          window.open("https://www.cms.im");
        },
      },
    ],
    customType: {
      m3u8: playM3u8,
    },
    controls: [
      {
        name: 'sourceSwitchButton',
        position: 'right',
        html: `第 ${currentIndex + 1} 集`,
        selector: playlist.map((_, i) => ({ html: `第 ${i + 1} 集`, i, default: i === currentIndex })),
        onSelect: function (item, $dom) {
          if (!item.default) {
            window.changeEpisode(item.i);
            return item.html;
          }
          return item.html;
        },
      },
    ],
  });

  player.on('fullscreenWeb', (state) => {
    isWebFullscreen = state;
  });

  player.on('fullscreen', (state) => {
    isFullscreen = state;
  });

  function addTitleBar(ap, name) {
    ap.layers.add({
      name: 'titleBar',
      html: `<div class="art-bottom" style="position: unset;font-size: 1.2em;background: linear-gradient(180deg, rgba(0, 0, 0, .8), rgba(0, 0, 0, .0001))!important;line-height: 1.5;transition: opacity 0.1s;padding: 0.666em 1.333em 1.2em;pointer-events: none;">${name}</div>`,
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
      },
      click: function () {
        ap.playing ? ap.pause() : ap.play();
      },
    });
  }

  player.on('ready', () => {
    addTitleBar(player, `第 ${currentIndex + 1} 集`);

    // 恢复全屏状态
    if (wasFullscreen || wasWebFullscreen) {
      setTimeout(() => {
        if (wasFullscreen) {
          player.fullscreen = true;
        }
        if (wasWebFullscreen) {
          player.fullscreenWeb = true;
        }
        wasFullscreen = false;
        wasWebFullscreen = false;
      }, 100);
    }

    const playPauseBtn = document.querySelector('.art-control-playAndPause');

    // 添加下一集按钮
    if (currentIndex < playlist.length - 1) {
      const nextBtn = document.createElement('div');
      nextBtn.className = 'art-control art-control-next';
      nextBtn.setAttribute('data-index', '10');
      nextBtn.innerHTML = '<i class="art-icon art-icon-next hint--rounded hint--top" aria-label="下一集" style="display: flex;"><svg xmlns="http://www.w3.org/2000/svg" height="22" width="22"><path d="M16 5a1 1 0 00-1 1v4.615a1.431 1.431 0 00-.615-.829L7.21 5.23A1.439 1.439 0 005 6.445v9.11a1.44 1.44 0 002.21 1.215l7.175-4.555a1.436 1.436 0 00.616-.828V16a1 1 0 002 0V6C17 5.448 16.552 5 16 5z"></path></svg></i>';
      playPauseBtn.insertAdjacentElement('afterend', nextBtn);
      nextBtn.addEventListener('click', () => {
        window.nextEpisode();
      });
    }

    // 添加上一集按钮
    if (currentIndex > 0) {
      const prevBtn = document.createElement('div');
      prevBtn.className = 'art-control art-control-prev';
      prevBtn.setAttribute('data-index', '9');
      prevBtn.innerHTML = '<i class="art-icon art-icon-prev hint--rounded hint--top" aria-label="上一集" style="display: flex;"><svg xmlns="http://www.w3.org/2000/svg" height="22" width="22"><path d="M7 5a1 1 0 011 1v4.615c.167-.309.37-.6.615-.829L15.79 5.23A1.439 1.439 0 0118 6.445v9.11a1.44 1.44 0 01-2.21 1.215l-7.175-4.555a1.436 1.436 0 01-.616-.828V16a1 1 0 01-2 0V6c0-.552.448-1 1-1z"></path></svg></i>';
      playPauseBtn.insertAdjacentElement('afterend', prevBtn);
      prevBtn.addEventListener('click', () => {
        window.prevEpisode();
      });
    }
  });

  // 播放结束自动下一集
  player.on('video:ended', () => {
    if (currentIndex < playlist.length - 1) {
      full()
      currentIndex++;
      initPlayer(playlist[currentIndex]);
    }
  });
}

// 播放m3u8格式
function playM3u8(video, url, art) {
  try {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      art.hls = hls;

      hls.on(Hls.Events.ERROR, function (event, data) {
        art.notice.show = '视频加载失败，请检查地址是否正确';
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      art.notice.show = '当前浏览器不支持m3u8格式播放';
    }
  } catch (error) {
    console.error('播放器错误:', error);
    art.notice.show = '视频播放出错，请刷新重试';
  }
}

// 添加加载状态
function setLoading(loading) {
  const btn = document.getElementById('loadBtn');
  const loadIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
  const loadingIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="loading-icon"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';
  btn.disabled = loading;
  btn.querySelector('span').innerHTML = loading ? ' 加载中...' : ' 点击播放';
  if (loading) {
    btn.style.opacity = '0.7';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

// 加载播放列表
window.loadPlaylist = async () => {
  const text = document.getElementById('playlist').value;
  if (!text.trim()) {
    alert('请输入视频地址');
    return;
  }
  setLoading(true);
  try {
    const text = document.getElementById('playlist').value;
    playlist = text.split('\n').filter(url => url.trim());
    currentIndex = 0;
    if (playlist.length > 0) {
      initPlayer(playlist[0]);
    }
  } catch (error) {
    alert('加载失败，请重试');
  } finally {
    setLoading(false);
  }
}

// 切换分集
window.changeEpisode = (index) => {
  full()
  currentIndex = Number(index);
  initPlayer(playlist[currentIndex]);
}

// 上一集
window.prevEpisode = () => {
  if (currentIndex > 0) {
    full()
    currentIndex--;
    initPlayer(playlist[currentIndex]);
  }
}

// 下一集
window.nextEpisode = () => {
  if (currentIndex < playlist.length - 1) {
    full()
    currentIndex++;
    initPlayer(playlist[currentIndex]);
  }
}

// 语言切换
window.toggleLanguage = () => {
  const currentLang = localStorage.getItem('language') || getDefaultLanguage();
  const newLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('language', newLang);
  redirectToLanguagePage(newLang);
};

// 获取默认语言
function getDefaultLanguage() {
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}

// 根据语言重定向到对应页面
function redirectToLanguagePage(lang) {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const basePath = currentPath.includes('/zh/') ? '/zh/' : '/';
  const targetPath = lang === 'zh' ? '/zh/' : '/';

  if (basePath !== targetPath) {
    const newPath = currentPath.replace(basePath, targetPath);
    window.location.href = newPath + currentSearch;
  }
}

// 初始化语言
function initLanguage() {
  const savedLang = localStorage.getItem('language');
  // 只在没有用户语言偏好记录时，根据系统语言进行自动跳转
  if (!savedLang) {
    const defaultLang = getDefaultLanguage();
    const currentPath = window.location.pathname;
    const isInZhPath = currentPath.includes('/zh/');

    if ((defaultLang === 'zh' && !isInZhPath) || (defaultLang === 'en' && isInZhPath)) {
      redirectToLanguagePage(defaultLang);
    }
  }
}

initLanguage();

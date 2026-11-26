/* CodeVerse 主题双写桥接
   目标：Butterfly 原生用 localStorage.theme 切换 html[data-theme]；
        设计规范用 codeverse-theme 作为持久键。两者必须双向同步，
         否则用户在两套控件间切换会出现主题回跳。

   策略：
     1. MutationObserver 监听 html[data-theme] —— 最可靠的捕获点，
        不依赖 Butterfly 的存储键名或格式（CDN 版本可能改）。
     2. 拦截 localStorage.setItem —— 覆盖「写存储但尚未触发 DOM 变化」的时序。
     3. 首帧脚本已在 head 注入，负责从任一键读取并预置 data-theme。

   所有监听挂在 document / 原型上，Pjax 换页不销毁，无需重绑。 */
(function () {
  'use strict';

  var KEY = 'codeverse-theme';
  var root = document.documentElement;

  // Butterfly 存储值形如 { value: 'dark', expire: ... }，也可能直接是字符串
  function decode(raw) {
    if (raw == null) return null;
    try {
      var v = JSON.parse(raw);
      return v && v.value ? v.value : (typeof v === 'string' ? v : null);
    } catch (e) {
      return raw === 'dark' || raw === 'light' ? raw : null;
    }
  }

  function write(mode) {
    if (mode !== 'dark' && mode !== 'light') return;
    try {
      // 与 Butterfly 的 saveToLocal 同结构，便于首帧脚本统一读取
      localStorage.setItem(KEY, JSON.stringify({ value: mode, expire: 0 }));
    } catch (e) {
      try { localStorage.setItem(KEY, mode); } catch (ignore) {}
    }
  }

  // 1) DOM 属性变化 → 同步到规范键
  var last = root.getAttribute('data-theme');
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.attributeName !== 'data-theme') continue;
      var mode = root.getAttribute('data-theme');
      if (mode === last) continue;
      last = mode;
      write(mode);
      document.dispatchEvent(new CustomEvent('codeverse:themechange', { detail: { theme: mode } }));
      break;
    }
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  // 2) 拦截 theme 键写入 → 立即镜像（处理先写存储后改 DOM 的竞态）
  var originalSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === 'theme') {
      var mode = decode(value);
      if (mode) write(mode);
    }
    return originalSet.apply(this, arguments);
  };

  // 3) 首次加载：把当前 DOM 状态补写一次，保证两键始终一致
  write(root.getAttribute('data-theme') || 'light');
})();

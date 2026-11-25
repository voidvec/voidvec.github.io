/* 项目轴交互：分类筛选、项目栈筛选、模块折叠
   全部走 document 级事件委托，PJAX 切换页面后依然有效 */
(function () {
  'use strict';

  function facetState(container) {
    var state = {};
    var groups = container.querySelectorAll('[data-facet]');
    Array.prototype.forEach.call(groups, function (g) {
      var active = g.querySelector('.pj-chip.is-active');
      state[g.getAttribute('data-facet')] = active ? active.getAttribute('data-value') : 'all';
    });
    return state;
  }

  function applyFacets(container) {
    var state = facetState(container);
    var list = document.querySelector('[data-pj-list]');
    if (!list) return;

    var active = Object.keys(state).some(function (k) { return state[k] !== 'all'; });
    var items = list.querySelectorAll('.article-sort-item');

    Array.prototype.forEach.call(items, function (item) {
      if (item.classList.contains('year')) {
        item.style.display = active ? 'none' : '';
        return;
      }
      var ok = true;
      Object.keys(state).forEach(function (facet) {
        if (state[facet] === 'all') return;
        if (item.getAttribute('data-' + facet) !== state[facet]) ok = false;
      });
      item.style.display = ok ? '' : 'none';
    });
  }

  function applyStack(container) {
    var active = container.querySelector('.pj-chip.is-active');
    var stack = active ? active.getAttribute('data-stack') : 'all';
    var cards = document.querySelectorAll('.pj-card[data-stack]');
    Array.prototype.forEach.call(cards, function (card) {
      var show = stack === 'all' || card.getAttribute('data-stack') === stack;
      card.style.display = show ? '' : 'none';
    });
  }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    var chip = target.closest('.pj-chip');
    if (chip) {
      var box = chip.closest('[data-pj-filter]');
      if (box) {
        e.preventDefault();
        var siblings = box.querySelectorAll('.pj-chip');
        Array.prototype.forEach.call(siblings, function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        if (chip.hasAttribute('data-stack')) applyStack(box);
        else applyFacets(box);
        return;
      }
    }

    var more = target.closest('[data-pj-more]');
    if (more) {
      var mod = more.closest('.pj-module');
      if (!mod) return;
      var collapsed = mod.querySelectorAll('.pj-doc.is-collapsed');
      var opened = more.getAttribute('data-open') === '1';
      Array.prototype.forEach.call(collapsed, function (doc) {
        doc.classList.toggle('is-open', !opened);
      });
      more.setAttribute('data-open', opened ? '0' : '1');
      more.textContent = opened ? '展开全部 ' + collapsed.length + ' 篇' : '收起';
    }
  });
})();

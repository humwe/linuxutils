// ==UserScript==
// @namespace         https://www.github.com/Cat7373/

// @name              網頁限制解除
// @name:en           Remove web limits
// @name:zh           網頁限制解除
// @name:zh-CN        網頁限制解除
// @name:zh-TW        網頁限制解除
// @name:ja           ウェブの規制緩和

// @description       通殺大部分網站，可以解除禁止覆制、剪切、選擇文本、右鍵菜單的限制。
// @description:en    Pass to kill most of the site, you can lift the restrictions prohibited to copy, cut, select the text, right-click menu.
// @description:zh    通殺大部分網站，可以解除禁止覆制、剪切、選擇文本、右鍵菜單的限制。
// @description:zh-CN 通殺大部分網站，可以解除禁止覆制、剪切、選擇文本、右鍵菜單的限制。
// @description:zh-TW 通殺大部分網站，可以解除禁止復制、剪切、選擇文本、右鍵菜單的限制。
// @description:ja    サイトのほとんどを殺すために渡し、あなたは、コピー切り取り、テキスト、右クリックメニューを選択することは禁止の制限を解除することができます。

// @homepageURL       https://cat7373.github.io/remove-web-limits/
// @supportURL        https://github.com/Cat7373/remove-web-limits/issues/
// @updateURL         https://cat7373.github.io/remove-web-limits/remove_web_limits.user.js

// @author            Cat73
// @version           1.3
// @license           LGPLv3

// @compatible        chrome Chrome_46.0.2490.86 + TamperMonkey + 腳本_1.3 測試通過
// @compatible        firefox Firefox_42.0 + GreaseMonkey + 腳本_1.2.1 測試通過
// @compatible        opera Opera_33.0.1990.115 + TamperMonkey + 腳本_1.1.3 測試通過
// @compatible        safari 未測試

// @match             *://*/*
// @grant             none
// @run-at            document-start
// ==/UserScript==
(function() {
  'use strict';

  // 域名規則列表
  var rules = {
    black_rule: {
      name: "black",
      hook_eventNames: "",
      unhook_eventNames: ""
    },
    default_rule: {
      name: "default",
      hook_eventNames: "contextmenu|select|selectstart|copy|cut|dragstart",
      unhook_eventNames: "mousedown|mouseup|keydown|keyup",
      dom0: true,
      hook_addEventListener: true,
      hook_preventDefault: true,
      hook_set_returnValue: true,
      add_css: true
    }
  };
  // 域名列表
  var lists = {
    // 黑名單
    black_list: [
      /.*\.youtube\.com.*/,
      /.*\.wikipedia\.org.*/,
      /mail\.qq\.com.*/,
      /translate\.google\..*/
    ]
  };

  // 要處理的 event 列表
  var hook_eventNames, unhook_eventNames, eventNames;
  // 儲存名稱
  var storageName = getRandStr('qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM', parseInt(Math.random() * 12 + 8));
  // 儲存被 Hook 的函數
  var EventTarget_addEventListener = EventTarget.prototype.addEventListener;
  var document_addEventListener = document.addEventListener;
  var Event_preventDefault = Event.prototype.preventDefault;

  // Hook addEventListener proc
  function addEventListener(type, func, useCapture) {
    var _addEventListener = this === document ? document_addEventListener : EventTarget_addEventListener;
    if(hook_eventNames.indexOf(type) >= 0) {
      _addEventListener.apply(this, [type, returnTrue, useCapture]);
    } else if(this && unhook_eventNames.indexOf(type) >= 0) {
      var funcsName = storageName + type + (useCapture ? 't' : 'f');

      if(this[funcsName] === undefined) {
        this[funcsName] = [];
        _addEventListener.apply(this, [type, useCapture ? unhook_t : unhook_f, useCapture]);
      }

      this[funcsName].push(func);
    } else {
      _addEventListener.apply(this, arguments);
    }
  }

  // 清理循環
  function clearLoop() {
    var elements = getElements();

    for(var i in elements) {
      for(var j in eventNames) {
        var name = 'on' + eventNames[j];
        if(elements[i][name] !== null && elements[i][name] !== onxxx) {
          if(unhook_eventNames.indexOf(eventNames[j]) >= 0) {
            elements[i][storageName + name] = elements[i][name];
            elements[i][name] = onxxx;
          } else {
            elements[i][name] = null;
          }
        }
      }
    }
  }

  // 返回true的函數
  function returnTrue(e) {
    return true;
  }
  function unhook_t(e) {
    return unhook(e, this, storageName + e.type + 't');
  }
  function unhook_f(e) {
    return unhook(e, this, storageName + e.type + 'f');
  }
  function unhook(e, self, funcsName) {
    var list = self[funcsName];
    for(var i in list) {
      list[i](e);
    }

    e.returnValue = true;
    return true;
  }
  function onxxx(e) {
    var name = storageName + 'on' + e.type;
    this[name](e);

    e.returnValue = true;
    return true;
  }

  // 獲取隨機字符串
  function getRandStr(chs, len) {
    var str = '';

    while(len--) {
      str += chs[parseInt(Math.random() * chs.length)];
    }

    return str;
  }

  // 獲取所有元素 包括document
  function getElements() {
    var elements = Array.prototype.slice.call(document.getElementsByTagName('*'));
    elements.push(document);

    return elements;
  }

  // 添加css
  function addStyle(css) {
    var style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  // 獲取目標域名應該使用的規則
  function getRule(url) {
    function testUrl(list, url) {
      for(var i in list) {
        if(list[i].test(url)) {
          return true;
        }
      }

      return false;
    }

    if(testUrl(lists.black_list, url)) {
      return rules.black_rule;
    }

    return rules.default_rule;
  }

  // 初始化
  function init() {
    // 獲取當前域名的規則
    var url = window.location.host + window.location.pathname;
    var rule = getRule(url);

    // 設置 event 列表
    hook_eventNames = rule.hook_eventNames.split("|");
    // TODO Allowed to return value
    unhook_eventNames = rule.unhook_eventNames.split("|");
    eventNames = hook_eventNames.concat(unhook_eventNames);

    // 調用清理 DOM0 event 方法的循環
    if(rule.dom0) {
      setInterval(clearLoop, 30 * 1000);
      setTimeout(clearLoop, 2500);
      window.addEventListener('load', clearLoop, true);
      clearLoop();
    }

    // hook addEventListener
    if(rule.hook_addEventListener) {
      EventTarget.prototype.addEventListener = addEventListener;
      document.addEventListener = addEventListener;
    }

    // hook preventDefault
    if(rule.hook_preventDefault) {
      Event.prototype.preventDefault = function() {
        if(eventNames.indexOf(this.type) < 0) {
          Event_preventDefault.apply(this, arguments);
        }
      };
    }

    // Hook set returnValue
    if(rule.hook_set_returnValue) {
      Event.prototype.__defineSetter__('returnValue', function() {
        if(this.returnValue !== true && eventNames.indexOf(this.type) >= 0) {
          this.returnValue = true;
        }
      });
    }

    console.debug('url: ' + url, 'storageName：' + storageName, 'rule: ' + rule.name);

    // 添加CSS
    if(rule.add_css) {
      addStyle('html, * {-webkit-user-select:text!important; -moz-user-select:text!important; user-select:text!important; -ms-user-select:text!important; -khtml-user-select:text!important;}');
    }
  }

  init();
})();

---
title: qiankun如何实现js隔离？
date: 2025-02-13 00:09:00
tags:
  - 微前端
  - 架构
  - 最佳实践
categories:
  - 前端
  - 架构
---

# qiankun如何实现js隔离？
qiankun 提供了两种 JavaScript 隔离方式：

1. **快照沙箱 (SnapshotSandbox)**
- 适用于单实例场景
- 工作原理：
```javascript
class SnapshotSandbox {
  constructor() {
    this.windowSnapshot = {};
    this.modifyPropsMap = {};
  }
  
  // 激活沙箱
  active() {
    // 1. 保存当前 window 状态
    for (const prop in window) {
      this.windowSnapshot[prop] = window[prop];
    }
    
    // 2. 恢复之前的状态
    Object.keys(this.modifyPropsMap).forEach(prop => {
      window[prop] = this.modifyPropsMap[prop];
    });
  }

  // 退出沙箱
  inactive() {
    // 1. 记录更改的状态
    for (const prop in window) {
      if (window[prop] !== this.windowSnapshot[prop]) {
        this.modifyPropsMap[prop] = window[prop];
      }
    }
    
    // 2. 还原 window 状态
    for (const prop in window) {
      window[prop] = this.windowSnapshot[prop];
    }
  }
}
```

2. **代理沙箱 (ProxySandbox)**
- 适用于多实例场景
- 工作原理：
```javascript
class ProxySandbox {
  constructor() {
    const fakeWindow = {};
    const proxy = new Proxy(fakeWindow, {
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
      get: (target, prop) => {
        // 优先从 fake window 中取值
        return prop in target ? target[prop] : window[prop];
      }
    });

    this.proxy = proxy;
  }
}
```

主要隔离原理：

1. **快照沙箱**：
- 进入微应用时保存主应用的 window 状态
- 恢复微应用的 window 状态
- 退出微应用时保存微应用的 window 状态
- 恢复主应用的 window 状态

2. **代理沙箱**：
- 为每个微应用创建一个独立的 fakeWindow
- 通过 Proxy 代理对 window 对象的访问
- 所有对 window 的修改都会被限制在 fakeWindow 中
- 读取时会先从 fakeWindow 查找，找不到再从真实 window 中查找

使用示例：

```javascript
// 在 qiankun 配置中开启 js 沙箱
registerMicroApps([
  {
    name: 'app1',
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app1',
    props: {
      sandbox: {
        experimentalStyleIsolation: true, // 开启样式隔离
        strictStyleIsolation: false,      // 严格的样式隔离
      }
    }
  }
]);
```

需要注意的点：

1. 快照沙箱只适合单实例应用，因为多个实例会相互影响
2. 代理沙箱性能更好，且支持多实例，是更推荐的方案
3. 某些特殊场景可能需要关闭沙箱：
   - 使用一些特殊的第三方库
   - 需要跨应用共享变量
4. 沙箱机制可能无法完全隔离某些复杂的全局污染

这就是 qiankun 实现 JavaScript 隔离的核心机制。通过这种方式，可以有效防止微应用之间的 JavaScript 代码相互污染。

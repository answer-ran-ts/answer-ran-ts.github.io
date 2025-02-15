---
title: 2.15 前端面试复盘（三）
date: 2025-02-15 12:00:00
tags:
  - 前端开发
  - 技术面试
categories:
  - 前端开发
---

# 面试官提问环节

### 面试官：说说你对 Vue 响应式的理解？

Vue 的响应式系统是其核心特性之一，我主要从以下几个方面来理解：

#### Vue2 的响应式实现
```js
// 核心是通过 Object.defineProperty 来劫持对象的属性
function defineReactive(obj, key, val) {
  // 每个属性对应一个 dep 用来收集依赖
  const dep = new Dep()
  
  Object.defineProperty(obj, key, {
    get() {
      // 收集依赖
      if (Dep.target) {
        dep.depend()
      }
      return val
    },
    set(newVal) {
      if (newVal === val) return
      val = newVal
      // 通知更新
      dep.notify()
    }
  })
}

// 实际项目中遇到的问题：
1. 对数组的变化监听需要特殊处理
2. 新增、删除属性需要使用 Vue.set/delete
3. 嵌套对象需要递归遍历
```

#### Vue3 的响应式优化
```js
// 使用 Proxy 来代理整个对象
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      // 触发更新
      trigger(target, key)
      return result
    }
  })
}

// 优势：
1. 可以监听数组变化
2. 可以监听对象属性的添加和删除
3. 支持 Map、Set、WeakMap、WeakSet
4. 性能更好，不需要递归遍历
```

### 面试官：项目中遇到过哪些性能问题？如何解决的？

在之前提到的虚拟表格项目中，我遇到了以下性能问题：

#### 1. 大数据渲染问题
```
问题：10万条数据渲染，导致页面卡顿
解决方案：
1. 实现虚拟滚动，只渲染可视区域数据
2. 使用 transform 代替 top 定位
3. 使用 RAF 优化滚动事件
4. 实现缓冲区机制提升滚动体验
```

#### 2. 频繁更新问题
```
问题：实时数据频繁更新导致性能问题
解决方案：
1. 使用 Web Worker 处理数据计算
2. 实现增量更新机制
3. 使用 Object.freeze 冻结不变数据
4. 优化更新频率，合并多次更新
```

#### 3. 内存泄漏问题
```
问题：长时间运行后内存占用过高
解决方案：
1. 及时清理不可见区域的 DOM
2. 解绑事件监听器
3. 清理定时器和订阅
4. 使用 WeakMap/WeakSet 存储引用
```

### 面试官：你是如何设计一个组件的？

以虚拟表格组件为例，我的设计思路是：

#### 1. 接口设计
```
1. 保持简单直观：
   - 必要的 props：data、columns、height
   - 可选的功能 props：selectable、sortable、expandable
   - 统一的事件命名：onSort、onSelect、onExpand

2. 兼顾灵活性：
   - 支持自定义列模板
   - 支持自定义排序逻辑
   - 支持自定义展开行内容
```

#### 2. 性能考虑
```
1. 渲染性能：
   - 虚拟滚动
   - 函数式组件
   - 合理的更新粒度

2. 内存优化：
   - 缓存计算结果
   - 及时清理资源
   - 优化数据结构
```

#### 3. 可维护性
```
1. 代码组织：
   - 单一职责
   - 逻辑分层
   - 清晰的注释

2. 扩展性：
   - 插件机制
   - 钩子函数
   - 预留扩展接口
```

这些都是我在实际项目中总结的经验，每个方案都经过了实践验证。

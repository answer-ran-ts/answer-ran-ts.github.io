---
title: 小心爆炸💥
date: 2024-05-15 21:03:00
updated: 2025-02-07
tags: [JavaScript, CSS, 前端特效]
categories: 交互
keywords: bubble effect, 气泡特效, 前端动画
description: 一个有趣的网页气泡特效实现，包含浮动气泡和点击爆炸效果，还会随机显示奶茶相关的祝福语。性能优化版本。
---

## 效果介绍

这是我的博客的一个泡泡🫧交互，主要有以下功能：
- 页面上会漂浮着多个半透明的气泡
- 气泡会缓慢上升并旋转
- 点击气泡会产生爆炸效果，并显示随机词汇
- 词汇包含财运、奶茶等多种趣味文本

## 实现步骤

### 1. HTML 结构
整个特效是通过 JavaScript 动态创建的，使用 DocumentFragment 优化 DOM 操作：

```javascript
const fragment = document.createDocumentFragment();
const container = document.createElement('div');
container.className = 'bubble-container';
fragment.appendChild(container);
document.body.appendChild(fragment);
```

### 2. CSS 样式
需要添加以下样式来实现气泡和动画效果：

```css
.bubble-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
  overflow: hidden;
}

.bubble {
  position: absolute;
  bottom: -100px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  animation: float 20s linear infinite;
  pointer-events: auto;
  cursor: pointer;
  will-change: transform;
}

.blessing-text {
  position: fixed;
  transform: translate(-50%, -50%);
  font-size: 1.2em;
  white-space: nowrap;
  pointer-events: none;
  animation: fadeOut 2s forwards;
  z-index: 1000;
}

.particle {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  animation: explode 1s ease-out forwards;
  z-index: 1000;
}

@keyframes float {
  from {
    transform: translateY(100vh) rotate(0deg);
  }
  to {
    transform: translateY(-100vh) rotate(360deg);
  }
}

@keyframes fadeOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes explode {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(100px);
    opacity: 0;
  }
}
```

### 3. JavaScript 实现

#### 3.1 性能优化
```javascript
// 使用 Set 存储活动的泡泡，提高查找和删除效率
const activeBubbles = new Set();

// 缓存随机数生成函数
const random = Math.random;
const floor = Math.floor;
```

#### 3.2 创建气泡
```javascript
function createBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  // 预计算并缓存样式值
  const margin = 150;
  const startX = margin + random() * (window.innerWidth - 2 * margin);
  const duration = 25 + random() * 20;
  const delay = random() * 20;
  const rotation = random() * 360;

  // 使用 cssText 批量设置样式
  bubble.style.cssText = `
    left:${startX}px;
    animation-duration:${duration}s;
    animation-delay:${delay}s;
    transform:rotate(${rotation}deg)
  `;
  
  return bubble;
}
```

### 4. 趣味文本设计

包含了多种主题的祝福语：

```javascript
const blessings = [
  // 财运祝福
  "我看你今天要发财啊💰",
  "今天赚它一个亿💴",
  "钞能力MAX✨",
  
  // 奶茶相关
  `今天喝${milkTeas[random() * milkTeas.length | 0]}🧋`,
  "奶茶要加双倍珍珠🧋",
  
  // 搞笑祝福
  "今天要当最强躺赢王👑",
  "今天要当摸鱼王🐟",
  "摸鱼时间到了~"
];
```

## 性能优化要点

1. DOM 操作优化
   - 使用 DocumentFragment 批量添加元素
   - 使用 cssText 批量设置样式
   - 减少重排重绘

2. 动画性能优化
   - 使用 transform 实现动画
   - 缓存计算结果
   - 添加 will-change 提示

3. 内存管理优化
   - 使用 Set 存储活动元素
   - 及时清理不需要的元素
   - 避免内存泄漏

## 使用方法

1. 将 CSS 代码添加到你的样式文件中
2. 将 JavaScript 代码保存为 `bubble-effect.js`
3. 在页面中引入文件：
```html
<script src="/js/bubble-effect.js"></script>
```

## 注意事项

- 气泡效果只在首页和文章列表页显示
- 已进行性能优化，但仍建议控制气泡数量
- 可以根据需要调整动画参数
- 祝福语可以自定义扩展

## 最后
泡泡带来的不只是视觉效果，更是一份美好的祝福 ✨
---
title: qiankun如何实现css隔离？
date: 2025-02-14 00:09:00
tags:
  - 微前端
  - 架构
  - 最佳实践
categories:
  - 前端
  - 架构
---

# qiankun如何实现css隔离？

qiankun 提供了三种 CSS 隔离方案，用于解决微应用之间的样式冲突问题：

## 1. Shadow DOM 隔离

这是最严格的隔离方式，通过 Web Components 的 Shadow DOM 特性实现完全隔离。

```javascript
registerMicroApps([
  {
    name: 'app1',
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app1',
    props: {
      sandbox: {
        strictStyleIsolation: true // 开启 Shadow DOM 隔离
      }
    }
  }
]);
```

工作原理：
- 为微应用的容器创建一个 Shadow DOM
- 微应用的所有内容都在 Shadow DOM 中运行
- CSS 完全隔离，内部样式不会影响外部，外部样式也不会影响内部

优缺点：
- 优点：完全隔离，互不影响
- 缺点：
  - 一些第三方库可能不兼容
  - 弹窗类组件可能无法正常工作
  - 部分老浏览器不支持

## 2. 动态样式表前缀隔离

这是 qiankun 默认的隔离方式，通过为每个微应用的样式添加特定前缀来实现。

```javascript
registerMicroApps([
  {
    name: 'app1',
    entry: '//localhost:8080',
    container: '#container',
    activeRule: '/app1',
    props: {
      sandbox: {
        experimentalStyleIsolation: true // 开启样式前缀隔离
      }
    }
  }
]);
```

工作原理：
```css
/* 原始样式 */
.title { color: red; }

/* 转换后 */
div[data-qiankun-app1] .title { color: red; }
```

- 为微应用容器添加特定的 data 属性
- 动态处理所有样式规则，为选择器添加容器前缀
- 确保样式只在微应用内部生效

优缺点：
- 优点：
  - 兼容性好
  - 实现相对简单
  - 性能损耗小
- 缺点：
  - 可能存在一些特殊选择器处理的边界情况
  - 不能完全隔离，比如 body 上的样式

## 3. 手动样式隔离

不使用 qiankun 的隔离方案，而是通过开发规范和构建工具来实现。

```javascript
// webpack 配置
{
  css: {
    modules: true, // 启用 CSS Modules
    preprocessorOptions: {
      less: {
        modifyVars: {
          // 添加特定前缀
          '@prefix': 'app1'
        }
      }
    }
  }
}
```

常用方案：
1. **CSS Modules**
```css
/* 源码 */
.title { color: red; }

/* 构建后 */
.app1_title_hash { color: red; }
```

2. **BEM 命名规范**
```css
.app1-component__element--modifier {
  color: red;
}
```

3. **CSS-in-JS**
```javascript
const StyledComponent = styled.div`
  .title {
    color: red;
  }
`;
```

## 最佳实践建议

1. **选择合适的隔离方案**
- 如果对隔离要求严格，使用 Shadow DOM
- 如果需要兼容性，使用动态样式表前缀
- 如果项目规范好，可以考虑手动隔离

2. **注意事项**
- 避免使用全局选择器（*）
- 减少标签选择器的使用
- 合理使用 CSS 权重
- 注意处理第三方组件库的样式

3. **常见问题解决**
```javascript
// 处理动态生成的样式
const dynamicStyle = document.createElement('style');
dynamicStyle.setAttribute('data-qiankun-app1', '');
dynamicStyle.textContent = '.dynamic { color: blue; }';
document.head.appendChild(dynamicStyle);

// 处理第三方组件弹窗
// 在主应用中预留弹窗容器
<div id="modal-container"></div>
```

通过合理使用这些隔离方案，可以有效避免微应用之间的样式冲突，保证应用的稳定运行。选择哪种方案主要取决于项目的具体需求、浏览器兼容性要求以及团队的开发规范。 
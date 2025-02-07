---
title: Vue 生命周期的理解？
date: 2024-06-10 20:30:00
tags:
  - Vue
  - 面试
categories:
  - 前端
  - Vue
---

## 一、什么是生命周期

生命周期（Life Cycle）是指 Vue 组件从创建到销毁的整个过程，也就是组件的生命历程。

在这个过程中，Vue 提供了一系列的生命周期钩子函数，让我们能在特定的阶段执行自己的代码。

## 二、生命周期有哪些

Vue 2.x 的生命周期钩子主要包含：

### 1. 创建阶段
- beforeCreate：实例创建前，此时数据观测和事件配置都未初始化
- created：实例创建后，此时已完成数据观测，但尚未挂载到 DOM

### 2. 挂载阶段
- beforeMount：DOM 挂载前，此时模板已编译，但还未挂载到页面
- mounted：DOM 挂载后，此时组件已经渲染到页面上

### 3. 更新阶段
- beforeUpdate：数据更新时，DOM 更新之前调用
- updated：数据更新后，DOM 更新完成后调用

### 4. 销毁阶段
- beforeDestroy：实例销毁前调用
- destroyed：实例销毁后调用

## 三、生命周期的应用场景

1. created
   - 发送 ajax 请求
   - 初始化数据
   - 注册全局事件

2. mounted
   - 操作 DOM
   - 初始化第三方插件
   - 获取 DOM 节点信息

3. beforeDestroy
   - 清除定时器
   - 解绑全局事件
   - 销毁第三方插件

## 四、注意事项

1. created 和 mounted 的区别
   - created 在组件实例创建完成后调用，此时还未挂载到 DOM
   - mounted 在组件挂载到 DOM 后调用，可以操作 DOM

2. 不要在生命周期函数中使用箭头函数
   - 箭头函数绑定了父级作用域的上下文，this 将不会按照期望指向 Vue 实例

3. destroyed 钩子中，实例的所有指令都被解绑，所有事件监听器被移除，所有子实例也都被销毁

## 五、示例代码

```js
export default {
  beforeCreate() {
    console.log('实例创建前')
  },
  created() {
    console.log('实例创建后')
    this.getData() // 发送请求获取数据
  },
  mounted() {
    console.log('DOM 挂载后')
    this.initPlugin() // 初始化插件
  },
  beforeDestroy() {
    console.log('实例销毁前')
    clearInterval(this.timer) // 清除定时器
  }
}
```

## 参考文献

- [Vue.js 官方文档 - 生命周期钩子](https://cn.vuejs.org/v2/guide/instance.html#生命周期图示)
- [Vue.js 技术揭秘](https://ustbhuangyi.github.io/vue-analysis/v2/components/lifecycle.html) 
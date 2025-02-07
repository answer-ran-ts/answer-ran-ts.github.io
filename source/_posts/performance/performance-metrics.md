---
title: 前端性能指标有哪些，如何获取和分析？
date: 2024-03-19 16:00:00
tags:
  - 性能优化
  - 前端监控
categories:
  - 前端
  - 性能优化
---

## 一、核心性能指标

### 1. 加载性能指标

1. FCP (First Contentful Paint)
- 首次内容绘制时间
- 标记浏览器渲染第一个 DOM 内容的时间点
```js
// 方式一：Performance API
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('FCP:', entry.startTime);
  }
}).observe({ entryTypes: ['paint'] });

// 方式二：Web Vitals
import { getFCP } from 'web-vitals';
getFCP(console.log);
```

2. LCP (Largest Contentful Paint)
- 最大内容绘制时间
- 页面主要内容加载完成的时间
```js
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('LCP:', entry.startTime);
  }
}).observe({ entryTypes: ['largest-contentful-paint'] });
```

3. TTI (Time to Interactive)
- 可交互时间
- 页面完全可交互所需时间
```js
import { getTTI } from 'web-vitals';
getTTI(console.log);
```

### 2. 交互性能指标

1. FID (First Input Delay)
- 首次输入延迟
- 用户首次交互的响应时间
```js
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('FID:', entry.processingStart - entry.startTime);
  }
}).observe({ entryTypes: ['first-input'] });
```

2. CLS (Cumulative Layout Shift)
- 累积布局偏移
- 页面视觉稳定性的度量
```js
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('CLS:', entry.value);
  }
}).observe({ entryTypes: ['layout-shift'] });
```

## 二、性能指标采集

### 1. Performance API
```js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }
  
  init() {
    // 页面加载性能
    this.getNavigationTiming();
    // 资源加载性能
    this.getResourceTiming();
    // 用户交互性能
    this.getUserTiming();
  }
  
  // 获取导航加载性能
  getNavigationTiming() {
    const timing = performance.getEntriesByType('navigation')[0];
    this.metrics.navigation = {
      // DNS 解析时间
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP 连接时间
      tcp: timing.connectEnd - timing.connectStart,
      // 首字节时间
      ttfb: timing.responseStart - timing.requestStart,
      // DOM 解析时间
      domParse: timing.domInteractive - timing.responseEnd,
      // 页面完全加载时间
      loadComplete: timing.loadEventEnd - timing.fetchStart
    };
  }
  
  // 获取资源加载性能
  getResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    this.metrics.resources = resources.map(item => ({
      name: item.name,
      type: item.initiatorType,
      duration: item.duration,
      size: item.transferSize
    }));
  }
  
  // 获取用户交互性能
  getUserTiming() {
    // 监听首次输入延迟
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      this.metrics.fid = entries[0].processingStart - entries[0].startTime;
    }).observe({ entryTypes: ['first-input'] });
    
    // 监听布局偏移
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      this.metrics.cls = entries.reduce((sum, entry) => sum + entry.value, 0);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
```

### 2. Resource Timing API
```js
class ResourceMonitor {
  constructor() {
    this.resourceList = [];
  }
  
  // 获取资源加载详情
  getResourceDetails() {
    const resources = performance.getEntriesByType('resource');
    
    return resources.map(item => {
      const timings = {
        // DNS 查询时间
        dns: item.domainLookupEnd - item.domainLookupStart,
        // TCP 连接时间
        tcp: item.connectEnd - item.connectStart,
        // 请求响应时间
        request: item.responseEnd - item.requestStart,
        // 资源大小
        size: item.encodedBodySize
      };
      
      return {
        name: item.name,
        type: item.initiatorType,
        timings
      };
    });
  }
  
  // 分析资源加载瓶颈
  analyzeBottlenecks() {
    const resources = this.getResourceDetails();
    const bottlenecks = {
      slow_dns: [],
      slow_tcp: [],
      slow_request: [],
      large_files: []
    };
    
    resources.forEach(resource => {
      const { timings, name } = resource;
      
      if (timings.dns > 100) {
        bottlenecks.slow_dns.push(name);
      }
      if (timings.tcp > 100) {
        bottlenecks.slow_tcp.push(name);
      }
      if (timings.request > 500) {
        bottlenecks.slow_request.push(name);
      }
      if (timings.size > 1024 * 1024) {
        bottlenecks.large_files.push(name);
      }
    });
    
    return bottlenecks;
  }
}
```

## 三、性能分析与优化

### 1. 性能分数计算
```js
class PerformanceScore {
  // 计算性能得分
  calculateScore(metrics) {
    const weights = {
      fcp: 0.2,
      lcp: 0.25,
      fid: 0.3,
      cls: 0.25
    };
    
    const scores = {
      fcp: this.scoreFCP(metrics.fcp),
      lcp: this.scoreLCP(metrics.lcp),
      fid: this.scoreFID(metrics.fid),
      cls: this.scoreCLS(metrics.cls)
    };
    
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + scores[key] * weight;
    }, 0);
  }
  
  // FCP 得分计算
  scoreFCP(fcp) {
    if (fcp <= 1000) return 1;
    if (fcp <= 2500) return 0.7;
    if (fcp <= 4000) return 0.3;
    return 0;
  }
  
  // 其他指标得分计算方法类似...
}
```

### 2. 性能监控报告
```js
class PerformanceReport {
  constructor() {
    this.monitor = new PerformanceMonitor();
    this.resourceMonitor = new ResourceMonitor();
    this.scoreCalculator = new PerformanceScore();
  }
  
  // 生成性能报告
  generateReport() {
    const metrics = this.monitor.metrics;
    const resources = this.resourceMonitor.getResourceDetails();
    const bottlenecks = this.resourceMonitor.analyzeBottlenecks();
    const score = this.scoreCalculator.calculateScore(metrics);
    
    return {
      score,
      metrics,
      resources,
      bottlenecks,
      timestamp: Date.now(),
      url: window.location.href
    };
  }
  
  // 发送性能数据
  async sendReport() {
    const report = this.generateReport();
    try {
      await fetch('/api/performance', {
        method: 'POST',
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }
}
```

## 四、实践建议

### 1. 指标采集建议
- 采用抽样策略，避免全量采集
- 考虑网络环境的影响
- 过滤异常数据

### 2. 性能分析建议
- 建立性能基准线
- 关注趋势变化
- 结合业务场景

### 3. 优化方向
```js
// 1. 资源加载优化
const optimizeResource = {
  // 预加载关键资源
  preload: () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = '/critical.js';
    document.head.appendChild(link);
  },
  
  // 按需加载
  lazyLoad: () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });
  }
};

// 2. 渲染优化
const optimizeRender = {
  // 避免布局抖动
  preventLayoutThrashing: () => {
    requestAnimationFrame(() => {
      const elements = document.querySelectorAll('.dynamic');
      const positions = elements.map(el => el.getBoundingClientRect());
      
      positions.forEach((pos, i) => {
        elements[i].style.transform = `translate(${pos.left}px, ${pos.top}px)`;
      });
    });
  }
};
```

## 参考文献

- [Web Vitals](https://web.dev/vitals/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Resource Timing API](https://w3c.github.io/resource-timing/)
- [性能优化最佳实践](https://developers.google.com/web/fundamentals/performance/why-performance-matters) 
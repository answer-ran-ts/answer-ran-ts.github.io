---
title: 大数据量的 Excel 导出解决方案有哪些？
date: 2024-09-10 19:00:00
tags:
  - Excel
  - 大数据
  - 性能优化
categories:
  - 前端
  - 数据处理
---

## 一、问题背景

在实际业务中，经常需要导出大量数据到 Excel 文件，这可能会遇到以下问题：

1. 浏览器内存占用过大
2. 导出过程页面卡顿
3. 请求超时
4. 文件过大下载慢

## 二、前端导出方案

### 1. 使用 XLSX.js

#### 1.1 基础导出
```js
import * as XLSX from 'xlsx';

class ExcelExport {
  constructor() {
    this.workbook = XLSX.utils.book_new();
  }
  
  // 创建工作表
  createSheet(data, sheetName = 'Sheet1') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(this.workbook, worksheet, sheetName);
  }
  
  // 导出文件
  exportFile(fileName = 'export.xlsx') {
    XLSX.writeFile(this.workbook, fileName);
  }
}

// 使用示例
const exporter = new ExcelExport();
exporter.createSheet([
  { name: 'John', age: 30 },
  { name: 'Mary', age: 25 }
]);
exporter.exportFile();
```

#### 1.2 分片处理
```js
class ChunkExport {
  constructor(chunkSize = 1000) {
    this.chunkSize = chunkSize;
    this.workbook = XLSX.utils.book_new();
  }
  
  // 分片处理数据
  async processDataInChunks(data) {
    const chunks = this.splitIntoChunks(data);
    const worksheet = XLSX.utils.json_to_sheet([]);
    
    for (let i = 0; i < chunks.length; i++) {
      await this.processChunk(worksheet, chunks[i], i);
    }
    
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Sheet1');
  }
  
  // 分割数据
  splitIntoChunks(data) {
    const chunks = [];
    for (let i = 0; i < data.length; i += this.chunkSize) {
      chunks.push(data.slice(i, i + this.chunkSize));
    }
    return chunks;
  }
  
  // 处理单个分片
  async processChunk(worksheet, chunk, index) {
    return new Promise(resolve => {
      setTimeout(() => {
        const rows = XLSX.utils.json_to_sheet(chunk);
        if (index === 0) {
          worksheet['!ref'] = rows['!ref'];
          worksheet['!cols'] = rows['!cols'];
          Object.assign(worksheet, rows);
        } else {
          this.appendRows(worksheet, rows, index * this.chunkSize);
        }
        resolve();
      }, 0);
    });
  }
  
  // 追加行数据
  appendRows(worksheet, rows, startRow) {
    Object.keys(rows).forEach(cell => {
      if (cell[0] === '!') return;
      const newCell = cell.replace(/\d+/, match => +match + startRow);
      worksheet[newCell] = rows[cell];
    });
  }
  
  // 导出文件
  async export(data, fileName = 'export.xlsx') {
    await this.processDataInChunks(data);
    XLSX.writeFile(this.workbook, fileName);
  }
}

// 使用示例
const exporter = new ChunkExport(1000);
const largeData = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  date: new Date().toISOString()
}));

exporter.export(largeData, 'large-export.xlsx');
```

### 2. Web Worker 处理

#### 2.1 主线程代码
```js
class WorkerExport {
  constructor() {
    this.worker = new Worker('excel-worker.js');
    this.setupWorker();
  }
  
  setupWorker() {
    this.worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'progress':
          this.updateProgress(data);
          break;
        case 'complete':
          this.downloadFile(data);
          break;
        case 'error':
          console.error('Export failed:', data);
          break;
      }
    };
  }
  
  export(data, options = {}) {
    this.worker.postMessage({
      type: 'start',
      data,
      options
    });
  }
  
  updateProgress(percent) {
    // 更新进度条
    console.log(`Export progress: ${percent}%`);
  }
  
  downloadFile(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }
  
  terminate() {
    this.worker.terminate();
  }
}
```

#### 2.2 Worker 线程代码
```js
// excel-worker.js
importScripts('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');

class ExcelWorker {
  constructor() {
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    self.onmessage = (event) => {
      const { type, data, options } = event.data;
      
      if (type === 'start') {
        this.processExport(data, options);
      }
    };
  }
  
  async processExport(data, options) {
    try {
      const workbook = XLSX.utils.book_new();
      const totalChunks = Math.ceil(data.length / 1000);
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = data.slice(i * 1000, (i + 1) * 1000);
        await this.processChunk(workbook, chunk, i === 0);
        
        // 报告进度
        self.postMessage({
          type: 'progress',
          data: Math.round((i + 1) / totalChunks * 100)
        });
      }
      
      // 生成文件
      const wbout = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      });
      
      // 返回结果
      self.postMessage({
        type: 'complete',
        data: new Blob([wbout], { type: 'application/octet-stream' })
      });
      
    } catch (error) {
      self.postMessage({
        type: 'error',
        data: error.message
      });
    }
  }
  
  async processChunk(workbook, chunk, isFirst) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (isFirst) {
          const worksheet = XLSX.utils.json_to_sheet(chunk);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        } else {
          XLSX.utils.sheet_add_json(
            workbook.Sheets['Sheet1'],
            chunk,
            { origin: -1 }
          );
        }
        resolve();
      }, 0);
    });
  }
}

new ExcelWorker();
```

## 三、后端导出方案

### 1. 流式处理
```js
// 前端代码
async function streamDownload() {
  const response = await fetch('/api/export/stream', {
    headers: {
      'Accept': 'application/octet-stream'
    }
  });
  
  const reader = response.body.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const blob = new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.xlsx';
  link.click();
  URL.revokeObjectURL(url);
}
```

```js
// 后端代码 (Node.js)
const Excel = require('exceljs');
const stream = require('stream');

async function streamExport(req, res) {
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true
  });
  
  const worksheet = workbook.addWorksheet('Sheet1');
  
  // 设置表头
  worksheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Name', key: 'name' },
    { header: 'Date', key: 'date' }
  ];
  
  // 流式查询数据库
  const cursor = db.collection('data').find().cursor();
  
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    worksheet.addRow(doc).commit();
  }
  
  await worksheet.commit();
  await workbook.commit();
}
```

### 2. 任务队列处理
```js
// 前端代码
class ExportTask {
  async createTask() {
    const response = await fetch('/api/export/task', {
      method: 'POST',
      body: JSON.stringify({ /* 导出参数 */ })
    });
    const { taskId } = await response.json();
    return this.pollTaskStatus(taskId);
  }
  
  async pollTaskStatus(taskId) {
    while (true) {
      const response = await fetch(`/api/export/status/${taskId}`);
      const { status, url } = await response.json();
      
      if (status === 'completed') {
        this.downloadFile(url);
        break;
      } else if (status === 'failed') {
        throw new Error('Export failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  downloadFile(url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.xlsx';
    link.click();
  }
}
```

## 四、最佳实践

### 1. 数据量判断
```js
class ExportStrategy {
  constructor(threshold = 10000) {
    this.threshold = threshold;
  }
  
  async export(data) {
    if (data.length <= this.threshold) {
      // 小数据量：直接前端导出
      return this.clientExport(data);
    } else if (data.length <= this.threshold * 10) {
      // 中等数据量：使用 Web Worker
      return this.workerExport(data);
    } else {
      // 大数据量：使用后端导出
      return this.serverExport(data);
    }
  }
}
```

### 2. 性能优化
```js
class OptimizedExport {
  // 预处理数据
  preprocessData(data) {
    return data.map(item => {
      // 只保留需要的字段
      const { id, name, date } = item;
      return { id, name, date };
    });
  }
  
  // 分批处理
  async batchProcess(data, batchSize = 1000) {
    const results = [];
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      results.push(await this.processBatch(batch));
      
      // 允许其他任务执行
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return results;
  }
  
  // 内存管理
  cleanupMemory() {
    if (global.gc) {
      global.gc();
    }
  }
}
```

### 3. 用户体验
```js
class ExportUI {
  constructor() {
    this.progress = 0;
    this.status = 'idle';
  }
  
  // 更新进度条
  updateProgress(percent) {
    this.progress = percent;
    this.updateUI();
  }
  
  // 显示状态
  updateStatus(status) {
    this.status = status;
    this.updateUI();
  }
  
  // 更新界面
  updateUI() {
    const progressBar = document.querySelector('.progress-bar');
    const statusText = document.querySelector('.status-text');
    
    if (progressBar) {
      progressBar.style.width = `${this.progress}%`;
    }
    
    if (statusText) {
      statusText.textContent = this.getStatusText();
    }
  }
  
  // 获取状态文本
  getStatusText() {
    const statusMap = {
      idle: '准备导出',
      processing: '正在导出...',
      completed: '导出完成',
      failed: '导出失败'
    };
    return statusMap[this.status] || '';
  }
}
```

## 参考文献

- [SheetJS 文档](https://docs.sheetjs.com/)
- [ExcelJS 文档](https://github.com/exceljs/exceljs)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Stream API](https://nodejs.org/api/stream.html) 
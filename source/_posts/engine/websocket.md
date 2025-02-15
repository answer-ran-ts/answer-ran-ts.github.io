---
title: 2.15 前端面试复盘（二）
date: 2025-02-15 12:00:00
tags:
  - WebSocket
  - 前端开发
  - 网络通信
categories:
  - 前端开发
---

# WebSocket 技术要点总结

## WebSocket 连接管理详解

### 心跳检测与断线重连机制
```javascript
class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.heartbeatTimer = null;
        this.reconnectAttempts = 0;
        
        // 配置参数
        this.config = {
            heartbeatInterval: 30000,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5
        };
    }

    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('连接成功');
            this.reconnectAttempts = 0; // 重置重连次数
            this.startHeartbeat();
        };

        this.ws.onclose = () => {
            this.clearHeartbeat();
            this.reconnect();
        };

        this.ws.onmessage = (event) => {
            if (event.data === 'pong') {
                // 收到心跳响应
                return;
            }
            // 处理其他消息
        };
    }

    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send('ping');
            }
        }, this.config.heartbeatInterval);
    }

    clearHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    reconnect() {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, this.config.reconnectInterval);
        }
    }
}
```

心跳检测是**预防性**的，用于及时发现连接问题。断线重连是**补救性**的，用于恢复已断开的连接。两者配合使用可以提供更可靠的连接保障。

### 黏包问题

在 WebSocket 通信中，由于 TCP 的特性，可能会出现数据包粘连的情况。这就是所谓的黏包问题，主要表现为多个数据包在传输过程中粘在一起，接收端无法正确分割。

#### TCP 特性与黏包原因

TCP 是面向连接的、可靠的、基于字节流的传输层通信协议。黏包问题产生的主要原因有：

1. **TCP 是流式协议**
   - TCP 传输的数据是连续的字节流，没有消息边界
   - 应用层的一次写操作，并不对应网络上的一个数据包
   - TCP 可能将多个小数据包合并成一个大的数据包发送
   - 也可能将一个大的数据包拆分成多个小数据包发送

2. **Nagle 算法**
   - TCP 默认启用 Nagle 算法，用于提高网络传输效率
   - 算法会等待一定时间，收集多个小数据包后一起发送
   - 这种优化机制直接导致了数据包的粘连

3. **接收方 TCP 缓冲区**
   - TCP 接收方会将收到的数据包暂存在缓冲区
   - 应用程序如果读取不及时，多个数据包会在缓冲区中堆积
   - 当应用程序一次性读取时，会同时读到多个数据包的数据

示意图：
```
发送方                                接收方
+------------+                     +------------+
| 数据包 1   |                     | 数据包 1+2 |
+------------+     TCP 传输        +------------+
| 数据包 2   |  =============>    | 数据       |
+------------+     合并传输        | 无法区分边界|
```

#### 解决方案

1. 消息帧格式设计
```javascript
const frame = {
    header: {
        messageLength: number,  // 消息总长度
        messageType: string,    // 消息类型
        timestamp: number       // 时间戳
    },
    body: any                   // 消息主体
}
```

2. 实现消息解析器
```javascript
class MessageParser {
    constructor() {
        this.buffer = '';  // 缓存数据
    }

    parse(data) {
        this.buffer += data;
        const messages = [];
        
        while(this.buffer.length > 0) {
            // 检查是否包含完整的消息头
            if (this.buffer.length < 8) break;  // 假设头部长度为8字节
            
            const headerLength = 8;
            const header = JSON.parse(this.buffer.slice(0, headerLength));
            const totalLength = header.messageLength + headerLength;
            
            // 检查是否收到完整消息
            if (this.buffer.length < totalLength) break;
            
            // 提取完整消息
            const message = this.buffer.slice(headerLength, totalLength);
            messages.push({
                type: header.messageType,
                data: JSON.parse(message)
            });
            
            // 更新缓存
            this.buffer = this.buffer.slice(totalLength);
        }
        
        return messages;
    }
}

// 使用示例
const parser = new MessageParser();
ws.onmessage = (event) => {
    const messages = parser.parse(event.data);
    messages.forEach(msg => {
        switch(msg.type) {
            case 'market':
                handleMarketData(msg.data);
                break;
            case 'trade':
                handleTradeData(msg.data);
                break;
            // ... 处理其他类型消息
        }
    });
};
```

3. 关键点说明
- 每个消息都有固定格式的头部，包含消息长度等信息
- 使用缓冲区暂存不完整的消息
- 通过消息长度字段来正确拆分消息
- 支持批量处理多个粘连的消息

这种方案可以有效处理 WebSocket 通信中的黏包问题，保证数据的完整性和正确性。

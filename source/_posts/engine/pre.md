---
title: 2.15 前端面试复盘（一）
date: 2025-02-15 12:00:00
tags:
  - 前端开发
  - 技术面试
categories:
  - 前端开发
---


# 前端面试技术要点总结

## 自我介绍
您好，我是XX，26岁，本科学历，是一名拥有3年工作经验的前端开发工程师。我熟练掌握 Vue 全家桶，有 Vue2、Vue3 的实际项目开发经验。同时也具备 React 及其生态系统的开发经验，包括 Hooks、Redux/Mobx 等状态管理方案。在工作经历中，我参与过企业中台系统、官网、数据可视化大屏等多个重要项目的开发。熟悉 Element UI、Ant Design 等主流组件库，对前端工程化有较深理解，能够熟练使用 Webpack、Vite 等构建工具进行项目优化。在可视化领域，我有丰富的 ECharts 使用经验。此外，我也参与过小程序和 APP 的开发工作。我注重代码质量和开发效率，有较强的业务理解能力和团队协作精神。目前正在寻找前端开发相关的工作机会，期望薪资范围在14-16k。

## 离职原因
"我上一家公司是集团的子公司，虽然有转正编的机会，但主要使用的是公司内部封闭的技术框架，这限制了我在主流技术方面的成长。考虑到个人的职业发展，我希望能到一个技术氛围更好的平台，接触更多业界主流的技术栈和项目，同时也期望能获得更好的发展机会。"

## 项目难点与解决方案

### 1. 实时数据展示与性能优化
```
- 使用 WebSocket 实现电力数据实时推送，保证数据实时性
- 对接 MQTT 协议，处理大量设备的实时数据上报
- 实现断线重连机制，保证数据连续性
- 优化数据更新策略，避免频繁 DOM 更新导致的性能问题
```

> 关于 WebSocket 的详细实现，包括心跳检测、断线重连和黏包问题的解决方案，请参考 [WebSocket 技术要点总结](../engine-websocket)

### 2. 复杂图表的性能优化
```
- 使用 WebWorker 处理分时图、K线图的大量数据计算
- 将复杂的数据运算迁移到 Worker 线程，避免主线程阻塞
- 实现图表数据的增量更新，优化渲染性能
- 处理历史数据与实时数据的无缝衔接
```

### 3. 数据处理与展示
```
- 使用 HQChart 实现各类专业图表（分时图、K线图）
- 处理大量历史数据的加载和缓存策略
- 实现图表的缩放、拖拽等交互功能
- 优化图表更新频率，平衡实时性和性能
```
## 说说你封装的组件

### 1.  - 高性能虚拟表格组件
在一个数据密集型的企业中台项目中，我封装了一个具有高性能、高复用性的虚拟表格组件 `VirtualTable`。这个组件解决了大数据量表格渲染的性能问题，支持多种复杂场景。

#### 核心功能特性
```
- 虚拟滚动：只渲染可视区域的数据，支持10万+数据量的流畅渲染
- 动态列配置：支持列的显示/隐藏、拖拽排序、列宽调整
- 多级表头：支持复杂的多级表头配置
- 自定义列：支持通过插槽自定义列的渲染内容
- 固定列：支持左右列固定，处理阴影、同步滚动
- 行/列合并：支持单元格合并，自动计算合并范围
- 排序/筛选：支持本地和远程排序筛选，多列组合排序
- 行选择：支持单选、多选、全选、反选
- 展开行：支持行展开/收起，异步加载子数据
- 树形数据：支持树形结构展示，懒加载子节点
```

#### 关键技术实现
```typescript
export default {
  name: 'VirtualTable',
  props: {
    // 表格数据
    data: {
      type: Array,
      required: true
    },
    // 列配置
    columns: {
      type: Array,
      required: true
    },
    // 可视区域高度
    height: {
      type: Number,
      default: 400
    },
    // 行高
    rowHeight: {
      type: Number,
      default: 40
    },
    // 固定列配置
    fixedColumns: {
      type: Object,
      default: () => ({ left: [], right: [] })
    },
    // 是否开启多选
    selectable: {
      type: Boolean,
      default: false
    },
    // 是否显示展开行
    expandable: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 可视区域起始索引
      startIndex: 0,
      // 可视区域结束索引
      endIndex: 0,
      // 缓冲区大小（上下各预留的行数）
      buffer: 5,
      // 选中行的 key 集合
      selectedKeys: new Set(),
      // 展开行的 key 集合
      expandedKeys: new Set(),
      // 列宽调整状态
      resizing: {
        column: null,
        startX: 0
      },
      // 列拖拽状态
      dragging: {
        column: null,
        targetIndex: -1
      }
    }
  },
  computed: {
    // 计算可视区域应该渲染的数据
    visibleData() {
      const start = Math.max(0, this.startIndex - this.buffer)
      const end = Math.min(this.data.length, this.endIndex + this.buffer)
      return this.data.slice(start, end).map((row, index) => ({
        ...row,
        _index: start + index // 保存真实索引
      }))
    },
    // 计算表格内容总高度
    totalHeight() {
      return this.data.length * this.rowHeight
    },
    // 计算固定列样式
    fixedColumnStyles() {
      const { left, right } = this.fixedColumns
      return {
        left: left.reduce((styles, col, index) => {
          styles[col.key] = { left: `${index * this.columnWidth}px` }
          return styles
        }, {}),
        right: right.reduce((styles, col, index) => {
          styles[col.key] = { right: `${index * this.columnWidth}px` }
          return styles
        }, {})
      }
    }
  },
  methods: {
    // 处理滚动事件（使用 RAF 优化）
    handleScroll(e) {
      if (this.scrollRAF) cancelAnimationFrame(this.scrollRAF)
      
      this.scrollRAF = requestAnimationFrame(() => {
        const { scrollTop, scrollLeft } = e.target
        
        // 计算当前的起始索引
        this.startIndex = Math.floor(scrollTop / this.rowHeight)
        // 计算当前的结束索引
        this.endIndex = this.startIndex + Math.ceil(this.height / this.rowHeight)
        
        // 同步固定列的滚动位置
        this.syncFixedScroll(scrollLeft)
        // 更新内容区域的位移
        this.updatePosition(scrollTop)
      })
    },

    // 更新内容区域的位移（使用 transform 优化性能）
    updatePosition(scrollTop) {
      const transform = `translate3d(0, ${scrollTop}px, 0)`
      this.$refs.content.style.transform = transform
      
      // 更新固定列位置
      if (this.hasFixedColumns) {
        this.$refs.leftFixed.style.transform = transform
        this.$refs.rightFixed.style.transform = transform
      }
    },

    // 处理列宽调整
    handleColumnResize(column, event) {
      this.resizing = {
        column,
        startX: event.clientX,
        startWidth: column.width
      }
      
      document.addEventListener('mousemove', this.onColumnResizing)
      document.addEventListener('mouseup', this.onColumnResizeEnd)
    },

    // 列宽调整过程
    onColumnResizing(event) {
      if (!this.resizing.column) return
      
      const { column, startX, startWidth } = this.resizing
      const diff = event.clientX - startX
      const newWidth = Math.max(100, startWidth + diff)
      
      // 更新列宽
      column.width = newWidth
      // 触发列宽变化事件
      this.$emit('column-resize', column)
    },

    // 处理行选择
    handleRowSelect(row, selected) {
      const key = row[this.rowKey]
      if (selected) {
        this.selectedKeys.add(key)
      } else {
        this.selectedKeys.delete(key)
      }
      
      this.$emit('selection-change', Array.from(this.selectedKeys))
    },

    // 处理展开行
    async handleRowExpand(row) {
      const key = row[this.rowKey]
      if (this.expandedKeys.has(key)) {
        this.expandedKeys.delete(key)
      } else {
        // 支持异步加载子数据
        if (this.loadChildrenData && !row.children) {
          row.loading = true
          try {
            row.children = await this.loadChildrenData(row)
          } finally {
            row.loading = false
          }
        }
        this.expandedKeys.add(key)
      }
    },

    // 处理排序
    handleSort(column) {
      if (!column.sortable) return
      
      // 支持多列排序
      const sortState = this.sortStates[column.key] || { order: 'none' }
      const nextOrder = this.getNextSortOrder(sortState.order)
      
      this.$set(this.sortStates, column.key, { order: nextOrder })
      
      if (this.remote) {
        // 远程排序
        this.$emit('sort-change', this.sortStates)
      } else {
        // 本地排序
        this.localSort()
      }
    },

    // 本地排序实现
    localSort() {
      const sortColumns = Object.entries(this.sortStates)
        .filter(([, state]) => state.order !== 'none')
      
      if (sortColumns.length === 0) {
        this.displayData = [...this.data]
        return
      }
      
      this.displayData.sort((a, b) => {
        for (const [key, state] of sortColumns) {
          const column = this.columnMap[key]
          const compareResult = this.compare(a[key], b[key], column.sortMethod)
          if (compareResult !== 0) {
            return state.order === 'asc' ? compareResult : -compareResult
          }
        }
        return 0
      })
    }
  },
  
  // 使用函数式组件优化行渲染
  components: {
    TableRow: {
      functional: true,
      props: ['row', 'columns', 'rowIndex'],
      render(h, { props, scopedSlots }) {
        const { row, columns, rowIndex } = props
        return h('tr', { key: row[rowKey] },
          columns.map(column => {
            // 处理自定义列模板
            if (scopedSlots[column.key]) {
              return h('td', {}, [
                scopedSlots[column.key]({ row, column, index: rowIndex })
              ])
            }
            // 默认渲染
            return h('td', {}, [row[column.key]])
          })
        )
      }
    }
  }
}
```

#### 性能优化措施
```
1. 虚拟滚动核心算法优化：
   - 使用 transform 代替 top 定位，避免重排
   - 实现缓冲区机制，提升滚动体验
   - 使用 RAF 优化滚动事件处理
   - 固定列同步滚动优化
   - 滚动过程中延迟非必要更新

2. 渲染性能优化：
   - 使用 Vue 的函数式组件渲染表格行
   - 关键数据使用 Object.freeze 冻结
   - 合理使用 v-show 和 v-if
   - 列宽调整使用 transform 实现
   - 优化重绘区域，避免整表重绘
   
3. 内存优化：
   - 实现数据分片加载
   - 及时清理不可见区域的 DOM
   - 使用事件委托优化事件处理
   - 优化大数据量排序算法
   - 按需加载展开行数据

4. 用户体验优化：
   - 添加列宽调整时的视觉反馈
   - 优化固定列的阴影效果
   - 实现平滑的滚动效果
   - 添加加载状态和空数据提示
   - 支持键盘快捷操作
```

#### 使用示例
```vue
<template>
  <virtual-table
    :data="tableData"
    :columns="columns"
    :height="500"
    :row-height="40"
    :fixed-columns="{ left: ['selection'], right: ['operation'] }"
    :selectable="true"
    :expandable="true"
    @sort-change="handleSortChange"
    @selection-change="handleSelectionChange"
    @row-expand="handleRowExpand"
  >
    <!-- 自定义展开行内容 -->
    <template #expand="{ row }">
      <div class="expand-content">
        {{ row.description }}
      </div>
    </template>
    
    <!-- 自定义操作列 -->
    <template #operation="{ row }">
      <el-button @click="handleEdit(row)">编辑</el-button>
      <el-button @click="handleDelete(row)">删除</el-button>
    </template>
  </virtual-table>
</template>

<script>
export default {
  data() {
    return {
      tableData: [],
      columns: [
        { type: 'selection', width: 60, fixed: 'left' },
        { key: 'name', title: '名称', sortable: true },
        { key: 'age', title: '年龄', sortable: true },
        { key: 'address', title: '地址', width: 300 },
        { key: 'operation', title: '操作', width: 150, fixed: 'right' }
      ]
    }
  },
  methods: {
    async loadData() {
      // 模拟加载 10 万条数据
      this.tableData = Array.from({ length: 100000 }, (_, index) => ({
        id: index,
        name: `用户 ${index}`,
        age: Math.floor(Math.random() * 100),
        address: `地址 ${index}`
      }))
    }
  }
}
</script>
```

这个组件在实际项目中显著提升了大数据量表格的渲染性能，将10万条数据的渲染时间从原来的3-4秒优化到了200ms以内，同时保持内存占用在合理范围内。该组件已在多个项目中复用，大大提高了开发效率。

主要应用场景：
1. 大数据量表格展示（10万+数据）
2. 复杂的数据操作界面（多选、排序、筛选）
3. 实时数据更新的监控页面
4. 树形结构数据展示
5. 需要高性能表格的企业级应用

## 说说你知道的HOC组件

### Vue2 中的 HOC 实现

#### 1. 权限控制 HOC
```js
// withPermission.js
export default function withPermission(WrappedComponent, permission) {
  return {
    name: 'WithPermission',
    functional: true,
    props: WrappedComponent.props,
    render(h, context) {
      const { props, data } = context
      const hasPermission = checkPermission(permission)
      
      if (!hasPermission) {
        return h('div', '无权限访问')
      }
      
      return h(WrappedComponent, {
        ...data,
        props
      })
    }
  }
}

// 使用示例
const PageWithPermission = withPermission(UserList, 'user:view')
```

#### 2. 数据加载 HOC
```js
// withLoading.js
export default function withLoading(WrappedComponent) {
  return {
    name: 'WithLoading',
    data() {
      return {
        loading: false,
        error: null,
        data: null
      }
    },
    props: {
      fetchData: {
        type: Function,
        required: true
      }
    },
    async created() {
      try {
        this.loading = true
        this.data = await this.fetchData()
      } catch (err) {
        this.error = err
      } finally {
        this.loading = false
      }
    },
    render(h) {
      if (this.loading) {
        return h('div', 'Loading...')
      }
      
      if (this.error) {
        return h('div', `Error: ${this.error.message}`)
      }
      
      return h(WrappedComponent, {
        props: {
          ...this.$props,
          data: this.data
        }
      })
    }
  }
}

// 使用示例
const UserListWithLoading = withLoading(UserList)
```

### Vue3 中的 HOC 实现

#### 1. 组合式 API 的权限控制 HOC
```ts
// withPermission.ts
import { h, defineComponent } from 'vue'

export function withPermission<T extends object>(
  WrappedComponent: T,
  permission: string
) {
  return defineComponent({
    name: 'WithPermission',
    setup(props) {
      const hasPermission = checkPermission(permission)
      
      return () => {
        if (!hasPermission) {
          return h('div', '无权限访问')
        }
        
        return h(WrappedComponent as any, props)
      }
    }
  })
}

// 使用示例
const PageWithPermission = withPermission(UserList, 'user:view')
```

#### 2. 响应式数据加载 HOC
```ts
// withAsync.ts
import { h, defineComponent, ref, onMounted } from 'vue'

export function withAsync<T extends object, D = any>(
  WrappedComponent: T,
  fetchData: () => Promise<D>
) {
  return defineComponent({
    name: 'WithAsync',
    setup() {
      const loading = ref(false)
      const error = ref<Error | null>(null)
      const data = ref<D | null>(null)
      
      onMounted(async () => {
        try {
          loading.value = true
          data.value = await fetchData()
        } catch (err) {
          error.value = err as Error
        } finally {
          loading.value = false
        }
      })
      
      return () => {
        if (loading.value) {
          return h('div', 'Loading...')
        }
        
        if (error.value) {
          return h('div', `Error: ${error.value.message}`)
        }
        
        return h(WrappedComponent as any, { data: data.value })
      }
    }
  })
}

// 使用示例
const UserListWithAsync = withAsync(UserList, fetchUserList)
```

#### 3. 性能优化 HOC
```ts
// withMemo.ts
import { h, defineComponent, computed } from 'vue'

export function withMemo<T extends object>(
  WrappedComponent: T,
  propsAreEqual = (prevProps: any, nextProps: any) => {
    return Object.keys(prevProps).every(key => prevProps[key] === nextProps[key])
  }
) {
  return defineComponent({
    name: 'WithMemo',
    props: ['memoProps'],
    setup(props) {
      const computedProps = computed(() => props.memoProps)
      
      return () => h(WrappedComponent as any, computedProps.value)
    },
    beforeUpdate() {
      if (propsAreEqual(this.$props.memoProps, this.$options.propsData?.memoProps)) {
        return false
      }
    }
  })
}

// 使用示例
const MemoizedComponent = withMemo(ExpensiveComponent)
```

### HOC 的优缺点

#### 优点
```
1. 代码复用：将通用逻辑抽象到 HOC 中
2. 关注点分离：将横切关注点从组件中抽离
3. 无侵入性：不修改原组件的情况下扩展功能
4. 灵活性：可以组合多个 HOC
```

#### 缺点
```
1. 组件层级嵌套：多个 HOC 组合会产生多层嵌套
2. props 命名冲突：多个 HOC 可能使用相同的 prop 名
3. 静态方法丢失：需要手动处理静态方法的拷贝
4. 调试困难：组件层级增加，调试变得复杂
```

### 最佳实践
```
1. 使用组合式 API 替代简单的 HOC
2. 合理使用 HOC 和组合式 API
3. 使用 displayName 提高调试体验
4. 避免在 render 方法中使用 HOC
5. 向下传递不相关的 props
6. 使用 compose 函数组合多个 HOC
```

这些 HOC 组件在实际项目中主要用于：
1. 权限控制
2. 数据加载和错误处理
3. 性能优化
4. 日志记录和监控
5. 组件状态管理
6. 主题和样式注入

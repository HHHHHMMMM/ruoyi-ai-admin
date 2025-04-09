<template>
  <div class="graph-viewer-container">
    <Spin :spinning="loading" tip="图谱加载中..." class="spin-container">
      <div class="toolbar">
        <a-tooltip title="缩小">
          <a-button type="text" @click="zoomOut">
            <template #icon><ZoomOutOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="放大">
          <a-button type="text" @click="zoomIn">
            <template #icon><ZoomInOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="适应屏幕">
          <a-button type="text" @click="fitView">
            <template #icon><FullscreenOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="下载图片">
          <a-button type="text" @click="downloadImage">
            <template #icon><DownloadOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip title="添加关系">
          <a-button type="text" @click="enableCreateRelation">
            <template #icon><ApiOutlined /></template>
          </a-button>
        </a-tooltip>
      </div>

      <div ref="graphContainer" class="graph-container"></div>

      <div
        v-if="graphData.nodes.length === 0 && !loading"
        class="empty-placeholder"
      >
        <Empty description="暂无图谱数据" />
      </div>
    </Spin>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  watch,
  nextTick,
  onUnmounted,
  defineProps,
  defineEmits,
  defineExpose,
} from 'vue';
import {
  Spin,
  Empty,
  Tooltip as ATooltip,
  Button as AButton,
} from 'ant-design-vue';
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  ApiOutlined,
} from '@ant-design/icons-vue';
import G6 from '@antv/g6';

// Define interfaces locally
interface NodeItem {
  id: string;
  name?: string;
  label?: string;
  nodeType: string;
  properties: Record<string, any>;
  [key: string]: any;
}

interface RelationItem {
  id?: string;
  source: string;
  target: string;
  relationLabel: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

interface GraphData {
  nodes: NodeItem[];
  edges: RelationItem[];
}

// Props definition
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  graphData: {
    type: Object as () => GraphData,
    default: () => ({ nodes: [], edges: [] }),
  },
});

// Define emits
const emit = defineEmits([
  'node-click',
  'edge-click',
  'edit-node',
  'delete-node',
  'add-node',
  'edit-edge',
  'delete-edge',
  'add-edge',
  'expand-node',
]);

// Refs
const graphContainer = ref<HTMLElement | null>(null);
const graph = ref<any | null>(null);
const visibleNodeTypes = ref<string[]>([]);
const visibleRelationTypes = ref<string[]>([]);

// Register custom elements
const registerCustomElements = () => {
  // Register custom node
  G6.registerNode('custom-node', {
    draw(cfg: any, group: any) {
      const { label, nodeType } = cfg;

      // Create outer circle
      const outerCircle = group.addShape('circle', {
        attrs: {
          x: 0,
          y: 0,
          r: 20,
          fill: getNodeColor(nodeType),
          stroke: '#fff',
          lineWidth: 2,
          cursor: 'pointer',
        },
        name: 'node-outer-circle',
      });

      // Create node label
      group.addShape('text', {
        attrs: {
          x: 0,
          y: 0,
          text: getNodeLabel(label, 10),
          fill: '#fff',
          fontSize: 12,
          textAlign: 'center',
          textBaseline: 'middle',
          cursor: 'pointer',
        },
        name: 'node-label',
      });

      // Create node type label
      group.addShape('text', {
        attrs: {
          x: 0,
          y: 26,
          text: nodeType,
          fill: '#666',
          fontSize: 10,
          textAlign: 'center',
          textBaseline: 'middle',
          cursor: 'pointer',
        },
        name: 'node-type-label',
      });

      return outerCircle;
    },
    // Update method to handle state changes
    setState(name: string, value: boolean, item: any) {
      const group = item.getContainer();
      const shape = group.get('children')[0]; // Get the first shape (circle)

      if (name === 'selected') {
        if (value) {
          shape.attr('stroke', '#f00');
          shape.attr('lineWidth', 3);
        } else {
          shape.attr('stroke', '#fff');
          shape.attr('lineWidth', 2);
        }
      } else if (name === 'hover') {
        if (value) {
          shape.attr('stroke', '#1890ff');
          shape.attr('lineWidth', 2);
        } else {
          shape.attr('stroke', '#fff');
          shape.attr('lineWidth', 2);
        }
      }
    },
  });

  // Register custom edge
  G6.registerEdge('custom-edge', {
    draw(cfg: any, group: any) {
      const { startPoint, endPoint, relationLabel } = cfg;

      // Create path
      const keyShape = group.addShape('path', {
        attrs: {
          path: [
            ['M', startPoint.x, startPoint.y],
            ['L', endPoint.x, endPoint.y],
          ],
          stroke: '#aaa',
          lineWidth: 1.5,
          endArrow: {
            path: G6.Arrow.triangle(6, 8, 0),
            fill: '#aaa',
          },
          cursor: 'pointer',
        },
        name: 'edge-line',
      });

      // Add relation label if provided
      if (relationLabel) {
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;

        group.addShape('rect', {
          attrs: {
            x: midX - 40,
            y: midY - 10,
            width: 80,
            height: 20,
            fill: '#f5f5f5',
            radius: 4,
            cursor: 'pointer',
          },
          name: 'edge-label-bg',
        });

        group.addShape('text', {
          attrs: {
            x: midX,
            y: midY,
            text: getNodeLabel(relationLabel, 10),
            fill: '#666',
            fontSize: 10,
            textAlign: 'center',
            textBaseline: 'middle',
            cursor: 'pointer',
          },
          name: 'edge-label',
        });
      }

      return keyShape;
    },
    // Handle state changes
    setState(name: string, value: boolean, item: any) {
      const group = item.getContainer();
      const shape = group.get('children')[0]; // Get the path

      if (name === 'selected') {
        if (value) {
          shape.attr('stroke', '#f00');
        } else {
          shape.attr('stroke', '#aaa');
        }
      } else if (name === 'hover') {
        if (value) {
          shape.attr('stroke', '#1890ff');
        } else {
          shape.attr('stroke', '#aaa');
        }
      }
    },
  });
};

// Initialize the graph
const initGraph = () => {
  if (graphContainer.value) {
    const width = graphContainer.value.scrollWidth;
    const height = 3000;

    // Destroy old graph if exists
    if (graph.value) {
      graph.value.destroy();
    }

    // Create new graph instance
    graph.value = new G6.Graph({
      container: graphContainer.value,
      width,
      height,
      fitView: true,
      fitViewPadding: 50,
      modes: {
        default: [
          'drag-canvas',
          'zoom-canvas',
          'drag-node',
          {
            type: 'tooltip',
            formatText(model: any) {
              const { properties, nodeType } = model;
              let tooltip = `<div class="g6-tooltip">`;
              tooltip += `<div class="g6-tooltip-title">${model.label || '未命名节点'}</div>`;
              if (properties) {
                tooltip += `<div class="g6-tooltip-body">`;
                tooltip += `<div><strong>类型:</strong> ${nodeType}</div>`;
                Object.keys(properties).forEach((key: string) => {
                  if (typeof properties[key] !== 'object') {
                    tooltip += `<div><strong>${key}:</strong> ${properties[key]}</div>`;
                  }
                });
                tooltip += `</div>`;
              }
              tooltip += `</div>`;
              return tooltip;
            },
          },
          {
            type: 'edge-tooltip',
            formatText(model: any) {
              const { relationLabel, properties } = model;
              let tooltip = `<div class="g6-tooltip">`;
              tooltip += `<div class="g6-tooltip-title">${relationLabel || '关系'}</div>`;
              if (properties) {
                tooltip += `<div class="g6-tooltip-body">`;
                Object.keys(properties).forEach((key: string) => {
                  if (typeof properties[key] !== 'object') {
                    tooltip += `<div><strong>${key}:</strong> ${properties[key]}</div>`;
                  }
                });
                tooltip += `</div>`;
              }
              tooltip += `</div>`;
              return tooltip;
            },
          },
        ],
        // 在 G6 4.8.x 中，创建边的行为通常是通过在节点之间创建边的交互实现的
        // 使用正确的内置交互行为名称
        addingEdge: [
          {
            type: 'create-edge', // G6 4.8.x 中的边创建交互
            trigger: 'click', // 使用点击触发
            edgeConfig: {
              // 新创建边的默认配置
              type: 'custom-edge',
              style: {
                stroke: '#aaa',
                lineWidth: 1.5,
              },
            },
          },
          'drag-canvas',
          'zoom-canvas',
        ],
      },
      layout: {
        type: 'force',
        preventOverlap: true,
        linkDistance: 100,
        nodeStrength: -100,
        edgeStrength: 0.1,
        // 为力导向布局添加额外配置，提高稳定性
        alphaDecay: 0.028,
        alphaMin: 0.001,
        onLayoutEnd: () => {
          // 布局结束后适应视图
          graph.value?.fitView(20);
        },
      },
      defaultNode: {
        type: 'custom-node',
        size: 40,
      },
      defaultEdge: {
        type: 'custom-edge',
        style: {
          endArrow: true,
        },
      },
      nodeStateStyles: {
        hover: {
          stroke: '#1890ff',
          lineWidth: 2,
        },
        selected: {
          stroke: '#f00',
          lineWidth: 3,
        },
      },
      edgeStateStyles: {
        hover: {
          stroke: '#1890ff',
        },
        selected: {
          stroke: '#f00',
        },
      },
      // 添加插件配置
      plugins: [
        // 如果需要使用 G6 插件，可以在这里添加
      ],
    });

    // Register events
    registerGraphEvents();

    // Render graph with formatted data
    const data = formatGraphData();
    graph.value.data(data);

    // 在 render 之前设置布局完成后的回调
    graph.value.on('afterlayout', () => {
      // 布局完成后适应视图
      graph.value?.fitView(20);
    });

    //graph.value.render();
  }
};

// Register graph events
const registerGraphEvents = () => {
  if (!graph.value) return;

  // Node click event
  graph.value.on('node:click', (evt: any) => {
    const { item } = evt;
    const model = item.getModel();

    // Clear previous selection
    graph.value.findAllByState('node', 'selected').forEach((node: any) => {
      graph.value.setItemState(node, 'selected', false);
    });

    // Set current node selected
    graph.value.setItemState(item, 'selected', true);

    // Emit event
    emit('node-click', model);
  });

  // Node right-click menu
  graph.value.on('node:contextmenu', (evt: any) => {
    evt.preventDefault();
    const { item } = evt;
    const model = item.getModel();

    // Open context menu
    openNodeContextMenu(evt.clientX, evt.clientY, model);
  });

  // Canvas right-click to add node
  graph.value.on('canvas:contextmenu', (evt: any) => {
    evt.preventDefault();
    const point = graph.value.getPointByClient(evt.clientX, evt.clientY);

    // Open add node menu
    openAddNodeMenu(evt.clientX, evt.clientY, point);
  });

  // Edge click event
  graph.value.on('edge:click', (evt: any) => {
    const { item } = evt;
    const model = item.getModel();

    // Clear previous selection
    graph.value.findAllByState('edge', 'selected').forEach((edge: any) => {
      graph.value.setItemState(edge, 'selected', false);
    });

    // Set current edge selected
    graph.value.setItemState(item, 'selected', true);

    // Emit event
    emit('edge-click', model);
  });

  // Edge right-click menu
  graph.value.on('edge:contextmenu', (evt: any) => {
    evt.preventDefault();
    const { item } = evt;
    const model = item.getModel();

    // Open context menu
    openEdgeContextMenu(evt.clientX, evt.clientY, model);
  });

  // Add edge event
  // 使用正确的边创建事件
  graph.value.on('aftercreateedge', (evt: any) => {
    // 在 G6 4.8.x 中，事件对象的结构可能不同
    const { edge } = evt;
    if (edge) {
      const model = edge.getModel();
      const sourceId = model.source;
      const targetId = model.target;

      // 发出添加边事件
      emit('add-edge', {
        sourceId,
        targetId,
      });
    }
  });

  // Window resize event
  window.addEventListener('resize', resizeGraph);
};

// Open node context menu
const openNodeContextMenu = (x: number, y: number, node: any) => {
  const menu = document.createElement('div');
  menu.className = 'graph-context-menu';
  menu.style.position = 'absolute';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.backgroundColor = '#fff';
  menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
  menu.style.borderRadius = '4px';
  menu.style.padding = '8px 0';
  menu.style.zIndex = '1000';

  const createMenuItem = (text: string, onClick: () => void) => {
    const item = document.createElement('div');
    item.className = 'graph-context-menu-item';
    item.style.padding = '8px 16px';
    item.style.cursor = 'pointer';
    item.style.fontSize = '14px';
    item.innerText = text;
    item.addEventListener('click', () => {
      onClick();
      document.body.removeChild(menu);
    });
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f0f0f0';
    });
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = '';
    });
    return item;
  };

  // Edit node
  const editItem = createMenuItem('编辑节点', () => {
    emit('edit-node', node);
  });
  menu.appendChild(editItem);

  // Expand relationships
  const expandItem = createMenuItem('展开关系', () => {
    emit('expand-node', node.id);
  });
  menu.appendChild(expandItem);

  // Delete node
  const deleteItem = createMenuItem('删除节点', () => {
    emit('delete-node', node.id);
  });
  menu.appendChild(deleteItem);

  // Add close event
  document.addEventListener('click', function closeMenu() {
    if (document.body.contains(menu)) {
      document.body.removeChild(menu);
    }
    document.removeEventListener('click', closeMenu);
  });

  document.body.appendChild(menu);
};

// Open add node menu
const openAddNodeMenu = (x: number, y: number, point: any) => {
  const menu = document.createElement('div');
  menu.className = 'graph-context-menu';
  menu.style.position = 'absolute';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.backgroundColor = '#fff';
  menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
  menu.style.borderRadius = '4px';
  menu.style.padding = '8px 0';
  menu.style.zIndex = '1000';

  const createMenuItem = (text: string, onClick: () => void) => {
    const item = document.createElement('div');
    item.className = 'graph-context-menu-item';
    item.style.padding = '8px 16px';
    item.style.cursor = 'pointer';
    item.style.fontSize = '14px';
    item.innerText = text;
    item.addEventListener('click', () => {
      onClick();
      document.body.removeChild(menu);
    });
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f0f0f0';
    });
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = '';
    });
    return item;
  };

  // Add problem node
  const addProblemItem = createMenuItem('添加问题节点', () => {
    emit('add-node', { type: 'Problem', position: point });
  });
  menu.appendChild(addProblemItem);

  // Add step node
  const addStepItem = createMenuItem('添加步骤节点', () => {
    emit('add-node', { type: 'Step', position: point });
  });
  menu.appendChild(addStepItem);

  // Add close event
  document.addEventListener('click', function closeMenu() {
    if (document.body.contains(menu)) {
      document.body.removeChild(menu);
    }
    document.removeEventListener('click', closeMenu);
  });

  document.body.appendChild(menu);
};

// Open edge context menu
const openEdgeContextMenu = (x: number, y: number, edge: any) => {
  const menu = document.createElement('div');
  menu.className = 'graph-context-menu';
  menu.style.position = 'absolute';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.backgroundColor = '#fff';
  menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
  menu.style.borderRadius = '4px';
  menu.style.padding = '8px 0';
  menu.style.zIndex = '1000';

  const createMenuItem = (text: string, onClick: () => void) => {
    const item = document.createElement('div');
    item.className = 'graph-context-menu-item';
    item.style.padding = '8px 16px';
    item.style.cursor = 'pointer';
    item.style.fontSize = '14px';
    item.innerText = text;
    item.addEventListener('click', () => {
      onClick();
      document.body.removeChild(menu);
    });
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f0f0f0';
    });
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = '';
    });
    return item;
  };

  // Edit relationship
  const editItem = createMenuItem('编辑关系', () => {
    emit('edit-edge', edge);
  });
  menu.appendChild(editItem);

  // Delete relationship
  const deleteItem = createMenuItem('删除关系', () => {
    emit('delete-edge', edge.id);
  });
  menu.appendChild(deleteItem);

  // Add close event
  document.addEventListener('click', function closeMenu() {
    if (document.body.contains(menu)) {
      document.body.removeChild(menu);
    }
    document.removeEventListener('click', closeMenu);
  });

  document.body.appendChild(menu);
};

// Resize graph
const resizeGraph = () => {
  if (graph.value && graphContainer.value) {
    const width = graphContainer.value.scrollWidth;
    const height = graphContainer.value.scrollHeight || 500;
    graph.value.changeSize(width, height);
    graph.value.fitView();
  }
};

// Format graph data
// Format graph data
const formatGraphData = () => {
  if (!props.graphData || !props.graphData.nodes || !props.graphData.edges) {
    console.error('无效的图表数据:', props.graphData);
    return { nodes: [], edges: [] };
  }

  const filteredNodes = props.graphData.nodes.filter((node) => {
    if (visibleNodeTypes.value.length === 0) return true;
    return visibleNodeTypes.value.includes(node.nodeType);
  });

  const nodeIds = new Set(filteredNodes.map((node) => String(node.id)));

  const filteredEdges = props.graphData.edges.filter((edge) => {
    const typeMatches =
      visibleRelationTypes.value.length === 0 ||
      visibleRelationTypes.value.includes(edge.relationLabel);
    // 转换为字符串比较
    const nodesIncluded =
      nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target));
    return typeMatches && nodesIncluded;
  });

  // 使用Set跟踪已经处理过的ID
  const processedNodeIds = new Set();
  const processedEdgeIds = new Set();

  // 确保生成正确的G6格式数据
  return {
    nodes: filteredNodes
      .filter((node) => {
        const nodeId = String(node.id);
        // 如果ID已经存在，跳过这个节点
        if (processedNodeIds.has(nodeId)) {
          console.warn(`跳过重复节点ID: ${nodeId}`);
          return false;
        }
        processedNodeIds.add(nodeId);
        return true;
      })
      .map((node) => ({
        id: String(node.id), // 转换为字符串
        // 使用properties里的description或其他字段作为节点名称
        label:
          node.name ||
          (node.properties && node.properties.description) ||
          `节点${node.id}`,
        nodeType: node.nodeType,
        properties: node.properties || {},
        // 添加一些G6可能需要的布局属性
        style: {
          fill: getNodeColor(node.nodeType),
        },
      })),
    edges: filteredEdges
      .filter((edge) => {
        const edgeId = String(edge.id);
        // 如果ID已经存在，跳过这条边
        if (processedEdgeIds.has(edgeId)) {
          console.warn(`跳过重复边ID: ${edgeId}`);
          return false;
        }
        processedEdgeIds.add(edgeId);
        // 确保源节点和目标节点存在
        const sourceExists = processedNodeIds.has(String(edge.source));
        const targetExists = processedNodeIds.has(String(edge.target));
        if (!sourceExists || !targetExists) {
          console.warn(`跳过边 ${edgeId}，因为源节点或目标节点不存在`);
          return false;
        }
        return true;
      })
      .map((edge) => ({
        id: String(edge.id), // 转换为字符串
        source: String(edge.source), // 转换为字符串
        target: String(edge.target), // 转换为字符串
        relationLabel: edge.relationLabel,
        properties: edge.properties || {},
        // 添加可能的样式属性
        style: {
          stroke: '#aaa',
          lineWidth: 1.5,
          endArrow: true,
        },
      })),
  };
};

// Get node color based on type
const getNodeColor = (nodeType: string) => {
  const colors: Record<string, string> = {
    Problem: '#FF6B6B',
    Step: '#4ECDC4',
    Person: '#FF6B6B',
    Company: '#4ECDC4',
    Bank: '#45B7D1',
    Account: '#FFA5AB',
    Transaction: '#FFE66D',
    Product: '#6B5CA5',
  };

  return colors[nodeType] || '#1890FF';
};

// Truncate long text
const getNodeLabel = (text: string, maxLength = 10): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Zoom in
const zoomIn = () => {
  if (graph.value) {
    const zoom = graph.value.getZoom();
    graph.value.zoomTo(zoom * 1.2);
  }
};

// Zoom out
const zoomOut = () => {
  if (graph.value) {
    const zoom = graph.value.getZoom();
    graph.value.zoomTo(zoom / 1.2);
  }
};

// Fit view
const fitView = () => {
  if (graph.value) {
    graph.value.fitView(20);
  }
};

// Download image
const downloadImage = () => {
  if (graph.value) {
    graph.value.downloadFullImage('knowledge-graph', 'image/png', {
      backgroundColor: '#fff',
      padding: [20, 20, 20, 20],
    });
  }
};

// Enable add relation mode
const enableCreateRelation = () => {
  if (!graph.value) return;

  // Set mode to add edge
  graph.value.setMode('addingEdge');

  // Show instruction message
  const message = document.createElement('div');
  message.className = 'graph-message';
  message.style.position = 'absolute';
  message.style.top = '10px';
  message.style.left = '50%';
  message.style.transform = 'translateX(-50%)';
  message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  message.style.color = '#fff';
  message.style.padding = '8px 16px';
  message.style.borderRadius = '4px';
  message.style.zIndex = '1001';
  message.innerText = '点击起始节点并拖动至目标节点创建关系，点击空白区域取消';

  document.body.appendChild(message);

  // Handle cancel
  const cancelHandler = (evt: MouseEvent) => {
    if (
      graph.value &&
      (evt.target as HTMLElement).className === 'graph-container'
    ) {
      graph.value.setMode('default');
      document.removeEventListener('click', cancelHandler);
      if (document.body.contains(message)) {
        document.body.removeChild(message);
      }
    }
  };

  document.addEventListener('click', cancelHandler);
};

// Apply filters
const applyFilters = (
  nodeTypesToShow: string[],
  relationTypesToShow: string[],
) => {
  visibleNodeTypes.value = nodeTypesToShow;
  visibleRelationTypes.value = relationTypesToShow;

  if (graph.value) {
    graph.value.data(formatGraphData());
    graph.value.render();
  }
};

// Expand all nodes
const expandAll = () => {
  if (graph.value) {
    graph.value.getNodes().forEach((node: any) => {
      graph.value.setItemState(node, 'collapsed', false);
    });

    if (graph.value) {
      graph.value.data(formatGraphData());
      graph.value.render();
    }
  }
};

// Collapse all nodes
const collapseAll = () => {
  if (graph.value) {
    graph.value.getNodes().forEach((node: any) => {
      if (node.getModel().id !== 'center') {
        // Except center node
        graph.value.setItemState(node, 'collapsed', true);
      }
    });

    if (graph.value) {
      graph.value.data(formatGraphData());
      graph.value.render();
    }
  }
};

// Lifecycle hooks
onMounted(() => {
  registerCustomElements();
  nextTick(() => {
    initGraph();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeGraph);
  if (graph.value) {
    graph.value.destroy();
  }
});

// Watch for data changes
// 修改 watch 部分的代码
// 在watch中添加日志
watch(
  () => props.graphData,
  () => {
    console.log('graphData changed:', props.graphData);
    nextTick(() => {
      if (graph.value) {
        try {
          const formattedData = formatGraphData();
          console.log('Formatted data for G6:', formattedData);

          // 清除之前的所有元素
          graph.value.clear();

          // 更新数据
          graph.value.data(formattedData);

          // 渲染图表
          graph.value.render();

          // 适应视图
          setTimeout(() => {
            graph.value.fitView(20);
          }, 100);
        } catch (error) {
          console.error('更新图表数据失败:', error);
        }
      }
    });
  },
  { deep: true },
);
// Expose methods to parent component
defineExpose({
  applyFilters,
  expandAll,
  collapseAll,
  fitView,
  zoomIn,
  zoomOut,
  enableCreateRelation,
});
</script>

<style lang="less" scoped>
.graph-viewer-container {
  width: 100%;
  height: 100%;
  position: relative;

  .spin-container {
    width: 100%;
    height: 100%;
  }

  .graph-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
    background-color: #fafafa;
  }

  .toolbar {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }

  .empty-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

:deep(.g6-tooltip) {
  border: 1px solid #e2e2e2;
  border-radius: 4px;
  font-size: 12px;
  color: #545454;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  box-shadow: rgb(174, 174, 174) 0px 0px 10px;

  .g6-tooltip-title {
    font-weight: bold;
    margin-bottom: 8px;
  }

  .g6-tooltip-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>

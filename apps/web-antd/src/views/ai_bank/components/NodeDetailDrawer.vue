<template>
  <Drawer
    :visible="visible"
    :title="drawerTitle"
    width="450"
    @close="handleClose"
    class="node-detail-drawer"
  >
    <template #extra>
      <Space>
        <Button @click="handleClose">关闭</Button>
        <Button type="primary" @click="handleExpandRelations">
          <template #icon><NodeExpandOutlined /></template>
          展开关系
        </Button>
      </Space>
    </template>

    <Spin :spinning="loading">
      <template v-if="nodeData">
        <!-- 节点基本信息 -->
        <Card class="node-info-card" :bordered="false">
          <template #title>
            <div class="card-title">
              <div
                class="node-type-indicator"
                :style="{
                  backgroundColor: getNodeTypeColor(nodeData.nodeType),
                }"
              ></div>
              <span>基本信息</span>
            </div>
          </template>

          <Descriptions :column="1">
            <DescriptionsItem label="ID">
              {{ nodeData.id }}
            </DescriptionsItem>
            <DescriptionsItem label="名称">
              {{ nodeData.name || nodeData.label || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="类型">
              <Tag :color="getNodeTypeColor(nodeData.nodeType)">
                {{ nodeData.nodeType }}
              </Tag>
            </DescriptionsItem>
          </Descriptions>
        </Card>

        <!-- 节点属性列表 -->
        <Card class="node-properties-card" title="属性列表" :bordered="false">
          <Empty v-if="!hasProperties" description="暂无属性" />
          <Collapse v-else accordion>
            <CollapsePanel
              v-for="(value, key) in nodeProperties"
              :key="key"
              :header="key"
            >
              <div class="property-value">
                <template v-if="isObject(value)">
                  <pre>{{ JSON.stringify(value, null, 2) }}</pre>
                </template>
                <template v-else>
                  {{ value }}
                </template>
              </div>
            </CollapsePanel>
          </Collapse>
        </Card>

        <!-- 关系列表 -->
        <Card class="node-relations-card" title="相关联系" :bordered="false">
          <Tabs default-active-key="outgoing">
            <!-- 出向关系 -->
            <TabPane key="outgoing" tab="出向关系">
              <Empty v-if="!hasOutgoingRelations" description="暂无出向关系" />
              <List v-else size="small">
                <ListItem
                  v-for="relation in outgoingRelations"
                  :key="relation.id"
                >
                  <ListItemMeta>
                    <template #title>
                      <div class="relation-item">
                        <Tag color="blue">{{ relation.relationLabel }}</Tag>
                        <ArrowRightOutlined />

                        class="node-link"
                        @click="handleNodeLinkClick(relation.target)" >
                        {{ getTargetNodeName(relation.target) }}
                        <Tag size="small">{{
                          getTargetNodeType(relation.target)
                        }}</Tag>
                      </div>
                    </template>
                  </ListItemMeta>
                </ListItem>
              </List>
            </TabPane>

            <!-- 入向关系 -->
            <TabPane key="incoming" tab="入向关系">
              <Empty v-if="!hasIncomingRelations" description="暂无入向关系" />
              <List v-else size="small">
                <ListItem
                  v-for="relation in incomingRelations"
                  :key="relation.id"
                >
                  <ListItemMeta>
                    <template #title>
                      <div class="relation-item">
                        class="node-link"
                        @click="handleNodeLinkClick(relation.source)" >
                        {{ getSourceNodeName(relation.source) }}
                        <Tag size="small">{{
                          getSourceNodeType(relation.source)
                        }}</Tag>

                        <ArrowLeftOutlined />
                        <Tag color="green">{{ relation.relationLabel }}</Tag>
                      </div>
                    </template>
                  </ListItemMeta>
                </ListItem>
              </List>
            </TabPane>
          </Tabs>
        </Card>
      </template>

      <Empty v-else description="请选择一个节点查看详情" />
    </Spin>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import type { PropType } from 'vue';
import {
  ArrowRightOutlined,
  ArrowLeftOutlined,
  NodeExpandOutlined,
} from '@ant-design/icons-vue';
import {
  Drawer,
  Space,
  Button,
  Spin,
  Card,
  Descriptions,
  DescriptionsItem,
  Tag,
  Empty,
  Collapse,
  CollapsePanel,
  Tabs,
  TabPane,
  List,
  ListItem,
  ListItemMeta,
} from 'ant-design-vue';
import type { NodeItem, RelationItem } from '../data/types';

export default defineComponent({
  name: 'NodeDetailDrawer',
  components: {
    Drawer,
    Space,
    Button,
    Spin,
    Card,
    Descriptions,
    DescriptionsItem,
    Tag,
    Empty,
    Collapse,
    CollapsePanel,
    Tabs,
    TabPane,
    List,
    ListItem,
    ListItemMeta,
    ArrowRightOutlined,
    ArrowLeftOutlined,
    NodeExpandOutlined,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    nodeData: {
      type: Object as PropType<NodeItem | null>,
      default: null,
    },
    allNodes: {
      type: Array as PropType<NodeItem[]>,
      default: () => [],
    },
    allRelations: {
      type: Array as PropType<RelationItem[]>,
      default: () => [],
    },
  },
  emits: ['update:visible', 'expand-relations', 'node-click'],
  setup(props, { emit }) {
    // 省略其余代码，保持不变...
    const loading = ref(false);

    // 节点标题
    const drawerTitle = computed(() => {
      if (!props.nodeData) return '节点详情';
      return (
        props.nodeData.name ||
        props.nodeData.label ||
        `节点 ${props.nodeData.id}`
      );
    });

    // 节点属性（排除特定字段）
    const nodeProperties = computed(() => {
      if (!props.nodeData || !props.nodeData.properties) return {};

      const exclude = ['id', 'name', 'label', 'nodeType'];
      const properties: Record<string, any> = {};

      Object.keys(props.nodeData.properties).forEach((key) => {
        if (!exclude.includes(key)) {
          properties[key] = props.nodeData!.properties[key];
        }
      });

      return properties;
    });

    // 是否有属性
    const hasProperties = computed(() => {
      return Object.keys(nodeProperties.value).length > 0;
    });

    // 出向关系（当前节点作为源）
    const outgoingRelations = computed(() => {
      if (!props.nodeData) return [];
      return props.allRelations.filter(
        (relation) => relation.source === props.nodeData!.id,
      );
    });

    // 入向关系（当前节点作为目标）
    const incomingRelations = computed(() => {
      if (!props.nodeData) return [];
      return props.allRelations.filter(
        (relation) => relation.target === props.nodeData!.id,
      );
    });

    // 是否有出向关系
    const hasOutgoingRelations = computed(() => {
      return outgoingRelations.value.length > 0;
    });

    // 是否有入向关系
    const hasIncomingRelations = computed(() => {
      return incomingRelations.value.length > 0;
    });

    // 获取节点类型颜色
    const getNodeTypeColor = (nodeType: string) => {
      const colors = {
        Person: '#FF6B6B',
        Company: '#4ECDC4',
        Bank: '#45B7D1',
        Account: '#FFA5AB',
        Transaction: '#FFE66D',
        Product: '#6B5CA5',
      };

      return (colors as any)[nodeType] || '#1890FF';
    };

    // 获取目标节点名称
    const getTargetNodeName = (targetId: string) => {
      const targetNode = props.allNodes.find((node) => node.id === targetId);
      return targetNode?.name || targetNode?.label || `节点 ${targetId}`;
    };

    // 获取目标节点类型
    const getTargetNodeType = (targetId: string) => {
      const targetNode = props.allNodes.find((node) => node.id === targetId);
      return targetNode?.nodeType || '未知';
    };

    // 获取源节点名称
    const getSourceNodeName = (sourceId: string) => {
      const sourceNode = props.allNodes.find((node) => node.id === sourceId);
      return sourceNode?.name || sourceNode?.label || `节点 ${sourceId}`;
    };

    // 获取源节点类型
    const getSourceNodeType = (sourceId: string) => {
      const sourceNode = props.allNodes.find((node) => node.id === sourceId);
      return sourceNode?.nodeType || '未知';
    };

    // 关闭抽屉
    const handleClose = () => {
      emit('update:visible', false);
    };

    // 展开节点关系
    const handleExpandRelations = () => {
      if (props.nodeData) {
        loading.value = true;

        // 调用父组件方法展开关系
        emit('expand-relations', props.nodeData.id);

        // 模拟加载完成
        setTimeout(() => {
          loading.value = false;
        }, 1000);
      }
    };

    // 处理节点链接点击
    const handleNodeLinkClick = (nodeId: string) => {
      const node = props.allNodes.find((n) => n.id === nodeId);
      if (node) {
        emit('node-click', node);
      }
    };

    // 检查值是否为对象
    const isObject = (value: any) => {
      return value !== null && typeof value === 'object';
    };

    return {
      loading,
      drawerTitle,
      nodeProperties,
      hasProperties,
      outgoingRelations,
      incomingRelations,
      hasOutgoingRelations,
      hasIncomingRelations,
      getNodeTypeColor,
      getTargetNodeName,
      getTargetNodeType,
      getSourceNodeName,
      getSourceNodeType,
      handleClose,
      handleExpandRelations,
      handleNodeLinkClick,
      isObject,
    };
  },
});
</script>

<style lang="less" scoped>
.node-detail-drawer {
  .node-info-card,
  .node-properties-card,
  .node-relations-card {
    margin-bottom: 16px;

    :deep(.ant-card-head) {
      min-height: 40px;
      padding: 0 12px;

      .ant-card-head-title {
        padding: 8px 0;
      }
    }

    :deep(.ant-card-body) {
      padding: 12px;
    }
  }

  .card-title {
    display: flex;
    align-items: center;

    .node-type-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }
  }

  .property-value {
    max-height: 200px;
    overflow: auto;

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .relation-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .node-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #1890ff;
      cursor: pointer;
    }
  }
}
</style>

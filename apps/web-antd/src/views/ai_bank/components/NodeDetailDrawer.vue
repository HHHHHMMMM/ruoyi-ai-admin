<template>
  <Drawer
    :visible="visible"
    :title="drawerTitle"
    width="1000"
    @close="handleClose"
    class="node-detail-drawer"
  >
    <template #extra>
      <Space>
        <Button @click="handleClose">关闭</Button>
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

        <!-- 意图实体映射列表 (替换原有的关系列表) -->
        <Card class="intent-entity-card" title="意图实体映射" :bordered="false">
          <IntentEntityList
            ref="intentEntityListRef"
            :in-drawer="true"
            :node-id="nodeData.id"
            :problem-type="nodeData.properties?.problem_type"
          />
        </Card>
      </template>

      <Empty v-else description="请选择一个节点查看详情" />
    </Spin>
  </Drawer>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, nextTick } from 'vue';
import type { PropType } from 'vue';
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
} from 'ant-design-vue';
import type { NodeItem, RelationItem } from '../data/types';
import IntentEntityList from './intent-entity/intent-entity-list.vue';

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
    IntentEntityList,
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
    const loading = ref(false);
    const intentEntityListRef = ref(null);

    // 节点标题
    const drawerTitle = computed(() => {
      if (!props.nodeData) return '节点详情';
      return props.nodeData.label || `节点 ${props.nodeData.id}`;
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

    // 关闭抽屉
    const handleClose = () => {
      emit('update:visible', false);
    };

    // 检查值是否为对象
    const isObject = (value: any) => {
      return value !== null && typeof value === 'object';
    };

    // 监听可见性变化，当抽屉打开时刷新意图实体列表
    watch(
      () => props.visible,
      (newVisible) => {
        if (newVisible && intentEntityListRef.value) {
          // 使用 nextTick 确保组件已经被挂载
          nextTick(() => {
            if (
              intentEntityListRef.value &&
              intentEntityListRef.value.refresh
            ) {
              intentEntityListRef.value.refresh();
            }
          });
        }
      },
    );

    return {
      loading,
      drawerTitle,
      nodeProperties,
      hasProperties,
      intentEntityListRef,
      getNodeTypeColor,
      handleClose,
      isObject,
    };
  },
});
</script>

<style lang="less" scoped>
.node-detail-drawer {
  .node-info-card,
  .node-properties-card,
  .intent-entity-card {
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
      max-height: 400px;
      overflow: hidden;
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
}
</style>

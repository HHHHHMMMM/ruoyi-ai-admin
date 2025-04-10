<template>
  <div class="filter-panel">
    <div class="panel-header">
      <FilterOutlined class="filter-icon" />
      <span class="panel-title">过滤器</span>
    </div>

    <div class="panel-content">
      <Collapse v-model:activeKey="activeKeys" ghost>
        <!-- 节点过滤 -->
        <CollapsePanel key="nodeFilter" header="节点类型">
          <div class="filter-section">
            <div class="filter-actions">
              <Button type="link" size="small" @click="selectAllNodeTypes">
                全选
              </Button>
              <Button type="link" size="small" @click="unselectAllNodeTypes">
                清空
              </Button>
            </div>

            <div class="filter-type-list">
              <CheckboxGroup
                v-model:value="selectedNodeTypes"
                @change="handleFilterChange"
              >
                <div v-for="type in nodeTypes" :key="type" class="type-item">
                  <Checkbox :value="type">
                    <Tag :color="getNodeTypeColor(type)">{{ type }}</Tag>
                  </Checkbox>
                  <span class="type-count">{{ getNodeTypeCount(type) }}</span>
                </div>
              </CheckboxGroup>
            </div>
          </div>
        </CollapsePanel>

        <!-- 关系过滤 -->
        <CollapsePanel key="relationFilter" header="关系类型">
          <div class="filter-section">
            <div class="filter-actions">
              <Button type="link" size="small" @click="selectAllRelationTypes">
                全选
              </Button>
              <Button
                type="link"
                size="small"
                @click="unselectAllRelationTypes"
              >
                清空
              </Button>
            </div>

            <div class="filter-type-list">
              <CheckboxGroup
                v-model:value="selectedRelationTypes"
                @change="handleFilterChange"
              >
                <div
                  v-for="type in relationTypes"
                  :key="type"
                  class="type-item"
                >
                  <Checkbox :value="type">
                    <span>{{ type }}</span>
                  </Checkbox>
                  <span class="type-count">{{
                    getRelationTypeCount(type)
                  }}</span>
                </div>
              </CheckboxGroup>
            </div>
          </div>
        </CollapsePanel>

        <!-- 路径分析 -->
        <CollapsePanel key="pathAnalysis" header="路径分析">
          <div class="filter-section">
            <Form layout="vertical">
              <FormItem label="起始节点">
                <Select
                  v-model:value="pathAnalysis.sourceId"
                  placeholder="选择起始节点"
                  show-search
                  :filter-option="filterOption"
                >
                  <SelectOption
                    v-for="node in availableNodes"
                    :key="node.id"
                    :value="node.id"
                  >
                    {{ node.label || node.name || `节点${node.id}` }}
                  </SelectOption>
                </Select>
              </FormItem>

              <FormItem label="目标节点">
                <Select
                  v-model:value="pathAnalysis.targetId"
                  placeholder="选择目标节点"
                  show-search
                  :filter-option="filterOption"
                >
                  <SelectOption
                    v-for="node in availableNodes"
                    :key="node.id"
                    :value="node.id"
                  >
                    {{ node.label || node.name || `节点${node.id}` }}
                  </SelectOption>
                </Select>
              </FormItem>

              <FormItem label="最大深度">
                <Slider
                  v-model:value="pathAnalysis.maxDepth"
                  :min="1"
                  :max="6"
                  :marks="{
                    1: '1',
                    2: '2',
                    3: '3',
                    4: '4',
                    5: '5',
                    6: '6',
                  }"
                />
              </FormItem>

              <Button
                type="primary"
                block
                :disabled="!pathAnalysis.sourceId || !pathAnalysis.targetId"
                @click="findPath"
              >
                <template #icon><ApartmentOutlined /></template>
                查找路径
              </Button>
            </Form>
          </div>
        </CollapsePanel>
      </Collapse>

      <Divider style="margin: 8px 0" />

      <div class="apply-filters">
        <Button type="primary" block @click="applyFilters"> 应用过滤器 </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watchEffect } from 'vue';
import type { PropType } from 'vue';

import { FilterOutlined, ApartmentOutlined } from '@ant-design/icons-vue';
import {
  Collapse,
  CollapsePanel,
  Button,
  CheckboxGroup,
  Checkbox,
  Tag,
  Form,
  FormItem,
  Select,
  SelectOption,
  Slider,
  Divider,
} from 'ant-design-vue';
import type { NodeItem, RelationItem } from '../data/types';

export default defineComponent({
  name: 'FilterPanel',
  components: {
    FilterOutlined,
    ApartmentOutlined,
    Collapse,
    CollapsePanel,
    Button,
    CheckboxGroup,
    Checkbox,
    Tag,
    Form,
    FormItem,
    Select,
    SelectOption,
    Slider,
    Divider,
  },
  props: {
    nodeTypes: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    relationTypes: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    nodes: {
      type: Array as PropType<NodeItem[]>,
      default: () => [],
    },
    edges: {
      type: Array as PropType<RelationItem[]>,
      default: () => [],
    },
  },
  emits: ['filter', 'find-path'],
  setup(props, { emit }) {
    // 折叠面板激活的键
    const activeKeys = ref<string[]>(['nodeFilter', 'relationFilter']);

    // 选中的节点类型和关系类型
    const selectedNodeTypes = ref<string[]>([]);
    const selectedRelationTypes = ref<string[]>([]);

    // 路径分析参数
    const pathAnalysis = reactive({
      sourceId: '',
      targetId: '',
      maxDepth: 3,
    });

    // 可选节点列表
    const availableNodes = computed(() => props.nodes || []);

    // 初始化选中所有类型
    watchEffect(() => {
      if (props.nodeTypes.length > 0 && selectedNodeTypes.value.length === 0) {
        selectedNodeTypes.value = [...props.nodeTypes];
      }

      if (
        props.relationTypes.length > 0 &&
        selectedRelationTypes.value.length === 0
      ) {
        selectedRelationTypes.value = [...props.relationTypes];
      }
    });

    // 获取节点类型颜色
    const getNodeTypeColor = (nodeType: string) => {
      const colors = {
        Person: 'red',
        Company: 'green',
        Bank: 'blue',
        Account: 'pink',
        Transaction: 'orange',
        Product: 'purple',
      };

      return (colors as any)[nodeType] || 'cyan';
    };

    // 获取节点类型数量
    const getNodeTypeCount = (nodeType: string) => {
      return (
        props.nodes?.filter((node) => node.nodeType === nodeType).length || 0
      );
    };

    // 获取关系类型数量
    const getRelationTypeCount = (relationType: string) => {
      return (
        props.edges?.filter((edge) => edge.relationLabel === relationType)
          .length || 0
      );
    };

    // 选择所有节点类型
    const selectAllNodeTypes = () => {
      selectedNodeTypes.value = [...props.nodeTypes];
      handleFilterChange();
    };

    // 取消选择所有节点类型
    const unselectAllNodeTypes = () => {
      selectedNodeTypes.value = [];
      handleFilterChange();
    };

    // 选择所有关系类型
    const selectAllRelationTypes = () => {
      selectedRelationTypes.value = [...props.relationTypes];
      handleFilterChange();
    };

    // 取消选择所有关系类型
    const unselectAllRelationTypes = () => {
      selectedRelationTypes.value = [];
      handleFilterChange();
    };

    // 处理过滤变化
    const handleFilterChange = () => {
      // 这里可以添加防抖处理
    };

    // 应用过滤器
    const applyFilters = () => {
      emit('filter', selectedNodeTypes.value, selectedRelationTypes.value);
    };

    // 查找路径
    const findPath = () => {
      emit('find-path', pathAnalysis);
    };

    // 节点选择器过滤选项
    const filterOption = (input: string, option: any) => {
      return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    };

    return {
      activeKeys,
      selectedNodeTypes,
      selectedRelationTypes,
      pathAnalysis,
      availableNodes,
      getNodeTypeColor,
      getNodeTypeCount,
      getRelationTypeCount,
      selectAllNodeTypes,
      unselectAllNodeTypes,
      selectAllRelationTypes,
      unselectAllRelationTypes,
      handleFilterChange,
      applyFilters,
      findPath,
      filterOption,
    };
  },
});
</script>

<style lang="less" scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;

    .filter-icon {
      margin-right: 8px;
      color: #1890ff;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .panel-content {
    padding: 8px;
    flex: 1;
    overflow-y: auto;

    .filter-section {
      margin-bottom: 8px;

      .filter-actions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .filter-type-list {
        max-height: 200px;
        overflow-y: auto;

        .type-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;

          .type-count {
            color: #999;
            font-size: 12px;
          }
        }
      }
    }

    .apply-filters {
      margin-top: 16px;
    }
  }
}
</style>

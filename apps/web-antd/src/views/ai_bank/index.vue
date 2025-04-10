<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import {
  message,
  Modal,
  Space,
  Button,
  Form,
  Input,
  Select,
  Row,
  Col,
} from 'ant-design-vue';
import {
  ReloadOutlined,
  BuildOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue';

import GraphViewer from './components/GraphViewer.vue';
import SearchPanel from './components/SearchPanel.vue';
import FilterPanel from './components/FilterPanel.vue';
import NodeDetailDrawer from './components/NodeDetailDrawer.vue';

import {
  createKnowledgeGraph,
  clearKnowledgeGraph,
  verifyKnowledgeGraph,
  createNode,
  updateNode,
  deleteNode,
  createRelation,
  updateRelation,
  deleteRelation,
} from './data/api';
import { useGraphData } from './hooks/useGraphData';
import type { NodeItem } from './data/types';

// 节点详情抽屉
const drawerVisible = ref(false);
const selectedNode = ref<NodeItem | null>(null);

// 图谱查看器引用
const graphViewerRef = ref(null);

// 使用图谱数据hook
const {
  loading,
  graphData,
  nodeTypes,
  relationTypes,
  fetchGraphData,
  searchNodes,
  fetchNodeRelations,
} = useGraphData();

// 初始化加载图谱数据
onMounted(async () => {
  await refreshGraph();
});

// 刷新图谱
const refreshGraph = async () => {
  try {
    await fetchGraphData();
    message.success('图谱数据刷新成功');
  } catch (error) {
    console.error('刷新图谱失败:', error);
    message.error('图谱数据刷新失败');
  }
};

// 创建知识图谱
const createGraph = async () => {
  try {
    const res = await createKnowledgeGraph();
    if (res.success) {
      message.success('知识图谱创建成功');
      await refreshGraph(); // 刷新图谱
    } else {
      message.error(res.message || '知识图谱创建失败');
    }
  } catch (error) {
    console.error('创建知识图谱失败:', error);
    message.error('创建知识图谱失败');
  }
};

// 确认清空图谱
const confirmClearGraph = () => {
  Modal.confirm({
    title: '确认清空知识图谱',
    content: '此操作将清空所有图谱数据，是否继续？',
    okText: '确认',
    cancelText: '取消',
    onOk: clearGraph,
  });
};

// 清空图谱
const clearGraph = async () => {
  try {
    const res = await clearKnowledgeGraph();
    if (res.success) {
      message.success('知识图谱已清空');
      graphData.value = { nodes: [], edges: [] }; // 清空本地数据
    } else {
      message.error(res.message || '知识图谱清空失败');
    }
  } catch (error) {
    console.error('清空知识图谱失败:', error);
    message.error('清空知识图谱失败');
  }
};

// 验证图谱
const verifyGraph = async () => {
  try {
    const res = await verifyKnowledgeGraph();
    if (res.success) {
      message.success('知识图谱验证通过');
    } else {
      message.error(res.message || '知识图谱验证失败');
    }
  } catch (error) {
    console.error('验证知识图谱失败:', error);
    message.error('验证知识图谱失败');
  }
};

// 处理节点点击
const handleNodeClick = (node: NodeItem) => {
  selectedNode.value = node;
  drawerVisible.value = true;
};

// 展开节点关系
const expandNodeRelations = async (nodeId: string) => {
  try {
    await fetchNodeRelations(nodeId);
    message.success('节点关系加载成功');
  } catch (error) {
    console.error('加载节点关系失败:', error);
    message.error('节点关系加载失败');
  }
};

// 处理搜索
const handleSearch = async (keyword: string) => {
  try {
    await searchNodes(keyword);
  } catch (error) {
    console.error('搜索节点失败:', error);
    message.error('搜索节点失败');
  }
};

// 应用过滤器
const applyFilters = (
  nodeTypesToShow: string[],
  relationTypesToShow: string[],
) => {
  if (graphViewerRef.value) {
    graphViewerRef.value.applyFilters(nodeTypesToShow, relationTypesToShow);
  }
};

// 展开所有节点
const expandAll = () => {
  if (graphViewerRef.value) {
    graphViewerRef.value.expandAll();
  }
};

// 收起所有节点
const collapseAll = () => {
  if (graphViewerRef.value) {
    graphViewerRef.value.collapseAll();
  }
};

// 节点编辑相关
const nodeForm = reactive({
  id: '',
  label: 'Problem',
  name: '',
  dynamicFields: [] as { key: string; value: string }[],
});

const nodeFormVisible = ref(false);

// 打开节点编辑表单
const openNodeForm = (node?: NodeItem) => {
  console.log('12234');
  if (node) {
    // 编辑现有节点
    nodeForm.id = node.id;
    nodeForm.label = node.nodeType;
    nodeForm.name = node.name || '';

    // 填充动态字段
    nodeForm.dynamicFields = [];
    if (node.properties) {
      Object.entries(node.properties).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'name' && key !== 'nodeType') {
          nodeForm.dynamicFields.push({ key, value: String(value) });
        }
      });
    }
  } else {
    // 新建节点
    nodeForm.id = '';
    nodeForm.label = 'Problem';
    nodeForm.name = '';
    nodeForm.dynamicFields = [];
  }

  nodeFormVisible.value = true;
};

// 打开创建节点表单
const openCreateNodeForm = () => {
  openNodeForm();
};

// 添加属性字段
const addDynamicField = () => {
  nodeForm.dynamicFields.push({ key: '', value: '' });
};

// 删除属性字段
const removeDynamicField = (index: number) => {
  nodeForm.dynamicFields.splice(index, 1);
};

// 处理节点表单提交
const handleNodeFormSubmit = async () => {
  if (!nodeForm.name.trim()) {
    message.error('节点名称不能为空');
    return;
  }

  // 构建节点数据
  const nodeData: any = {
    nodeType: nodeForm.label,
    name: nodeForm.name,
    properties: {},
  };

  // 添加动态属性
  nodeForm.dynamicFields.forEach((field) => {
    if (field.key && field.key.trim()) {
      nodeData.properties[field.key] = field.value;
    }
  });

  try {
    let success;
    if (nodeForm.id) {
      // 更新节点
      success = await updateNode(nodeForm.id, nodeData);
    } else {
      // 创建新节点
      success = await createNode(nodeData);
    }

    if (success) {
      nodeFormVisible.value = false;
      await refreshGraph(); // 刷新图谱以显示新节点
    }
  } catch (error) {
    console.error('保存节点失败:', error);
    message.error('保存节点失败');
  }
};

// 删除节点
const confirmDeleteNode = (nodeId: string) => {
  Modal.confirm({
    title: '确认删除节点',
    content: '删除节点将同时删除与之相关的所有关系，是否继续？',
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteNode(nodeId);
      } catch (error) {
        console.error('删除节点失败:', error);
        message.error('删除节点失败');
      }
    },
  });
};

// 关系表单相关
const relationForm = reactive({
  id: '',
  sourceId: '',
  targetId: '',
  type: '',
  dynamicFields: [] as { key: string; value: string }[],
});

const relationFormVisible = ref(false);

// 打开添加关系表单
const openRelationForm = (
  sourceId?: string,
  targetId?: string,
  relation?: any,
) => {
  if (relation) {
    // 编辑现有关系
    relationForm.id = relation.id;
    relationForm.sourceId = relation.source;
    relationForm.targetId = relation.target;
    relationForm.type = relation.relationLabel;

    // 填充动态字段
    relationForm.dynamicFields = [];
    if (relation.properties) {
      Object.entries(relation.properties).forEach(([key, value]) => {
        relationForm.dynamicFields.push({ key, value: String(value) });
      });
    }
  } else {
    // 新建关系
    relationForm.id = '';
    relationForm.sourceId = sourceId || '';
    relationForm.targetId = targetId || '';
    relationForm.type = '';
    relationForm.dynamicFields = [];
  }

  relationFormVisible.value = true;
};

// 添加关系属性字段
const addRelationDynamicField = () => {
  relationForm.dynamicFields.push({ key: '', value: '' });
};

// 删除关系属性字段
const removeRelationDynamicField = (index: number) => {
  relationForm.dynamicFields.splice(index, 1);
};

// 处理关系表单提交
const handleRelationFormSubmit = async () => {
  if (!relationForm.sourceId) {
    message.error('请选择源节点');
    return;
  }

  if (!relationForm.targetId) {
    message.error('请选择目标节点');
    return;
  }

  if (!relationForm.type) {
    message.error('请选择关系类型');
    return;
  }

  // 构建关系数据
  const relationData: any = {
    sourceId: relationForm.sourceId,
    targetId: relationForm.targetId,
    type: relationForm.type,
    properties: {},
  };

  // 添加动态属性
  relationForm.dynamicFields.forEach((field) => {
    if (field.key && field.key.trim()) {
      relationData.properties[field.key] = field.value;
    }
  });

  try {
    let success;
    if (relationForm.id) {
      // 更新关系
      success = await updateRelation(relationForm.id, relationData);
    } else {
      // 创建新关系
      success = await createRelation(relationData);
    }

    if (success) {
      relationFormVisible.value = false;
      await refreshGraph(); // 刷新图谱以显示新关系
    }
  } catch (error) {
    console.error('保存关系失败:', error);
    message.error('保存关系失败');
  }
};

// 删除关系
const confirmDeleteRelation = (relationId: string) => {
  Modal.confirm({
    title: '确认删除关系',
    content: '是否确认删除此关系？',
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteRelation(relationId);
      } catch (error) {
        console.error('删除关系失败:', error);
        message.error('删除关系失败');
      }
    },
  });
};

// 打开创建关系表单
const openCreateRelationForm = () => {
  openRelationForm();
};
</script>

<template>
  <Page :auto-content-height="true">
    <template #headerContent>
      <div>
        <h2 class="mb-2 text-lg font-bold">知识图谱可视化</h2>
        <p class="text-gray-600">
          银行知识图谱展示平台，支持节点查询、关系过滤、路径分析等功能
        </p>
      </div>
    </template>

    <!-- 工具栏 -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <Space>
          <Button type="primary" @click="createGraph">
            <template #icon><BuildOutlined /></template>
            创建知识图谱
          </Button>
          <Button danger @click="confirmClearGraph">
            <template #icon><ClearOutlined /></template>
            清空知识图谱
          </Button>
          <Button @click="verifyGraph">
            <template #icon><CheckCircleOutlined /></template>
            验证图谱
          </Button>
          <Button @click="refreshGraph">
            <template #icon><ReloadOutlined /></template>
            刷新图谱
          </Button>
          <Button @click="openCreateNodeForm">
            <template #icon><PlusOutlined /></template>
            添加节点
          </Button>
          <Button @click="openCreateRelationForm">
            <template #icon><LinkOutlined /></template>
            添加关系
          </Button>
        </Space>
      </div>

      <div>
        <Space>
          <Button @click="expandAll">展开全部</Button>
          <Button @click="collapseAll">收起全部</Button>
        </Space>
      </div>
    </div>

    <div class="flex h-full">
      <!-- 左侧面板 -->
      <div
        class="mr-4 flex w-64 flex-col overflow-hidden rounded-md bg-white shadow-md"
      >
        <SearchPanel @search="handleSearch" />
        <FilterPanel
          :nodeTypes="nodeTypes"
          :relationTypes="relationTypes"
          @filter="applyFilters"
        />
      </div>

      <!-- 图谱展示区域 -->
      <div
        class="flex flex-1 flex-col overflow-hidden rounded-md bg-white shadow-md"
      >
        <GraphViewer
          ref="graphViewerRef"
          :loading="loading"
          :graphData="graphData"
          @edit-node="openNodeForm"
          @node-click="handleNodeClick"
        />
      </div>
    </div>

    <!-- 节点详情抽屉 -->
    <NodeDetailDrawer
      v-model:visible="drawerVisible"
      :nodeData="selectedNode"
      :allNodes="graphData.nodes"
      :allRelations="graphData.edges"
      @expand-relations="expandNodeRelations"
      @node-click="handleNodeClick"
      @edit-node="openNodeForm"
      @delete-node="confirmDeleteNode"
      @add-relation="openRelationForm"
      @edit-relation="openRelationForm"
      @delete-relation="confirmDeleteRelation"
    />

    <!-- 节点编辑对话框 -->
    <Modal
      width="800px"
      v-model:visible="nodeFormVisible"
      :title="nodeForm.id ? '编辑节点' : '添加节点'"
      @ok="handleNodeFormSubmit"
    >
      <Form :model="nodeForm" layout="vertical">
        <Form.Item label="节点类型">
          <Select v-model:value="nodeForm.label">
            <Select.Option value="Problem">问题</Select.Option>
            <Select.Option value="Step">步骤</Select.Option>
            <Select.Option value="Entity">实体</Select.Option>
            <Select.Option value="Concept">概念</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="名称">
          <Input v-model:value="nodeForm.name" />
        </Form.Item>

        <div v-for="(field, index) in nodeForm.dynamicFields" :key="index">
          <Row :gutter="16">
            <Col :span="10">
              <Form.Item label="属性名">
                <Input v-model:value="field.key" />
              </Form.Item>
            </Col>
            <Col :span="10">
              <Form.Item label="属性值">
                <Input v-model:value="field.value" />
              </Form.Item>
            </Col>
            <Col :span="4">
              <Form.Item label=" " :colon="false">
                <Button @click="removeRelationDynamicField(index)" danger
                  >删除</Button
                >
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Button @click="addDynamicField" type="dashed" block>添加属性</Button>
      </Form>
    </Modal>

    <!-- 关系编辑对话框 -->
    <Modal
      v-model:visible="relationFormVisible"
      :title="relationForm.id ? '编辑关系' : '添加关系'"
      @ok="handleRelationFormSubmit"
    >
      <Form :model="relationForm" layout="vertical">
        <Form.Item label="源节点">
          <Select v-model:value="relationForm.sourceId">
            <Select.Option
              v-for="node in graphData.nodes"
              :key="node.id"
              :value="node.id"
            >
              {{ node.name || node.id }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="目标节点">
          <Select v-model:value="relationForm.targetId">
            <Select.Option
              v-for="node in graphData.nodes"
              :key="node.id"
              :value="node.id"
            >
              {{ node.name || node.id }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="关系类型">
          <Select v-model:value="relationForm.type">
            <Select.Option value="CONTAINS">包含</Select.Option>
            <Select.Option value="RELATED_TO">相关</Select.Option>
            <Select.Option value="DEPENDS_ON">依赖</Select.Option>
            <Select.Option value="IS_A">是一种</Select.Option>
          </Select>
        </Form.Item>

        <!-- 动态属性表单 -->
        <div v-for="(field, index) in relationForm.dynamicFields" :key="index">
          <Row :gutter="16" type="flex" align="middle">
            <Col :span="10">
              <Form.Item label="属性名">
                <Input v-model:value="field.key" />
              </Form.Item>
            </Col>
            <Col :span="10">
              <Form.Item label="属性值">
                <Input v-model:value="field.value" />
              </Form.Item>
            </Col>
            <Col :span="4">
              <div
                style="
                  display: flex;
                  align-items: center;
                  height: 32px;
                  margin-top: 20px;
                "
              >
                <Button @click="removeRelationDynamicField(index)" danger
                  >删除</Button
                >
              </div>
            </Col>
          </Row>
        </div>

        <Button @click="addRelationDynamicField" type="dashed" block
          >添加属性</Button
        >
      </Form>
    </Modal>
  </Page>
</template>

<style lang="less" scoped>
.graph-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style>

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
import type { DictData } from '#/api/system/dict/dict-data-model';

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
import { dictDataList4AiBank } from '#/api/system/dict/dict-data';
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
  // 新增字段
  problemType: '',
  problemId: '',
  description: '',
  dynamicFields: [] as { key: string; value: string }[],
});
const problemTypeOptions = ref<DictData[]>([]);
const dictLoading = ref(false);

const nodeFormVisible = ref(false);
// 加载问题类型字典数据
const loadProblemTypes = async () => {
  dictLoading.value = true;
  try {
    const res = await dictDataList4AiBank({ dictType: 'problem_type' }); // 使用正确的字典类型
    problemTypeOptions.value = res.rows || [];
  } catch (error) {
    console.error('加载问题类型失败:', error);
    message.error('加载问题类型失败');
  } finally {
    dictLoading.value = false;
  }
};
// 打开节点编辑表单
const openNodeForm = (node?: NodeItem) => {
  console.log(node);
  if (node) {
    // 编辑现有节点
    nodeForm.id = node.id;
    nodeForm.label = node.nodeType;

    if (node.nodeType === 'Problem') {
      // 是问题节点，填充问题特定字段
      nodeForm.problemType = node.properties?.problem_type || '';
      nodeForm.problemId = node.properties?.problem_id || '';
      nodeForm.description = node.properties?.description || '';
      loadProblemTypes(); // 加载问题类型数据
    } else {
      // 非问题节点
      nodeForm.name = node.label || '';
    }

    // 填充动态字段
    nodeForm.dynamicFields = [];
    if (node.properties) {
      Object.entries(node.properties).forEach(([key, value]) => {
        // 排除问题特定字段和通用字段
        if (
          ![
            'id',
            'name',
            'nodeType',
            'problem_id',
            'problem_type',
            'description',
          ].includes(key)
        ) {
          nodeForm.dynamicFields.push({ key, value: String(value) });
        }
      });
    }
  } else {
    // 新建节点
    nodeForm.id = '';
    nodeForm.label = 'Problem';
    nodeForm.name = '';
    nodeForm.problemType = '';
    nodeForm.problemId = '';
    nodeForm.description = '';
    nodeForm.dynamicFields = [];

    // 如果默认是问题类型，加载问题类型数据
    if (nodeForm.label === 'Problem') {
      loadProblemTypes();
    }
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
  if (nodeForm.label === 'Problem') {
    // 验证问题特定字段
    if (!nodeForm.problemType) {
      message.error('请选择问题类型');
      return;
    }
    if (!nodeForm.description) {
      message.error('问题描述不能为空');
      return;
    }
  } else {
    // 验证一般节点字段
    if (!nodeForm.name.trim()) {
      message.error('节点名称不能为空');
      return;
    }
  }

  // 构建节点数据
  const nodeData: any = {
    nodeType: nodeForm.label,
    properties: {},
  };

  // 根据节点类型设置属性
  if (nodeForm.label === 'Problem') {
    // 问题节点
    nodeData.name = nodeForm.description.substring(0, 20) + '...'; // 截取描述作为显示名称
    nodeData.properties.problem_type = nodeForm.problemType;
    nodeData.properties.description = nodeForm.description;

    // 如果是编辑模式且有问题ID，保留原ID
    if (nodeForm.id && nodeForm.problemId) {
      nodeData.properties.problem_id = nodeForm.problemId;
    }
    // 注意：新建问题节点时，problem_id 由后端生成
  } else {
    // 一般节点
    nodeData.name = nodeForm.name;
  }

  // 添加动态属性
  nodeForm.dynamicFields.forEach((field) => {
    if (field.key && field.key.trim()) {
      nodeData.properties[field.key] = field.value;
    }
  });

  try {
    if (nodeForm.id) {
      // 更新节点
      await updateNode(nodeForm.id, nodeData);
    } else {
      // 创建新节点
      await createNode(nodeData);
    }
    nodeFormVisible.value = false;
    await refreshGraph(); // 刷新图谱以显示新节点
    message.success(nodeForm.id ? '节点更新成功' : '节点创建成功');
  } catch (error) {
    console.error('保存节点失败:', error);
    message.error('保存节点失败');
  }
};

const handleEditRelation = (relation) => {
  if (relation) {
    console.log('Received in parent:', relation);
    openRelationForm(relation.source, relation.target, relation);
  } else {
    console.error('关系对象为空');
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
        await refreshGraph(); // 刷新图谱以显示新关系
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
  console.log(relation);
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
    let res;
    if (relationForm.id) {
      // 更新关系
      res = await updateRelation(relationForm.id, relationData);
    } else {
      // 创建新关系
      res = await createRelation(relationData);
    }

    if (res.success) {
      relationFormVisible.value = false;
      await refreshGraph(); // 刷新图谱以显示新关系
      message.success(
        res.message || (relationForm.id ? '关系更新成功' : '关系创建成功'),
      );
    } else {
      message.error(
        res.message || (relationForm.id ? '关系更新失败' : '关系创建失败'),
      );
    }
  } catch (error) {
    console.error('保存关系失败:', error);
    message.error('保存关系失败');
  }
};
// 节点类型变更处理
const handleNodeTypeChange = (value) => {
  if (value === 'Problem') {
    loadProblemTypes(); // 加载问题类型数据
    nodeForm.name = ''; // 清空名称字段
  } else {
    // 清空问题相关字段
    nodeForm.problemType = '';
    nodeForm.problemId = '';
    nodeForm.description = '';
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

// 问题类型变更处理
const handleProblemTypeChange = async (value) => {
  // 清空问题ID，等待后端生成
  nodeForm.problemId = '';

  // 后端会根据问题类型生成ID，这里可以先清空，或者可以预览生成规则
  // 实际生成的ID会在提交表单后由后端返回
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
          @edit-relation="handleEditRelation"
          @delete-node="confirmDeleteNode"
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
      @add-relation="openRelationForm"
      @edit-relation="openRelationForm"
      @delete-relation="confirmDeleteRelation"
    />

    <!-- 节点编辑对话框 -->
    <!-- 节点编辑对话框 -->
    <Modal
      width="800px"
      v-model:visible="nodeFormVisible"
      :title="nodeForm.id ? '编辑节点' : '添加节点'"
      @ok="handleNodeFormSubmit"
    >
      <Form :model="nodeForm" layout="vertical">
        <Form.Item label="节点类型">
          <Select v-model:value="nodeForm.label" @change="handleNodeTypeChange">
            <Select.Option value="Problem">问题</Select.Option>
            <Select.Option value="Step">步骤</Select.Option>
          </Select>
        </Form.Item>

        <!-- 问题类型选择 - 仅在选择"问题"节点类型时显示 -->
        <template v-if="nodeForm.label === 'Problem'">
          <Form.Item label="问题类型">
            <Select
              v-model:value="nodeForm.problemType"
              :loading="dictLoading"
              @change="handleProblemTypeChange"
            >
              <Select.Option
                v-for="item in problemTypeOptions"
                :key="item.dictValue"
                :value="item.dictValue"
              >
                {{ item.dictLabel }}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="问题ID" v-if="nodeForm.problemId">
            <Input v-model:value="nodeForm.problemId" disabled />
          </Form.Item>

          <Form.Item label="问题描述">
            <Input.TextArea v-model:value="nodeForm.description" :rows="4" />
          </Form.Item>
        </template>

        <!-- 非问题节点的名称字段 -->
        <Form.Item v-else label="名称">
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
                <Button @click="removeDynamicField(index)" danger>删除</Button>
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
              {{ node.label || node.id }}
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
              {{ node.label || node.id }}
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

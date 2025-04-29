<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
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
  Tooltip,
} from 'ant-design-vue';

import {
  ReloadOutlined,
  BuildOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  LinkOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue';

import GraphViewer from './components/GraphViewer.vue';
import SearchPanel from './components/SearchPanel.vue';
import NodeDetailDrawer from './components/NodeDetailDrawer.vue';

import {
  createKnowledgeGraph,
  clearKnowledgeGraph,
  verifyKnowledgeGraph,
  createNode,
  updateNode,
  deleteNode,
  createRelation,
  deleteRelation,
  listProblemIds,
  createStepNode,
  getStepsByProblemId,
} from './data/api';
import { dataSourceList } from '#/api/system/data-source/api';
import { useGraphData } from './hooks/useGraphData';
import type { NodeItem } from './data/types';
// 节点详情抽屉
const drawerVisible = ref(false);
const systemList = ref<any[]>([]);
const systemListLoading = ref(false);
const selectedNode = ref<NodeItem | null>(null);
// 添加问题ID列表相关的响应式数据
const problemIds = ref<any[]>([]);
const problemIdsLoading = ref(false);
// 图谱查看器引用
const graphViewerRef = ref(null);

// 使用图谱数据hook
const { loading, graphData, fetchGraphData, searchNodes, fetchNodeRelations } =
  useGraphData();

// 初始化加载图谱数据
onMounted(async () => {
  await refreshGraph();
  await loadSystemList();
});

// 关系表单相关
const relationForm = reactive({
  id: '',
  type: 'NEXT_DEFAULT',
  problemId: '',
  sourceId: '',
  targetId: '',
  conditionExpression: '',
  dynamicFields: [] as { key: string; value: string }[],
});

// 步骤列表相关
const steps = ref<any[]>([]);
const stepsLoading = ref(false);
const filteredSteps = computed(() => {
  // 根据选择的问题ID过滤步骤
  return steps.value.filter(
    (step) => step.problemId === relationForm.problemId,
  );
});

// Add this function with your other loading functions
const loadSystemList = async () => {
  systemListLoading.value = true;
  try {
    const res = await dataSourceList({
      pageNum: 1,
      pageSize: 100, // Ensure we get all systems
    });
    systemList.value = res.rows;
  } catch (error) {
    console.error('加载系统列表失败:', error);
    message.error('加载系统列表失败');
    systemList.value = [];
  } finally {
    systemListLoading.value = false;
  }
};
// 加载特定问题的步骤列表
const loadStepsByProblemId = async (problemId: string) => {
  if (!problemId) return;

  stepsLoading.value = true;
  try {
    // 这里假设有一个API来获取特定问题的步骤
    const res = await getStepsByProblemId(problemId);
    if (res && res.data) {
      steps.value = res.data;
    } else if (res) {
      steps.value = Array.isArray(res) ? res : [];
    } else {
      steps.value = [];
    }
  } catch (error) {
    console.error('加载步骤列表失败:', error);
    message.error('加载步骤列表失败');
    steps.value = [];
  } finally {
    stepsLoading.value = false;
  }
};

// 处理问题ID变更
const handleProblemIdChange = (value: string) => {
  // 清空源节点和目标节点
  relationForm.sourceId = '';
  relationForm.targetId = '';

  // 加载该问题的步骤列表
  loadStepsByProblemId(value);
};

// 处理关系类型变更
const handleRelationTypeChange = (value: string) => {
  // 如果选择FIRST_STEP，清空源节点
  if (value === 'FIRST_STEP') {
    relationForm.sourceId = '';
  }

  // 如果不是NEXT_IF，清空条件表达式
  if (value !== 'NEXT_IF') {
    relationForm.conditionExpression = '';
  }
};

// 加载问题ID列表
const loadProblemIds = async () => {
  problemIdsLoading.value = true;
  try {
    const res = await listProblemIds();
    if (res.success) {
      problemIds.value = res.data;
    } else {
      message.error(res.message || '加载问题列表失败');
    }
  } catch (error) {
    console.error('加载问题列表失败:', error);
    message.error('加载问题列表失败');
  } finally {
    problemIdsLoading.value = false;
  }
};

// 问题ID选项过滤函数
const filterProblemOptions = (input: string, option: any) => {
  const problemId = option.value?.toString().toLowerCase() || '';
  const description = option.children[0]?.toString().toLowerCase() || '';
  const searchText = input.toLowerCase();

  return problemId.includes(searchText) || description.includes(searchText);
};

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

// 节点编辑相关
const nodeForm = reactive({
  id: '',
  label: 'Problem',
  name: '',
  // 问题节点字段
  problemType: '',
  problemId: '',
  description: '',
  // Step节点字段
  stepProblemId: '',
  stepId: null,
  operation: 'query',
  systemA: '',
  tableName: '',
  field: '',
  conditionSql: '',
  replyContent: '',
  // 动态字段
  dynamicFields: [] as { key: string; value: string }[],
});
const nodeFormVisible = ref(false);

// 更新openNodeForm函数，处理Step节点的信息
const openNodeForm = (node?: NodeItem) => {
  if (node) {
    // 编辑现有节点
    nodeForm.id = node.id;
    nodeForm.label = node.nodeType;

    if (node.nodeType === 'Problem') {
      // 是问题节点，填充问题特定字段
      nodeForm.problemType = node.properties?.problem_type || '';
      nodeForm.problemId = node.properties?.problem_id || '';
      nodeForm.description = node.properties?.description || '';
    } else if (node.nodeType === 'Step') {
      loadProblemIds();
      // 是Step节点，填充Step特定字段
      nodeForm.stepProblemId = node.properties?.problem_id || '';
      nodeForm.stepId = node.properties?.step_id || null;
      nodeForm.operation = node.properties?.operation || 'query';

      // 根据操作类型加载相应的字段
      if (nodeForm.operation === 'query') {
        nodeForm.systemA = node.properties?.system_a || '';
        nodeForm.tableName = node.properties?.table_name || '';
        nodeForm.field = node.properties?.field || '';
        nodeForm.conditionSql = node.properties?.condition_sql || '';
      } else {
        // 清空查询相关字段
        nodeForm.systemA = '';
        nodeForm.tableName = '';
        nodeForm.field = '';
        nodeForm.conditionSql = '';
      }

      // 无论操作类型如何，都加载回复内容
      nodeForm.replyContent = node.properties?.reply_content || '';
    }

    // 填充动态字段
    nodeForm.dynamicFields = [];
    if (node.properties) {
      Object.entries(node.properties).forEach(([key, value]) => {
        // 排除问题特定字段和Step特定字段
        if (
          ![
            'id',
            'name',
            'nodeType',
            'problem_id',
            'problem_type',
            'description',
            'step_id',
            'operation',
            'system_a',
            'table_name',
            'field',
            'condition_sql',
            'reply_content',
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
    // 清空问题字段
    nodeForm.problemType = '';
    nodeForm.problemId = '';
    nodeForm.description = '';
    // 清空Step字段
    nodeForm.stepProblemId = '';
    nodeForm.stepId = null;
    nodeForm.operation = 'query';
    nodeForm.systemA = '';
    nodeForm.tableName = '';
    nodeForm.field = '';
    nodeForm.conditionSql = '';
    nodeForm.replyContent = '';
    // 清空动态字段
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
  if (nodeForm.label === 'Problem') {
    // 验证问题特定字段
    if (!nodeForm.description) {
      message.error('问题描述不能为空');
      return;
    }
  } else if (nodeForm.label === 'Step') {
    // 验证Step特定字段
    if (!nodeForm.stepProblemId) {
      message.error('问题ID不能为空');
      return;
    }
    if (!nodeForm.stepId) {
      message.error('步骤ID不能为空');
      return;
    }
    if (!nodeForm.operation) {
      message.error('操作类型不能为空');
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
  } else if (nodeForm.label === 'Step') {
    // Step节点
    nodeData.name = `步骤${nodeForm.stepId}: ${nodeForm.operation === 'query' ? '查询' : '回复'}`; // 使用步骤ID和操作类型作为显示名称
    nodeData.properties.problem_id = nodeForm.stepProblemId;
    nodeData.properties.step_id = nodeForm.stepId;
    nodeData.properties.operation = nodeForm.operation;

    // 根据操作类型添加相应的属性
    if (nodeForm.operation === 'query') {
      // 添加查询操作相关的非空属性
      if (nodeForm.systemA) nodeData.properties.system_a = nodeForm.systemA;
      if (nodeForm.tableName)
        nodeData.properties.table_name = nodeForm.tableName;
      if (nodeForm.field) nodeData.properties.field = nodeForm.field;
      if (nodeForm.conditionSql)
        nodeData.properties.condition_sql = nodeForm.conditionSql;
    }
    if (nodeForm.replyContent)
      nodeData.properties.reply_content = nodeForm.replyContent;
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
      await updateNode(nodeData);
    } else if (nodeForm.label === 'Step') {
      // 创建新节点
      await createStepNode(nodeData);
    } else {
      await createNode(nodeData);
    }

    // 处理响应
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

// Add this method to handle the create-relation event from GraphViewer
const handleCreateRelation = async (relationData: any) => {
  try {
    const res = await createRelation(relationData);
    await refreshGraph(); // 刷新图谱
    message.success('关系创建成功');
  } catch (error) {
    console.error('创建关系失败:', error);
    message.error('创建关系失败');
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
    relationForm.type = relation.type || 'NEXT_DEFAULT';
    relationForm.problemId = relation.problemId || '';
    relationForm.sourceId = relation.source || sourceId || '';
    relationForm.targetId = relation.target || targetId || '';
    relationForm.conditionExpression = relation.properties?.condition || '';

    // 加载相关步骤
    if (relationForm.problemId) {
      loadStepsByProblemId(relationForm.problemId);
    }
  } else {
    // 新建关系
    relationForm.id = '';
    relationForm.type = 'NEXT_DEFAULT';
    relationForm.problemId = '';
    relationForm.sourceId = sourceId || '';
    relationForm.targetId = targetId || '';
    relationForm.conditionExpression = '';

    // 清空步骤列表
    steps.value = [];
  }

  // 确保先加载问题ID列表
  loadProblemIds();

  relationFormVisible.value = true;
};

// 处理关系表单提交
const handleRelationFormSubmit = async () => {
  // 验证表单
  if (!relationForm.problemId) {
    message.error('请选择问题ID');
    return;
  }

  if (relationForm.type !== 'FIRST_STEP' && !relationForm.sourceId) {
    message.error('请选择起始步骤');
    return;
  }

  if (!relationForm.targetId) {
    message.error('请选择目标步骤');
    return;
  }

  if (relationForm.type === 'NEXT_IF' && !relationForm.conditionExpression) {
    message.error('请输入条件表达式');
    return;
  }

  // 构建关系数据
  const relationData: any = {
    relationType: relationForm.type,
    problemId: relationForm.problemId,
    toStepId: parseInt(relationForm.targetId),
    conditionExpression: relationForm.conditionExpression,
  };

  // 只有在非FIRST_STEP关系中才设置fromStepId
  if (relationForm.type !== 'FIRST_STEP') {
    relationData.fromStepId = parseInt(relationForm.sourceId);
  }

  try {
    // 调用创建步骤关系的API
    const res = await createRelation(relationData);

    if (res && res.code === 200) {
      relationFormVisible.value = false;
      await refreshGraph(); // 刷新图谱以显示新关系
      message.success(res.msg || '关系创建成功');
    } else if (res) {
      message.error(res.msg || '关系创建失败');
    } else {
      // 假设请求成功但没有合适的返回值
      relationFormVisible.value = false;
      await refreshGraph();
      message.success('关系创建成功');
    }
  } catch (error) {
    console.error('保存关系失败:', error);
    message.error(
      '保存关系失败: ' +
        (error instanceof Error ? error.message : String(error)),
    );
  }
};
// 节点类型变更处理
const handleNodeTypeChange = (value) => {
  if (value === 'Problem') {
    // 清空Step字段
    nodeForm.stepProblemId = '';
    nodeForm.stepId = null;
    nodeForm.operation = 'query';
    nodeForm.systemA = '';
    nodeForm.tableName = '';
    nodeForm.field = '';
    nodeForm.conditionSql = '';
    nodeForm.replyContent = '';
  } else if (value === 'Step') {
    loadProblemIds();
    // 清空问题字段
    nodeForm.problemType = '';
    nodeForm.problemId = '';
    nodeForm.description = '';
    nodeForm.name = '';
  } else {
    // 清空问题和Step相关字段
    nodeForm.problemType = '';
    nodeForm.problemId = '';
    nodeForm.description = '';
    nodeForm.stepProblemId = '';
    nodeForm.stepId = null;
    nodeForm.operation = 'query';
    nodeForm.systemA = '';
    nodeForm.tableName = '';
    nodeForm.field = '';
    nodeForm.conditionSql = '';
    nodeForm.replyContent = '';
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
        await refreshGraph();
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
    </div>

    <div class="flex h-full">
      <!-- 左侧面板 -->
      <div
        class="mr-4 flex w-64 flex-col overflow-hidden rounded-md bg-white shadow-md"
      >
        <SearchPanel @search="handleSearch" />
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
          @delete-relation="confirmDeleteRelation"
          @create-relation="handleCreateRelation"
          @refresh-graph="refreshGraph"
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
          <Form.Item>
            <template #label>
              <span>
                问题意图
                <Tooltip
                  title="请使用英文简要描述，全局唯一，例如:transfer_limit_issue"
                >
                  <QuestionCircleOutlined style="margin-left: 4px" />
                </Tooltip>
              </span>
            </template>
            <Input v-model:value="nodeForm.problemType" />
          </Form.Item>
          <Form.Item>
            <template #label>
              <span>
                问题描述
                <Tooltip title="问题描述将会反应在问题节点上。">
                  <QuestionCircleOutlined style="margin-left: 4px" />
                </Tooltip>
              </span>
            </template>
            <Input.TextArea v-model:value="nodeForm.description" :rows="4" />
          </Form.Item>
        </template>

        <!-- Step节点的特定字段 -->
        <template v-else-if="nodeForm.label === 'Step'">
          <Form.Item label="问题ID" required>
            <Select
              v-model:value="nodeForm.stepProblemId"
              placeholder="请选择关联的问题ID"
              :loading="problemIdsLoading"
              show-search
              :filter-option="filterProblemOptions"
            >
              <Select.Option
                v-for="item in problemIds"
                :key="item.problemId"
                :value="item.problemId"
              >
                {{ item.problemId }} -
                {{
                  item.description
                    ? item.description.length > 20
                      ? item.description.substring(0, 20) + '...'
                      : item.description
                    : ''
                }}
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="步骤ID" required>
            <Input
              v-model:value="nodeForm.stepId"
              type="number"
              placeholder="步骤序号"
              :min="1"
              @change="(e) => handleStepIdChange(e.target.value)"
            />
          </Form.Item>

          <Form.Item label="操作类型" required>
            <Select v-model:value="nodeForm.operation">
              <Select.Option value="query">查询</Select.Option>
              <Select.Option value="reply">回复</Select.Option>
            </Select>
          </Form.Item>
          <template v-if="nodeForm.operation === 'query'">
            <Form.Item label="系统名称">
              <Select
                v-model:value="nodeForm.systemA"
                placeholder="请选择系统"
                :loading="systemListLoading"
                show-search
              >
                <Select.Option
                  v-for="system in systemList"
                  :key="system.id"
                  :value="system.englishSystemName"
                >
                  {{ system.systemName }}--{{ system.dbName }}库
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="表名">
              <Input
                v-model:value="nodeForm.tableName"
                placeholder="相关表名"
              />
            </Form.Item>

            <Form.Item label="字段">
              <Input v-model:value="nodeForm.field" placeholder="相关字段" />
            </Form.Item>

            <Form.Item label="条件SQL">
              <Input.TextArea
                v-model:value="nodeForm.conditionSql"
                :rows="2"
                placeholder="查询条件"
              />
            </Form.Item>
          </template>
          <template v-if="nodeForm.operation === 'reply'">
            <Form.Item label="回复内容">
              <Input.TextArea
                v-model:value="nodeForm.replyContent"
                :rows="3"
                placeholder="回复内容"
              />
            </Form.Item>
          </template>
        </template>

        <!-- 其他节点类型的名称字段 -->
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
        <!-- 关系类型选择 -->
        <Form.Item label="关系类型" required>
          <Select
            v-model:value="relationForm.type"
            @change="handleRelationTypeChange"
          >
            <Select.Option value="NEXT_DEFAULT">默认下一步</Select.Option>
            <Select.Option value="NEXT_IF">条件下一步</Select.Option>
            <Select.Option value="FIRST_STEP">第一步</Select.Option>
          </Select>
        </Form.Item>

        <!-- 问题ID选择 -->
        <Form.Item label="问题ID" required>
          <Select
            v-model:value="relationForm.problemId"
            placeholder="请选择关联的问题ID"
            :loading="problemIdsLoading"
            show-search
            :filter-option="filterProblemOptions"
            @change="handleProblemIdChange"
          >
            <Select.Option
              v-for="item in problemIds"
              :key="item.problemId"
              :value="item.problemId"
            >
              {{ item.problemId }} -
              {{
                item.description
                  ? item.description.length > 20
                    ? item.description.substring(0, 20) + '...'
                    : item.description
                  : ''
              }}
            </Select.Option>
          </Select>
        </Form.Item>

        <!-- 起始节点选择 - 对于NEXT_DEFAULT和NEXT_IF显示 -->
        <Form.Item
          v-if="relationForm.type !== 'FIRST_STEP'"
          label="起始步骤"
          required
        >
          <Select
            v-model:value="relationForm.sourceId"
            placeholder="请选择起始步骤"
            :loading="stepsLoading"
          >
            <Select.Option
              v-for="step in filteredSteps"
              :key="step.stepId"
              :value="step.stepId"
            >
              步骤{{ step.stepId }}:
              {{ step.operation === 'query' ? '查询' : '回复' }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="目标步骤" required>
          <Select
            v-model:value="relationForm.targetId"
            placeholder="请选择目标步骤"
            :loading="stepsLoading"
          >
            <Select.Option
              v-for="step in filteredSteps"
              :key="step.stepId"
              :value="step.stepId"
            >
              步骤{{ step.stepId }}:
              {{ step.operation === 'query' ? '查询' : '回复' }}
            </Select.Option>
          </Select>
        </Form.Item>

        <!-- 条件表达式 - 只在NEXT_IF时显示 -->
        <Form.Item
          v-if="relationForm.type === 'NEXT_IF'"
          label="条件表达式"
          required
        >
          <Input.TextArea
            v-model:value="relationForm.conditionExpression"
            placeholder="请输入条件表达式，例如：field1 == 'value1'"
            :rows="3"
          />
        </Form.Item>
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

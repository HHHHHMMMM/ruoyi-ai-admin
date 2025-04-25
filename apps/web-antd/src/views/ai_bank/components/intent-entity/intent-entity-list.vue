<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { IntentEntityMapping } from '#/api/system/intent-entity/model';

import { useVbenModal } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';
import { computed, reactive } from 'vue';

import { Modal, Popconfirm, Space } from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import {
  intentEntityList,
  intentEntityRemove,
} from '#/api/system/intent-entity';

import { columns, querySchema } from './data';
import intentEntityModal from './intent-entity-modal.vue';

// Props to control component behavior from parent
const props = defineProps({
  // 是否在抽屉中使用
  inDrawer: {
    type: Boolean,
    default: false,
  },
  // 节点ID，如果在抽屉中使用时可能需要
  nodeId: {
    type: [String, Number],
    default: null,
  },
  // 问题类型，从节点属性中传入
  problemType: {
    type: String,
    default: '',
  },
});

// 计算表格高度，在抽屉中使用时限制高度
const tableHeight = computed(() => {
  return props.inDrawer ? '300px' : 'auto';
});

// 是否显示表单
const showForm = computed(() => {
  return !props.inDrawer;
});

const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 80,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3',
};
// 定义tooltipConfig
const tooltipConfig = reactive({
  showAll: true,
  enterable: true,
  contentMethod: ({ column, row }: any) => {
    const { field } = column;
    // 获取当前单元格的值
    const cellValue = row?.[field];

    // 如果是字符串类型且有值，则显示完整内容
    if (typeof cellValue === 'string' && cellValue) {
      return cellValue;
    } else if (cellValue && typeof cellValue === 'object') {
      // 如果是对象类型，则转换为JSON字符串显示
      return JSON.stringify(cellValue, null, 2);
    }

    // 对于其他类型或空值，使用默认行为
    return null;
  },
});
const gridOptions = computed<VxeGridProps>(() => ({
  checkboxConfig: {
    highlight: true,
    reserve: true,
  },
  columns,
  // 表格配置
  height: tableHeight.value,
  keepSource: true,
  tooltipConfig,
  pagerConfig: {
    // 在抽屉中使用时，减小每页显示数量
    pageSize: props.inDrawer ? 5 : 10,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        const mapping = {
          ...(props.problemType ? { intentType: props.problemType } : {}),
          ...formValues,
        };

        const pageQuery = {
          pageNum: page.currentPage,
          pageSize: page.pageSize,
        };

        return await intentEntityList(mapping, pageQuery);
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  id: 'intent-entity-mapping-index',
}));

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions: showForm.value ? formOptions : undefined,
  gridOptions: gridOptions.value,
});

const [IntentEntityModal, modalApi] = useVbenModal({
  connectedComponent: intentEntityModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: IntentEntityMapping) {
  modalApi.setData({ id: record.id });
  modalApi.open();
}

async function handleDelete(row: IntentEntityMapping) {
  await intentEntityRemove([row.id]);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: IntentEntityMapping) => row.id);
  Modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await intentEntityRemove(ids);
      await tableApi.query();
    },
  });
}

// 提供刷新方法给父组件
defineExpose({
  refresh: () => tableApi.query(),
});
</script>

<template>
  <div class="intent-entity-list-container" :class="{ 'in-drawer': inDrawer }">
    <BasicTable :table-title="inDrawer ? undefined : '意图实体映射列表'">
      <template #toolbar-tools>
        <Space>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            @click="handleMultiDelete"
          >
            {{ $t('pages.common.delete') }}
          </a-button>
          <a-button type="primary" @click="handleAdd">
            {{ $t('pages.common.add') }}
          </a-button>
        </Space>
      </template>
      <template #action="{ row }">
        <Space>
          <ghost-button @click="handleEdit(row)">
            {{ $t('pages.common.edit') }}
          </ghost-button>
          <Popconfirm
            :get-popup-container="getVxePopupContainer"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <ghost-button danger @click.stop="">
              {{ $t('pages.common.delete') }}
            </ghost-button>
          </Popconfirm>
        </Space>
      </template>
    </BasicTable>
    <IntentEntityModal @reload="tableApi.query()" />
  </div>
</template>

<style lang="less" scoped>
.intent-entity-list-container {
  width: 100%;
  margin-bottom: 16px;

  &.in-drawer {
    max-height: 350px;
    overflow: hidden;
  }
}
</style>

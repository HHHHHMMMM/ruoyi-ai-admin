<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { FlowExecutionLog } from '#/api/system/flow-execution-log/flow-execution-log-modal';

import { onMounted } from 'vue';

import { useVbenModal, Page } from '@vben/common-ui';
import { getVxePopupContainer } from '@vben/utils';

import { Modal, Popconfirm, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '#/adapter/vxe-table';
import {
  flowLogList,
  flowLogRemove,
  flowLogCleanupExpired,
} from '#/api/system/flow-execution-log/flow-execution-log-api';

import { columns, querySchema } from './flow-execution-log-data';
import flowLogModal from './flow-execution-log-modal.vue';
import flowLogDetail from './flow-execution-log-detail.vue';

const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 80,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
  },
  columns,
  // 使用固定高度避免无限拉长
  height: '600px',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        // 处理日期范围
        const params = { ...formValues };
        if (params.dateRange && params.dateRange.length === 2) {
          params.startTime = params.dateRange[0];
          params.endTime = params.dateRange[1];
          delete params.dateRange;
        }

        return await flowLogList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...params,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  id: 'knowledge-graph-flow-execution-log-index',
  // 设置表格自动占满容器宽度
  autoResize: true,
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 组件挂载后手动触发一次查询
onMounted(() => {
  console.log('组件已挂载，即将触发查询');
  tableApi.query();
});

const [LogModal, modalApi] = useVbenModal({
  connectedComponent: flowLogModal,
});

const [LogDetail, detailApi] = useVbenModal({
  connectedComponent: flowLogDetail,
});

function handleViewDetail(record: FlowExecutionLog) {
  detailApi.setData({ id: record.id });
  detailApi.open();
}

async function handleDelete(row: FlowExecutionLog) {
  await flowLogRemove([row.id]);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: FlowExecutionLog) => row.id);
  Modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await flowLogRemove(ids);
      await tableApi.query();
    },
  });
}

function handleCleanupExpired() {
  Modal.confirm({
    title: '清理日志',
    content: '确认要清理30天前的过期日志吗？',
    onOk: async () => {
      await flowLogCleanupExpired(30);
      await tableApi.query();
    },
  });
}

function handleDownloadExcel() {
  // 处理日期范围
  const params = { ...tableApi.formApi.form.values };
  if (params.dateRange && params.dateRange.length === 2) {
    params.startTime = params.dateRange[0];
    params.endTime = params.dateRange[1];
    delete params.dateRange;
  }
}

// 状态标签颜色映射
const statusMap = {
  STARTED: 'processing',
  COMPLETED: 'success',
  FAILED: 'error',
};
</script>

<template>
  <Page :auto-content-height="true">
    <BasicTable id="flow-log" table-title="流程执行日志列表" class="w-full">
      <template #toolbar-tools>
        <Space>
          <a-button
            v-access:code="['knowledgegraph:flow:log:export']"
            @click="handleDownloadExcel"
          >
            {{ $t('pages.common.export') }}
          </a-button>
          <a-button
            v-access:code="['knowledgegraph:flow:log:cleanup']"
            @click="handleCleanupExpired"
          >
            清理过期日志
          </a-button>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            v-access:code="['knowledgegraph:flow:log:remove']"
            @click="handleMultiDelete"
          >
            {{ $t('pages.common.delete') }}
          </a-button>
        </Space>
      </template>

      <!-- 状态标签插槽 -->
      <template #status="{ row }">
        <Tag :color="statusMap[row.status]">
          {{
            row.status === 'STARTED'
              ? '进行中'
              : row.status === 'COMPLETED'
                ? '已完成'
                : '失败'
          }}
        </Tag>
      </template>

      <template #action="{ row }">
        <Space>
          <ghost-button @click.stop="handleViewDetail(row)">
            查看详情
          </ghost-button>
          <Popconfirm
            :get-popup-container="
              (node) => getVxePopupContainer(node, 'flow-log')
            "
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
    <LogModal @reload="tableApi.query()" />
    <LogDetail />
  </Page>
</template>

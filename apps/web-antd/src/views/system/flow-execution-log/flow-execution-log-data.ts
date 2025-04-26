import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

export interface FlowExecutionLog {
  id: number;
  flowId: string;
  userId: string;
  problemId: string;
  executedAt: string;
  context: string;
  pathData: string;
  executionDetails: string;
  status: string;
}

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'flowId',
    label: '流程ID',
  },
  {
    component: 'Input',
    fieldName: 'userId',
    label: '用户ID',
  },
  {
    component: 'Input',
    fieldName: 'problemId',
    label: '问题ID',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '进行中', value: 'STARTED' },
        { label: '已完成', value: 'COMPLETED' },
        { label: '失败', value: 'FAILED' },
      ],
    },
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'RangePicker',
    fieldName: 'dateRange',
    label: '执行时间',
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '流程ID',
    field: 'flowId',
  },
  {
    title: '用户ID',
    field: 'userId',
  },
  {
    title: '问题ID',
    field: 'problemId',
  },
  {
    title: '执行时间',
    field: 'executedAt',
  },
  {
    title: '状态',
    field: 'status',
    slots: { default: 'status' },
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
  },
];

export const modalSchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
    fieldName: 'id',
    label: 'id',
  },
  {
    component: 'Input',
    fieldName: 'flowId',
    label: '流程ID',
    componentProps: {
      disabled: true,
    },
  },
  {
    component: 'Input',
    fieldName: 'userId',
    label: '用户ID',
    componentProps: {
      disabled: true,
    },
  },
  {
    component: 'Input',
    fieldName: 'problemId',
    label: '问题ID',
    componentProps: {
      disabled: true,
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'executedAt',
    label: '执行时间',
    componentProps: {
      disabled: true,
      showTime: true,
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      options: [
        { label: '进行中', value: 'STARTED' },
        { label: '已完成', value: 'COMPLETED' },
        { label: '失败', value: 'FAILED' },
      ],
    },
    rules: 'required',
  },
];

// 详情页的JSON查看器
export const jsonViewerSchema: FormSchemaGetter = () => [
  {
    component: 'JsonViewer',
    fieldName: 'context',
    label: '上下文数据',
    componentProps: {
      height: '300px',
      readOnly: true,
    },
  },
  {
    component: 'JsonViewer',
    fieldName: 'pathData',
    label: '路径数据',
    componentProps: {
      height: '300px',
      readOnly: true,
    },
  },
  {
    component: 'JsonViewer',
    fieldName: 'executionDetails',
    label: '执行详情',
    componentProps: {
      height: '400px',
      readOnly: true,
    },
  },
];

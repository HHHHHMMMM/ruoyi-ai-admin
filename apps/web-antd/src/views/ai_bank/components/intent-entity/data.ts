import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

/**
 * Query form schema definition
 */
export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'intentType',
    label: '意图类型',
  },
  {
    component: 'Input',
    fieldName: 'entityName',
    label: '实体名称',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '是', value: 1 },
        { label: '否', value: 0 },
      ],
    },
    fieldName: 'isRequired',
    label: '是否必需',
  },
];

/**
 * Table columns definition
 */
export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '意图类型',
    field: 'intentType',
  },
  {
    title: '实体名称',
    field: 'entityName',
  },
  {
    title: '是否必需',
    field: 'isRequired',
    width: 100,
    slots: {
      default: ({ row }) => {
        return row.isRequired === 1 ? '是' : '否';
      },
    },
  },
  {
    title: '优先级',
    field: 'priority',
    width: 100,
  },
  {
    title: '提示模板',
    field: 'promptTemplate',
    showOverflow: 'tooltip', // 这会使超出部分显示为省略号，并在悬停时显示tooltip
    // 或者使用更详细的配置
  },
  // {
  //   title: '创建时间',
  //   field: 'createdAt',
  //   width: 180,
  // },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 180,
  },
];

/**
 * Form schema for add/edit modal
 */
export const modalSchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
    fieldName: 'id',
    label: '主键',
  },
  {
    component: 'Input',
    fieldName: 'intentType',
    label: '意图类型',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'entityName',
    label: '实体名称',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: [
        { label: '是', value: 1 },
        { label: '否', value: 0 },
      ],
      optionType: 'button',
    },
    defaultValue: 1,
    fieldName: 'isRequired',
    label: '是否必需',
    rules: 'required',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      max: 100,
    },
    defaultValue: 1,
    fieldName: 'priority',
    label: '优先级',
    rules: 'required',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    fieldName: 'promptTemplate',
    label: '提示模板',
  },
];

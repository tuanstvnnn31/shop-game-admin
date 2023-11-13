import React from "react";
import {
  IResourceComponentsProps,
  BaseRecord,
  HttpError,
  useTranslate,
  CrudFilters,
} from "@refinedev/core";
import { IPost, ICategory, IPostFilterVariables } from "../../interfaces";
import {
  useTable,
  List,
  EditButton,
  ShowButton,
  DeleteButton,
  MarkdownField,
  DateField,
  useSelect,
} from "@refinedev/antd";
import { Table, Space, Form, Select, Button, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export const BlogPostList: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { tableProps, searchFormProps } = useTable<
    IPost,
    HttpError,
    IPostFilterVariables
  >({
    onSearch: (params) => {
      console.log(params);

      const filters: CrudFilters = [];
      const { q, category, status, createdAt } = params;

      filters.push(
        {
          field: "q",
          operator: "eq",
          value: q,
        },
        {
          field: "category.id",
          operator: "eq",
          value: category,
        },
        {
          field: "status",
          operator: "eq",
          value: status,
        },
        {
          field: "createdAt",
          operator: "gte",
          value: createdAt ? createdAt[0].toISOString() : undefined,
        },
        {
          field: "createdAt",
          operator: "lte",
          value: createdAt ? createdAt[1].toISOString() : undefined,
        }
      );

      console.log("filters", params
      );

      return filters;
      
    },
  });

  return (
    <>
      <Filter formProps={searchFormProps} />
      <List>
        <Table {...tableProps} rowKey="id">
          <Table.Column
            dataIndex="id"
            title={translate("blog_posts.fields.id")}
          />
          <Table.Column
            dataIndex="title"
            title={translate("blog_posts.fields.title")}
          />
          <Table.Column
            dataIndex="content"
            title={translate("blog_posts.fields.content")}
            render={(value: any) => (
              <MarkdownField value={value.slice(0, 80) + "..."} />
            )}
          />
          <Table.Column
            dataIndex="status"
            title={translate("blog_posts.fields.status")}
          />
          <Table.Column
            dataIndex={["createdAt"]}
            title={translate("blog_posts.fields.createdAt")}
            render={(value: any) => <DateField value={value} />}
          />
          <Table.Column
            dataIndex={["updatedAt"]}
            title={translate("blog_posts.fields.updatedAt")}
            render={(value: any) => <DateField value={value} />}
          />
          <Table.Column
            dataIndex={["category", "title"]}
            title={translate("blog_posts.fields.category")}
          />
          <Table.Column
            title={translate("table.actions")}
            dataIndex="actions"
            render={(_, record: BaseRecord) => (
              <Space>
                <EditButton hideText size="small" recordItemId={record.id} />
                <ShowButton hideText size="small" recordItemId={record.id} />
                <DeleteButton hideText size="small" recordItemId={record.id} />
              </Space>
            )}
          />
        </Table>
      </List>
    </>
  );
};
const Filter: React.FC<{ formProps: FormProps }> = ({ formProps }) => {
  const { selectProps: categorySelectProps } = useSelect<ICategory>({
    resource: "categories",
  });

  return (
    <Form layout="vertical" {...formProps}>
      <Form.Item label="Search" name="q">
        <Input
          placeholder="ID, Title, Content, etc."
          prefix={<SearchOutlined />}
        />
      </Form.Item>
      <Form.Item label="Status" name="status">
        <Select
          allowClear
          options={[
            {
              label: "Published",
              value: "published",
            },
            {
              label: "Draft",
              value: "draft",
            },
            {
              label: "Rejected",
              value: "rejected",
            },
          ]}
          placeholder="Post Status"
        />
      </Form.Item>
      <Form.Item label="Category" name="category">
        <Select
          {...categorySelectProps}
          allowClear
          placeholder="Search Categories"
        />
      </Form.Item>
      <Form.Item label="Created At" name="createdAt"></Form.Item>
      <Form.Item>
        <Button htmlType="submit" type="primary">
          Filter
        </Button>
      </Form.Item>
    </Form>
  );
};

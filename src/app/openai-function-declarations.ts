export type OpenAITool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
};

const tableNameSchema = {
  type: 'string',
  description: 'Table name. Table names should be lowercase, and use snake_case.',
};

const columnNameSchema = {
  type: 'string',
  description: 'Column name. Column names should be lowercase, and use snake_case.',
};

const columnTypeSchema = {
  type: 'string',
  enum: ['string', 'integer', 'date'],
  description: 'Column type. Specifies the type of data that can be stored in this column.',
};

const tableColumnProperties = {
  columnName: columnNameSchema,
  columnType: columnTypeSchema,
};

const columnSchema = {
  type: 'object',
  description: 'Table column. Specifies the properties of a table column.',
  properties: tableColumnProperties,
  required: ['columnName', 'columnType'],
};

const columnsSchema = {
  type: 'array',
  description: 'Array of table columns definitions.',
  items: columnSchema,
};

const createTableSchema = {
  tableName: tableNameSchema,
  columns: columnsSchema,
};

const alterTableSchema = {
  tableName: tableNameSchema,
  addColumns: columnsSchema,
  removeColumns: columnsSchema,
  alterColumns: columnsSchema,
};

const createTableFunction: OpenAITool = {
  type: 'function',
  function: {
    name: 'createTable',
    description: 'Create database table.',
    parameters: {
      type: 'object',
      properties: createTableSchema,
      required: ['tableName', 'columns'],
    },
  },
};

const alterTableFunction: OpenAITool = {
  type: 'function',
  function: {
    name: 'alterTable',
    description: 'Alter database table. Modifies column definitions.',
    parameters: {
      type: 'object',
      properties: alterTableSchema,
      required: ['tableName'],
    },
  },
};

export const functionDeclarations: OpenAITool[] = [createTableFunction, alterTableFunction];

import { CondOperator, RequestQueryBuilder } from "@nestjsx/crud-request";
import { DataProvider, HttpError } from "@refinedev/core";
import { AxiosInstance } from "axios";
import { stringify } from "query-string";
import axios from "axios";

export const axiosInstance = axios.create();
type TransformedErrors = {
  [key: string]: string[];
};

export const transformHttpError = (error: any): HttpError => {
  const message = error.response.data.error;
  const statusCode = error.response.data.statusCode;
  const errorMessages = error.response.data.message;

  const errors = transformErrorMessages(errorMessages);

  const httpError: HttpError = {
    statusCode,
    message,
    errors,
  };

  return httpError;
};

export const createFilterQuery = (
  index: number,
  field: string,
  operator: string,
  value: number
) => {
  return `f[${index}][field]=${field}&f[${index}][operator]=${operator}&f[${index}][value]=${value}`;
};
export const createSortQuery = (
  field: string,
  direction: "asc" | "desc" = "desc"
) => {
  return `sort_column=${field}&sort_direction=${direction}`;
};

export const transformErrorMessages = (
  errorMessages: string[]
): TransformedErrors => {
  const transformedErrors: TransformedErrors = {};

  for (const errorMessage of errorMessages) {
    const separatorIndex = errorMessage.indexOf(" ");
    const field = errorMessage.substring(0, separatorIndex);

    if (transformedErrors[field]) {
      transformedErrors[field].push(errorMessage);
    } else {
      transformedErrors[field] = [errorMessage];
    }
  }

  return transformedErrors;
};

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const customError: HttpError = {
      ...error,
      message: error.response?.data?.message,
      statusCode: error.response?.status,
    };

    return Promise.reject(customError);
  }
);

export const customDataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = axiosInstance
): Required<DataProvider> => ({
  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    console.log("[]", { resource, pagination, filters, sorters, meta });

    const filtersStringArr: string[] = filters
      ? filters?.map((item: any, index) => {
          return createFilterQuery(
            index,
            item?.field,
            item.operator,
            item.value
          );
        })
      : [];
    pagination?.pageSize;
    const sortersStringArr = sorters
      ? sorters?.map((item, index) => {
          return createSortQuery(item?.field, item.order);
        })
      : [];
    const url = `${apiUrl}/${resource}`;
    const query = [...filtersStringArr, ...sortersStringArr].join("&");
    // const query = JSON.stringify({ s: "ds" });
    const { data } = await httpClient.get(`${url}?${query}`);

    // without pagination
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
      };
    } else {
      // with pagination
      return {
        data: data.data,
        total: data.total,
      };
    }
  },

  getMany: async ({ resource, ids, meta }) => {
    const url = `${apiUrl}/${resource}`;

    let query = RequestQueryBuilder.create().setFilter({
      field: "id",
      operator: CondOperator.IN,
      value: ids,
    });

    const { data } = await httpClient.get(`${url}?${query.query()}`);

    return {
      data,
    };
  },

  create: async ({ resource, variables }) => {
    const url = `${apiUrl}/${resource}`;

    try {
      const { data } = await httpClient.post(url, variables);

      return {
        data,
      };
    } catch (error) {
      const httpError = transformHttpError(error);

      throw httpError;
    }
  },

  update: async ({ resource, id, variables }) => {
    const url = `${apiUrl}/${resource}/${id}`;

    try {
      const { data } = await httpClient.patch(url, variables);

      return {
        data,
      };
    } catch (error) {
      const httpError = transformHttpError(error);

      throw httpError;
    }
  },

  updateMany: async ({ resource, ids, variables }) => {
    const errors: HttpError[] = [];

    const response = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data } = await httpClient.patch(
            `${apiUrl}/${resource}/${id}`,
            variables
          );
          return data;
        } catch (error) {
          const httpError = transformHttpError(error);

          errors.push(httpError);
        }
      })
    );

    if (errors.length > 0) {
      throw errors;
    }

    return { data: response };
  },

  createMany: async ({ resource, variables }) => {
    const url = `${apiUrl}/${resource}/bulk`;

    try {
      const { data } = await httpClient.post(url, { bulk: variables });

      return {
        data,
      };
    } catch (error) {
      const httpError = transformHttpError(error);

      throw httpError;
    }
  },

  getOne: async ({ resource, id }) => {
    const url = `${apiUrl}/${resource}/${id}`;

    const { data } = await httpClient.get(url);

    return {
      data,
    };
  },

  deleteOne: async ({ resource, id }) => {
    const url = `${apiUrl}/${resource}/${id}`;

    const { data } = await httpClient.delete(url);

    return {
      data,
    };
  },

  deleteMany: async ({ resource, ids }) => {
    const response = await Promise.all(
      ids.map(async (id) => {
        const { data } = await httpClient.delete(`${apiUrl}/${resource}/${id}`);
        return data;
      })
    );
    return { data: response };
  },

  getApiUrl: () => {
    return apiUrl;
  },

  custom: async ({
    url,
    method,
    meta,
    filters,
    sorters,
    payload,
    query,
    headers,
  }) => {
    let requestUrl = `${url}?${RequestQueryBuilder.query()}`;

    if (query) {
      requestUrl = `${requestUrl}&${stringify(query)}`;
    }

    let axiosResponse;
    switch (method) {
      case "put":
      case "post":
      case "patch":
        axiosResponse = await httpClient[method](url, payload, {
          headers,
        });
        break;
      case "delete":
        axiosResponse = await httpClient.delete(url, {
          data: payload,
          headers: headers,
        });
        break;
      default:
        axiosResponse = await httpClient.get(requestUrl, { headers });
        break;
    }

    const { data } = axiosResponse;

    return Promise.resolve({ data });
  },
});

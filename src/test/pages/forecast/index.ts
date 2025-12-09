export const defaultErrorResp = new Error("API Failure");

export const groups = [
  {
    id: 1,
    userid: 1,
    group_name: "Test Group",
  },
  {
    id: 2,
    userid: 1,
    group_name: "Admins",
  },
  {
    id: 3,
    userid: 1,
    group_name: "Managers",
  },
  {
    id: 4,
    userid: 1,
    group_name: "Random Group",
  },
];

export const stores = [
  {
    store_number: "1",
    store_name: "Store 1",
    storeid: 1,
  },
  {
    store_number: "11",
    store_name: "Store 11",
    storeid: 3,
  },
  {
    store_number: "15",
    store_name: "Store 15",
    storeid: 6,
  },
];

export const groupStoresResp = {
  data: {
    error: 0,
    success: true,
    stores: [
      {
        store_number: "1",
        store_name: "Store 1",
        storeid: 1,
        active: 1,
      },
      {
        store_number: "11",
        store_name: "Store 11",
        storeid: 3,
        active: 1,
      },
      {
        store_number: "15",
        store_name: "Store 15",
        storeid: 6,
        active: 1,
      },
    ],
  },
};

export const fileListResp = {
  data: {
    error: 0,
    success: true,
    files: ["1_12_08_2025_UPC_List.csv"],
  },
};

export const priceHistoryResp = {
  data: {
    error: 0,
    success: true,
    end_date: "2025-11-05T00:00:00",
    total_stores: 1,
    upc_count: 1,
    result: [
      {
        storeid: 111,
        price_type: "REG",
        unit_price: 14.99,
        regular_retail_price: 14.99,
        total_qty: 15,
        product_code: "1200000017",
        product_description: "PEPSI 24 PK",
        store_number: "1",
        store_name: "IGA 1",
        lift: 2.75,
      },
      {
        storeid: 111,
        price_type: "SALE",
        unit_price: 10.99,
        regular_retail_price: 14.99,
        total_qty: 69,
        product_code: "1200000017",
        product_description: "PEPSI 24 PK",
        store_number: "1",
        store_name: "IGA 1",
        lift: 16.25,
      },
      {
        storeid: 111,
        price_type: "TPR",
        unit_price: 10.99,
        regular_retail_price: 14.99,
        total_qty: 37,
        product_code: "1200000017",
        product_description: "PEPSI 24 PK",
        store_number: "1",
        store_name: "IGA 1",
        lift: 8.25,
      },
      {
        storeid: 111,
        price_type: "TPR",
        unit_price: 13.99,
        regular_retail_price: 14.99,
        total_qty: 43,
        product_code: "1200000017",
        product_description: "PEPSI 24 PK",
        store_number: "1",
        store_name: "IGA 1",
        lift: 9.75,
      },
    ],
  },
};

export const forecastResp = {
  data: {
    error: 0,
    success: true,
    qty_output: {
      "1200000017": {
        metrics: {
          description: "PEPSI 24 PK",
          qty: 164,
          avg_daily_qty: 1.7263157894736842,
          max_day_qty: 17,
          days_active: 47,
          outliers: [
            {
              date: "08/18/2025",
              qty: 5,
            },
            {
              date: "10/07/2025",
              qty: 13,
            },
            {
              date: "11/05/2025",
              qty: 17,
            },
            {
              date: "08/14/2025",
              qty: 3,
            },
            {
              date: "10/02/2025",
              qty: 14,
            },
            {
              date: "10/03/2025",
              qty: 9,
            },
            {
              date: "08/09/2025",
              qty: 1,
            },
            {
              date: "08/16/2025",
              qty: 6,
            },
            {
              date: "08/23/2025",
              qty: 1,
            },
            {
              date: "08/30/2025",
              qty: 1,
            },
            {
              date: "09/20/2025",
              qty: 1,
            },
            {
              date: "09/27/2025",
              qty: 1,
            },
            {
              date: "10/04/2025",
              qty: 13,
            },
            {
              date: "10/11/2025",
              qty: 1,
            },
            {
              date: "10/18/2025",
              qty: 1,
            },
            {
              date: "10/25/2025",
              qty: 2,
            },
          ],
          prices: {
            "10.99": 106,
            "13.99": 43,
            "14.99": 15,
          },
        },
        history: [],
        history_dimension: 0,
        forecast: 4,
        forecast_dimension: 7,
        forecast_method: "dow_average_forecast",
      },
      "1200000088": {
        metrics: {
          description: "MOUNTAIN DEW 24 PK",
          qty: 148,
          avg_daily_qty: 1.5578947368421052,
          max_day_qty: 11,
          days_active: 56,
          outliers: [
            {
              date: "10/06/2025",
              qty: 6,
            },
            {
              date: "10/27/2025",
              qty: 5,
            },
            {
              date: "08/12/2025",
              qty: 3,
            },
            {
              date: "08/19/2025",
              qty: 6,
            },
            {
              date: "10/07/2025",
              qty: 11,
            },
            {
              date: "10/02/2025",
              qty: 5,
            },
            {
              date: "10/09/2025",
              qty: 7,
            },
            {
              date: "08/15/2025",
              qty: 5,
            },
            {
              date: "10/03/2025",
              qty: 8,
            },
          ],
          prices: {
            "10.99": 79,
            "13.99": 38,
            "14.99": 31,
          },
        },
        history: [],
        history_dimension: 0,
        forecast: 3,
        forecast_dimension: 7,
        forecast_method: "dow_average_forecast",
      },
      "1200000170": {
        metrics: {
          description: "DIET MOUNTAIN DEW 24 PK",
          qty: 74,
          avg_daily_qty: 0.7789473684210526,
          max_day_qty: 8,
          days_active: 35,
          outliers: [
            {
              date: "10/06/2025",
              qty: 7,
            },
            {
              date: "10/07/2025",
              qty: 8,
            },
            {
              date: "10/01/2025",
              qty: 7,
            },
            {
              date: "08/22/2025",
              qty: 1,
            },
            {
              date: "10/03/2025",
              qty: 2,
            },
            {
              date: "11/01/2025",
              qty: 4,
            },
          ],
          prices: {
            "10.99": 36,
            "13.99": 21,
            "14.99": 17,
          },
        },
        history: [],
        history_dimension: 0,
        forecast: 1,
        forecast_dimension: 7,
        forecast_method: "dow_average_forecast",
      },
    },
    sales_output: {
      "1200000017": {
        metrics: {
          description: "PEPSI 24 PK",
          total_sales: 1991.3600000000001,
          avg_daily_qty: 20.961684210526318,
          max_day_qty: 186,
          days_active: 47,
          outliers: [
            {
              date: "10/07/2025",
              qty: 142.87,
            },
            {
              date: "11/05/2025",
              qty: 186.83,
            },
            {
              date: "10/02/2025",
              qty: 153.86,
            },
            {
              date: "08/16/2025",
              qty: 65.94,
            },
            {
              date: "10/04/2025",
              qty: 142.87,
            },
            {
              date: "10/25/2025",
              qty: 27.98,
            },
          ],
          prices: {
            "10.99": 106,
            "13.99": 43,
            "14.99": 15,
          },
        },
        history: [],
        history_dimension: 0,
        forecast: 89,
        forecast_dimension: 7,
        forecast_method: "dow_average_forecast",
      },
      "1200000088": {
        metrics: {
          description: "MOUNTAIN DEW 24 PK",
          total_sales: 1864.52,
          avg_daily_qty: 19.626526315789473,
          max_day_qty: 120,
          days_active: 56,
          outliers: [
            {
              date: "10/06/2025",
              qty: 65.94,
            },
            {
              date: "10/27/2025",
              qty: 69.95,
            },
            {
              date: "08/12/2025",
              qty: 44.97,
            },
            {
              date: "08/19/2025",
              qty: 65.94,
            },
            {
              date: "10/07/2025",
              qty: 120.89,
            },
            {
              date: "10/02/2025",
              qty: 54.95,
            },
            {
              date: "10/09/2025",
              qty: 97.93,
            },
            {
              date: "10/03/2025",
              qty: 87.92,
            },
          ],
          prices: {
            "10.99": 79,
            "13.99": 38,
            "14.99": 31,
          },
        },
        history: [],
        history_dimension: 0,
        forecast: 89,
        forecast_dimension: 7,
        forecast_method: "dow_average_forecast",
      },
      "1200000170": {
        metrics: {
          description: "DIET MOUNTAIN DEW 24 PK",
          total_sales: 944.2600000000001,
          avg_daily_qty: 9.939578947368423,
          max_day_qty: 87,
          days_active: 35,
          outliers: [
            {
              date: "10/06/2025",
              qty: 76.93,
            },
            {
              date: "10/07/2025",
              qty: 87.92,
            },
            {
              date: "10/01/2025",
              qty: 76.93,
            },
            {
              date: "08/22/2025",
              qty: 14.99,
            },
            {
              date: "10/03/2025",
              qty: 21.98,
            },
            {
              date: "11/01/2025",
              qty: 55.96,
            },
          ],
          prices: {
            "10.99": 36,
            "13.99": 21,
            "14.99": 17,
          },
        },
        history: [],
        history_dimension: 0,
        forecast: 41,
        forecast_dimension: 7,
        forecast_method: "dow_average_forecast",
      },
    },
  },
};

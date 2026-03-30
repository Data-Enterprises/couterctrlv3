export const getBGResp = {
  data: {
    error: 0,
    success: true,
    group_count: 6,
    company: [
      {
        id: 1,
        name: "Food Giant",
        address: "",
        city: "",
        state: "",
        zip: 0,
        phone: "",
        contact_email: "jdilleha@dcrpos.com",
      },
    ],
    groups: [
      {
        id: 1,
        name: "All Stores",
        company: 1,
      },
      {
        id: 2,
        name: "test1",
        company: 1,
      },
      {
        id: 3,
        name: "Zone 1",
        company: 1,
      },
      {
        id: 4,
        name: "Zone 2",
        company: 1,
      },
      {
        id: 5,
        name: "Zone 3",
        company: 1,
      },
      {
        id: 6,
        name: "Zone 4",
        company: 1,
      },
    ],
  },
};

export const bgCreatedResp = {
  data: {
    error: 0,
    success: true,
    group_count: 6,
    company: [
      {
        id: 1,
        name: "Food Giant",
        address: "",
        city: "",
        state: "",
        zip: 0,
        phone: "",
        contact_email: "jdilleha@dcrpos.com",
      },
    ],
    groups: [
      {
        id: 1,
        name: "All Stores",
        company: 1,
      },
      {
        id: 2,
        name: "test1",
        company: 1,
      },
      {
        id: 3,
        name: "Zone 1",
        company: 1,
      },
      {
        id: 4,
        name: "Zone 2",
        company: 1,
      },
      {
        id: 5,
        name: "Zone 3",
        company: 1,
      },
      {
        id: 6,
        name: "Zone 4",
        company: 1,
      },
      {
        id: 7,
        name: "Unique Name",
        company: 1,
      },
    ],
  },
};

export const selectedCompanyBGResp = {
  data: {
    error: 0,
    success: true,
    group_count: 6,
    company: [
      {
        id: 4,
        name: "Test Company",
        address: "",
        city: "",
        state: "",
        zip: 0,
        phone: "",
        contact_email: "test@example.com",
      },
    ],
    groups: [
      {
        id: 1,
        name: "All Stores",
        company: 4,
      },
      {
        id: 2,
        name: "test1",
        company: 4,
      },
      {
        id: 3,
        name: "Zone 1",
        company: 4,
      },
      {
        id: 4,
        name: "Zone 2",
        company: 4,
      },
      {
        id: 5,
        name: "Zone 3",
        company: 4,
      },
      {
        id: 6,
        name: "Zone 4",
        company: 4,
      },
    ],
  },
};

export const updatedBGResp = {
  data: {
    error: 0,
    success: true,
    group_count: 6,
    company: [
      {
        id: 4,
        name: "Test Company",
        address: "",
        city: "",
        state: "",
        zip: 0,
        phone: "",
        contact_email: "test@example.com",
      },
    ],
    groups: [
      {
        id: 1,
        name: "All Stores",
        company: 4,
      },
      {
        id: 2,
        name: "updated group",
        company: 4,
      },
      {
        id: 3,
        name: "Zone 1",
        company: 4,
      },
      {
        id: 4,
        name: "Zone 2",
        company: 4,
      },
      {
        id: 5,
        name: "Zone 3",
        company: 4,
      },
      {
        id: 6,
        name: "Zone 4",
        company: 4,
      },
    ],
  },
};

export const deletedBGResp = {
  data: {
    error: 0,
    success: true,
    group_count: 6,
    company: [
      {
        id: 4,
        name: "Test Company",
        address: "",
        city: "",
        state: "",
        zip: 0,
        phone: "",
        contact_email: "test@example.com",
      },
    ],
    groups: [
      {
        id: 1,
        name: "All Stores",
        company: 4,
      },
      {
        id: 3,
        name: "Zone 1",
        company: 4,
      },
      {
        id: 4,
        name: "Zone 2",
        company: 4,
      },
      {
        id: 5,
        name: "Zone 3",
        company: 4,
      },
      {
        id: 6,
        name: "Zone 4",
        company: 4,
      },
    ],
  },
};

export const bgAssignedToUserResp = {
  data: {
    error: 0,
    success: true,
    active: [
      {
        id: 1,
        name: "All Stores",
        company: 4,
        company_name: "Test Company 1",
        active: 1,
      },
      {
        id: 2,
        name: "All Stores",
        company: 3,
        company_name: "Test Company 2",
        active: 1,
      },
      {
        id: 3,
        name: "Stores 1",
        company: 1,
        company_name: "Test Company 1",
        active: 1,
      },
    ],
    inactive: [
      {
        id: 4,
        name: "All Stores",
        company: 2,
        company_name: "Test Company 3",
        active: 0,
      },
      {
        id: 5,
        name: "Stores 2",
        company: 1,
        company_name: "Test Company 1",
        active: 0,
      },
      {
        id: 6,
        name: "Stores 3",
        company: 1,
        company_name: "Test Company 1",
        active: 0,
      },
    ],
  },
};

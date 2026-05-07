import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  User,
  BaseGroup,
  Store,
  UnassignedStore,
  UserCompany,
  UserLevel,
} from "../interfaces";

export type UserData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  user_level: number;
  confirm_password: string;
  role: number;
};

type FormUpdate = {
  key: keyof UserData;
  value: string | number;
};

export type UserStores = {
  assigned: Store[];
  unassigned: UnassignedStore[];
};

const defaultInfo: UserData = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  user_level: 0,
  confirm_password: "",
  role: 0,
};

export type UserFormType =
  | "create"
  | "update"
  | "delete"
  | "update_password"
  | "user_info"
  | "reset_security"
  | "";

type BaseGroupOption = "create" | "update" | "delete" | "assign_to_user" | "";
type StoreFormOption = "assign" | "info" | "bg_assign" | "";
type UserFilterType = "name" | "email";

interface UsersState {
  users: User[];
  userInfo: UserData;
  baseGroups: BaseGroup[];
  refresh: boolean;
  selectedUserId: number;
  allStores: Store[];
  selectedUserStores: UserStores;
  companyModalOpen: boolean;
  userCompanyIds: number[];
  baseGroupModalOpen: boolean;
  selectedCompanyId: number;
  userLevels: UserLevel[];
  selectedForm: number;
  selectedUserForm: UserFormType;
  isDeletingUser: boolean;
  userFilterText: string;
  alreadyAssignedBgs: BaseGroup[];
  availableUsernameText: string;
  usernameTextColor: string;
  availableEmailText: string;
  emailTextColor: string;
  bgOption: BaseGroupOption;
  storesOption: StoreFormOption;
  userFilterType: UserFilterType;
}

const initialState: UsersState = {
  users: [],
  userInfo: defaultInfo,
  baseGroups: [],
  refresh: true,
  selectedUserId: 0,
  allStores: [],
  selectedUserStores: {
    assigned: [],
    unassigned: [],
  },
  companyModalOpen: false,
  userCompanyIds: [],
  baseGroupModalOpen: false,
  selectedCompanyId: 0,
  userLevels: [],
  selectedForm: 0,
  selectedUserForm: "",
  isDeletingUser: false,
  userFilterText: "",
  alreadyAssignedBgs: [],
  availableUsernameText: "",
  usernameTextColor: "",
  availableEmailText: "",
  emailTextColor: "",
  bgOption: "",
  storesOption: "",
  userFilterType: "name",
};

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setUserInfo: (state, action: PayloadAction<FormUpdate>) => {
      const { key, value } = action.payload;
      if (key === "role" || key === "user_level") {
        state.userInfo = { ...state.userInfo, [key]: value as number };
      } else {
        state.userInfo = { ...state.userInfo, [key]: value as string };
      }
    },
    setSelectedUserInfo: (state, action: PayloadAction<User>) => {
      const {
        username,
        email,
        first_name,
        last_name,
        user_level,
        role,
        password,
        companies,
      } = action.payload;
      state.userInfo = {
        ...state.userInfo,
        username,
        email,
        first_name,
        last_name,
        user_level,
        role: role === null ? 0 : role,
        password: password,
        confirm_password: password,
      };
      state.userCompanyIds = companies.map((c) => c.company);
    },
    setAssignBaseGroups: (state, action: PayloadAction<BaseGroup[]>) => {
      state.baseGroups = action.payload;
      const assigned = [...action.payload].filter((bg) => bg.active === 1);
      state.alreadyAssignedBgs = assigned;
    },
    resetUserInfo: (state) => {
      state.userInfo = defaultInfo;
      state.userCompanyIds = [];
      state.selectedUserId = 0;
      state.usernameTextColor = "";
      state.availableUsernameText = "";
      state.emailTextColor = "";
      state.availableEmailText = "";
    },
    setRefresh: (state, action: PayloadAction<boolean>) => {
      state.refresh = action.payload;
    },
    setSelectedUserId: (state, action: PayloadAction<number>) => {
      state.selectedUserId = action.payload;
    },
    setSelectedUserStores: (state, action: PayloadAction<UserStores>) => {
      state.selectedUserStores.assigned = action.payload.assigned;
      state.selectedUserStores.unassigned = action.payload.unassigned;
      state.allStores = [
        ...state.selectedUserStores.assigned,
        ...state.selectedUserStores.unassigned,
      ];
    },
    setRole: (state, action: PayloadAction<number>) => {
      state.userInfo.role = action.payload;
    },
    setStoresAssignedForUser: (state, action: PayloadAction<number[]>) => {
      const newlyAssigned = state.allStores.filter((s) =>
        action.payload.includes(s.storeid),
      );
      state.selectedUserStores.assigned = [
        ...state.selectedUserStores.assigned,
        ...newlyAssigned,
      ].sort(
        (a: Store, b: Store) =>
          parseInt(a.store_number) - parseInt(b.store_number),
      );
      state.selectedUserStores.unassigned = state.selectedUserStores.unassigned
        .filter((s) => !action.payload.includes(s.storeid))
        .sort(
          (a: Store, b: Store) =>
            parseInt(a.store_number) - parseInt(b.store_number),
        );
    },
    setStoresUnassignedForUser: (state, action: PayloadAction<number[]>) => {
      const newlyUnassigned = state.allStores.filter((s) =>
        action.payload.includes(s.storeid),
      );
      state.selectedUserStores.unassigned = [
        ...state.selectedUserStores.unassigned,
        ...newlyUnassigned,
      ].sort(
        (a: Store, b: Store) =>
          parseInt(a.store_number) - parseInt(b.store_number),
      );
      state.selectedUserStores.assigned = state.selectedUserStores.assigned
        .filter((s) => !action.payload.includes(s.storeid))
        .sort(
          (a: Store, b: Store) =>
            parseInt(a.store_number) - parseInt(b.store_number),
        );
    },
    setCompanyModalOpen: (state, action: PayloadAction<boolean>) => {
      state.companyModalOpen = action.payload;
    },
    setUserCompanyIds: (state, action: PayloadAction<number[]>) => {
      state.userCompanyIds = action.payload;
    },
    updateUserCompanies: (state, action: PayloadAction<UserCompany[]>) => {
      const id = state.selectedUserId;
      const idx = state.users.findIndex((u) => u.id === id);
      state.users[idx].companies = action.payload;
    },
    setBaseGroupModalOpen: (state, action: PayloadAction<boolean>) => {
      state.baseGroupModalOpen = action.payload;
    },
    setSelectedCompanyId: (state, action: PayloadAction<number>) => {
      state.selectedCompanyId = action.payload;
    },
    setUserLevels: (state, action: PayloadAction<UserLevel[]>) => {
      state.userLevels = action.payload;
    },
    setSelectedForm: (state, action: PayloadAction<number>) => {
      state.selectedForm = action.payload;
    },
    setSelectedUserForm: (state, action: PayloadAction<UserFormType>) => {
      state.selectedUserForm = action.payload;
    },
    setIsDeletingUser: (state, action: PayloadAction<boolean>) => {
      state.isDeletingUser = action.payload;
    },
    setUserFilterText: (state, action: PayloadAction<string>) => {
      state.userFilterText = action.payload;
    },
    setAvailableUsernameDetails: (
      state,
      action: PayloadAction<{
        availableUsernameText: string;
        usernameTextColor: string;
      }>,
    ) => {
      state.availableUsernameText = action.payload.availableUsernameText;
      state.usernameTextColor = action.payload.usernameTextColor;
    },
    setAvailableEmailDetails: (
      state,
      action: PayloadAction<{
        availableEmailText: string;
        emailTextColor: string;
      }>,
    ) => {
      state.availableEmailText = action.payload.availableEmailText;
      state.emailTextColor = action.payload.emailTextColor;
    },
    setBGOption: (state, action: PayloadAction<BaseGroupOption>) => {
      state.bgOption = action.payload;
    },
    setStoresFormOption: (state, action: PayloadAction<StoreFormOption>) => {
      state.storesOption = action.payload;
    },
    setUserFilterType: (state, action: PayloadAction<UserFilterType>) => {
      state.userFilterType = action.payload;
    },
    resetUsersSlice: () => initialState,
  },
});

export const {
  setUsers,
  setUserInfo,
  setSelectedUserInfo,
  resetUserInfo,
  setRefresh,
  setSelectedUserId,
  setSelectedUserStores,
  setRole,
  setStoresAssignedForUser,
  setStoresUnassignedForUser,
  setCompanyModalOpen,
  setUserCompanyIds,
  updateUserCompanies,
  setBaseGroupModalOpen,
  setSelectedCompanyId,
  setUserLevels,
  setAssignBaseGroups,
  setSelectedForm,
  setSelectedUserForm,
  setIsDeletingUser,
  setUserFilterText,
  resetUsersSlice,
  setAvailableUsernameDetails,
  setAvailableEmailDetails,
  setBGOption,
  setStoresFormOption,
  setUserFilterType,
} = usersSlice.actions;
export default usersSlice.reducer;

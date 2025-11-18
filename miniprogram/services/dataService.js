const STORAGE_KEY = 'ICOST_STATE_V1';
const { http } = require('../utils/request'); 

const defaultAccount = {
  id: 'account-demo',
  username: 'demo',
  password: '123456',
  name: '演示用户',
  avatar: '/images/avatar.png',
  totalAssets: 268000,
  balance: 34800,
};

const defaultState = {
  currentUserId: defaultAccount.id,
  accounts: [defaultAccount],
  user: {
    id: defaultAccount.id,
    name: defaultAccount.name,
    avatar: defaultAccount.avatar,
    totalAssets: defaultAccount.totalAssets,
    balance: defaultAccount.balance,
  },
  ledgers: [
    {
      id: 'ledger-default',
      name: '默认账本',
      color: '#2F80ED',
      budget: 8000,
      remark: '日常开销与生活支出',
      category: 'personal',
    },
    {
      id: 'ledger-family',
      name: '家庭账本',
      color: '#F2994A',
      budget: 15000,
      remark: '家庭共同支出',
      category: 'family',
    },
    {
      id: 'ledger-trip',
      name: '旅行账本',
      color: '#27AE60',
      budget: 12000,
      remark: '旅行专项预算',
      category: 'travel',
    },
  ],
  categories: [
    { id: 'cat-food', name: '餐饮', type: 'expense', icon: '/images/icons/goods.png', parentId: 0 },
    { id: 'cat-traffic', name: '交通', type: 'expense', icon: '/images/icons/business.png', parentId: 0 },
    { id: 'cat-ent', name: '娱乐', type: 'expense', icon: '/images/icons/examples.png', parentId: 0 },
    { id: 'cat-life', name: '生活缴费', type: 'expense', icon: '/images/icons/business-active.png', parentId: 0 },
    { id: 'cat-income-salary', name: '工资', type: 'income', icon: '/images/icons/home.png', parentId: 0 },
    { id: 'cat-income-bonus', name: '奖金', type: 'income', icon: '/images/icons/examples-active.png', parentId: 0 },
    { id: 'cat-transfer', name: '转账', type: 'transfer', icon: '/images/icons/usercenter.png', parentId: 0 },
  ],
  bills: [
    {
      id: 'bill-1',
      ledgerId: 'ledger-default',
      type: 'expense',
      categoryId: 'cat-food',
      amount: 36.5,
      payment: '微信',
      date: '2025-11-10T08:15:00.000Z',
      note: '早餐',
      reimburseStatus: 'none',
      flowTag: 'expense',
    },
    {
      id: 'bill-2',
      ledgerId: 'ledger-default',
      type: 'expense',
      categoryId: 'cat-traffic',
      amount: 120,
      payment: '支付宝',
      date: '2025-11-09T14:12:00.000Z',
      note: '打车',
      reimburseStatus: 'pending',
      flowTag: 'reimburse',
    },
    {
      id: 'bill-3',
      ledgerId: 'ledger-family',
      type: 'income',
      categoryId: 'cat-income-salary',
      amount: 18200,
      payment: '银行转账',
      date: '2025-11-05T09:00:00.000Z',
      note: '11月工资',
      reimburseStatus: 'none',
      flowTag: 'salary',
    },
    {
      id: 'bill-4',
      ledgerId: 'ledger-trip',
      type: 'transfer',
      categoryId: 'cat-transfer',
      amount: 5000,
      payment: '储蓄卡',
      date: '2025-10-28T11:35:00.000Z',
      note: '旅行专项储备',
      reimburseStatus: 'done',
      flowTag: 'transfer',
    },
  ],
  reimbursements: [
    { id: 'reb-1', billId: 'bill-2', amount: 120, status: 'pending' },
    { id: 'reb-2', billId: 'bill-4', amount: 5000, status: 'done' },
  ],
  assets: {
    totalAssets: 268000,
    totalDebt: 95000,
    borrowIn: 12000,
    borrowOut: 5000,
  },
};

let stateCache = null;

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function getNow() {
  return new Date().toISOString();
}

function safeGetStorage() {
  try {
    return wx.getStorageSync(STORAGE_KEY);
  } catch (err) {
    return null;
  }
}

function safeSetStorage(value) {
  try {
    wx.setStorageSync(STORAGE_KEY, value);
  } catch (err) {
    console.warn('存储失败', err);
  }
}

function loadState() {
  if (stateCache) {
    return stateCache;
  }
  const stored = safeGetStorage();
  if (!stored || typeof stored !== 'object') {
    stateCache = clone(defaultState);
    safeSetStorage(stateCache);
    return stateCache;
  }
  stateCache = Object.assign(clone(defaultState), stored);
  return stateCache;
}

function persist() {
  safeSetStorage(stateCache);
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function normalizeUsername(value = '') {
  return value.trim().toLowerCase();
}

function findAccountByUsername(state, username) {
  const target = normalizeUsername(username);
  return state.accounts.find((item) => normalizeUsername(item.username) === target);
}

function syncUserFromAccount(state, account) {
  if (!account) return;
  state.user = Object.assign({}, state.user, {
    id: account.id,
    name: account.name,
    avatar: account.avatar || '/images/avatar.png',
    totalAssets: account.totalAssets ?? state.user.totalAssets,
    balance: account.balance ?? state.user.balance,
  });
}

function ensureState() {
  return loadState();
}

function withState(mutator) {
  const state = ensureState();
  mutator(state);
  persist();
  return state;
}

function parseDate(value) {
  if (!value) return new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

function formatDateKey(date) {
  const d = parseDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function resolveRange(option = {}) {
  const now = new Date();
  let start;
  let end;
  const mode = option.mode || 'month';
  if (mode === 'week') {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (mode === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (mode === 'all') {
    start = new Date(2000, 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (mode === 'range' && option.start && option.end) {
    start = parseDate(option.start);
    start.setHours(0, 0, 0, 0);
    end = parseDate(option.end);
    end.setHours(23, 59, 59, 999);
  } else {
    const source = option.value ? parseDate(`${option.value}-01`) : now;
    start = new Date(source.getFullYear(), source.getMonth(), 1);
    end = new Date(source.getFullYear(), source.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end, mode };
}

function filterBillsByRange(bills, rangeOption) {
  const { start, end } = resolveRange(rangeOption);
  const startTs = start.getTime();
  const endTs = end.getTime();
  return bills.filter((bill) => {
    const ts = parseDate(bill.date).getTime();
    return ts >= startTs && ts <= endTs;
  });
}

function sum(list, selector) {
  return list.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function groupBy(list, keyGetter) {
  return list.reduce((acc, item) => {
    const key = keyGetter(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

function getStateSnapshot() {
  return clone(ensureState());
}

function getUser() {
  // 1. 优先从服务器存储获取用户信息
  const serverUser = getUserInfo();
  if (serverUser && serverUser.id) {
    // 同步服务器数据到本地状态
    withState((state) => {
      state.currentUserId = serverUser.id;
      state.user = Object.assign({}, state.user, {
        id: serverUser.id,
        name: serverUser.name || serverUser.nickname || '用户',
        avatar: serverUser.profile || '/images/avatar.png',
        totalAssets: serverUser.totalAssets || 0,
      });
      
      // 同时更新账户信息
      const accountIndex = state.accounts.findIndex(acc => acc.id === serverUser.id);
      if (accountIndex > -1) {
        state.accounts[accountIndex] = Object.assign({}, state.accounts[accountIndex], {
          name: state.user.name,
          avatar: state.user.profile,
          totalAssets: state.user.totalAssets,
        });
      } else {
        // 如果本地没有对应账户，创建一个
        state.accounts.push({
          id: serverUser.id,
          username: serverUser.phoneNumber || serverUser.id,
          password: '', // 服务器登录不需要密码
          name: serverUser.name || serverUser.nickname,
          avatar: serverUser.profile || '/images/avatar.png',
          totalAssets: serverUser.totalAssets || 0,
        });
      }
    });
    persist();
    
    return clone(serverUser);
  }
  
  // 2. 回退到本地账户逻辑（原有代码）
  const state = ensureState();
  const account = state.accounts.find((item) => item.id === state.currentUserId);
  if (account) {
    syncUserFromAccount(state, account);
    persist();
  } else if (!state.user || !state.user.id) {
    state.user = Object.assign(
      {
        id: '',
        name: '未登录用户',
        avatar: '/images/avatar.png',
        totalAssets: 0,
        balance: 0,
      },
      state.user || {}
    );
  }
  return clone(state.user);
}

function updateUser(payload) {
  let result;
  withState((state) => {
    state.user = Object.assign({}, state.user, payload, { updatedAt: getNow() });
    const accountIndex = state.accounts.findIndex((acc) => acc.id === state.currentUserId);
    if (accountIndex > -1) {
      state.accounts[accountIndex] = Object.assign({}, state.accounts[accountIndex], {
        name: state.user.name,
        avatar: state.user.avatar,
        totalAssets: state.user.totalAssets,
        balance: state.user.balance,
      });
    }
    result = state.user;
  });
  return clone(result);
}

function listLedgers() {
  return clone(ensureState().ledgers);
}

function upsertLedger(ledger) {
  let result;
  withState((state) => {
    const idx = state.ledgers.findIndex((item) => item.id === ledger.id);
    if (idx > -1) {
      state.ledgers[idx] = Object.assign({}, state.ledgers[idx], ledger, { updatedAt: getNow() });
      result = state.ledgers[idx];
    } else {
      const record = Object.assign(
        {
          id: generateId('ledger'),
          color: '#2F80ED',
          budget: 0,
        },
        ledger,
        { createdAt: getNow() }
      );
      state.ledgers.push(record);
      result = record;
    }
  });
  return clone(result);
}

function removeLedger(id) {
  withState((state) => {
    state.ledgers = state.ledgers.filter((item) => item.id !== id);
    state.bills = state.bills.filter((bill) => bill.ledgerId !== id);
  });
}

function listCategories(type) {
  const categories = ensureState().categories;
  if (!type) return clone(categories);
  return clone(categories.filter((item) => item.type === type));
}

function addCategory(payload) {
  let record;
  withState((state) => {
    record = Object.assign(
      {
        id: generateId('cat'),
        parentId: 0,
      },
      payload,
      { createdAt: getNow() }
    );
    state.categories.push(record);
  });
  return clone(record);
}

function listBills(filter = {}) {
  const state = ensureState();
  let bills = [...state.bills];
  if (filter.ledgerId) {
    bills = bills.filter((bill) => bill.ledgerId === filter.ledgerId);
  }
  if (filter.type) {
    bills = bills.filter((bill) => bill.type === filter.type);
  }
  if (filter.mode || (filter.start && filter.end) || filter.value) {
    bills = filterBillsByRange(bills, filter);
  }
  return clone(bills.sort((a, b) => new Date(b.date) - new Date(a.date)));
}

function addBill(payload) {
  let record;
  withState((state) => {
    record = Object.assign(
      {
        id: generateId('bill'),
        createdAt: getNow(),
      },
      payload
    );
    state.bills.push(record);
    if (payload.reimburseStatus && payload.reimburseStatus !== 'none') {
      state.reimbursements.push({
        id: generateId('reb'),
        billId: record.id,
        amount: payload.amount,
        status: payload.reimburseStatus,
      });
    }
  });
  return clone(record);
}

function getLedgerSnapshot(ledgerId, rangeOption) {
  const state = ensureState();
  const ledger = state.ledgers.find((item) => item.id === ledgerId) || state.ledgers[0];
  const bills = listBills(Object.assign({ ledgerId: ledger.id }, rangeOption));
  const expense = sum(bills.filter((item) => item.type === 'expense'), (item) => item.amount);
  const income = sum(bills.filter((item) => item.type === 'income'), (item) => item.amount);
  const transfer = sum(bills.filter((item) => item.type === 'transfer'), (item) => item.amount);
  const reimbursePending = sum(
    bills.filter((item) => item.reimburseStatus === 'pending'),
    (item) => item.amount
  );
  const reimburseDone = sum(
    bills.filter((item) => item.reimburseStatus === 'done'),
    (item) => item.amount
  );
  return {
    ledger,
    expense,
    income,
    transfer,
    balance: income - expense,
    budget: ledger.budget || 0,
    budgetRemain: (ledger.budget || 0) - expense,
    reimbursePending,
    reimburseDone,
  };
}

function getAssetsSummary() {
  const assets = ensureState().assets;
  const netAsset = (assets.totalAssets || 0) - (assets.totalDebt || 0);
  return Object.assign({ netAsset }, clone(assets));
}

function updateAssets(payload) {
  withState((state) => {
    state.assets = Object.assign({}, state.assets, payload, { updatedAt: getNow() });
  });
  return getAssetsSummary();
}

function getStatistics(rangeOption = {}) {
  const state = ensureState();
  const bills = listBills(rangeOption);
  const expenseBills = bills.filter((item) => item.type === 'expense');
  const incomeBills = bills.filter((item) => item.type === 'income');
  const transferBills = bills.filter((item) => item.type === 'transfer');

  const totals = {
    expense: sum(expenseBills, (item) => item.amount),
    income: sum(incomeBills, (item) => item.amount),
    transfer: sum(transferBills, (item) => item.amount),
  };
  const balance = totals.income - totals.expense;
  const reimburse = {
    pending: sum(bills.filter((item) => item.reimburseStatus === 'pending'), (item) => item.amount),
    done: sum(bills.filter((item) => item.reimburseStatus === 'done'), (item) => item.amount),
  };

  const expenseGroups = groupBy(expenseBills, (item) => item.categoryId);
  const incomeGroups = groupBy(incomeBills, (item) => item.categoryId);

  const categories = state.categories;
  const mapCategoryName = (id) => {
    const found = categories.find((cat) => cat.id === id);
    return found ? found.name : '未分类';
  };

  const expenseBreakdown = Object.keys(expenseGroups).map((key) => {
    const list = expenseGroups[key];
    const amount = sum(list, (item) => item.amount);
    return {
      categoryId: key,
      name: mapCategoryName(key),
      amount,
      percent: totals.expense ? (amount / totals.expense) * 100 : 0,
    };
  });

  const incomeBreakdown = Object.keys(incomeGroups).map((key) => {
    const list = incomeGroups[key];
    const amount = sum(list, (item) => item.amount);
    return {
      categoryId: key,
      name: mapCategoryName(key),
      amount,
      percent: totals.income ? (amount / totals.income) * 100 : 0,
    };
  });

  const ledgerGroup = groupBy(bills, (item) => item.ledgerId);
  const ledgerSummary = Object.keys(ledgerGroup).map((key) => {
    const ledger = state.ledgers.find((item) => item.id === key);
    const list = ledgerGroup[key];
    return {
      ledgerId: key,
      ledgerName: ledger ? ledger.name : '未知账本',
      expense: sum(list.filter((item) => item.type === 'expense'), (item) => item.amount),
      income: sum(list.filter((item) => item.type === 'income'), (item) => item.amount),
    };
  });

  const flowGroups = groupBy(transferBills, (item) => item.flowTag || 'transfer');
  const flowSummary = Object.keys(flowGroups).map((key) => {
    const amount = sum(flowGroups[key], (item) => item.amount);
    return { flowTag: key, amount };
  });

  return {
    totals: Object.assign({ balance }, totals),
    reimburse,
    expenseBreakdown,
    incomeBreakdown,
    ledgerSummary,
    flowSummary,
    billCount: bills.length,
    range: resolveRange(rangeOption),
  };
}

function getQuickSnapshot() {
  const currentMonth = formatDateKey(new Date());
  const ledger = getLedgerSnapshot(ensureState().ledgers[0].id, {
    mode: 'month',
    value: currentMonth,
  });
  const statistics = getStatistics({ mode: 'month', value: currentMonth });
  return {
    ledger,
    statistics,
    reimburse: statistics.reimburse,
  };
}

function listAccounts() {
  return clone(ensureState().accounts);
}

async function registerAccount(userData) {
  try {
    const result = await http.post('/user/register', userData);
    if (result.code === 1) {
      // 保存用户信息和token
      if (result.data) {
        if (result.data) {
          setUser(result.data);
        }
        // if (result.data.token) {
        //   setToken(result.data.token);
        // }
      }
      return {
        success: true,
        message: result.message,
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.message || '注册失败'
      };
    }
  } catch (error) {
    console.error('注册请求失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

async function loginAccount(loginData) {
  try {
    const result = await http.post('/user/login', loginData);  
    if (result.code === 1) {
      // 保存用户信息和token
      if (result.data) {
        if (result.data) {
          setUser(result.data);
        }
        // if (result.data.token) {
        //   setToken(result.data.token);
        // }
      }
      return {
        success: true,
        message: result.message,
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.message || '登录失败'
      };
    }
  } catch (error) {
    console.error('登录请求失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

async function logoutAccount() {
  try {
    // 1. 清除本地存储的用户信息和token
    //clearToken(); // 清除token
    try {
      wx.removeStorageSync('USER_INFO');
    } catch (err) {
      console.warn('清除本地用户信息失败', err);
    }
    
    // 2. 重置应用状态
    withState((state) => {
      state.currentUserId = null;
      state.user = {
        id: '',
        name: '未登录用户',
        avatar: '/images/avatar.png',
        totalAssets: 0,
        balance: 0,
      };
    });
    // 3. 持久化状态
    persist();
    return clone(ensureState().user);
    
  } catch (error) {
    console.error('退出登录过程中发生错误:', error);
    throw error;
  }
}

// 用户信息存储（用于保存服务器返回的用户信息）
function setUser(userInfo) {
  try {
    wx.setStorageSync('USER_INFO', userInfo);
  } catch (err) {
    console.warn('用户信息存储失败', err);
  }
}

function getUserInfo() {
  try {
    return wx.getStorageSync('USER_INFO');
  } catch (err) {
    return null;
  }
}

module.exports = {
  getStateSnapshot,
  getUser,
  updateUser,
  listAccounts,
  registerAccount,
  loginAccount,
  logoutAccount,
  listLedgers,
  upsertLedger,
  removeLedger,
  listCategories,
  addCategory,
  listBills,
  addBill,
  getLedgerSnapshot,
  getAssetsSummary,
  updateAssets,
  getStatistics,
  getQuickSnapshot,
  setUser,
  getUserInfo,
};


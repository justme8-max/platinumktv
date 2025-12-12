// Demo data for testing without database
// This data is shown when demo mode is active

export interface DemoRoom {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity: number;
  hourly_rate: number;
  status: "available" | "occupied" | "maintenance" | "reserved" | "cleaning";
  current_session_start?: string;
  waiter_id?: string;
  notes?: string;
}

export interface DemoOrder {
  id: string;
  room_id: string;
  room_name: string;
  waiter_name: string;
  status: "pending" | "preparing" | "ready" | "served";
  total_amount: number;
  items: { name: string; quantity: number; price: number }[];
  created_at: string;
}

export interface DemoTransaction {
  id: string;
  room_name: string;
  amount: number;
  payment_method: "cash" | "card" | "ewallet" | "transfer";
  created_at: string;
  receipt_number: string;
}

export interface DemoStats {
  todayRevenue: number;
  todayTransactions: number;
  activeRooms: number;
  activeOrders: number;
  occupiedRooms: number;
  pendingItems: number;
}

// Generate timestamps relative to now
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

export const DEMO_ROOMS: DemoRoom[] = [
  { 
    id: "demo-1", 
    room_number: "101", 
    room_name: "VIP Platinum", 
    room_type: "VIP", 
    capacity: 12, 
    hourly_rate: 750000, 
    status: "occupied",
    current_session_start: hoursAgo(2),
    notes: "Premium sound system"
  },
  { 
    id: "demo-2", 
    room_number: "102", 
    room_name: "VIP Gold", 
    room_type: "VIP", 
    capacity: 10, 
    hourly_rate: 600000, 
    status: "occupied",
    current_session_start: hoursAgo(1),
  },
  { 
    id: "demo-3", 
    room_number: "103", 
    room_name: "VIP Silver", 
    room_type: "VIP", 
    capacity: 8, 
    hourly_rate: 500000, 
    status: "available",
  },
  { 
    id: "demo-4", 
    room_number: "201", 
    room_name: "Executive Suite", 
    room_type: "Executive", 
    capacity: 15, 
    hourly_rate: 1000000, 
    status: "reserved",
  },
  { 
    id: "demo-5", 
    room_number: "202", 
    room_name: "Executive Deluxe", 
    room_type: "Executive", 
    capacity: 12, 
    hourly_rate: 850000, 
    status: "available",
  },
  { 
    id: "demo-6", 
    room_number: "301", 
    room_name: "Regular A", 
    room_type: "Regular", 
    capacity: 6, 
    hourly_rate: 250000, 
    status: "occupied",
    current_session_start: hoursAgo(3),
  },
  { 
    id: "demo-7", 
    room_number: "302", 
    room_name: "Regular B", 
    room_type: "Regular", 
    capacity: 6, 
    hourly_rate: 250000, 
    status: "cleaning",
  },
  { 
    id: "demo-8", 
    room_number: "303", 
    room_name: "Regular C", 
    room_type: "Regular", 
    capacity: 6, 
    hourly_rate: 250000, 
    status: "available",
  },
  { 
    id: "demo-9", 
    room_number: "401", 
    room_name: "Party Room", 
    room_type: "Party", 
    capacity: 25, 
    hourly_rate: 1500000, 
    status: "maintenance",
    notes: "Speaker repair in progress"
  },
  { 
    id: "demo-10", 
    room_number: "402", 
    room_name: "Family Room", 
    room_type: "Family", 
    capacity: 8, 
    hourly_rate: 350000, 
    status: "available",
  },
  { 
    id: "demo-11", 
    room_number: "501", 
    room_name: "Premium Lounge", 
    room_type: "Premium", 
    capacity: 20, 
    hourly_rate: 2000000, 
    status: "available",
  },
];

export const DEMO_ORDERS: DemoOrder[] = [
  {
    id: "order-1",
    room_id: "demo-1",
    room_name: "VIP Platinum",
    waiter_name: "Budi Santoso",
    status: "pending",
    total_amount: 450000,
    items: [
      { name: "Bir Bintang", quantity: 6, price: 35000 },
      { name: "Nachos", quantity: 2, price: 55000 },
      { name: "Chicken Wings", quantity: 1, price: 85000 },
    ],
    created_at: hoursAgo(0.1),
  },
  {
    id: "order-2",
    room_id: "demo-2",
    room_name: "VIP Gold",
    waiter_name: "Sari Dewi",
    status: "preparing",
    total_amount: 320000,
    items: [
      { name: "Jus Jeruk", quantity: 4, price: 25000 },
      { name: "French Fries", quantity: 2, price: 45000 },
      { name: "Pizza Margherita", quantity: 1, price: 120000 },
    ],
    created_at: hoursAgo(0.3),
  },
  {
    id: "order-3",
    room_id: "demo-6",
    room_name: "Regular A",
    waiter_name: "Budi Santoso",
    status: "ready",
    total_amount: 180000,
    items: [
      { name: "Teh Botol", quantity: 6, price: 15000 },
      { name: "Keripik", quantity: 3, price: 30000 },
    ],
    created_at: hoursAgo(0.5),
  },
];

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "trx-1",
    room_name: "Regular B",
    amount: 890000,
    payment_method: "cash",
    created_at: hoursAgo(1),
    receipt_number: "RCP-20251212-0001",
  },
  {
    id: "trx-2",
    room_name: "VIP Silver",
    amount: 2450000,
    payment_method: "card",
    created_at: hoursAgo(2),
    receipt_number: "RCP-20251212-0002",
  },
  {
    id: "trx-3",
    room_name: "Executive Suite",
    amount: 4200000,
    payment_method: "transfer",
    created_at: hoursAgo(3),
    receipt_number: "RCP-20251212-0003",
  },
  {
    id: "trx-4",
    room_name: "Regular C",
    amount: 650000,
    payment_method: "ewallet",
    created_at: hoursAgo(4),
    receipt_number: "RCP-20251212-0004",
  },
  {
    id: "trx-5",
    room_name: "Family Room",
    amount: 1100000,
    payment_method: "cash",
    created_at: hoursAgo(5),
    receipt_number: "RCP-20251212-0005",
  },
];

export const DEMO_STATS: DemoStats = {
  todayRevenue: DEMO_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0),
  todayTransactions: DEMO_TRANSACTIONS.length,
  activeRooms: DEMO_ROOMS.filter(r => r.status === "occupied").length,
  activeOrders: DEMO_ORDERS.filter(o => o.status !== "served").length,
  occupiedRooms: DEMO_ROOMS.filter(r => r.status === "occupied").length,
  pendingItems: DEMO_ORDERS.reduce((sum, o) => sum + o.items.length, 0),
};

export const DEMO_CLEANING_TASKS = [
  {
    id: "task-1",
    room_name: "Regular B",
    room_number: "302",
    assigned_to: "Agus Cleaning",
    status: "in_progress",
    priority: "high",
    created_at: hoursAgo(0.5),
  },
  {
    id: "task-2",
    room_name: "VIP Gold",
    room_number: "102",
    assigned_to: "Rina OB",
    status: "pending",
    priority: "normal",
    created_at: hoursAgo(0.2),
  },
];

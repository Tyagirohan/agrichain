import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  delivered_orders: number;
  monthly_revenue: Array<{ month: string; revenue: number }>;
  product_revenue: Array<{ product: string; revenue: number; quantity: number }>;
  best_sellers: Array<{ product: string; quantity: number; revenue: number }>;
  recent_orders: any[];
}

interface FarmerAnalyticsProps {
  data: AnalyticsData;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const FarmerAnalytics = ({ data }: FarmerAnalyticsProps) => {
  if (!data || data.total_orders === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Analytics Dashboard</h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No sales data yet</p>
          <p className="text-sm mt-2">Start selling to see your analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-3xl mr-3">📊</span>
        Analytics Dashboard
      </h2>

      {/* Revenue Trend Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">💰 Revenue Trends (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.monthly_revenue}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Product Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📦 Revenue by Product</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.product_revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best Sellers */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🏆 Best Selling Products</h3>
          <div className="space-y-4">
            {data.best_sellers.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <div>
                  <p className="font-semibold text-gray-800">{item.product}</p>
                  <p className="text-sm text-gray-600">{item.quantity} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">₹{item.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 border-2 border-green-300">
          <p className="text-green-700 font-semibold mb-2">💰 Total Revenue</p>
          <p className="text-3xl font-bold text-green-800">₹{data.total_revenue.toFixed(2)}</p>
          <p className="text-sm text-green-600 mt-1">From {data.delivered_orders} delivered orders</p>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 border-2 border-blue-300">
          <p className="text-blue-700 font-semibold mb-2">📦 Total Orders</p>
          <p className="text-3xl font-bold text-blue-800">{data.total_orders}</p>
          <p className="text-sm text-blue-600 mt-1">All time</p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-6 border-2 border-purple-300">
          <p className="text-purple-700 font-semibold mb-2">✅ Delivery Rate</p>
          <p className="text-3xl font-bold text-purple-800">
            {data.total_orders > 0 ? Math.round((data.delivered_orders / data.total_orders) * 100) : 0}%
          </p>
          <p className="text-sm text-purple-600 mt-1">{data.delivered_orders} / {data.total_orders} orders</p>
        </div>
      </div>
    </div>
  );
};

// Consumer Analytics Component
interface ConsumerAnalyticsData {
  total_spent: number;
  total_orders: number;
  monthly_spending: Array<{ month: string; spending: number }>;
  category_spending: Array<{ category: string; spending: number }>;
  favorite_products: Array<{ product: string; orders: number }>;
}

interface ConsumerAnalyticsProps {
  data: ConsumerAnalyticsData;
}

export const ConsumerAnalytics = ({ data }: ConsumerAnalyticsProps) => {
  if (!data || data.total_orders === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Purchase Analytics</h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No purchase history yet</p>
          <p className="text-sm mt-2">Start shopping to see your analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-3xl mr-3">📊</span>
        Purchase Analytics
      </h2>

      {/* Spending Trend Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">💳 Spending Trends (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthly_spending}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
            <Legend />
            <Line type="monotone" dataKey="spending" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Spending & Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Category Spending Pie Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🥘 Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.category_spending}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, spending }) => `${category}: ₹${spending.toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="spending"
              >
                {data.category_spending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Favorite Products */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">❤️ Most Ordered Products</h3>
          <div className="space-y-4">
            {data.favorite_products.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold text-blue-600">#{index + 1}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.product}</p>
                    <p className="text-sm text-gray-600">Ordered {item.orders} times</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-6 border-2 border-blue-300">
          <p className="text-blue-700 font-semibold mb-2">💰 Total Spent</p>
          <p className="text-3xl font-bold text-blue-800">₹{data.total_spent.toFixed(2)}</p>
          <p className="text-sm text-blue-600 mt-1">Across {data.total_orders} orders</p>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-6 border-2 border-green-300">
          <p className="text-green-700 font-semibold mb-2">📦 Average Order Value</p>
          <p className="text-3xl font-bold text-green-800">
            ₹{data.total_orders > 0 ? (data.total_spent / data.total_orders).toFixed(2) : 0}
          </p>
          <p className="text-sm text-green-600 mt-1">Per order</p>
        </div>
      </div>
    </div>
  );
};


// Order service — wraps the data layer's parent/seller order split.
// All methods return Promises.
import { createOrder, getOrders, getSellerOrders, getOrderById, updateOrderStatus } from '../lib/firestore'
export const orderService = {
  create: createOrder,
  listForCustomer: async (customerId) => (await getOrders()).filter((o) => o.customerId === customerId),
  listForSeller: async (sellerId) => (await getSellerOrders()).filter((o) => o.sellerId === sellerId),
  byId: getOrderById,
  updateStatus: updateOrderStatus,
  all: getOrders,
  allSellerOrders: getSellerOrders,
}
export default orderService

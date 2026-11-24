// Order service — wraps the data layer's parent/seller order split.
import { createOrder, getOrders, getSellerOrders, getOrderById, updateOrderStatus } from '../lib/firestore'
export const orderService = {
  create: createOrder,
  listForCustomer: (customerId) => getOrders().filter((o) => o.customerId === customerId),
  listForSeller: (sellerId) => getSellerOrders().filter((o) => o.sellerId === sellerId),
  byId: getOrderById,
  updateStatus: updateOrderStatus,
  all: getOrders,
  allSellerOrders: getSellerOrders,
}
export default orderService

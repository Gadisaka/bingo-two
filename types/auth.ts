export interface UserPayload {
  id: number
  role: "admin" | "agent" | "cashier"
  name?: string
  phone?: string
  type?: string
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  pendingRepairs: number;
  assetsInUse: number;
  ticketsByStatus: { [key: string]: number };
  ticketsByPriority: { [key: string]: number };
  assetsByCondition: { [key: string]: number };
  recentTickets: any[];
}

export interface TicketPart {
  part_id: string;
  ticket_id: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string;
  status: 'pending' | 'ordered' | 'received';
  requested_date: string;
  received_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePartRequest {
  part_name: string;
  quantity: number;
  unit_cost: number;
  supplier: string;
  notes?: string;
}

export interface UpdatePartRequest {
  status?: 'pending' | 'ordered' | 'received';
  notes?: string;
}

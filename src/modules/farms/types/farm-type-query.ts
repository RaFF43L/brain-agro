export type FarmFilterQuery = Partial<{
  name: string;
  city: string;
  state: string;
  totalAreaMin: number;
  totalAreaMax: number;
  producerId: number;
}>;
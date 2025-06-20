
export type ReactionSchemeRecord = {
  reactionPartners: string;
  reactants: string[];
  products: string[];
  ligandStructureId: number;
  representative: boolean;
};

export type ReactionSchemeRecordWithKeyInfo = ReactionSchemeRecord & {
  ecNumber: string;
  substrate: string;
  organism: string;
};

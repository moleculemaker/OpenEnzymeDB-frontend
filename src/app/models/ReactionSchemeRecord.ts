
export type ReactionSchemeRecord = {
  reactionPartners: string;
  reactants: string[];
  products: string[];
  ligandStructureId: number;
};

export type ReactionSchemeRecordWithKeyInfo = ReactionSchemeRecord & {
  ecNumber: string;
  substrate: string;
  organism: string;
};

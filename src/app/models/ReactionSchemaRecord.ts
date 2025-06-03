
export type ReactionSchemaRecord = {
  reactionPartners: string;
  reactants: string[];
  products: string[];
  ligandStructureId: number;
};

export type ReactionSchemaRecordWithKeyInfo = ReactionSchemaRecord & {
  ecNumber: string;
  substrate: string;
  organism: string;
};

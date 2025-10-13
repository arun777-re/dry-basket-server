import { Interaction } from "../../models";
import { InteractionDocumentDTO } from "../../types/interaction";
const ACTION_WEIGHTS = {
    view:1,
    purchase:4,
    addCart:3,
    addToWishlist:3
} as const;

export class InteractionService {
  async createInteraction({
  userId,
  productId,
  action,
  categoryId,
}: {
  userId: string;
  productId: string | string[];
  action: string;
  categoryId?: string;
}): Promise<boolean> {
  const weight = ACTION_WEIGHTS[action as keyof typeof ACTION_WEIGHTS] ?? 0;

  try {
    if (Array.isArray(productId)) {
      const docs = productId.map((id) => ({
        userId,
        productId: id,
        action,
        categoryId,
        weight,
      }));

      await Interaction.insertMany(docs, { ordered: false }); // ignore duplicates
    } else {
      await Interaction.create({
        userId,
        productId,
        action,
        categoryId,
        weight,
      });
    }

    return true;
  } catch (error) {
    console.error("Error during create interaction", error);
    throw new Error("Error during create interaction");
  }
}
  async getAllInteraction({
    userId,
  }: {
    userId: string;
  }): Promise<InteractionDocumentDTO[] | null> {
    try {
      const getInteraction = await Interaction.find({userId}).sort({createdAt:-1}).lean();
      if (!getInteraction) return null;
      return getInteraction as unknown as InteractionDocumentDTO[];
    } catch (error) {
       console.error("Error during get interaction",error);
       throw new Error("Error during get interaction");
    }
  }
  async lengthOfModel(userId:string):Promise<number>{
    const docs = await Interaction.find({userId}).lean();
    const lengthofDocs = docs.length;
    return lengthofDocs
  }
}

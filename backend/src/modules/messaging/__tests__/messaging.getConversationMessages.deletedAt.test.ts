import { AppDataSource } from "../../core";
import { MessageService } from "../services/message.service";
import { Conversation } from "../../shared/entities/Conversation";
import { Messaging } from "../../shared/entities/Messaging";

function makeQb<T>(finalResult: any) {
  const qb: any = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(finalResult),
    getOne: jest.fn(),
  };
  return qb as T & typeof qb;
}

describe("MessageService.getConversationMessages deletedAt filtering", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("applies deletedBySender2At cutoff for sender2 even though participants are normalized for response", async () => {
    const userId = 222; // this user is sender2
    const deletedBySender2At = new Date("2026-02-01T10:00:00.000Z");

    const conversationQb: any = makeQb([[], 0]);
    conversationQb.getOne.mockResolvedValue({
      id: 99,
      sender1Id: 111,
      sender2Id: userId,
      deletedBySender1At: null,
      deletedBySender2At,
      sender1: { id: 111 },
      sender2: { id: userId },
    });

    const messageQb: any = makeQb([[], 0]);

    const conversationRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(conversationQb),
    };
    const messagingRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(messageQb),
    };

    jest.spyOn(AppDataSource, "getRepository").mockImplementation((entity: any) => {
      if (entity === Conversation) return conversationRepo as any;
      if (entity === Messaging) return messagingRepo as any;
      return {} as any;
    });

    const service = new MessageService();
    await service.getConversationMessages(99, userId, { markAsRead: false });

    const cutoffCall = messageQb.andWhere.mock.calls.find(
      (c: any[]) => c[0] === "message.createdAt > :deletedAt"
    );

    expect(cutoffCall).toBeTruthy();
    expect(cutoffCall[1]).toEqual({ deletedAt: deletedBySender2At });
  });
});


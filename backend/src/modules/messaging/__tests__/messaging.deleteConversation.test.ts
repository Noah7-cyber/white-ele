import { AppDataSource } from "../../core";
import { MessageService } from "../services/message.service";
import { Conversation } from "../../shared/entities/Conversation";

describe("MessageService.deleteConversationsForUser", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-19T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("marks conversations deleted for sender1 and sender2 (per-user soft delete)", async () => {
    const repo = {
      update: jest.fn().mockResolvedValue({}),
    };

    const getRepoSpy = jest
      .spyOn(AppDataSource, "getRepository")
      .mockReturnValue(repo as any);

    const service = new MessageService();
    const userId = 10;
    const conversationIds = [1, 2, 3];

    const res = await service.deleteConversationsForUser(userId, conversationIds);

    expect(res.success).toBe(true);
    expect(repo.update).toHaveBeenCalledTimes(2);
    expect(getRepoSpy).toHaveBeenCalledWith(Conversation);

    const now = new Date("2026-02-19T12:00:00.000Z");

    const [where1, set1] = repo.update.mock.calls[0]!;
    expect(where1).toEqual(expect.objectContaining({ sender1Id: userId }));
    expect((where1 as any).id).toBeDefined(); // TypeORM FindOperator (In([...]))
    expect(set1).toEqual({ deletedBySender1: true, deletedBySender1At: now });

    const [where2, set2] = repo.update.mock.calls[1]!;
    expect(where2).toEqual(expect.objectContaining({ sender2Id: userId }));
    expect((where2 as any).id).toBeDefined(); // TypeORM FindOperator (In([...]))
    expect(set2).toEqual({ deletedBySender2: true, deletedBySender2At: now });
  });
});

